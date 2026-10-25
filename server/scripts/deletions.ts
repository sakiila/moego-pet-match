/**
 * 处理资料删除申请（人工核实后执行）。
 *   tsx scripts/deletions.ts list [--all] [--prod]                     列出待处理（--all 含已处理）
 *   tsx scripts/deletions.ts resolve <request_id> --note "…" [--keep-pet] [--yes] [--prod]
 * resolve 只改申请状态与处理说明，不删除任何东西；下架宠物先用 catalog.ts unpublish。
 * 关联宠物仍在上架时拒绝标记已处理，避免先显示已处理；确认无需下架（如只删名言、申请无效）时加 --keep-pet。
 * 不加 --yes 只列出，不写入。
 */
import { connect, describeTarget } from './cli.ts';

const args = process.argv.slice(2);
const flag = (name: string) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const positional = args.filter((a, i) => !a.startsWith('--') && args[i - 1] !== '--note');
const [cmd, id] = positional;
const yes = args.includes('--yes');
const prod = args.includes('--prod');

const client = await connect(prod);
console.log(describeTarget(prod, yes));
try {
  if (cmd === 'list') {
    const { rows } = await client.query(
      `SELECT d.request_id, d.player_id, c.name AS player_name, d.pet_id, p.name AS pet_name, p.status AS pet_status, d.note, d.status, d.created_at, d.result_note
         FROM pet_match.deletion_requests d
         LEFT JOIN pet_match.colleagues c ON c.user_id = d.player_id
         LEFT JOIN pet_match.pets p ON p.pet_id = d.pet_id
        ${args.includes('--all') ? '' : "WHERE d.status = 'pending'"}
        ORDER BY d.created_at`,
    );
    console.log(`requests: ${rows.length}`);
    for (const r of rows) {
      const target = r.pet_id ? `pet ${r.pet_id} ${r.pet_name ?? '(removed)'} [${r.pet_status}]` : 'general request';
      console.log(`  ${r.request_id}  ${r.status}  ${r.created_at.toISOString()}  from ${r.player_name ?? '?'} (${r.player_id})  · ${target}`);
      if (r.note) console.log(`      note: ${r.note}`);
      if (r.result_note) console.log(`      result: ${r.result_note}`);
    }
  } else if (cmd === 'resolve') {
    if (!id) throw new Error('usage: resolve <request_id> --note "…"');
    const note = flag('--note');
    if (!note?.trim()) throw new Error('--note is required: write what was cleaned up and what remains outside the game (Feishu, AI service, backups)');
    const row = (
      await client.query(
        `SELECT d.request_id, d.status, d.pet_id, p.status AS pet_status FROM pet_match.deletion_requests d LEFT JOIN pet_match.pets p ON p.pet_id = d.pet_id WHERE d.request_id = $1`,
        [id],
      )
    ).rows[0];
    if (!row) throw new Error(`unknown request ${id}`);
    if (row.status === 'processed') throw new Error('already processed');
    if (row.pet_id && row.pet_status === 'published' && !args.includes('--keep-pet'))
      throw new Error(`pet ${row.pet_id} is still published; run catalog.ts unpublish first, or pass --keep-pet if no takedown is needed`);
    console.log(`resolve ${row.request_id} (pet ${row.pet_id ?? '-'} status ${row.pet_status ?? '-'}) → processed · note: ${note}`);
    if (yes) {
      await client.query(`UPDATE pet_match.deletion_requests SET status = 'processed', processed_at = now(), result_note = $2 WHERE request_id = $1`, [id, note]);
      console.log('applied.');
    }
  } else {
    console.log('usage: deletions.ts list [--all] | resolve <request_id> --note "…" [--keep-pet] [--yes]   (add --prod for production PostgreSQL)');
  }
} finally {
  await client.end();
}
