import fastifyStatic from '@fastify/static';
import type { FastifyPluginAsync } from 'fastify';
import type { AppDeps } from '../app.ts';
import { RULES_VERSION } from '../../../web/src/engine/config.ts';

const HEALTH_TIMEOUT_MS = 2_000;

/**
 * 健康检查（Docker HEALTHCHECK 与反向代理用）：顺带确认数据库可连。
 * 生产时同一服务提供前端构建产物：带哈希的 /assets 长期缓存，index.html 不缓存，
 * 其他页面路径回退到 index.html；/api、/img 的 404 不返回页面。
 */
export const webRoutes: FastifyPluginAsync<AppDeps> = async (app, { pool, staticDir, gameVersion = null }) => {
  // 当前运行的构建版本与引擎规则版本：首页据此提示旧页面刷新（规则不一致时旧页面的结算会被拒绝）
  app.get('/api/version', async (_request, reply) => reply.header('cache-control', 'no-cache').send({ version: gameVersion, rulesVersion: RULES_VERSION }));

  app.get('/api/health', async (_request, reply) => {
    const timeout = new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), HEALTH_TIMEOUT_MS));
    try {
      await Promise.race([pool.query('SELECT 1'), timeout]);
      return { ok: true };
    } catch {
      return reply.status(503).send({ ok: false });
    }
  });

  if (!staticDir) return;
  await app.register(fastifyStatic, {
    root: staticDir,
    wildcard: false,
    index: false,
    // 缓存头由下面按路径设置，关闭插件自带的 max-age=0
    cacheControl: false,
    setHeaders: (res, path) => {
      res.setHeader('cache-control', /[\\/]assets[\\/]/.test(path) ? 'public, max-age=31536000, immutable' : 'no-cache');
    },
  });

  app.setNotFoundHandler((request, reply) => {
    const path = request.url.split('?')[0];
    if (request.method !== 'GET' || /^\/(api|img|assets)(\/|$)/.test(path)) {
      return reply.status(404).send(path.startsWith('/api') ? { error: 'not_found' } : undefined);
    }
    return reply.header('cache-control', 'no-cache').sendFile('index.html');
  });
};
