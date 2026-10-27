import type pg from 'pg';
import type { AchievementId, FactionContribution, FactionPerson, FactionPetStat, FactionSideView, FactionState, FactionView, ResultPayload } from '../../../web/src/api/types.ts';
import {
  FACTION_EVENT, FACTION_RULES, FACTIONS, balanceFactors, factionLead, factionPhase, factionSpecies, gamePoints, inFactionWeek,
  type Faction, type FactionEvent,
} from '../../../web/src/game/factionWeek.ts';
import { inTransaction, type Pool } from '../db/pool.ts';
import { beijingDate } from './pets.ts';

/** 猫派 vs 狗派周（docs/events/CAT_DOG_WEEK.md）：报名、结算时计分、拉锯读数与收官授徽。 */
type Queryable = Pool | pg.PoolClient;

export class FactionError extends Error {
  constructor(readonly code: 'closed' | 'other_faction') {
    super(code);
  }
}

/**
 * 生产迁移手动执行（deploy/DEPLOY.md）：代码先于 023 迁移上线时，活动整体静默，不影响开局与结算。
 * to_regclass 不会因表不存在报错，放在结算事务里也安全；确认存在后不再查询。
 */
let tablesReady = false;
async function factionReady(db: Queryable): Promise<boolean> {
  if (tablesReady) return true;
  const { rows } = await db.query("SELECT to_regclass('pet_match.faction_results') IS NOT NULL AS ok");
  tablesReady = rows[0].ok;
  return tablesReady;
}

const sides = <T>(fn: (f: Faction) => T) => ({ cat: fn('cat'), dog: fn('dog') }) as Record<Faction, T>;

const previousDate = (date: string) => new Date(Date.parse(`${date}T00:00:00Z`) - 86_400_000).toISOString().slice(0, 10);

export async function memberFaction(db: Queryable, playerId: string, event: FactionEvent = FACTION_EVENT): Promise<{ faction: Faction; joinedAt: Date } | null> {
  const { rows } = await db.query('SELECT faction, joined_at FROM pet_match.faction_members WHERE event_id = $1 AND player_id = $2', [event.id, playerId]);
  return rows[0] ? { faction: rows[0].faction, joinedAt: rows[0].joined_at } : null;
}

/** 报名可在活动周最后一天前随时进行；同一阵营重复报名幂等，换阵营拒绝。 */
export async function joinFaction(pool: Pool, playerId: string, faction: Faction, now = new Date(), event: FactionEvent = FACTION_EVENT) {
  const today = beijingDate(now);
  if (!inFactionWeek(event, today) || now.getTime() >= Date.parse(event.settleAt) || !(await factionReady(pool))) throw new FactionError('closed');
  await pool.query(
    'INSERT INTO pet_match.faction_members (event_id, player_id, faction) VALUES ($1, $2, $3) ON CONFLICT (event_id, player_id) DO NOTHING',
    [event.id, playerId, faction],
  );
  const member = await memberFaction(pool, playerId, event);
  if (member?.faction !== faction) throw new FactionError('other_faction');
  invalidateFactionCache();
}

/** 报名玩家在活动周内登记的普通局：阵容按猫狗配额抽样。 */
export async function lineupQuota(db: Queryable, playerId: string, boardDate: string, event: FactionEvent = FACTION_EVENT): Promise<number | undefined> {
  if (!inFactionWeek(event, boardDate) || !(await factionReady(db))) return undefined;
  return (await memberFaction(db, playerId, event)) ? FACTION_RULES.lineupPerSpecies : undefined;
}

/**
 * 在结算事务中调用（调用方已按玩家加锁，保证每日封顶不被并发越过）。
 * 只计报名之后登记、活动周内、有有效操作的普通局；收官后不再计分。返回值写入结算快照，重试时原样返回。
 */
