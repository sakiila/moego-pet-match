import { randomUUID } from 'node:crypto';
import { inTransaction, type Pool } from '../db/pool.ts';
import type { ObjectStore } from '../storage/objectStore.ts';
import { beijingDate } from './pets.ts';

export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;
/** 每个身份每个北京自然日最多保存成功的提交次数。 */
export const SUBMISSION_DAILY_LIMIT = 10;
export const PET_NAME_MAX = 40;
export const OWNER_QUOTE_MAX = 200;

/**
 * 主人说只收英文：可打印 ASCII（字母、数字、空格、英文标点）与换行，
 * 另放行手机输入法自动替换出的弯引号、省略号和长短破折号。前端 UploadScreen 同一规则。
 */
const ENGLISH_TEXT = /^[\x20-\x7e\n\u2018\u2019\u201c\u201d\u2026\u2013\u2014]*$/;
export const isEnglishText = (text: string) => ENGLISH_TEXT.test(text);

/** 按文件头判断真实格式（不信任文件名与声明的类型）：JPEG、PNG、WebP、HEIC。 */
export function sniffImage(buf: Buffer): { ext: string; contentType: string } | null {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return { ext: 'jpg', contentType: 'image/jpeg' };
  if (buf.length >= 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])))
    return { ext: 'png', contentType: 'image/png' };
  if (buf.length >= 12 && buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP')
    return { ext: 'webp', contentType: 'image/webp' };
  if (buf.length >= 12 && buf.toString('ascii', 4, 8) === 'ftyp' && /^(heic|heix|hevc|mif1|msf1)$/.test(buf.toString('ascii', 8, 12)))
    return { ext: 'heic', contentType: 'image/heic' };
  return null;
}

export class SubmissionError extends Error {
  constructor(readonly code: 'unsupported_type' | 'daily_limit') {
    super(code);
  }
}

export interface SubmissionHooks {
  /** 测试用：写库前注入失败，验证对象回滚。 */
  beforeInsert?: () => Promise<void>;
}

/** 北京时间当天 0 点对应的 UTC 时刻。 */
const beijingDayStart = (now: Date) => new Date(`${beijingDate(now)}T00:00:00+08:00`);

/**
 * 保存一份上传：原样写入对象存储，再在同一身份的咨询锁内复核当天次数并写资料。
 * 超限或写库失败时删除已写入的对象，只有保存成功的提交才计入每日上限。
 */
export async function createSubmission(
  pool: Pool,
  store: ObjectStore,
  input: { playerId: string; petName: string; ownerQuote: string | null; file: Buffer },
  now: Date,
  hooks: SubmissionHooks = {},
): Promise<{ submissionId: string }> {
  const type = sniffImage(input.file);
  if (!type) throw new SubmissionError('unsupported_type');
  const since = beijingDayStart(now);
  const countToday = (db: Pick<Pool, 'query'>) =>
    db.query('SELECT count(*)::int AS n FROM pet_match.submissions WHERE player_id = $1 AND created_at >= $2', [input.playerId, since]).then((r) => r.rows[0].n as number);
  // 先粗查一次，已满时不必上传对象
  if ((await countToday(pool)) >= SUBMISSION_DAILY_LIMIT) throw new SubmissionError('daily_limit');

  const key = `submissions/${input.playerId}/${randomUUID()}.${type.ext}`;
  await store.put(key, input.file, type.contentType);
  try {
    return await inTransaction(pool, async (client) => {
      await client.query("SELECT pg_advisory_xact_lock(hashtext('submission:' || $1))", [input.playerId]);
      if ((await countToday(client)) >= SUBMISSION_DAILY_LIMIT) throw new SubmissionError('daily_limit');
      await hooks.beforeInsert?.();
      const { rows } = await client.query(
        `INSERT INTO pet_match.submissions (player_id, pet_name, owner_quote, object_key, content_type, size_bytes, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING submission_id`,
        [input.playerId, input.petName, input.ownerQuote, key, type.contentType, input.file.length, now],
      );
      return { submissionId: rows[0].submission_id as string };
    });
  } catch (error) {
    await store.delete(key).catch(() => {});
    throw error;
  }
}
