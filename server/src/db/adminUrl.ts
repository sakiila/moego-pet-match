import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/**
 * Supabase 管理员连接：`.env` 末行的 JDBC URL（jdbc:postgresql://host:port/db?user=…&password=…）。
 * 只供运维脚本（只读核验、建 schema / 角色、迁移）使用，应用运行时使用专用角色 PET_MATCH_DATABASE_URL。
 */
export function readSupabaseAdminConfig() {
  const envPath = fileURLToPath(new URL('../../../.env', import.meta.url));
  const line = readFileSync(envPath, 'utf8')
    .split('\n')
    .map((l) => l.trim())
    .find((l) => l.startsWith('jdbc:postgresql://'));
  if (!line) throw new Error('No jdbc:postgresql:// line found in .env');
  const url = new URL(line.slice('jdbc:'.length));
  return {
    host: url.hostname,
    port: Number(url.port || 5432),
    database: url.pathname.slice(1),
    user: url.searchParams.get('user') ?? '',
    password: url.searchParams.get('password') ?? '',
    ssl: { rejectUnauthorized: false },
  };
}
