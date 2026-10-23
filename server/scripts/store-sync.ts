/**
 * 把本地对象存储（server/.store，与 R2 相同键布局）同步到 R2：只上传桶里还没有的键，不删除、不覆盖、不碰数据库。
 *   tsx --env-file=../.env scripts/store-sync.ts [--yes]
 * 不加 --yes 只列出将上传的对象。
 */
import { readdir, readFile } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ListObjectsV2Command, PutObjectCommand } from '@aws-sdk/client-s3';
import { r2FromEnv } from '../src/storage/r2.ts';

const TYPES: Record<string, string> = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp' };
const yes = process.argv.includes('--yes');
const root = process.env.OBJECT_STORE_DIR ?? fileURLToPath(new URL('../.store/', import.meta.url));

const r2 = r2FromEnv();
if (!r2) throw new Error('R2 not configured (R2_ACCOUNT_ID / R2_ACCESS_KEY_ID / R2_SECRET_KEY_ID / R2_BUCKET_NAME)');

async function walk(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(entries.map((e) => (e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)])));
  return nested.flat();
}

async function remoteKeys(): Promise<Set<string>> {
  const keys = new Set<string>();
  let token: string | undefined;
  do {
    const res = await r2!.client.send(new ListObjectsV2Command({ Bucket: r2!.bucket, ContinuationToken: token }));
    for (const o of res.Contents ?? []) if (o.Key) keys.add(o.Key);
    token = res.IsTruncated ? res.NextContinuationToken : undefined;
  } while (token);
  return keys;
}

const local = (await walk(root)).map((file) => ({ file, key: relative(root, file).split(sep).join('/') }));
const existing = await remoteKeys();
const todo = local.filter((o) => !existing.has(o.key) && TYPES[o.key.split('.').pop() ?? '']);
const skipped = local.filter((o) => !TYPES[o.key.split('.').pop() ?? '']);

const byPrefix = new Map<string, number>();
for (const o of todo) byPrefix.set(o.key.split('/')[0], (byPrefix.get(o.key.split('/')[0]) ?? 0) + 1);
console.log(`bucket ${r2.bucket}: ${existing.size} existing · local ${local.length} · to upload ${todo.length}${yes ? '' : ' · DRY RUN'}`);
for (const [prefix, n] of byPrefix) console.log(`  ${prefix}/: ${n}`);
if (skipped.length) console.log(`  ignored (unknown type): ${skipped.map((o) => o.key).join(', ')}`);

if (yes) {
  let done = 0;
  for (const o of todo) {
    await r2.client.send(
      new PutObjectCommand({ Bucket: r2.bucket, Key: o.key, Body: await readFile(o.file), ContentType: TYPES[o.key.split('.').pop()!] }),
    );
    if (++done % 50 === 0) console.log(`  uploaded ${done}/${todo.length}`);
  }
  const after = await remoteKeys();
  const missing = local.filter((o) => TYPES[o.key.split('.').pop() ?? ''] && !after.has(o.key));
  console.log(`uploaded ${done}; bucket now ${after.size}; missing ${missing.length}`);
}
