import { RULES } from '../../../web/src/engine/config.ts';

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
} as const;

export interface CandidatePet {
  petId: string;
  ownerUserId: string | null;
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
 * 只决定选哪 6 种，局内掉落与计分不受影响。random 返回 [0, 1)。
 */
export function sampleLineup(
  pets: CandidatePet[],
  playerId: string,
  collected: ReadonlySet<string>,
  random: () => number,
): { lineup: string[]; own: string[] } {
  const own = pets.filter((p) => p.ownerUserId === playerId);
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
  }

  const allCollected = others.every((p) => collected.has(p.petId));
  const weight = (p: CandidatePet) =>
    allCollected ? 1 : collected.has(p.petId) ? LINEUP_WEIGHTS.collected : LINEUP_WEIGHTS.uncollected;
  const pool = [...others];
  const chosenOthers: CandidatePet[] = [];
  while (chosenOwn.length + chosenOthers.length < RULES.kinds && pool.length > 0) {
    const p = pickWithout(pool, weight, random);
    chosenOthers.push(p);
    pool.splice(pool.indexOf(p), 1);
  }
  return { lineup: [...chosenOwn, ...chosenOthers].map((p) => p.petId), own: chosenOwn.map((p) => p.petId) };
}
