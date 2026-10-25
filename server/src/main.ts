import { fileURLToPath } from 'node:url';
import { buildApp } from './app.ts';
import { config } from './config.ts';
import { createPool } from './db/pool.ts';
import { DiskCache } from './storage/diskCache.ts';
import { localDirStore } from './storage/localDirStore.ts';
import { r2Store } from './storage/objectStore.ts';
import { r2FromEnv } from './storage/r2.ts';
import { slackAdminNotifier } from './services/adminNotify.ts';
import { slackDirectory } from './services/slackDirectory.ts';
import { slackAvatarFetcher } from './storage/slackAvatar.ts';
import { syncSlackMembers } from './services/syncSlackMembers.ts';

const pool = createPool(config.databaseUrl);
const directory = slackDirectory(process.env.SLACK_BOT_TOKEN);
// 默认本地目录对象存储（与 R2 相同的键布局）；OBJECT_STORE=r2 时使用 R2
const r2 = process.env.OBJECT_STORE === 'r2' ? r2FromEnv() : null;
const store = r2 ? r2Store(r2) : localDirStore(process.env.OBJECT_STORE_DIR ?? fileURLToPath(new URL('../.store/', import.meta.url)));
const app = buildApp({
  pool,
  staticDir: config.staticDir,
  directory,
  notify: slackAdminNotifier(process.env.SLACK_BOT_TOKEN, process.env.SLACK_NOTIFY_CHANNEL),
  images: {
    cache: new DiskCache(process.env.IMAGE_CACHE_DIR ?? fileURLToPath(new URL('../.cache/img', import.meta.url)), 1.5 * 1024 ** 3),
    store,
    fetchAvatar: slackAvatarFetcher(process.env.SLACK_BOT_TOKEN),
  },
});
await app.listen({ port: config.port, host: config.host });

let refresh: Promise<void> | undefined;
const refreshDirectory = () => {
  if (!directory || refresh) return;
  refresh = directory.all()
    .then(members => syncSlackMembers(pool, members))
    .then(count => { app.log.info({ count }, 'Slack directory synced'); })
    .catch(error => { app.log.warn(error, 'Slack directory sync failed; keeping saved directory'); })
    .finally(() => { refresh = undefined; });
};
refreshDirectory();
const directoryTimer = setInterval(refreshDirectory, 5 * 60_000);
directoryTimer.unref();

const shutdown = async () => {
  clearInterval(directoryTimer);
  await app.close();
  await refresh;
  await pool.end();
  process.exit(0);
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
