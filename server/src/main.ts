import { fileURLToPath } from 'node:url';
import { buildApp } from './app.ts';
import { config } from './config.ts';
import { createPool } from './db/pool.ts';
import { DiskCache } from './storage/diskCache.ts';
import { localDirStore } from './storage/localDirStore.ts';
import { r2Store } from './storage/objectStore.ts';
import { r2FromEnv } from './storage/r2.ts';
import { slackAvatarFetcher } from './storage/slackAvatar.ts';

const pool = createPool(config.databaseUrl);
// 默认本地目录对象存储（与 R2 相同的键布局）；OBJECT_STORE=r2 时使用 R2
const r2 = process.env.OBJECT_STORE === 'r2' ? r2FromEnv() : null;
const store = r2 ? r2Store(r2) : localDirStore(process.env.OBJECT_STORE_DIR ?? fileURLToPath(new URL('../.store/', import.meta.url)));
const app = buildApp({
  pool,
  images: {
    cache: new DiskCache(process.env.IMAGE_CACHE_DIR ?? fileURLToPath(new URL('../.cache/img', import.meta.url)), 1.5 * 1024 ** 3),
    store,
    fetchAvatar: slackAvatarFetcher(process.env.SLACK_BOT_TOKEN),
    enableTestUpload: process.env.ENABLE_TEST_UPLOAD === '1',
  },
});
await app.listen({ port: config.port, host: '127.0.0.1' });

const shutdown = async () => {
  await app.close();
  await pool.end();
  process.exit(0);
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
