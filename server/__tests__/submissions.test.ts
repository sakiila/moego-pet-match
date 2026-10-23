import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.ts';
import { MAX_UPLOAD_BYTES, SUBMISSION_DAILY_LIMIT } from '../src/services/submissions.ts';
import { DiskCache } from '../src/storage/diskCache.ts';
import { memoryStore } from '../src/storage/objectStore.ts';
import { freshDatabase } from './helpers.ts';

const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(64, 1)]);
const HEIC = Buffer.concat([Buffer.from('0000ftypheic'), Buffer.alloc(64, 3)]);

let ctx: Awaited<ReturnType<typeof freshDatabase>>;
let app: ReturnType<typeof buildApp>;
const store = memoryStore();
let now = new Date('2026-10-23T02:00:00Z'); // 北京时间 10:00
let failInsert = false;
let slowInsert = false;

beforeAll(async () => {
  ctx = await freshDatabase();
  app = buildApp({
    pool: ctx.pool,
    now: () => now,
    submissionHooks: {
      beforeInsert: async () => {
        if (failInsert) throw new Error('db down');
        // 并发测试：在复核次数之后、写入之前停一下，让几个请求真正交叠
        if (slowInsert) await new Promise((r) => setTimeout(r, 200));
      },
    },
    images: { cache: new DiskCache(mkdtempSync(join(tmpdir(), 'pm-sub-')), 1024 * 1024), store, fetchAvatar: async () => null },
  });
});
afterAll(async () => {
  await app.close();
  await ctx.app.close();
  await ctx.pool.end();
});
beforeEach(async () => {
  await ctx.pool.query('DELETE FROM pet_match.submissions');
  store.objects.clear();
  now = new Date('2026-10-23T02:00:00Z');
  failInsert = false;
  slowInsert = false;
});

function upload(file: Buffer, fields: Record<string, string> = { playerId: 'U_TEST_BOB', petName: 'Oreo' }, filename = 'oreo.jpg') {
  const boundary = '----pmsub';
  const parts = [
    ...Object.entries(fields).map(([k, v]) => `--${boundary}\r\nContent-Disposition: form-data; name="${k}"\r\n\r\n${v}\r\n`),
    `--${boundary}\r\nContent-Disposition: form-data; name="photo"; filename="${filename}"\r\nContent-Type: image/jpeg\r\n\r\n`,
  ];
  const body = Buffer.concat([Buffer.from(parts.join('')), file, Buffer.from(`\r\n--${boundary}--\r\n`)]);
  return app.inject({ method: 'POST', url: '/api/submissions', payload: body, headers: { 'content-type': `multipart/form-data; boundary=${boundary}` } });
}

describe('上传提交', () => {
  it('原样保存原文件（不转码），记下名字、主人与真实格式', async () => {
    const res = await upload(HEIC, { playerId: 'U_TEST_BOB', petName: '  Oreo  ' }, 'IMG_0001.heic');
    expect(res.statusCode).toBe(200);
    const row = (await ctx.pool.query('SELECT player_id, pet_name, object_key, content_type, size_bytes, status FROM pet_match.submissions')).rows[0];
    expect(row).toMatchObject({ player_id: 'U_TEST_BOB', pet_name: 'Oreo', content_type: 'image/heic', size_bytes: HEIC.length, status: 'received' });
    expect(row.object_key).toMatch(/^submissions\/U_TEST_BOB\/[0-9a-f-]+\.heic$/);
    expect(store.objects.get(row.object_key)?.body.equals(HEIC)).toBe(true);
    expect(res.json()).toEqual({ submissionId: expect.any(String) });
  });

  it('按文件头判断格式：扩展名伪装成 .jpg 的 GIF 被拒，不落对象', async () => {
    const res = await upload(Buffer.from('GIF89a pretending'), undefined, 'cat.jpg');
    expect(res.statusCode).toBe(415);
    expect(res.json().error).toBe('unsupported_type');
    expect(store.objects.size).toBe(0);
  });

  it('超过 20 MB 被拒', async () => {
    const res = await upload(Buffer.concat([PNG, Buffer.alloc(MAX_UPLOAD_BYTES)]));
    expect(res.statusCode).toBe(413);
    expect(res.json().error).toBe('too_large');
    expect(store.objects.size).toBe(0);
  });

  it('缺照片、缺名字或名字过长都被拒', async () => {
    expect((await upload(PNG, { playerId: 'U_TEST_BOB', petName: '   ' })).json().error).toBe('name_required');
    expect((await upload(PNG, { playerId: 'U_TEST_BOB', petName: 'x'.repeat(41) })).statusCode).toBe(400);
    const noFile = await app.inject({ method: 'POST', url: '/api/submissions', payload: '', headers: { 'content-type': 'multipart/form-data; boundary=x' } });
    expect(noFile.statusCode).toBe(400);
  });

  it('名单外身份被拒', async () => {
    expect((await upload(PNG, { playerId: 'U_TEST_GUEST', petName: 'X' })).statusCode).toBe(404);
  });

  it('每个身份每个北京自然日最多 10 次；第 11 次被拒，北京 0 点后重置；别人不受影响', async () => {
    for (let i = 0; i < SUBMISSION_DAILY_LIMIT; i++) expect((await upload(PNG)).statusCode).toBe(200);
    const eleventh = await upload(PNG);
    expect(eleventh.statusCode).toBe(429);
    expect(eleventh.json().error).toBe('daily_limit');
    expect(store.objects.size).toBe(SUBMISSION_DAILY_LIMIT);
    expect((await upload(PNG, { playerId: 'U_TEST_ALICE', petName: 'Kiwi' })).statusCode).toBe(200);
    now = new Date('2026-10-23T15:59:00Z'); // 北京 23:59，仍是同一天
    expect((await upload(PNG)).statusCode).toBe(429);
    now = new Date('2026-10-23T16:00:00Z'); // 北京次日 0:00
    expect((await upload(PNG)).statusCode).toBe(200);
  });

  it('只统计保存成功的提交：数据库写入失败时删掉已写的对象，也不占用当天次数', async () => {
    failInsert = true;
    expect((await upload(PNG)).statusCode).toBe(503);
    expect(store.objects.size).toBe(0);
    expect((await ctx.pool.query('SELECT count(*)::int n FROM pet_match.submissions')).rows[0].n).toBe(0);
  });

  it('并发提交也不会超过上限', async () => {
    for (let i = 0; i < SUBMISSION_DAILY_LIMIT - 1; i++) await upload(PNG);
    slowInsert = true;
    const results = await Promise.all([upload(PNG), upload(PNG), upload(PNG)]);
    expect(results.filter((r) => r.statusCode === 200)).toHaveLength(1);
    expect((await ctx.pool.query('SELECT count(*)::int n FROM pet_match.submissions')).rows[0].n).toBe(SUBMISSION_DAILY_LIMIT);
    expect(store.objects.size).toBe(SUBMISSION_DAILY_LIMIT);
  });
});
