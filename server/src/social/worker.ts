import { createHash } from 'node:crypto';
import type { FastifyPluginAsync } from 'fastify';
import type { AppDeps } from '../app.ts';
import type { Pool } from '../db/pool.ts';
import type { ObjectStore } from '../storage/objectStore.ts';
import { claimSyncJob, enqueueSync } from './events.ts';
import { slackRead, SlackReadError, type SlackMessage, type SlackSyncConfig } from './slackApi.ts';
import { markFileDeleted, sourceKey, syncMessage, SYNC_FORMAT_VERSION } from './sync.ts';
import { purgeSocialMedia } from './media.ts';

export async function processSyncJob(pool: Pool, store: ObjectStore, config: SlackSyncConfig) {
  const job = await claimSyncJob(pool);
  if (!job) return false;
  try {
    if (job.event.type === 'file_deleted') await markFileDeleted(pool, job.event.fileId);
    else await syncMessage(pool, store, config, job.event);
    await pool.query(
      "UPDATE pet_match.social_slack_jobs SET done_at=now(),event='{}',claimed_until=NULL,last_error=NULL WHERE event_id=$1 AND claim_token=$2",
      [job.event_id, job.claim_token],
    );
  } catch (error) {
    const code = error instanceof SlackReadError ? error.code : 'processing_failed';
    const delay = error instanceof SlackReadError ? error.retryAfter : Math.min(3600, 5 * 2 ** job.attempts);
    await pool.query(
      `UPDATE pet_match.social_slack_jobs SET available_at=now()+$3*interval '1 second',claimed_until=NULL,last_error=$4,
      failed_at=CASE WHEN attempts>=8 THEN now() ELSE NULL END WHERE event_id=$1 AND claim_token=$2`,
      [job.event_id, job.claim_token, delay, code],
    );
  }
  return true;
}

/** 补近期内容并复核已导入帖；完整窗口才判定缺失，避免分页截断误删。 */
export async function pollSlackChannel(pool: Pool, config: SlackSyncConfig) {
  const oldest = String(Math.floor(Date.now() / 1000) - 30 * 86400);
  const known = (
    await pool.query(
      `SELECT source_ts,source_version FROM pet_match.social_posts WHERE source_channel=$1 AND source='slack' AND deleted_at IS NULL`,
      [config.channelId],
    )
  ).rows;
  const versions = new Map(known.map((r) => [r.source_ts, r.source_version]));
  const seen = new Set<string>();
  let cursor = '';
  let complete = false;
  let queued = 0;
  for (let page = 0; page < 3; page++) {
    const data = await slackRead(config, 'conversations.history', {
      channel: config.channelId,
      oldest,
      limit: '100',
      ...(cursor ? { cursor } : {}),
    });
    for (const message of (data.messages ?? []) as SlackMessage[]) {
      if (message.bot_id || !message.user || (message.thread_ts && message.thread_ts !== message.ts)) continue;
      seen.add(message.ts);
      const version = versions.get(message.ts) ?? message.edited?.ts ?? message.ts;
      const digest = createHash('sha256')
        .update(
          JSON.stringify([
            SYNC_FORMAT_VERSION,
            message.text,
            message.edited?.ts,
            message.files?.map((f) => [f.id, f.mode, f.is_deleted]),
          ]),
        )
        .digest('hex')
        .slice(0, 24);
      await enqueueSync(pool, `poll:${sourceKey(config, message.ts)}:${digest}`, {
        type: 'message',
        ts: message.ts,
        version,
      });
      queued++;
    }
    cursor = data.response_metadata?.next_cursor ?? '';
    if (!data.has_more && !cursor) {
      complete = true;
      break;
    }
    if (!cursor) break;
  }
  if (complete)
    for (const row of known)
      if (Number(row.source_ts) >= Number(oldest) && !seen.has(row.source_ts)) {
        await enqueueSync(pool, `missing:${sourceKey(config, row.source_ts)}`, {
          type: 'delete',
          ts: row.source_ts,
          version: row.source_version,
        });
      }
  const verify = (
    await pool.query(
      `SELECT source_ts,source_version FROM pet_match.social_posts
    WHERE source_channel=$1 AND source='slack' AND hidden_at IS NULL AND deleted_at IS NULL
    AND (source_checked_at IS NULL OR source_checked_at<now()-interval '15 minutes')
    ORDER BY source_checked_at NULLS FIRST LIMIT 20`,
      [config.channelId],
    )
  ).rows;
  const slot = Math.floor(Date.now() / (15 * 60000));
  for (const row of verify)
    await enqueueSync(pool, `verify:${sourceKey(config, row.source_ts)}:${slot}`, {
      type: 'verify',
      ts: row.source_ts,
      version: row.source_version,
    });
  return { queued, complete };
}

export async function pollIfDue(pool: Pool, config: SlackSyncConfig) {
  const key = `${config.teamId}/${config.channelId}`;
  await pool.query('INSERT INTO pet_match.social_sync_state(source_key) VALUES($1) ON CONFLICT DO NOTHING', [key]);
  const claimed = await pool.query(
    `UPDATE pet_match.social_sync_state SET claimed_until=now()+interval '5 minutes'
    WHERE source_key=$1 AND next_poll_at<=now() AND (claimed_until IS NULL OR claimed_until<now()) RETURNING source_key`,
    [key],
  );
  if (!claimed.rowCount) return;
  try {
    await pollSlackChannel(pool, config);
    await pool.query(
      "UPDATE pet_match.social_sync_state SET last_poll_at=now(),next_poll_at=now()+interval '1 minute',claimed_until=NULL,last_error=NULL WHERE source_key=$1",
      [key],
    );
  } catch (error) {
    await pool.query(
      "UPDATE pet_match.social_sync_state SET next_poll_at=now()+$2*interval '1 second',claimed_until=NULL,last_error=$3 WHERE source_key=$1",
      [
        key,
        error instanceof SlackReadError ? Math.max(60, error.retryAfter) : 60,
        error instanceof SlackReadError ? error.code : 'poll_failed',
      ],
    );
  }
}

export const socialWorker: FastifyPluginAsync<AppDeps> = async (app, { pool, social, images }) => {
  if (!social || !images?.store || social.startWorker === false) return;
  const store = images.store;
  let running: Promise<void> | undefined;
  let stopped = false;
  let nextPurge = 0;
  const tick = () => {
    if (stopped || running) return;
    running = (async () => {
      if (social.sync) {
        await processSyncJob(pool, store, social.sync);
        await pollIfDue(pool, social.sync);
      }
      if (Date.now() >= nextPurge) {
        await purgeSocialMedia(pool, store);
        nextPurge = Date.now() + 60000;
      }
    })()
      .catch(() => {
        app.log.warn('social background processing failed; will retry');
      })
      .finally(() => {
        running = undefined;
      });
  };
  const timer = setInterval(tick, 1500);
  timer.unref();
  app.addHook('onReady', async () => {
    tick();
  });
  app.addHook('onClose', async () => {
    stopped = true;
    clearInterval(timer);
    await running;
  });
};
