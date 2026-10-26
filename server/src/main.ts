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
import { productionTurnstile } from './services/turnstile.ts';

const pool = createPool(config.databaseUrl);
const gameSecurity = process.env.NODE_ENV === 'production' ? productionTurnstile(process.env) : undefined;
// 访客仍可参与，但必须使用允许的公司域名邮箱并通过真人账号过滤。
const directory = slackDirectory(process.env.SLACK_BOT_TOKEN, { allowGuests: true });
// 默认本地目录对象存储（与 R2 相同的键布局）；OBJECT_STORE=r2 时使用 R2
const r2 = process.env.OBJECT_STORE === 'r2' ? r2FromEnv() : null;
const store = r2 ? r2Store(r2) : localDirStore(process.env.OBJECT_STORE_DIR ?? fileURLToPath(new URL('../.store/', import.meta.url)));
const app = buildApp({
  pool,
  gameSecurity,
  staticDir: config.staticDir,
  gameVersion: config.gameVersion,
  directory,
  social: process.env.PET_SOCIAL_ENABLED === 'true' ? {
    publicOrigin: process.env.PET_SOCIAL_PUBLIC_ORIGIN ?? (process.env.NODE_ENV === 'production' ? 'https://star.baobo.me' : 'http://127.0.0.1:5180'),
    adminIds: (process.env.SLACK_ADMIN_MEMBER_ID ?? '').split(',').map(id => id.trim()).filter(Boolean),
    sync: process.env.PET_SOCIAL_SLACK_SYNC_ENABLED === 'true' && process.env.SLACK_BOT_TOKEN ? {
      teamId: 'T011CF3CMJN', channelId: 'C0APZBRK49E', token: process.env.SLACK_BOT_TOKEN,
    } : undefined,
  } : undefined,
  notify: slackAdminNotifier(process.env.SLACK_BOT_TOKEN, process.env.SLACK_NOTIFY_CHANNEL),
  slack: process.env.SLACK_SIGNING_SECRET && process.env.SLACK_BOT_TOKEN ? { signingSecret: process.env.SLACK_SIGNING_SECRET, token: process.env.SLACK_BOT_TOKEN } : null,
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
// 开发库使用本地样例身份；正式环境才以完整 Slack 名单覆盖名册。
const directoryTimer = process.env.NODE_ENV === 'production' ? setInterval(refreshDirectory, 5 * 60_000) : undefined;
if (directoryTimer) {
  refreshDirectory();
  directoryTimer.unref();
}

const shutdown = async () => {
  if (directoryTimer) clearInterval(directoryTimer);
  await app.close();
  await refresh;
  await pool.end();
  process.exit(0);
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
