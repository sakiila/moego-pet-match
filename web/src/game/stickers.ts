import type { Timeline } from '../engine';

export interface ChainStickers {
  /** 本次操作中首次服务、且历史未收集的宠物（按阵容 id 去重）。 */
  newPets: string[];
  /** 同主家庭两只宠物在本次操作中都被服务：取服务格数最多的两只。 */
  reunion: { familyId: string; pets: [string, string] } | null;
}

/**
 * 根据一次操作的整条连消计算局内贴纸。新宠按独立宠物去重，不按格数累计；
 * 团聚每个家庭每局最多一次（shownFamilies 由调用方维护）。只影响展示，不改变收集或得分。
 */
export function chainStickers(
  timeline: Timeline,
  lineup: string[],
  uncollected: ReadonlySet<string>,
  families: Readonly<Record<string, string>>,
  notedNew: ReadonlySet<string>,
  shownFamilies: ReadonlySet<string>,
): ChainStickers {
  if (timeline.kind !== 'chain') return { newPets: [], reunion: null };
  const served = lineup.map(() => 0);
  for (const b of timeline.batches) b.servedByKind.forEach((n, k) => (served[k] += n));

  const newPets = lineup.filter((id, k) => served[k] > 0 && uncollected.has(id) && !notedNew.has(id));

  const byFamily = new Map<string, { id: string; n: number }[]>();
  lineup.forEach((id, k) => {
    const fam = families[id];
    if (!fam || served[k] === 0 || shownFamilies.has(fam)) return;
    byFamily.set(fam, [...(byFamily.get(fam) ?? []), { id, n: served[k] }]);
  });
  let reunion: ChainStickers['reunion'] = null;
  for (const [familyId, members] of byFamily) {
    if (members.length < 2) continue;
    const top = [...members].sort((a, b) => b.n - a.n).slice(0, 2);
    reunion = { familyId, pets: [top[0].id, top[1].id] };
    break;
  }
  return { newPets, reunion };
}
