/** 只读核验 R2：桶是否可访问、位置信息，以及默认端点是否可用（判断是否设置了 EU 等 jurisdiction）。 */
import { GetBucketLocationCommand, HeadBucketCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { r2FromEnv } from '../src/storage/r2.ts';

const r2 = r2FromEnv();
if (!r2) throw new Error('R2 env not configured');
const run = async (label: string, fn: () => Promise<unknown>) => {
  try {
    console.log(label, JSON.stringify(await fn()));
  } catch (e) {
    const err = e as { name?: string; message?: string; $metadata?: { httpStatusCode?: number } };
    console.log(label, 'ERROR', err.name, err.$metadata?.httpStatusCode, err.message?.slice(0, 160));
  }
};
await run('head (default endpoint):', async () => (await r2.client.send(new HeadBucketCommand({ Bucket: r2.bucket }))).$metadata.httpStatusCode);
await run('location:', async () => (await r2.client.send(new GetBucketLocationCommand({ Bucket: r2.bucket }))).LocationConstraint ?? null);
await run('objects (first 5 keys):', async () =>
  (await r2.client.send(new ListObjectsV2Command({ Bucket: r2.bucket, MaxKeys: 5 }))).Contents?.map((o) => o.Key) ?? [],
);
