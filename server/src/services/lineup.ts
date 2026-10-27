import { RULES } from '../../../web/src/engine/config.ts';
import { coatDistance, type Coat } from '../catalog/coat.ts';
import type { Faction } from '../../../web/src/game/factionWeek.ts';

/** 已确认的阵容抽样初值（V1_RULES「自家宠物抽样」「未收集倾向」），可随试玩调整。 */
export const LINEUP_WEIGHTS = {
  /** 只有 1 只已上架自家宠物时入选概率。 */
  ownSingle: 0.75,
  /** 有 ≥ 2 只时：入选 1 只、2 只的概率（其余为不带）。 */
  ownMultiOne: 0.65,
  ownMultiTwo: 0.2,
  /** 非自家补位权重：未收集 : 已收集 = 2 : 1；全部收集后等权。 */
  uncollected: 2,
  collected: 1,
  /** 自家宠物最多占几种。 */
  ownCap: 2,
  /** 毛色距离小于此值视为外观相近（约为全部宠物两两距离的第 10 百分位）。 */
  coatSimilar: 12,
  /** 与已入选宠物外观相近的候选，补位权重乘以此值：降权而非排除，候选不足时仍能凑满。 */
  coatPenalty: 0.1,
} as const;

export interface CandidatePet {
  petId: string;
  ownerUserId: string | null;
  /** 毛色特征；缺失时不参与撞色降权。 */
  coat?: Coat | null;
  /** 归一后的猫狗物种，只在阵营周配额抽样时使用。 */
  species?: Faction | null;
}

function pickWithout<T>(items: T[], weight: (t: T) => number, random: () => number): T {
  const total = items.reduce((s, t) => s + weight(t), 0);
  let r = random() * total;
  for (const t of items) {
    r -= weight(t);
    if (r < 0) return t;
  }
  return items[items.length - 1];
}

/**
 * 两步抽样：先按概率抽自家宠物（最多 2 种），再从非自家已上架宠物按未收集 2 : 已收集 1 无放回补满 6 种。
 * 补位时与已入选宠物（含自家）毛色相近的候选降权，减少同局撞色；自家宠物本身不受影响。
 * 只决定选哪 6 种，局内掉落与计分不受影响。random 返回 [0, 1)。
 */
export function sampleLineup(
  pets: CandidatePet[],
  playerId: string,
  collected: ReadonlySet<string>,
  random: () => number,
  /** 阵营周已报名玩家：猫、狗各占几种（docs/events/CAT_DOG_WEEK.md 第 5 节）；不传为普通抽样。 */
  speciesQuota?: number,
): { lineup: string[]; own: string[] } {
  const remaining: Record<Faction, number> | null = speciesQuota ? { cat: speciesQuota, dog: speciesQuota } : null;
  // 配额抽样时非猫非狗的自家宠物本期不入选；自家宠物占用对应物种名额
  const own = pets.filter((p) => p.ownerUserId === playerId && (!remaining || p.species));
  const others = pets.filter((p) => p.ownerUserId !== playerId);

  let ownCount = 0;
  const r = random();
  if (own.length === 1) ownCount = r < LINEUP_WEIGHTS.ownSingle ? 1 : 0;
  else if (own.length >= 2) ownCount = r < LINEUP_WEIGHTS.ownMultiOne ? 1 : r < LINEUP_WEIGHTS.ownMultiOne + LINEUP_WEIGHTS.ownMultiTwo ? 2 : 0;
  ownCount = Math.min(ownCount, LINEUP_WEIGHTS.ownCap);

  const chosenOwn: CandidatePet[] = [];
  const ownPool = [...own];
  for (let i = 0; i < ownCount; i++) {
    const p = pickWithout(ownPool, () => 1, random);
    chosenOwn.push(p);
    ownPool.splice(ownPool.indexOf(p), 1);
    if (remaining && p.species) remaining[p.species]--;
  }

  const allCollected = others.every((p) => collected.has(p.petId));
  const base = (p: CandidatePet) =>
    allCollected ? 1 : collected.has(p.petId) ? LINEUP_WEIGHTS.collected : LINEUP_WEIGHTS.uncollected;
  const pool = [...others];
  const chosenOthers: CandidatePet[] = [];
  const lookAlike = (p: CandidatePet) =>
    !!p.coat && [...chosenOwn, ...chosenOthers].some((q) => q.coat && coatDistance(p.coat!, q.coat) < LINEUP_WEIGHTS.coatSimilar);
  const weight = (p: CandidatePet) => base(p) * (lookAlike(p) ? LINEUP_WEIGHTS.coatPenalty : 1);
  // 配额内的物种优先；某物种不够时用另一物种补，猫狗都不够时才用其他物种
  const candidates = () => {
    if (!remaining) return pool;
    const open = pool.filter((p) => p.species && remaining[p.species] > 0);
    if (open.length) return open;
    const catsDogs = pool.filter((p) => p.species);
    return catsDogs.length ? catsDogs : pool;
  };
  while (chosenOwn.length + chosenOthers.length < RULES.kinds && pool.length > 0) {
    const p = pickWithout(candidates(), weight, random);
    chosenOthers.push(p);
    pool.splice(pool.indexOf(p), 1);
    if (remaining && p.species) remaining[p.species]--;
  }
  return { lineup: [...chosenOwn, ...chosenOthers].map((p) => p.petId), own: chosenOwn.map((p) => p.petId) };
}
