/** 命令行脚本共用：默认本地开发库，--prod 使用显式管理员连接；OBJECT_STORE=r2 切到 R2。 */
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { LOCAL_DEV_URL, useDatabaseSsl } from '../src/config.ts';
import { localDirStore } from '../src/storage/localDirStore.ts';
import { r2Store, type ObjectStore } from '../src/storage/objectStore.ts';
import { r2FromEnv } from '../src/storage/r2.ts';

export function storeFromEnv(): ObjectStore {
  if (process.env.OBJECT_STORE === 'r2') {
    const r2 = r2FromEnv();
    if (!r2) throw new Error('R2 not configured');
    return r2Store(r2);
  }
  return localDirStore(process.env.OBJECT_STORE_DIR ?? fileURLToPath(new URL('../.store/', import.meta.url)));
}

export async function connect(prod: boolean): Promise<pg.Client> {
  const connectionString = prod ? process.env.PET_MATCH_ADMIN_DATABASE_URL : process.env.DATABASE_URL ?? LOCAL_DEV_URL;
  if (!connectionString) throw new Error('PET_MATCH_ADMIN_DATABASE_URL is required for --prod');
  const client = new pg.Client({ connectionString, ssl: useDatabaseSsl(connectionString) ? { rejectUnauthorized: false } : false });
  await client.connect();
  return client;
}

export const describeTarget = (prod: boolean, yes: boolean) =>
  `target: ${prod ? 'production PostgreSQL' : 'local dev'} · store: ${process.env.OBJECT_STORE === 'r2' ? 'R2' : 'local dir'}${yes ? '' : ' · DRY RUN'}`;
