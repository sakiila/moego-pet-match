#!/usr/bin/env python3
"""Collect this Feishu pet table through the signed-in browser, without exporting credentials."""
import argparse
import base64
import gzip
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import time
import uuid
from datetime import datetime, timezone
from zoneinfo import ZoneInfo
from urllib.parse import urlencode

SOURCE = 'https://mengshikeji.feishu.cn/wiki/VNOdwKUcAiJ6NLkuUHjcGLqtnWg?table=tbl7iNhpyhFjuyWj&view=vewpsMLR0U'
ORIGIN = 'https://mengshikeji.feishu.cn'
BASE = 'Ypy6b47ULawZgDsbXItcpxPNnBc'
TABLE = 'tbl7iNhpyhFjuyWj'
VIEW = 'vewpsMLR0U'
OWNER_ENDPOINT = ORIGIN + '/space/api/mention/user.detail.v2/'


def atomic_json(path, value):
    tmp = path.with_suffix(path.suffix + '.tmp')
    tmp.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')
    tmp.replace(path)


def unpack(text):
    return json.loads(gzip.decompress(base64.b64decode(text)))


class Browser:
    def __init__(self, session=None):
        self.cli = shutil.which('bsk')
        if not self.cli:
            raise RuntimeError('bsk CLI is required with its logged-in browser extension')
        self.env = dict(os.environ, BSK_AUTO_START='0')
        self.owned = session is None
        self.sid = session
        if self.owned:
            self.sid = self.call('session', 'start', '--name', 'MoeGo pet material import', session=False)['session_id']

    def call(self, *args, session=True, timeout=180):
        cmd = [self.cli, *map(str, args)]
        if session:
            cmd += ['--session', self.sid]
        cmd += ['--json']
        result = subprocess.run(cmd, capture_output=True, text=True, env=self.env, timeout=timeout)
        if result.returncode:
            raise RuntimeError(result.stderr[:2000] or result.stdout[:2000])
        return json.loads(result.stdout)

    def evaluate(self, expression):
        result = self.call('evaluate', expression, '--timeout', '120s')
        if not result.get('ok'):
            raise RuntimeError('Browser evaluation failed: ' + str(result.get('error'))[:500])
        return result.get('value')

    def close(self):
        if self.owned:
            self.call('session', 'stop', self.sid, session=False)


def fetch_table(browser):
    query = urlencode(dict(tableID=TABLE, viewID=VIEW, recordLimit=200, ondemandLimit=200,
                           needBase='true', viewLazyLoad='true', ondemandVer=2, openType=0,
                           noMissCS='true', optimizationFlag=1, removeFmlExtra='true'))
    url = f'{ORIGIN}/space/api/v1/bitable/{BASE}/clientvars?{query}'
    value = browser.evaluate('fetch(' + json.dumps(url) + ',{credentials:"same-origin"}).then(r=>r.json()).then(x=>({code:x.code,table:x.data?.table}))')
    if value.get('code') != 0 or not value.get('table'):
        raise RuntimeError('Source table request did not succeed')
    table = unpack(value['table'])
    if table.get('meta', {}).get('id') != TABLE:
        raise RuntimeError('Unexpected table; refusing to collect')
    return table


def field_ids(table):
    ids = {field['name']: key for key, field in table['fieldMap'].items()}
    for name in ('Pet Name', 'Pet Owner', 'Pic', 'Intro', 'Gender'):
        if name not in ids:
            raise RuntimeError('Source schema changed: missing ' + name)
    return ids


def raw_text(value):
    if value is None:
        return ''
    if isinstance(value, list):
        parts = []
        for part in value:
            if not isinstance(part, dict):
                parts.append(str(part))
                continue
            text = part.get('text', '')
            if part.get('type') == 'url' and part.get('link') and part['link'] != text:
                text += ' (' + part['link'] + ')'
            parts.append(text)
        return ''.join(parts)
    return str(value)


def current_record(browser):
    return browser.evaluate('(()=>{const m=document.getElementById("BASE_CARD_MODAL_CONTENT_FOCUS_ID");if(!m)return null;const e=[...m.querySelectorAll("[id]")].find(e=>e.id.startsWith("BITABLE_TEXT_EDITOR_CONTAINER_ID_PREFIX_"));return e?e.id.split("PREFIX_")[1].split("_fld")[0]:null})()')


