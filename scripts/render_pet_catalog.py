#!/usr/bin/env python3
"""Render an offline pet-album manifest as a conservative Chinese Markdown catalog."""

import argparse
import json
import os
from pathlib import Path
import re
from urllib.parse import quote


ACTIVE_OWNER_STATUSES = {"active", "normal", "enabled", "正常", "正常使用", "在职", "启用"}
VALID_RECORD_STATUSES = {"eligible", "valid", "active", "included", "complete", "collected", "success", "有效", "已采集"}
INACTIVE_STATUSES = {"closed", "inactive", "disabled", "deactivated", "deleted", "停用", "已停用", "禁用", "已禁用", "离职", "已离职", "已注销", "注销", "已关闭", "关闭"}
DOWNLOADED_STATUSES = {"downloaded", "success", "complete", "ok", "已下载", "成功"}


def value_text(value):
    if value is None or value == "":
        return "未提供"
    if isinstance(value, (dict, list)):
        return json.dumps(value, ensure_ascii=False, indent=2)
    return str(value)


def normalized(value):
    return str(value or "").strip().casefold()


def has_value(value):
    return value is not None and value != "" and value != [] and value != {}


def markdown_text(value):
    return re.sub(r"([\\`*_{}\[\]<>|])", r"\\\1", value_text(value)).replace("\n", " ")


def raw_block(value):
    text = value_text(value)
    fence = "`" * max(3, max((len(m.group(0)) + 1 for m in re.finditer(r"`+", text)), default=3))
    return f"{fence}text\n{text}\n{fence}"


def source_link(value):
    if isinstance(value, str) and value.startswith(("https://", "http://")):
        return f"[打开来源](<{quote(value, safe=':/?&=%#@+;,.-_~')}>)"
    return markdown_text(value)


def classify_record(record):
    """An explicitly inactive owner always overrides a record's included status."""
    owners = record.get("owners") or []
    if normalized(record.get("status")) in INACTIVE_STATUSES:
        return "skipped", "记录状态明确为停用或关闭"
    for owner in owners:
        if normalized(owner.get("status")) in INACTIVE_STATUSES:
            return "skipped", f"主人账号状态为 {value_text(owner.get('status'))}"
    if normalized(record.get("status")) not in VALID_RECORD_STATUSES:
        return "pending", "记录状态缺失或未明确标记为有效"
    if not owners:
        return "pending", "缺少主人账号及其状态证据"
    for owner in owners:
        if normalized(owner.get("status")) not in ACTIVE_OWNER_STATUSES:
            return "pending", "至少一位主人账号状态缺失或未明确确认正常"
        if not has_value(owner.get("status_evidence")):
            return "pending", "至少一位主人缺少账号状态证据"
    return "valid", "所有主人账号均有明确正常状态及证据"


def attachment_state(attachment, assets_root):
    raw_path = attachment.get("local_path")
    if normalized(attachment.get("download_status")) not in DOWNLOADED_STATUSES:
        return None, f"下载状态未确认成功：{value_text(attachment.get('download_status'))}"
    if not raw_path:
        return None, "缺少本地路径"
    path = Path(raw_path).expanduser()
    if not path.is_absolute():
        path = assets_root / path
    if not path.is_file():
        return None, "本地文件不存在"
    return path.resolve(), None


def local_url(path, output_dir):
    return quote(Path(os.path.relpath(path, output_dir)).as_posix(), safe="/.-_~")


def minimal_audit(item, reason=None):
    owner_name = item.get("owner_name")
    if not owner_name and item.get("owners"):
        owner_name = "、".join(value_text(owner.get("name")) for owner in item["owners"])
    return (
        f"- 记录 {markdown_text(item.get('source_record_id'))}；"
        f"宠物原名：{markdown_text(item.get('pet_name_raw'))}；"
        f"主人：{markdown_text(owner_name)}；"
        f"原因：{markdown_text(reason or item.get('reason') or item.get('error') or item.get('status'))}"
    )


