/** 命令行脚本共用：数据库连接（默认本地开发库，--prod 用 Supabase 管理员连接）与对象存储（OBJECT_STORE=r2 切到 R2）。 */
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { LOCAL_DEV_URL } from '../src/config.ts';
import { readSupabaseAdminConfig } from '../src/db/adminUrl.ts';
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
  const client = new pg.Client(prod ? readSupabaseAdminConfig() : { connectionString: process.env.DATABASE_URL ?? LOCAL_DEV_URL });
  await client.connect();
  return client;
}

export const describeTarget = (prod: boolean, yes: boolean) =>
  `target: ${prod ? 'Supabase (prod)' : 'local dev'} · store: ${process.env.OBJECT_STORE === 'r2' ? 'R2' : 'local dir'}${yes ? '' : ' · DRY RUN'}`;