def ensure_record_open(browser):
    if current_record(browser):
        return
    # The gallery is canvas-rendered. Its first card position was visually verified.
    result = False
    for _ in range(30):
        result = browser.evaluate('(()=>{const c=[...document.querySelectorAll("canvas")].find(e=>{const r=e.getBoundingClientRect();return r.left>300&&r.top>100&&r.width>500&&r.height>300});if(!c)return false;const r=c.getBoundingClientRect();const x=r.left+100,y=r.top+210;for(const type of ["pointerdown","mousedown","pointerup","mouseup","click"]){const EventType=type.startsWith("pointer")?PointerEvent:MouseEvent;c.dispatchEvent(new EventType(type,{bubbles:true,clientX:x,clientY:y,button:0}))}return true})()')
        if result:
            break
        time.sleep(.3)
    if not result:
        raise RuntimeError('Could not locate the verified first gallery card; open one record and use --session')
    for _ in range(30):
        if current_record(browser):
            return
        time.sleep(.2)
    raise RuntimeError('First record detail did not load')


def collect_owner_status(browser, table, ids, cache_path, seed_paths=()):
    owners = {}
    record_owners = {}
    for rid, fields in table['recordMap'].items():
        users = (fields.get(ids['Pet Owner'], {}).get('value') or {}).get('users', [])
        record_owners[rid] = [str(u['userId']) for u in users]
        for user in users:
            owners[str(user['userId'])] = user
    context_path = cache_path.parent/'run-context.json'
    now = datetime.now(timezone.utc)
    context = json.loads(context_path.read_text()) if context_path.exists() else {}
    if (context.get('source_url') != SOURCE or context.get('table_rev') != table['meta']['rev']
            or not context.get('started_at')
            or (now-datetime.fromisoformat(context['started_at'])).total_seconds() > 3600):
        context = dict(run_id=str(uuid.uuid4()), source_url=SOURCE,
                       table_rev=table['meta']['rev'], started_at=now.isoformat())
        atomic_json(context_path, context)
    previous = json.loads(cache_path.read_text()) if cache_path.exists() else {}
    cache = {uid: user for uid, user in previous.items()
             if user.get('run_id') == context['run_id'] and user.get('source_url') == SOURCE
             and user.get('table_rev') == table['meta']['rev'] and user.get('checked_at')
             and (now-datetime.fromisoformat(user['checked_at'])).total_seconds() <= 3600}
    # Seeds are responses captured during this run's verified native profile lookups.
    for seed_path in seed_paths:
        item = json.loads(Path(seed_path).read_text())
        response = item.get('request', {}).get('response_body', {}).get('text')
        if response:
            response = json.loads(response)
            checked_at = datetime.fromtimestamp(item['request']['finished_at']/1000, timezone.utc)
            if (now-checked_at).total_seconds() > 3600:
                raise RuntimeError('Seed status response is older than this collection window')
            for uid, user in response.get('data', {}).get('entities', {}).items():
                if user.get('resigned') in (True, False):
                    cache[uid] = {k: user.get(k) for k in ('id', 'en_name', 'display_name', 'resigned', 'display_tag', 'is_external', 'avatar_url')}
                    cache[uid].update(checked_at=checked_at.isoformat(), run_id=context['run_id'],
                                      source_url=SOURCE, table_rev=table['meta']['rev'])
                    cache[uid]['status_evidence'] = f'Feishu user.detail.v2 resigned={str(user["resigned"]).lower()}'
    atomic_json(cache_path, cache)
    # Persisted status is refreshed by default; a resume explicitly reuses only this run's cache.
    unresolved = set(owners) - set(cache)
    if not unresolved:
        return owners, cache
    ensure_record_open(browser)
    browser.call('debug', 'start', '--name', 'Pet owner account status')
    order = [rid for group in table.get('groupList', []) for rid in group.get('recordIDList', [])]
    attempted_records = set()
    try:
        for _ in range(len(table['recordMap']) + 2):
            if not unresolved:
                break
            rid = current_record(browser)
            next_state = browser.evaluate('(()=>{const b=document.querySelector(".bitable-card-modal-header-v2-btn-next");return !!b&&!b.disabled&&!b.classList.contains("disabled")})()')
            if not next_state:
                break
            next_rid = order[order.index(rid)+1] if rid in order and order.index(rid)+1 < len(order) else None
            candidate_ids = set(record_owners.get(next_rid, []))
            if rid not in attempted_records:
                attempted_records.add(rid)
                before = browser.call('debug', 'requests', '--url', '/mention/user.detail.v2/', '--limit', '100')
                seen = {r['id'] for r in before.get('requests', [])}
                batch = list(candidate_ids) + sorted(unresolved - candidate_ids)[:20-len(candidate_ids)]
                # A native, authenticated read request supplies its own CSRF handling.
                # Modify ONLY the requested owner ID list, never credentials or permissions.
                rule = dict(match=dict(url=OWNER_ENDPOINT, method='POST'),
                            effect=dict(type='modify', json={'set': {'mentioned_users': batch}}), times=1)
                added = browser.call('debug', 'rule_add', '--rule', json.dumps(rule))
                rule_id = added.get('rules', [])[-1]['id']
                try:
                    # Owner lookup occurs while the next record mounts, before hover.
                    browser.evaluate('(()=>{const b=document.querySelector(".bitable-card-modal-header-v2-btn-next");if(!b)throw new Error("Next record button missing");b.click();return true})()')
                    for _ in range(25):
                        if current_record(browser) != rid:
                            break
                        time.sleep(.1)
                    else:
                        raise RuntimeError('Record navigation did not advance; refusing to skip records')
                    browser.evaluate('(()=>{const e=document.querySelector(".b-user-tag-container");if(!e)return false;for(const type of ["mouseover","mouseenter"])e.dispatchEvent(new MouseEvent(type,{bubbles:true}));return true})()')
                    browser.call('hover', '.b-user-tag-container', '--settle', '1000ms')
                    response = None
                    for _ in range(12):
                        requests = browser.call('debug', 'requests', '--url', '/mention/user.detail.v2/', '--limit', '100')
                        matches = [r for r in requests.get('requests', []) if r['id'] not in seen and r.get('state') == 'complete' and r.get('response_body', {}).get('state') == 'available']
                        if matches:
                            detail = browser.call('debug', 'request', matches[-1]['id'], '--part', 'response', '--max-chars', '16384')
                            body = detail['request']['response_body']
                            if body.get('offset', 0) or body.get('next_offset'):
                                raise RuntimeError('Owner response was sliced; refusing partial status')
                            response = json.loads(body['text'])
                            break
                        time.sleep(.2)
                    if response and response.get('code') == 0:
                        for uid, user in response.get('data', {}).get('entities', {}).items():
                            if user.get('resigned') in (True, False):
                                cache[uid] = {k: user.get(k) for k in ('id', 'en_name', 'display_name', 'resigned', 'display_tag', 'is_external', 'avatar_url')}
                                cache[uid].update(checked_at=datetime.now(timezone.utc).isoformat(),
                                                  run_id=context['run_id'], source_url=SOURCE,
                                                  table_rev=table['meta']['rev'])
                                cache[uid]['status_evidence'] = f'Feishu user.detail.v2 resigned={str(user["resigned"]).lower()}'
                        unresolved -= set(cache)
                        atomic_json(cache_path, cache)
                        print(f'OWNER_STATUS {len(set(owners)&set(cache))}/{len(owners)}', flush=True)
                finally:
                    browser.call('debug', 'rule_remove', rule_id)
    finally:
        browser.call('debug', 'stop')
    return owners, cache


