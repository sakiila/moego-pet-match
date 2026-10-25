/** 运行配置。本地默认连 docker-compose 的开发库；正式环境用 RackNerd PostgreSQL 专用角色。 */
export const LOCAL_DEV_URL = 'postgres://postgres:postgres@localhost:54329/pet_match_dev';
export const LOCAL_TEST_URL = 'postgres://postgres:postgres@localhost:54329/pet_match_test';

/**
 * 数据库选择：显式 DATABASE_URL 优先；只有 NODE_ENV=production 才使用 .env 里的正式库
 * PET_MATCH_DATABASE_URL，避免本地开发误连 Supabase。
 */
export const config = {
  port: Number(process.env.PORT ?? 8787),
  /** 监听地址：本机默认只听 127.0.0.1；容器内设为 0.0.0.0，由端口映射限制在宿主机本地。 */
  host: process.env.HOST ?? '127.0.0.1',
  /** 生产：前端构建产物目录（镜像里为 /app/public）；开发不设置，页面由 Vite 提供。 */
  staticDir: process.env.STATIC_DIR || undefined,
  databaseUrl:
    process.env.DATABASE_URL ??
    (process.env.NODE_ENV === 'production' ? process.env.PET_MATCH_DATABASE_URL : undefined) ??
    LOCAL_DEV_URL,
};

export const isLocalDatabase = (url: string) => /@(localhost|127\.0\.0\.1)[:/]/.test(url);

/** 连接本地库时不用 SSL；DATABASE_SSL=disable 用于本机验证镜像时从容器连本地开发库。 */
export const useDatabaseSsl = (url: string) => process.env.DATABASE_SSL !== 'disable' && !isLocalDatabase(url);