def render_catalog(manifest, *, input_dir, output_dir, assets_root=None):
    input_dir, output_dir = Path(input_dir).resolve(), Path(output_dir).resolve()
    assets_root = Path(assets_root).resolve() if assets_root else input_dir
    records = manifest.get("records") or []
    skipped = list(manifest.get("skipped") or [])
    skipped_ids = {str(item["source_record_id"]) for item in skipped if item.get("source_record_id")}
    valid, excluded, unresolved = [], [], []
    for record in records:
        classification, reason = classify_record(record)
        if record.get("source_record_id") and str(record["source_record_id"]) in skipped_ids:
            classification, reason = "skipped", "该记录同时出现在跳过列表，保守排除"
        {"valid": valid, "skipped": excluded, "pending": unresolved}[classification].append((record, reason))

    # A record may occur in both arrays during an interrupted collection. Count it once.
    for record, reason in excluded:
        if not record.get("source_record_id") or str(record["source_record_id"]) not in skipped_ids:
            skipped.append({
                "source_record_id": record.get("source_record_id"),
                "pet_name_raw": record.get("pet_name_raw"),
                "owner_name": "、".join(value_text(owner.get("name")) for owner in record.get("owners") or []),
                "reason": reason,
            })
            if record.get("source_record_id"):
                skipped_ids.add(str(record["source_record_id"]))

    pending = list(manifest.get("pending") or [])
    failures = []
    attachment_count = available_count = 0
    for record, _ in valid:
        for attachment in record.get("attachments") or []:
            attachment_count += 1
            path, error = attachment_state(attachment, assets_root)
            if path:
                available_count += 1
            else:
                failures.append((record, attachment, error))

    coverage = manifest.get("coverage") or {}
    expected, visited = coverage.get("expected_records"), coverage.get("visited_records")
    counts_match = (
        isinstance(expected, int) and not isinstance(expected, bool)
        and isinstance(visited, int) and not isinstance(visited, bool)
        and expected >= 0 and expected == visited
    )
    audit_records = records + skipped
    represented_ids = {str(item["source_record_id"]) for item in audit_records if item.get("source_record_id")}
    records_match = counts_match and len(represented_ids) == expected and all(item.get("source_record_id") for item in audit_records)
    attachments_known = all(isinstance(record.get("attachments"), list) for record, _ in valid)
    fully_complete = coverage.get("complete") is True and records_match and attachments_known and not unresolved and not pending and not failures
    completeness = "已完成（依 manifest 的覆盖声明及计数；附件已检查本地存在）" if fully_complete else "未确认完整"
    lines = [
        "# 宠物相册开发素材", "",
        f"- 相册来源：{source_link(manifest.get('source_url'))}",
        f"- 采集时间：{markdown_text(manifest.get('captured_at'))}",
        f"- 完整性：**{completeness}**", "",
        "## 总量摘要", "",
        f"- manifest 记录：{len(records)} 条；有效记录：{len(valid)} 条。",
        f"- 跳过记录：{len(skipped)} 条；待核对记录：{len(unresolved)} 条；额外待处理项：{len(pending)} 条。",
        f"- 有效记录中的附件条目：{attachment_count} 个；本地可用：{available_count} 个；失败或待确认：{len(failures)} 个。",
        f"- 来源预期记录数：{value_text(expected)}；已访问记录数：{value_text(visited)}。",
        f"- manifest 中可识别的唯一记录 ID：{len(represented_ids)} 个（含跳过记录）。",
        "- 数量按相册记录统计；一条记录可能包含多只宠物，不代表已确认的宠物数量。", "",
        "## 账号判定规则", "",
        "- 每条有效记录必须明确标记为有效，且所有主人均有明确的正常账号状态和非空状态证据。",
        "- 任一主人为 closed、停用、关闭、离职或注销状态时，整条记录跳过；不展示其介绍和附件。",
        "- 状态缺失、状态未知或证据缺失均进入待核对，不视为正常账号。状态证据原样保留，本整理器不联网重新核实。",
        "- 主人字段仅表示来源里的飞书人员信息；不推断其 Slack 身份。",
        "- 原名、性别和 Intro 保留原文，不翻译、不拆分多宠记录、不猜测宠物与照片的对应关系。", "",
        "## 有效记录", "",
    ]
    if not valid:
        lines.extend(["暂无满足账号判定规则的有效记录。", ""])
    for index, (record, _) in enumerate(valid, 1):
        lines.extend([
            f"### {index}. {markdown_text(record.get('pet_name_raw'))}", "",
            f"记录 ID：{markdown_text(record.get('source_record_id'))}", "",
            "**宠物名字原文**", "", raw_block(record.get("pet_name_raw")), "",
            "**主人及账号状态证据**", "",
        ])
        for owner in record.get("owners") or []:
            lines.extend([
                f"- 主人：{markdown_text(owner.get('name'))}；账号判定状态：{markdown_text(owner.get('status'))}", "",
                raw_block(owner.get("status_evidence")), "",
            ])
        lines.extend([
            "**性别原文**", "", raw_block(record.get("gender_raw")), "",
            "**Intro 原文**", "", raw_block(record.get("intro_raw")), "",
            "**全部附件**", "",
        ])
        attachments = record.get("attachments") or []
        if not attachments:
            lines.extend(["来源附件清单为空。" if isinstance(record.get("attachments"), list) else "未提供附件清单；不能据此确认原记录没有附件。", ""])
        for attachment in attachments:
            name = attachment.get("original_name") or attachment.get("local_path") or "未命名附件"
            path, error = attachment_state(attachment, assets_root)
            if path:
                url = local_url(path, output_dir)
                lines.append(f"- [{markdown_text(name)}](<{url}>)")
            else:
                lines.append(f"- {markdown_text(name)} — {markdown_text(error)}")
            lines.extend([
                f"  - MIME：{markdown_text(attachment.get('mime'))}；大小（字节）：{markdown_text(attachment.get('size'))}；下载状态：{markdown_text(attachment.get('download_status'))}",
                f"  - SHA-256：{markdown_text(attachment.get('sha256'))}", "",
            ])
            if path and (normalized(attachment.get("mime")).startswith("image/") or path.suffix.casefold() in {".png", ".jpg", ".jpeg", ".webp", ".gif", ".avif", ".bmp"}):
                lines.extend([f"![{markdown_text(name)}](<{url}>)", ""])
        lines.extend([f"**来源**：{source_link(record.get('source_url') or manifest.get('source_url'))}", ""])
        if has_value(record.get("notes")):
            lines.extend(["**记录备注原文**", "", raw_block(record["notes"]), ""])

    lines.extend([
        "## 待核对多宠情况", "",
        "相册的每条记录及附件保持成组。附件顺序不代表宠物与照片的对应关系；本文件未确认单宠数量或建立图片映射。", "",
    ])
    possible_multi = [record for record, _ in valid if re.search(r"[/／、,&＆\n]|和|与", str(record.get("pet_name_raw") or ""))]
    if possible_multi:
        lines.extend(["以下名称包含分隔符或连接词，可能是多宠、别名或其他写法，仅作为人工核对线索：", ""])
        lines.extend(f"- 记录 {markdown_text(record.get('source_record_id'))}：{markdown_text(record.get('pet_name_raw'))}" for record in possible_multi)
    else:
        lines.append("名称中未发现明显分隔线索；这不代表已确认每条记录只有一只宠物。")
    lines.extend(["", "## 账号或记录待核对", ""])
    lines.extend(minimal_audit(record, reason) for record, reason in unresolved)
    if not unresolved:
        lines.append("无。")
    lines.extend(["", "## 跳过列表", "", "仅保留记录 ID、宠物原名、主人和跳过原因，不包含介绍、性别和附件。", ""])
    lines.extend(minimal_audit(item) for item in skipped)
    if not skipped:
        lines.append("无。")
    lines.extend(["", "## 失败项和额外待处理项", ""])
    for record, attachment, reason in failures:
        lines.append(f"- 记录 {markdown_text(record.get('source_record_id'))}；附件 {markdown_text(attachment.get('original_name'))}；{markdown_text(reason)}。")
    for item in pending:
        lines.append(minimal_audit(item) if isinstance(item, dict) else f"- {markdown_text(item)}")
    if not failures and not pending:
        lines.append("无已报告失败项或待处理项；这不单独证明采集完整。")
    lines.extend([
        "", "## 完整性说明", "",
        f"- manifest 覆盖声明：{value_text(coverage.get('complete'))}。",
        f"- 预期记录数与访问记录数：{'一致' if counts_match else '缺失或不一致'}。",
        f"- 唯一记录 ID 是否覆盖预期数量：{'是' if records_match else '未确认'}；有效记录附件清单是否均已提供：{'是' if attachments_known else '否'}。",
        "- 只有覆盖声明明确为 true、预期数与访问数及唯一记录 ID 数一致、有效记录附件清单已提供、没有待核对或待处理项、有效记录附件均确认下载成功且本地存在，才标记已完成。",
        "- 本文按 manifest 整理，不独立证明源相册没有遗漏字段、分页或附件；缺失字段均明确显示为未提供。",
        "- 文件大小和 SHA-256 按 manifest 展示，未在本整理器中重新计算。",
    ])
    if has_value(coverage.get("notes")):
        lines.extend(["", "**采集覆盖备注原文**", "", raw_block(coverage["notes"])])
    lines.append("")
    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", required=True, type=Path, help="JSON manifest 文件")
    parser.add_argument("--output", required=True, type=Path, help="输出 Markdown 文件")
    parser.add_argument("--assets-root", type=Path, help="相对 local_path 的根目录；默认为 manifest 所在目录")
    args = parser.parse_args()
    with args.input.open(encoding="utf-8") as handle:
        manifest = json.load(handle)
    if not isinstance(manifest, dict):
        parser.error("manifest 顶层必须是 JSON 对象")
    document = render_catalog(manifest, input_dir=args.input.parent, output_dir=args.output.parent, assets_root=args.assets_root)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(document, encoding="utf-8")
    print(f"已生成：{args.output}")


if __name__ == "__main__":
    main()
