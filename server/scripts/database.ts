/** 独立生产库维护；默认只预览迁移，--apply 才执行，不导入任何人员源表。 */
import { connect } from './cli.ts';
import { listMigrations, migrate } from '../src/db/migrate.ts';

const command = process.argv[2];
if (command !== 'migrate' && command !== 'verify') throw new Error('usage: database.ts migrate|verify [--prod] [--apply]');
const client = await connect(process.argv.includes('--prod'));
try {
  if (command === 'migrate') {
    const exists = (await client.query("SELECT to_regclass('pet_match.schema_migrations') IS NOT NULL AS ok")).rows[0].ok;
    const done = new Set(exists ? (await client.query('SELECT version FROM pet_match.schema_migrations')).rows.map(r => r.version) : []);
    const pending = listMigrations().filter(m => !done.has(m.version)).map(m => m.version);
    console.log('pending migrations:', pending.length ? pending.join(', ') : '(none)');
    if (process.argv.includes('--apply')) console.log('applied:', await migrate(client));
    else console.log('Dry run. Add --apply to execute.');
  } else {
    await client.query('BEGIN READ ONLY');
    console.log('database:', (await client.query('SELECT current_database() AS database, current_user AS role')).rows[0]);
    console.log('objects:', (await client.query(`SELECT c.relname AS name, c.relkind AS type, obj_description(c.oid, 'pg_class') AS comment
      FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
      WHERE n.nspname='pet_match' AND c.relkind IN ('r','v') ORDER BY c.relname`)).rows);
    console.log('external personnel table:', (await client.query("SELECT to_regclass('public.\"user\"') IS NOT NULL AS exists")).rows[0].exists);
    await client.query('ROLLBACK');
  }
} finally { await client.end(); }
