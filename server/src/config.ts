/** 运行配置。本地默认连 docker-compose 的开发库；正式环境用 Supabase 专用角色。 */
export const LOCAL_DEV_URL = 'postgres://postgres:postgres@localhost:54329/pet_match_dev';
export const LOCAL_TEST_URL = 'postgres://postgres:postgres@localhost:54329/pet_match_test';

/**
 * 数据库选择：显式 DATABASE_URL 优先；只有 NODE_ENV=production 才使用 .env 里的正式库
 * PET_MATCH_DATABASE_URL，避免本地开发误连 Supabase。
 */
export const config = {
  port: Number(process.env.PORT ?? 8787),
  databaseUrl:
    process.env.DATABASE_URL ??
    (process.env.NODE_ENV === 'production' ? process.env.PET_MATCH_DATABASE_URL : undefined) ??
    LOCAL_DEV_URL,
};

export const isLocalDatabase = (url: string) => /@(localhost|127\.0\.0\.1)[:/]/.test(url);