def attachment_url(rid, attachment, field_id, revision):
    token = attachment.get('attachmentToken') or attachment['id']
    extra = {'bitablePerm': {'tableId': TABLE, 'rev': revision, 'attachments': {field_id: {rid: [token]}}}}
    query = urlencode(dict(extra=json.dumps(extra, separators=(',', ':')), mount_node_token=BASE, mount_point='bitable'))
    return f'https://internal-api-drive-stream.feishu.cn/space/api/box/stream/download/all/{token}/?{query}'


def download_one(browser, url, target, expected_size, expected_mime):
    if target.exists():
        if expected_size and target.stat().st_size != expected_size:
            raise RuntimeError('Existing file size mismatch; refusing overwrite')
        checksum = target.with_suffix(target.suffix+'.sha256')
        if not checksum.exists() or checksum.read_text().strip() != hashlib.sha256(target.read_bytes()).hexdigest():
            raise RuntimeError('Existing file has no matching checksum; refusing silent reuse')
        return
    expression = '''(async()=>{const r=await fetch(URL,{credentials:"include"});if(!r.ok)return {status:r.status};const a=new Uint8Array(await r.arrayBuffer());let s="";for(let i=0;i<a.length;i+=32768)s+=String.fromCharCode(...a.subarray(i,i+32768));return {status:r.status,mime:r.headers.get("Content-Type"),size:a.length,b64:btoa(s)}})()'''.replace('URL', json.dumps(url))
    result = browser.evaluate(expression)
    if result.get('status') != 200 or not result.get('b64'):
        raise RuntimeError('Attachment fetch failed, HTTP ' + str(result.get('status')))
    if expected_mime and not result.get('mime', '').split(';')[0].startswith(expected_mime.split(';')[0]):
        raise RuntimeError('Unexpected attachment content type: ' + str(result.get('mime')))
    data = base64.b64decode(result['b64'], validate=True)
    if expected_size and len(data) != expected_size:
        raise RuntimeError('Attachment byte count differs from source')
    tmp = target.with_suffix(target.suffix + '.part')
    tmp.write_bytes(data)
    tmp.replace(target)
    target.with_suffix(target.suffix+'.sha256').write_text(hashlib.sha256(data).hexdigest()+'\n')


