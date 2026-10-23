import pg from 'pg';
import { useDatabaseSsl } from '../config.ts';

export type Pool = pg.Pool;

export function createPool(connectionString: string): pg.Pool {
  return new pg.Pool({
    connectionString,
    max: 5,
    ssl: useDatabaseSsl(connectionString) ? { rejectUnauthorized: false } : false,
  });
}

/** 在一个事务中执行；任何异常都回滚，不留下部分写入。 */
export async function inTransaction<T>(pool: pg.Pool, fn: (client: pg.PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}
