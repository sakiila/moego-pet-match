/** 使用测试夹具重建 pet_match_test；始终使用 LOCAL_TEST_URL，不读取生产连接配置。 */
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { freshDatabase } from '../__tests__/helpers.ts';
import { buildApp } from '../src/app.ts';
import { DiskCache } from '../src/storage/diskCache.ts';
import type { RegisteredGame, ResultPayload } from '../../web/src/api/types.ts';

const ctx = await freshDatabase();
const dir = await mkdtemp(join(tmpdir(), 'pm-benchmark-'));
let originGets = 0;
const app = buildApp({
  pool: ctx.pool,
  images: {
    cache: new DiskCache(dir, 10_000_000),
    fetchAvatar: async () => null,
    store: {
      get: async () => {
        originGets++;
        await new Promise(resolve => setTimeout(resolve, 40));
        return { body: Buffer.alloc(28_000, 1), contentType: 'image/png' };
      },
      put: async () => {}, delete: async () => {},
    },
  },
});
const round = (value: number) => Math.round(value * 10) / 10;
async function batch(name: string, requests: number, concurrency: number, request: () => Promise<{ statusCode: number }>) {
  const times: number[] = [];
  const statuses: Record<string, number> = {};
  let next = 0;
  let dbAcquisitions = 0;
  let waitingPeak = 0;
  const acquired = () => { dbAcquisitions++; };
  ctx.pool.on('acquire', acquired);
  const timer = setInterval(() => { waitingPeak = Math.max(waitingPeak, ctx.pool.waitingCount); }, 1);
  const start = performance.now();
  const before = originGets;
  try {
    await Promise.all(Array.from({ length: concurrency }, async () => {
      while (next++ < requests) {
        const at = performance.now();
        const response = await request();
        times.push(performance.now() - at);
        statuses[response.statusCode] = (statuses[response.statusCode] ?? 0) + 1;
      }
    }));
  } finally {
    clearInterval(timer);
    ctx.pool.off('acquire', acquired);
  }
  times.sort((a, b) => a - b);
  const result = { name, requests, concurrency, ms: round(performance.now() - start),
    p50: round(times[Math.ceil(times.length * .5) - 1]), p95: round(times[Math.ceil(times.length * .95) - 1]),
    dbAcquisitions, waitingPeak, originFetches: originGets - before, statuses };
  console.log(JSON.stringify(result));
  if (statuses[200] !== requests) throw new Error(`${name}: failed requests`);
  return result;
}

try {
  await ctx.pool.query(`UPDATE pet_match.pets SET sticker_key = 'benchmark/' || pet_id`);
  await app.ready();
  await app.inject('/api/manager');
  const stages = [];
  stages.push(await batch('manager', 100, 20, () => app.inject('/api/manager')));
  stages.push(await batch('cold-image', 30, 30, () => app.inject('/img/pets/mochi/128')));
  stages.push(await batch('warm-image', 100, 20, () => app.inject('/img/pets/mochi/128')));
  const game: RegisteredGame = (await app.inject({ method: 'POST', url: '/api/games', payload: { playerId: 'U_TEST_BOB', mode: 'normal' } })).json();
  const result: ResultPayload = {
    rulesVersion: game.rulesVersion, completed: true, score: 300, clearedCells: 3,
    clearedByMultiplier: [3, 0, 0, 0, 0], rushSucceeded: false, maxChain: 1, toolsFired: 0,
    validMoves: 1, actedInLastSeconds: false,
    pets: game.lineup.map((p, i) => ({ id: p.petId, served: i === 0 ? 3 : 0, firstServedSeq: i === 0 ? 1 : null })),
  };
  const slow = buildApp({ pool: ctx.pool, settleHooks: { beforeCommit: () => new Promise(resolve => setTimeout(resolve, 100)) } });
  try {
    await slow.ready();
    stages.push(await batch('duplicate-result', 40, 40, () => slow.inject({ method: 'POST', url: `/api/games/${game.gameId}/result`, payload: { playerId: 'U_TEST_BOB', result } })));
  } finally { await slow.close(); }
  const persisted = {
    results: (await ctx.pool.query('SELECT count(*)::int AS n FROM pet_match.game_results WHERE game_id = $1', [game.gameId])).rows[0].n,
    progress: (await ctx.pool.query(`SELECT completed_normal_games FROM pet_match.player_progress WHERE player_id = 'U_TEST_BOB'`)).rows[0].completed_normal_games,
  };
  if (persisted.results !== 1 || persisted.progress !== 1) throw new Error('Duplicate result was counted more than once');
  const output = process.argv[2] ? resolve(process.argv[2]) : fileURLToPath(new URL(`../../data/performance/local-${Date.now()}.json`, import.meta.url));
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, JSON.stringify({ environment: 'local test PostgreSQL, Fastify inject, 5 DB connections', stages, persisted }, null, 2) + '\n');
  console.log(`Report: ${output}`);
} finally {
  await app.close();
  await ctx.app.close();
  await ctx.pool.end();
  await rm(dir, { recursive: true, force: true });
}
