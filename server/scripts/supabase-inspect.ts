/** 只读核验 Supabase：版本、schema、角色与同事名单人数。不做任何写入。 */
import pg from 'pg';
import { readSupabaseAdminConfig } from '../src/db/adminUrl.ts';

const client = new pg.Client(readSupabaseAdminConfig());
await client.connect();
try {
  await client.query('SET default_transaction_read_only = on');
  const q = async (sql: string) => (await client.query(sql)).rows;
  console.log('server_version:', (await q('SHOW server_version'))[0].server_version);
  console.log('current_user:', (await q('SELECT current_user'))[0].current_user);
  console.log('schemas:', (await q("SELECT nspname FROM pg_namespace WHERE nspname NOT LIKE 'pg\\_%' AND nspname <> 'information_schema' ORDER BY 1")).map((r) => r.nspname).join(', '));
  console.log('pet_match roles:', (await q("SELECT rolname FROM pg_roles WHERE rolname LIKE 'pet_match%'")).map((r) => r.rolname));
  console.log('user columns:', (await q("SELECT column_name, data_type FROM information_schema.columns WHERE table_schema='public' AND table_name='user' ORDER BY ordinal_position")).map((r) => `${r.column_name}:${r.data_type}`).join(', '));
  console.log('eligible colleagues:', (await q(`SELECT count(*)::int AS n FROM public."user" WHERE deleted = false AND is_bot = false AND (team_id = 'T011CF3CMJN' OR email ILIKE '%@moego.pet')`))[0].n);
  console.log('can create role:', (await q('SELECT rolcreaterole FROM pg_roles WHERE rolname = current_user'))[0].rolcreaterole);
} finally {
  await client.end();
}