def build_manifest(browser, table, ids, owners, status, root):
    result = dict(source_url=SOURCE, captured_at=datetime.now(ZoneInfo('Asia/Shanghai')).isoformat(timespec='seconds'),
                  coverage=dict(complete=False, expected_records=table['recordCount'], visited_records=len(table['recordMap']), notes=[]),
                  records=[], skipped=[], pending=[])
    gender_options = table['fieldMap'][ids['Gender']].get('property', {}).get('options', {})
    if isinstance(gender_options, list):
        gender_options = {o['id']: o for o in gender_options}
    rows = table['recordMap']
    ordered = [rid for group in table.get('groupList', []) for rid in group.get('recordIDList', [])]
    ordered += [rid for rid in rows if rid not in ordered]
    for rid in ordered:
        fields = rows[rid]
        name = raw_text(fields.get(ids['Pet Name'], {}).get('value'))
        raw_owners = (fields.get(ids['Pet Owner'], {}).get('value') or {}).get('users', [])
        checked = []
        for owner in raw_owners:
            uid = str(owner['userId']); state = status.get(uid, {})
            labels = str(state.get('display_tag', '')) + str(state.get('display_name', ''))
            closed = state.get('resigned') is True or bool(re.search(r'\bclosed\b|已停用|已注销|已离职', labels, re.I))
            active = state.get('resigned') is False and not closed
            checked.append(dict(name=owner.get('name') or owner.get('enName', ''), source_user_id=uid,
                                status='closed' if closed else 'active' if active else 'unknown',
                                status_evidence=state.get('status_evidence', ''), checked_at=state.get('checked_at')))
        if any(o['status'] == 'closed' for o in checked):
            result['skipped'].append(dict(source_record_id=rid, pet_name_raw=name,
                                         owner_name=', '.join(o['name'] for o in checked), reason='主人飞书账号 closed / resigned / 已停用；未下载附件'))
            continue
        if not checked or any(o['status'] != 'active' for o in checked):
            result['pending'].append(dict(source_record_id=rid, pet_name_raw=name, owner_name=', '.join(o['name'] for o in checked), reason='主人账号状态未明确，未下载附件'))
            continue
        values = fields.get(ids['Gender'], {}).get('value') or []
        genders = [gender_options.get(k, {}).get('name', k) for k in values]
        record = dict(source_record_id=rid, source_url=SOURCE, pet_name_raw=name, owners=checked,
                      gender_raw=', '.join(genders), intro_raw=raw_text(fields.get(ids['Intro'], {}).get('value')),
                      attachments=[], status='included', notes=[])
        record['source_fields_raw'] = {meta['name']: fields.get(fid, {}).get('value')
                                       for fid, meta in table['fieldMap'].items()}
        if '&' in name or '＆' in name:
            record['notes'].append('多宠物原始记录；宠物与照片对应关系尚未人工拆分。')
        attachments = fields.get(ids['Pic'], {}).get('value') or []
        for index, attachment in enumerate(attachments, 1):
            suffix = Path(attachment.get('name', '')).suffix.lower()
            if not re.fullmatch(r'\.[a-z0-9]{1,8}', suffix):
                suffix = '.bin'
            attachment_id = attachment.get('attachmentToken') or attachment['id']
            if not re.fullmatch(r'[A-Za-z0-9_-]+', attachment_id):
                raise RuntimeError('Unexpected attachment identifier')
            target = root/'originals'/f'{rid}-{index:02d}-{attachment_id}{suffix}'
            item = dict(original_name=attachment.get('name'), local_path=str(target.relative_to(root)),
                        attachment_id=attachment_id,
                        mime=attachment.get('mimeType'), size=attachment.get('size'),
                        width=attachment.get('width'), height=attachment.get('height'), download_status='pending')
            try:
                download_one(browser, attachment_url(rid, attachment, ids['Pic'], table['meta']['rev']),
                             target, attachment.get('size'), attachment.get('mimeType'))
                item.update(download_status='downloaded', sha256=hashlib.sha256(target.read_bytes()).hexdigest())
                print(f'FILE_READY {rid} {index}/{len(attachments)} {target.stat().st_size}', flush=True)
            except Exception as exc:
                item.update(download_status='failed', error=str(exc)[:1000])
                print(f'FAILED {rid} {index}: {exc}', flush=True)
            record['attachments'].append(item)
        result['records'].append(record)
        atomic_json(root/'manifest.json', result)
    result['coverage']['complete'] = len(rows) == table['recordCount'] and not result['pending'] and all(a['download_status'] == 'downloaded' for r in result['records'] for a in r['attachments'])
    skipped_ids = {r['source_record_id'] for r in result['skipped']}
    skipped_attachments = sum(len(rows[rid].get(ids['Pic'], {}).get('value') or []) for rid in skipped_ids)
    result['coverage']['notes'] = [
        '账号先核验再下载；本次主人账号已核验 ' + str(len(set(owners) & set(status))) + '/' + str(len(owners)) + '。',
        '停用账号记录仅保留最小审计，未下载对应 ' + str(skipped_attachments) + ' 张附件。',
        '原表全部字段保存在有效记录的 source_fields_raw；原介绍中的链接保留。',
        '数量按原始记录统计，尚未拆分多宠物或合照对应关系；飞书主人尚未映射 Slack。',
        '原图未裁切或风格化。下载字节数及本地 SHA-256 已校验；原始目录可能保留历史缓存，开发使用当前 manifest 引用的文件。'
    ]
    atomic_json(root/'manifest.json', result)
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--out', type=Path, default=Path('data/pet-materials'))
    parser.add_argument('--session', help='Reuse a task-owned browser session with a record detail open')
    parser.add_argument('--seed-status', action='append', default=[], help='Current-run native profile response capture')
    parser.add_argument('--resume', action='store_true', help='Reuse this run\'s account status cache and verified files')
    args = parser.parse_args()
    root = args.out.resolve(); (root/'originals').mkdir(parents=True, exist_ok=True)
    cache = root/'owner-status.json'
    if cache.exists() and not args.resume:
        cache.rename(root/f'owner-status-{int(time.time())}.json')
    browser = Browser(args.session)
    try:
        if browser.owned:
            browser.call('navigate', SOURCE)
        table = fetch_table(browser)
        ids = field_ids(table)
        print(f'SOURCE_RECORDS {len(table["recordMap"])}/{table["recordCount"]}', flush=True)
        owners, checked = collect_owner_status(browser, table, ids, cache, args.seed_status)
        print(f'OWNERS_CHECKED {len(set(owners)&set(checked))}/{len(owners)}', flush=True)
        result = build_manifest(browser, table, ids, owners, checked, root)
        from render_pet_catalog import render_catalog
        document = render_catalog(result, input_dir=root, output_dir=root, assets_root=root)
        (root/'PET_CATALOG.md').write_text(document, encoding='utf-8')
        print(json.dumps(dict(included=len(result['records']), skipped=len(result['skipped']), pending=len(result['pending']), complete=result['coverage']['complete'])), flush=True)
    finally:
        browser.close()


if __name__ == '__main__':
    main()
