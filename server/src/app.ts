import Fastify, { type FastifyError } from 'fastify';
import type { Pool } from './db/pool.ts';
import type { SettleHooks } from './services/games.ts';
import type { DiskCache } from './storage/diskCache.ts';
import type { ObjectStore } from './storage/objectStore.ts';
import type { AvatarFetcher } from './storage/slackAvatar.ts';
import { gameRoutes } from './routes/games.ts';
import { imageRoutes } from './routes/images.ts';
import { leaderboardRoutes } from './routes/leaderboard.ts';
import { playerRoutes } from './routes/players.ts';
import { rosterRoutes } from './routes/roster.ts';
import { testUploadRoutes } from './routes/testUpload.ts';

export interface AppDeps {
  pool: Pool;
  /** 测试用：结算事务中途注入失败。 */
  settleHooks?: SettleHooks;
  images?: {
    cache: DiskCache;
    /** R2 私有桶；未配置时宠物图返回 503。 */
    store: ObjectStore | null;
    fetchAvatar: AvatarFetcher;
    enableTestUpload?: boolean;
  };
}

export function buildApp(deps: AppDeps) {
  const app = Fastify({ logger: process.env.NODE_ENV === 'test' ? false : { level: 'info' } });

  // 数据库等内部错误统一成「暂时不可用」，前端据此区分读取失败与未找到
  app.setErrorHandler((error: FastifyError, request, reply) => {
    if (error.validation) return reply.status(400).send({ error: 'invalid_request', detail: error.message });
    request.log.error(error);
    return reply.status(503).send({ error: 'unavailable' });
  });

  app.register(rosterRoutes, deps);
  app.register(playerRoutes, deps);
  app.register(gameRoutes, deps);
  app.register(leaderboardRoutes, deps);
  app.register(imageRoutes, deps);
  app.register(testUploadRoutes, deps);
  return app;
}