export async function recordFactionContribution(
  client: pg.PoolClient,
  game: { game_id: string; player_id: string; mode: string; lineup: string[]; created_at: Date },
  boardDate: string,
  payload: ResultPayload,
  event: FactionEvent = FACTION_EVENT,
): Promise<FactionContribution | undefined> {
  if (game.mode !== 'normal' || payload.validMoves === 0 || !inFactionWeek(event, boardDate) || !(await factionReady(client))) return undefined;
  const member = await memberFaction(client, game.player_id, event);
  if (!member || new Date(game.created_at) < new Date(member.joinedAt)) return undefined;
  if ((await client.query('SELECT 1 FROM pet_match.faction_results WHERE event_id = $1', [event.id])).rowCount) return undefined;

  const species = new Map<string, Faction | null>(
    (await client.query('SELECT pet_id, species FROM pet_match.pets WHERE pet_id = ANY($1)', [game.lineup])).rows.map((r) => [r.pet_id, factionSpecies(r.species)]),
  );
  const served = payload.pets.filter((p) => p.served > 0);
  const { ownCells, otherCells, points } = gamePoints(member.faction, served.map((p) => ({ species: species.get(p.id) ?? null, served: p.served })));
  const today = await client.query(
    'SELECT count(*)::int AS n FROM pet_match.faction_contributions WHERE event_id = $1 AND player_id = $2 AND board_date = $3 AND counted',
    [event.id, game.player_id, boardDate],
  );
  const counted = today.rows[0].n < FACTION_RULES.dailyGames;
  await client.query(
    `INSERT INTO pet_match.faction_contributions (game_id, event_id, player_id, faction, board_date, own_cells, other_cells, points, counted, pet_cells)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) ON CONFLICT (game_id) DO NOTHING`,
    [game.game_id, event.id, game.player_id, member.faction, boardDate, ownCells, otherCells, counted ? points : 0, counted,
      Object.fromEntries(served.map((p) => [p.id, p.served]))],
  );
  invalidateFactionCache();
  return { faction: member.faction, points: counted ? points : 0, capped: !counted };
}

interface Totals {
  members: Record<Faction, number>;
  active: Record<Faction, number>;
  points: Record<Faction, number>;
  factors: Record<Faction, number>;
  adjusted: Record<Faction, number>;
}

async function totals(db: Queryable, event: FactionEvent): Promise<Totals> {
  const members = await db.query('SELECT faction, count(*)::int AS n FROM pet_match.faction_members WHERE event_id = $1 GROUP BY faction', [event.id]);
  const scored = await db.query(
    `SELECT faction, sum(points)::int AS points, count(DISTINCT player_id)::int AS active
     FROM pet_match.faction_contributions WHERE event_id = $1 AND counted GROUP BY faction`,
    [event.id],
  );
  const pick = <K extends string>(rows: Record<string, unknown>[], key: K) => sides((f) => Number(rows.find((r) => r.faction === f)?.[key] ?? 0));
  const active = pick(scored.rows, 'active');
  const points = pick(scored.rows, 'points');
  const factors = balanceFactors(active);
  return { members: pick(members.rows, 'n'), active, points, factors, adjusted: sides((f) => Math.round(points[f] * factors[f])) };
}

/** 按成员积分排序的各阵营前几名；只列仍在可参与名单内的同事。date 为空表示整期。 */
async function topPeople(db: Queryable, event: FactionEvent, limit: number, date?: string): Promise<Record<Faction, FactionPerson[]>> {
  const { rows } = await db.query(
    `SELECT c.faction, c.player_id, m.name, sum(c.points)::int AS points
     FROM pet_match.faction_contributions c JOIN pet_match.colleagues m ON m.user_id = c.player_id
     WHERE c.event_id = $1 AND c.counted AND ($2::date IS NULL OR c.board_date = $2::date)
     GROUP BY c.faction, c.player_id, m.name HAVING sum(c.points) > 0
     ORDER BY points DESC, min(c.created_at), c.player_id`,
    [event.id, date ?? null],
  );
  return sides((f) => rows.filter((r) => r.faction === f).slice(0, limit).map((r) => ({ userId: r.player_id, name: r.name, points: r.points })));
}

/** 计分局里被服务最多的猫和狗（只看仍上架的宠物）。 */
async function topPets(db: Queryable, event: FactionEvent, date?: string): Promise<Record<Faction, FactionPetStat | null>> {
  const { rows } = await db.query(
    `SELECT e.key AS pet_id, p.name, p.species, sum(e.value::int)::int AS cells
     FROM pet_match.faction_contributions c CROSS JOIN LATERAL jsonb_each_text(c.pet_cells) e
     JOIN pet_match.pets p ON p.pet_id = e.key AND p.status = 'published'
     WHERE c.event_id = $1 AND c.counted AND ($2::date IS NULL OR c.board_date = $2::date)
     GROUP BY e.key, p.name, p.species ORDER BY cells DESC, e.key`,
    [event.id, date ?? null],
  );
  return sides((f) => {
    const row = rows.find((r) => factionSpecies(r.species) === f);
    return row ? { petId: row.pet_id, name: row.name, cells: row.cells } : null;
  });
}

interface StoredResult extends Totals {
  winner: Faction | null;
  top: Record<Faction, FactionPerson[]>;
  pets: Record<Faction, FactionPetStat | null>;
}

/**
 * 收官：到 settleAt 后第一次读取（或运维脚本）时执行，每期只写一次。
 * 胜方（平局为双方）中至少有 1 局计入积分的成员获得限时传奇徽章。
 */
