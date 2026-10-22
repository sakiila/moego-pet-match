import { S3Client } from '@aws-sdk/client-s3';

/** Cloudflare R2（S3 兼容）客户端。凭据来自 .env；浏览器从不直连 R2。 */
export function r2FromEnv(env = process.env) {
  const accountId = env.R2_ACCOUNT_ID;
  const accessKeyId = env.R2_ACCESS_KEY_ID;
  const secretAccessKey = env.R2_SECRET_ACCESS_KEY ?? env.R2_SECRET_KEY_ID;
  const bucket = env.R2_BUCKET_NAME;
  if (!accountId || !accessKeyId || !secretAccessKey || !bucket) return null;
  const client = new S3Client({
    region: 'auto',
    // 设置了 jurisdiction（eu / fedramp）的桶只能通过对应的专属端点访问
    endpoint: `https://${accountId}${env.R2_JURISDICTION ? `.${env.R2_JURISDICTION}` : ''}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
  return { client, bucket };
}

export type R2 = NonNullable<ReturnType<typeof r2FromEnv>>;
