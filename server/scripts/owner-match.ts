/**
 * 主人 → Slack user_id 对应表（只读）：用飞书显示名／英文名与生产独立同事视图匹配。
 * 输出 data/pet-materials/owner-slack-map.{json,md}（不进 git），供人工审核；本脚本不写数据库。
 * 规则：中文名一致，或英文全名一致，且只有一位同事满足 → confident；
 * 只有英文名首词或邮箱前缀能对上、或多人满足 → candidates；都没有 → not_found。
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const root = fileURLToPath(new URL('../../data/pet-materials/', import.meta.url));
const catalog = JSON.parse(readFileSync(`${root}catalog-final-v4/moego-pet-catalog-final.json`, 'utf8'));
const url = process.env.PET_MATCH_DATABASE_URL;
if (!url) throw new Error('PET_MATCH_DATABASE_URL missing');

const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
await client.connect();
const colleagues: { user_id: string; name: string; email: string }[] = (
  await client.query('SELECT user_id, name, email FROM pet_match.colleagues')
).rows;
await client.end();

const cjk = (s: string) => (s.match(/[一-鿿]+/g) ?? []).join('');
const latinTokens = (s: string) => (s.toLowerCase().match(/[a-z]+/g) ?? []);
const latinFull = (s: string) => latinTokens(s).join(' ');

type Owner = { owner_id: string; display_name: string; en_name?: string; status_en_name?: string; resigned?: boolean; active_pet_count?: number; active_pet_ids?: string[] };
const owners: Owner[] = catalog.owners;
const petNames = new Map<string, string>(catalog.pets.map((p: { pet_id: string; name: string }) => [p.pet_id, p.name]));

const results = owners.map((o) => {
  const names = [o.display_name, o.en_name ?? '', o.status_en_name ?? ''];
  const zh = cjk(o.display_name);
  const fulls = new Set(names.map(latinFull).filter((s) => s.includes(' ')));
  const firsts = new Set(names.map((n) => latinTokens(n)[0]).filter(Boolean));
  const strong = colleagues.filter((c) => (zh && cjk(c.name) === zh) || fulls.has(latinFull(c.name)));
  const weak = colleagues.filter(
    (c) => !strong.includes(c) && (firsts.has(latinTokens(c.name)[0]) || firsts.has(c.email.split('@')[0].toLowerCase().replace(/[^a-z]/g, ''))),
  );
  const status = strong.length === 1 ? 'confident' : strong.length > 1 || weak.length > 0 ? 'candidates' : 'not_found';
  return {
    owner_id: o.owner_id,
    feishu_name: o.display_name,
    resigned: !!o.resigned,
    active_pets: (o.active_pet_ids ?? []).map((id) => petNames.get(id) ?? id),
    status,
    slack_user_id: status === 'confident' ? strong[0].user_id : null,
    matched_name: status === 'confident' ? strong[0].name : null,
    candidates: status === 'candidates' ? [...strong, ...weak].slice(0, 6).map((c) => ({ user_id: c.user_id, name: c.name, email_prefix: c.email.split('@')[0] })) : [],
  };
});

const relevant = results.filter((r) => r.active_pets.length > 0);
const count = (s: string) => relevant.filter((r) => r.status === s).length;
writeFileSync(`${root}owner-slack-map.json`, JSON.stringify({ generated_at: new Date().toISOString(), confirmed: false, owners: results }, null, 2));

const lines = [
  '# 主人 → Slack 对应表（待审核）',
  '',
  `有在架宠物的主人 ${relevant.length} 位：确定 ${count('confident')}、需要选择 ${count('candidates')}、未找到 ${count('not_found')}。`,
  '',
  '## 需要你选择',
  '',
  '| 飞书主人 | 宠物 | 候选同事（user_id） |',
  '| --- | --- | --- |',
  ...relevant.filter((r) => r.status === 'candidates').map((r) => `| ${r.feishu_name} | ${r.active_pets.join('、')} | ${r.candidates.map((c) => `${c.name}（${c.user_id}）`).join('；')} |`),
  '',
  '## 未找到',
  '',
  '| 飞书主人 | 宠物 | 是否离职 |',
  '| --- | --- | --- |',
  ...relevant.filter((r) => r.status === 'not_found').map((r) => `| ${r.feishu_name} | ${r.active_pets.join('、')} | ${r.resigned ? '是' : '否'} |`),
  '',
  '## 已确定（请扫一眼）',
  '',
  '| 飞书主人 | 同事名单中的名字 | user_id | 宠物 |',
  '| --- | --- | --- | --- |',
  ...relevant.filter((r) => r.status === 'confident').map((r) => `| ${r.feishu_name} | ${r.matched_name} | ${r.slack_user_id} | ${r.active_pets.join('、')} |`),
  '',
];
writeFileSync(`${root}owner-slack-map.md`, lines.join('\n'));
console.log(`owners with pets: ${relevant.length}; confident ${count('confident')}, candidates ${count('candidates')}, not_found ${count('not_found')}`);
