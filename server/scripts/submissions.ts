/**
 * 取走同事上传的宠物照片，人工处理后用 catalog publish 上架。
 *   tsx scripts/submissions.ts list [--prod]                列出尚未取走的提交
 *   tsx scripts/submissions.ts pull [--yes] [--prod]        下载原文件与资料到 data/submissions/<北京日期>/<id>/，记录已取走
 *   tsx scripts/submissions.ts done <submission_id> [--yes] [--prod]   标记已处理
 * 不加 --yes 只列出，不写入。对象存储由 OBJECT_STORE 决定（正式环境为 r2）。
 * 原文件可能带拍摄位置等 EXIF；交给 AI 服务前须先去除。
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { beijingDate } from '../src/services/pets.ts';
import { connect, describeTarget, storeFromEnv } from './cli.ts';

const args = process.argv.slice(2);
const [cmd, id] = args.filter((a) => !a.startsWith('--'));
const yes = args.includes('--yes');
const prod = args.includes('--prod');
const OUT = fileURLToPath(new URL('../../data/submissions/', import.meta.url));

const client = await connect(prod);
console.log(describeTarget(prod, yes));
try {
  if (cmd === 'list' || cmd === 'pull') {
    const { rows } = await client.query(
      `SELECT s.submission_id, s.player_id, c.name AS owner_name, s.pet_name, s.object_key, s.content_type, s.size_bytes, s.created_at
         FROM pet_match.submissions s LEFT JOIN pet_match.colleagues c ON c.user_id = s.player_id
        WHERE s.pulled_at IS NULL ORDER BY s.created_at`,
    );
    console.log(`not yet pulled: ${rows.length}`);
    for (const r of rows) console.log(`  ${r.submission_id}  ${r.pet_name}  (owner ${r.owner_name ?? '?'} ${r.player_id})  ${r.content_type} ${(r.size_bytes / 1024).toFixed(0)} KB  ${r.created_at.toISOString()}`);
    if (cmd === 'pull' && yes) {
      const store = storeFromEnv();
      for (const r of rows) {
        const obj = await store.get(r.object_key);
        if (!obj) {
          console.log(`  missing object, skipped: ${r.submission_id} ${r.object_key}`);
          continue;
        }
        const dir = `${OUT}${beijingDate(r.created_at)}/${r.submission_id}/`;
        await mkdir(dir, { recursive: true });
        const ext = r.object_key.split('.').pop();
        await writeFile(`${dir}original.${ext}`, obj.body);
        const info = { submissionId: r.submission_id, petName: r.pet_name, ownerUserId: r.player_id, ownerName: r.owner_name, contentType: r.content_type, sizeBytes: r.size_bytes, submittedAt: r.created_at };
        await writeFile(`${dir}info.json`, `${JSON.stringify(info, null, 2)}\n`);
        await client.query('UPDATE pet_match.submissions SET pulled_at = now() WHERE submission_id = $1', [r.submission_id]);
        console.log(`  pulled → ${dir}`);
      }
      console.log('done. Strip EXIF location before sending photos to the AI image service.');
    }
  } else if (cmd === 'done') {
    if (!id) throw new Error('usage: done <submission_id>');
    const row = (await client.query('SELECT submission_id, pet_name, status, pulled_at FROM pet_match.submissions WHERE submission_id = $1', [id])).rows[0];
    if (!row) throw new Error(`unknown submission ${id}`);
    console.log(`mark done: ${row.submission_id} ${row.pet_name} (status ${row.status}, pulled ${row.pulled_at ? 'yes' : 'no'})`);
    if (yes) {
      await client.query("UPDATE pet_match.submissions SET status = 'done' WHERE submission_id = $1", [id]);
      console.log('applied.');
    }
  } else {
    console.log('usage: submissions.ts list | pull [--yes] | done <submission_id> [--yes]   (add --prod for Supabase)');
  }
} finally {
  await client.end();
}
