import { S3Client } from '@aws-sdk/client-s3';

/**
 * R2 读写的超时：SDK 默认不限时，连接或响应卡住时图片请求会一直挂着，
 * 前端只能等到自己的超时。连接 2 秒、无数据 4 秒即放弃，最多重试一次。
 */
export const R2_TIMEOUTS = { connectionTimeout: 2_000, requestTimeout: 4_000, maxAttempts: 2 };

export function r2Client(
  { endpoint, accessKeyId, secretAccessKey }: { endpoint: string; accessKeyId: string; secretAccessKey: string },
  { connectionTimeout, requestTimeout, maxAttempts } = R2_TIMEOUTS,
) {
  return new S3Client({
    region: 'auto',
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
    maxAttempts,
    // 新版 SDK 的 requestTimeout 默认只打警告，须显式要求超时即报错
    requestHandler: { connectionTimeout, requestTimeout, throwOnRequestTimeout: true },
  });
}

/** Cloudflare R2（S3 兼容）客户端。凭据来自 .env；浏览器从不直连 R2。 */
export function r2FromEnv(env = process.env) {
  const accountId = env.R2_ACCOUNT_ID;
  const accessKeyId = env.R2_ACCESS_KEY_ID;
  const secretAccessKey = env.R2_SECRET_ACCESS_KEY ?? env.R2_SECRET_KEY_ID;
  const bucket = env.R2_BUCKET_NAME;
  if (!accountId || !accessKeyId || !secretAccessKey || !bucket) return null;
  const client = r2Client({
    // 设置了 jurisdiction（eu / fedramp）的桶只能通过对应的专属端点访问
    endpoint: `https://${accountId}${env.R2_JURISDICTION ? `.${env.R2_JURISDICTION}` : ''}.r2.cloudflarestorage.com`,
    accessKeyId,
    secretAccessKey,
  });
  return { client, bucket };
}

export type R2 = NonNullable<ReturnType<typeof r2FromEnv>>;
