import { fileURLToPath } from 'node:url';
import { buildApp } from './app.ts';
import { config } from './config.ts';
import { createPool } from './db/pool.ts';
import { DiskCache } from './storage/diskCache.ts';
import { r2Store } from './storage/objectStore.ts';
import { r2FromEnv } from './storage/r2.ts';
import { slackAvatarFetcher } from './storage/slackAvatar.ts';

const pool = createPool(config.databaseUrl);
const r2 = r2FromEnv();
const app = buildApp({
  pool,
  images: {
    cache: new DiskCache(process.env.IMAGE_CACHE_DIR ?? fileURLToPath(new URL('../.cache/img', import.meta.url)), 1.5 * 1024 ** 3),
    store: r2 ? r2Store(r2) : null,
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
