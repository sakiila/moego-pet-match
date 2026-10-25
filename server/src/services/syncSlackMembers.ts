import { inTransaction, type Pool } from '../db/pool.ts';
import type { SlackMember } from './slackDirectory.ts';

/** 仅接受完整的有效成员列表；整个更新失败时保留上次可用名册。 */
export async function syncSlackMembers(pool: Pool, members: SlackMember[]): Promise<number> {
  if (!members.length) throw new Error('refusing to replace Slack directory with an empty list');
  return inTransaction(pool, async client => {
    await client.query("SELECT pg_advisory_xact_lock(hashtext('pet_match_slack_directory'))");
    await client.query('UPDATE pet_match.slack_members SET active=false WHERE active AND user_id <> ALL($1::text[])', [members.map(m => m.userId)]);
    await client.query(
      `INSERT INTO pet_match.slack_members (user_id, name, email, active, synced_at)
       SELECT "userId", name, email, true, now() FROM jsonb_to_recordset($1::jsonb) AS m("userId" text, name text, email text)
       ON CONFLICT (user_id) DO UPDATE SET name=EXCLUDED.name, email=EXCLUDED.email, active=true, synced_at=EXCLUDED.synced_at`,
      [JSON.stringify(members)],
    );
    return members.length;
  });
}