export async function settleFactionEvent(pool: Pool, now = new Date(), event: FactionEvent = FACTION_EVENT): Promise<StoredResult | null> {
  if (now.getTime() < Date.parse(event.settleAt) || !(await factionReady(pool))) return null;
  return inTransaction(pool, async (client) => {
    await client.query("SELECT pg_advisory_xact_lock(hashtextextended('faction:' || $1, 0))", [event.id]);
    const existing = await client.query('SELECT result FROM pet_match.faction_results WHERE event_id = $1', [event.id]);
    if (existing.rows[0]) return existing.rows[0].result as StoredResult;
    const sum = await totals(client, event);
    const winner = factionLead(sum.adjusted).leader;
    const result: StoredResult = { ...sum, winner, top: await topPeople(client, event, 3), pets: await topPets(client, event) };
    await client.query('INSERT INTO pet_match.faction_results (event_id, winner, result) VALUES ($1, $2, $3)', [event.id, winner, result]);
    const winners = winner ? [winner] : [...FACTIONS];
    for (const f of winners) {
      await client.query(
        `INSERT INTO pet_match.achievement_awards (player_id, achievement_id, target_value, source_game_id)
         SELECT DISTINCT player_id, $3, 1, NULL::uuid FROM pet_match.faction_contributions WHERE event_id = $1 AND faction = $2 AND counted
         ON CONFLICT DO NOTHING`,
        [event.id, f, event.badges[f]],
      );
    }
    invalidateFactionCache();
    return result;
  });
}

/** 公共读数缓存 30 秒（测试环境不缓存）；报名、计分与收官时清空。 */
const CACHE_MS = 30_000;
let cache: { key: string; at: number; value: Promise<{ sum: Totals; yesterday: FactionView['yesterday'] }> } | null = null;

export function invalidateFactionCache() {
  cache = null;
}

async function liveBoard(pool: Pool, event: FactionEvent, today: string) {
  const key = `${event.id}|${today}`;
  if (process.env.NODE_ENV !== 'test' && cache?.key === key && Date.now() - cache.at < CACHE_MS) return cache.value;
  const value = (async () => {
    const yesterdayDate = previousDate(today);
    const hasYesterday = yesterdayDate >= event.startsOn && yesterdayDate <= event.endsOn;
    const [sum, stars, pets] = await Promise.all([
      totals(pool, event),
      hasYesterday ? topPeople(pool, event, 1, yesterdayDate) : null,
      hasYesterday ? topPets(pool, event, yesterdayDate) : null,
    ]);
    const yesterday = stars && pets ? { stars: sides((f) => stars[f][0] ?? null), pets } : null;
    return { sum, yesterday };
  })();
  cache = { key, at: Date.now(), value };
  value.catch(() => { if (cache?.value === value) cache = null; });
  return value;
}

export async function loadFaction(pool: Pool, playerId: string, now = new Date(), event: FactionEvent = FACTION_EVENT): Promise<FactionState> {
  const today = beijingDate(now);
  const phase = factionPhase(event, today, now);
  if (phase === 'hidden' || !(await factionReady(pool))) return { phase: 'hidden' };
  const member = await memberFaction(pool, playerId, event);
  const mine = await pool.query(
    `SELECT coalesce(sum(points) FILTER (WHERE counted), 0)::int AS points, count(*) FILTER (WHERE counted AND board_date = $3)::int AS today
     FROM pet_match.faction_contributions WHERE event_id = $1 AND player_id = $2`,
    [event.id, playerId, today],
  );
  const base = { eventId: event.id, startsOn: event.startsOn, endsOn: event.endsOn };
  const view = (sum: Totals, hide: boolean): Record<Faction, FactionSideView> => sides((f) => ({
    members: sum.members[f], active: sum.active[f], factor: sum.factors[f],
    points: hide ? null : sum.points[f], adjusted: hide ? null : sum.adjusted[f],
  }));

  if (phase === 'ended') {
    const result = await settleFactionEvent(pool, now, event);
    if (!result) return { phase: 'hidden' };
    const awarded = member && (await pool.query('SELECT 1 FROM pet_match.achievement_awards WHERE player_id = $1 AND achievement_id = $2', [playerId, event.badges[member.faction]])).rowCount;
    const badge: AchievementId | null = member && awarded ? event.badges[member.faction] : null;
    return {
      ...base, phase, sides: view(result, false), lead: factionLead(result.adjusted),
      me: { faction: member?.faction ?? null, points: mine.rows[0].points, todayLeft: null },
      yesterday: null,
      result: { winner: result.winner, top: result.top, pets: result.pets, badge },
    };
  }

  const { sum, yesterday } = await liveBoard(pool, event, today);
  const open = inFactionWeek(event, today);
  return {
    ...base, phase, sides: view(sum, phase === 'fog'), lead: factionLead(sum.adjusted),
    me: { faction: member?.faction ?? null, points: mine.rows[0].points, todayLeft: member && open ? Math.max(0, FACTION_RULES.dailyGames - mine.rows[0].today) : null },
    yesterday,
    result: null,
  };
}
