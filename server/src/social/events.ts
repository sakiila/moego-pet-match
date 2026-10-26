import { randomUUID } from 'node:crypto';
import type { Pool } from '../db/pool.ts';
import type { SlackSyncConfig } from './slackApi.ts';

export type SyncEvent =
  { type: 'message' | 'delete' | 'verify'; ts: string; version: string } | { type: 'file_deleted'; fileId: string };
export const validTs = (value: unknown): value is string =>
  typeof value === 'string' && /^\d{1,16}(?:\.\d{1,6})?$/.test(value);
export function syncEvent(payload: Record<string, any>, config: SlackSyncConfig): SyncEvent | null {
  if (payload.type !== 'event_callback' || payload.team_id !== config.teamId) return null;
  const event = payload.event;
  if (!event || typeof event !== 'object') return null;
  if (event.type === 'file_deleted' && typeof event.file_id === 'string' && /^F[A-Z0-9]+$/.test(event.file_id))
    return { type: 'file_deleted', fileId: event.file_id };
  if (event.type !== 'message' || event.channel !== config.channelId) return null;
  const message = event.subtype === 'message_changed' ? event.message : event;
  const ts = event.subtype === 'message_deleted' ? event.deleted_ts : message?.ts;
  if (!validTs(ts)) return null;
  const root = event.subtype === 'message_deleted' ? event.previous_message : message;
  if (root?.thread_ts && root.thread_ts !== ts) return null;
  if (message?.bot_id || ['bot_message', 'message_replied', 'channel_join', 'channel_leave'].includes(event.subtype))
    return null;
  if (event.subtype && !['file_share', 'message_changed', 'message_deleted'].includes(event.subtype)) return null;
  const version = validTs(event.event_ts) ? event.event_ts : validTs(message?.edited?.ts) ? message.edited.ts : ts;
  return { type: event.subtype === 'message_deleted' ? 'delete' : 'message', ts, version };
}
export async function enqueueSync(pool: Pool, eventId: string, event: SyncEvent) {
  await pool.query(
    'INSERT INTO pet_match.social_slack_jobs(event_id,event) VALUES($1,$2) ON CONFLICT(event_id) DO NOTHING',
    [eventId, event],
  );
}
export async function acceptSyncEvent(pool: Pool, payload: Record<string, any>, config: SlackSyncConfig) {
  const event = syncEvent(payload, config);
  if (event && typeof payload.event_id === 'string' && payload.event_id.length <= 200)
    await enqueueSync(pool, payload.event_id, event);
}
export async function claimSyncJob(pool: Pool) {
  const token = randomUUID();
  const { rows } = await pool.query(
    `WITH candidate AS (SELECT event_id FROM pet_match.social_slack_jobs
    WHERE done_at IS NULL AND failed_at IS NULL AND available_at<=now() AND (claimed_until IS NULL OR claimed_until<now())
    ORDER BY available_at,event_id LIMIT 1 FOR UPDATE SKIP LOCKED)
    UPDATE pet_match.social_slack_jobs j SET claimed_until=now()+interval '5 minutes',claim_token=$1,attempts=attempts+1
    FROM candidate c WHERE j.event_id=c.event_id RETURNING j.*`,
    [token],
  );
  return rows[0] as { event_id: string; event: SyncEvent; claim_token: string; attempts: number } | undefined;
}
