import { mkdtemp, readdir, rm, stat, utimes } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, expect, it } from 'vitest';
import { DiskCache } from '../src/storage/diskCache.ts';

const dirs: string[] = [];
async function cache(maxBytes = 1_000_000) {
  const dir = await mkdtemp(join(tmpdir(), 'pm-disk-'));
  dirs.push(dir);
  return new DiskCache(dir, maxBytes);
}
afterEach(async () => {
  await Promise.all(dirs.splice(0).map(dir => rm(dir, { recursive: true, force: true })));
});

it('过期时间按写入时间判断，不因最近读取而延长', async () => {
  const c = await cache();
  await c.put('avatar', Buffer.from('avatar'), 'image/png');
  const name = (await readdir(c.dir)).find(name => name.endsWith('.type'))!;
  const old = new Date(Date.now() - 2_000);
  await utimes(join(c.dir, name), old, old);
  expect(await c.get('avatar', 1_000)).toBeNull();
});

it('多个冷图片并发写入并淘汰时不会因文件被另一轮删除而失败', async () => {
  const c = await cache(3_000);
  for (let round = 0; round < 5; round++) {
    const results = await Promise.allSettled(Array.from({ length: 40 }, async (_, i) => {
      await new Promise(resolve => setTimeout(resolve, i % 10 * 2));
      await c.put(`image-${round}-${i}`, Buffer.alloc(100, i), 'image/png');
    }));
    expect(results.filter(result => result.status === 'rejected')).toEqual([]);
  }
  const names = (await readdir(c.dir)).filter(name => !name.endsWith('.type'));
  const bytes = (await Promise.all(names.map(name => stat(join(c.dir, name))))).reduce((sum, info) => sum + info.size, 0);
  expect(bytes).toBeLessThanOrEqual(3_000);
});

it('下架清理与图片写入、淘汰并发时容忍已删除的缓存文件', async () => {
  const c = await cache(3_000);
  const removing = (async () => {
    for (let i = 0; i < 15; i++) {
      await new Promise(resolve => setTimeout(resolve, 2));
      await c.deleteGroup('pet:mochi');
    }
  })();
  const writes = Array.from({ length: 60 }, async (_, i) => {
    await new Promise(resolve => setTimeout(resolve, i % 20 * 2));
    await c.put(`image-${i}`, Buffer.alloc(100, i), 'image/png', 'pet:mochi');
  });
  const results = await Promise.allSettled([removing, ...writes]);
  expect(results.filter(result => result.status === 'rejected')).toEqual([]);
});
