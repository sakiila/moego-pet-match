import Fastify, { type FastifyError } from 'fastify';
import type { Pool } from './db/pool.ts';
import type { SettleHooks } from './services/games.ts';
import type { DiskCache } from './storage/diskCache.ts';
import type { ObjectStore } from './storage/objectStore.ts';
import type { AvatarFetcher } from './storage/slackAvatar.ts';
import { gameRoutes } from './routes/games.ts';
import { imageRoutes } from './routes/images.ts';
import { leaderboardRoutes } from './routes/leaderboard.ts';
import { petRoutes } from './routes/pets.ts';
import { playerRoutes } from './routes/players.ts';
import { rosterRoutes } from './routes/roster.ts';
import { deletionRoutes } from './routes/deletions.ts';
import { submissionRoutes } from './routes/submissions.ts';
import { webRoutes } from './routes/web.ts';
import type { SubmissionHooks } from './services/submissions.ts';

export interface AppDeps {
  pool: Pool;
  /** 测试用：结算事务中途注入失败。 */
  settleHooks?: SettleHooks;
  /** 测试用：上传写库前注入失败。 */
  submissionHooks?: SubmissionHooks;
  /** 当前时刻（测试可固定，用于每日上限的北京自然日）。 */
  now?: () => Date;
  /** 生产：前端构建产物目录，由同一服务提供页面；开发时为空（页面由 Vite 提供）。 */
  staticDir?: string;
  images?: {
    cache: DiskCache;
    /** R2 私有桶；未配置时宠物图返回 503。 */
    store: ObjectStore | null;
    fetchAvatar: AvatarFetcher;
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
  app.register(petRoutes, deps);
  app.register(imageRoutes, deps);
  app.register(submissionRoutes, deps);
  app.register(deletionRoutes, deps);
  app.register(webRoutes, deps);
  return app;
}
