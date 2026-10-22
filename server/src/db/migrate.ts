import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type pg from 'pg';

const MIGRATIONS_DIR = fileURLToPath(new URL('../../migrations/', import.meta.url));

export function listMigrations(): { version: string; sql: string }[] {
  return readdirSync(MIGRATIONS_DIR)
    .filter((f) => /^\d+_.+\.sql$/.test(f))
    .sort()
    .map((f) => ({ version: f.replace(/\.sql$/, ''), sql: readFileSync(MIGRATIONS_DIR + f, 'utf8') }));
}

/** 依次执行未执行过的迁移，每个迁移一个事务；返回本次执行的版本。 */
export async function migrate(client: pg.Client | pg.PoolClient): Promise<string[]> {
  await client.query('CREATE SCHEMA IF NOT EXISTS pet_match');
  await client.query(
    'CREATE TABLE IF NOT EXISTS pet_match.schema_migrations (version text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())',
  );
  const done = new Set((await client.query('SELECT version FROM pet_match.schema_migrations')).rows.map((r) => r.version));
  const applied: string[] = [];
  for (const m of listMigrations()) {
    if (done.has(m.version)) continue;
    await client.query('BEGIN');
    try {
      await client.query(m.sql);
      await client.query('INSERT INTO pet_match.schema_migrations (version) VALUES ($1)', [m.version]);
      await client.query('COMMIT');
      applied.push(m.version);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
  }
  return applied;
}
