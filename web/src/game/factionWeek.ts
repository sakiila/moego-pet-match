/**
 * 猫派 vs 狗派周（docs/events/CAT_DOG_WEEK.md）：服务端计分与前端展示共用的活动常量与纯函数。
 * 日期一律为北京自然日 YYYY-MM-DD，与对局 board_date 一致。
 */
export type Faction = 'cat' | 'dog';
export const FACTIONS: readonly Faction[] = ['cat', 'dog'];

export interface FactionEvent {
  id: string;
  /** 首尾均含。 */
  startsOn: string;
  endsOn: string;
  /** 从这一天起只显示领先程度，不显示数字。 */
  fogFrom: string;
  /** 收官后首页结果卡显示到这一天（含）。 */
  resultUntil: string;
  /** 收官时间（UTC）：最后一天登记的局最晚在开局后 10 分钟内保存。 */
  settleAt: string;
  /** 胜方成员获得的限时传奇徽章。 */
  badges: Record<Faction, 'meowchamp26' | 'woofchamp26'>;
}

/** 首期（2026-10-27 用户确认）：10-27 至 11-02，不发 Slack，奖励限时传奇徽章。 */
export const FACTION_EVENT: FactionEvent = {
  id: 'catdog-2026',
  startsOn: '2026-10-27',
  endsOn: '2026-11-02',
  fogFrom: '2026-11-02',
  resultUntil: '2026-11-09',
  settleAt: '2026-11-02T16:15:00Z',
  badges: { cat: 'meowchamp26', dog: 'woofchamp26' },
};

export const FACTION_RULES = {
  /** 本阵营物种每服务 1 格的积分。 */
  ownPoints: 2,
  /** 对方物种每服务 1 格的积分；其他物种不计。 */
  otherPoints: 1,
  /** 每人每个北京自然日计入阵营积分的合格对局数。 */
  dailyGames: 5,
  /** 人少一方的平衡系数上限。 */
  balanceCap: 1.3,
  /** 调整后分差在此比例以内判平局。 */
  tieRatio: 0.005,
  /** 小于此比例为「小幅领先」，否则「大幅领先」（迷雾期展示）。 */
  slightRatio: 0.1,
  /** 已报名玩家每局阵容中猫、狗各几只。 */
  lineupPerSpecies: 3,
} as const;

export type FactionPhase = 'hidden' | 'active' | 'fog' | 'ended';

/** 按北京日期与当前时刻判断活动阶段；收官时刻前的最后一晚仍属于 fog。 */
export function factionPhase(event: FactionEvent, today: string, now: Date): FactionPhase {
  if (today < event.startsOn) return 'hidden';
  if (now.getTime() >= Date.parse(event.settleAt)) return today <= event.resultUntil ? 'ended' : 'hidden';
  if (today > event.endsOn) return 'fog';
  return today >= event.fogFrom ? 'fog' : 'active';
}

/** 对局登记日是否在活动周内。 */
export const inFactionWeek = (event: FactionEvent, boardDate: string) => boardDate >= event.startsOn && boardDate <= event.endsOn;

/** 名录物种文本归一为猫或狗；其他物种与未知返回 null。与成就模块的归一规则一致。 */
export function factionSpecies(species: string | null | undefined): Faction | null {
  const base = (species ?? '').replace(/[（(].*$/, '').trim().toLowerCase();
  if (base === '猫' || base === 'cat' || base === 'cats') return 'cat';
  if (base === '狗' || base === 'dog' || base === 'dogs') return 'dog';
  return null;
}

/** 单局阵营积分：只看服务格（不看游戏分数），本阵营物种 2 分、对方物种 1 分。 */
export function gamePoints(faction: Faction, served: readonly { species: Faction | null; served: number }[]) {
  let own = 0;
  let other = 0;
  for (const p of served) {
    if (p.species === faction) own += p.served;
    else if (p.species) other += p.served;
  }
  return { ownCells: own, otherCells: other, points: own * FACTION_RULES.ownPoints + other * FACTION_RULES.otherPoints };
}

/** 人少一方乘 min(上限, 多方人数 ÷ 少方人数)；人数按至少计过 1 局的成员。 */
export function balanceFactors(active: Record<Faction, number>): Record<Faction, number> {
  const { cat, dog } = active;
  if (cat === dog || cat === 0 || dog === 0) return { cat: 1, dog: 1 };
  const factor = Math.min(FACTION_RULES.balanceCap, Math.max(cat, dog) / Math.min(cat, dog));
  return cat < dog ? { cat: factor, dog: 1 } : { cat: 1, dog: factor };
}

export type FactionLead = { leader: Faction | null; level: 'even' | 'slight' | 'clear' };

/** 比较调整后总分：分差在 0.5% 内为平局（leader 为 null）。 */
export function factionLead(adjusted: Record<Faction, number>): FactionLead {
  const top = Math.max(adjusted.cat, adjusted.dog);
  const gap = Math.abs(adjusted.cat - adjusted.dog);
  if (top === 0 || gap <= top * FACTION_RULES.tieRatio) return { leader: null, level: 'even' };
  return { leader: adjusted.cat > adjusted.dog ? 'cat' : 'dog', level: gap < top * FACTION_RULES.slightRatio ? 'slight' : 'clear' };
}
