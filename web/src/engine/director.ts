import type { DirectorConfig } from './config';
import type { Rng } from './rng';
import type { Board, Pos } from './types';

/**
 * 补落导演：参数见 config.ts 的 DirectorConfig 与 DIRECTOR。
 * 只看局部、不搜索全盘、不预测整条连锁；每格开销 O(种类数)。
 */
/** 运气 0…1：久旱步数 / 上限，封顶。 */
export function luckOf(drought: number, cfg: DirectorConfig): number {
  if (cfg.droughtCap <= 0) return 1;
  return Math.min(drought, cfg.droughtCap) / cfg.droughtCap;
}

/** 阶段系数：取最后一个 fromMs ≤ t 的项；t 早于首项时取首项。 */
export function stageFactor(t: number, cfg: DirectorConfig): number {
  let factor = cfg.phases[0]?.factor ?? 1;
  for (const phase of cfg.phases) {
    if (phase.fromMs <= t) factor = phase.factor;
    else break;
  }
  return factor;
}

const kindAt = (board: Board, r: number, c: number): number => {
  const row = board[r];
  if (!row) return -1;
  const piece = row[c];
  return piece?.type === 'pet' ? piece.kind : -1;
};

/** 从 (r, c) 出发沿 (dr, dc) 方向连续同类（kind）的格数。 */
function run(board: Board, r: number, c: number, dr: number, dc: number, kind: number): number {
  let n = 0;
  for (let rr = r + dr, cc = c + dc; kindAt(board, rr, cc) === kind; rr += dr, cc += dc) n++;
  return n;
}

/**
 * 计算某个补落格各类的权重。只把已经落定的邻居算进去：空格与道具格不算。
 * 下方整列已稳定；左右中可能有尚未补落的空格，忽略即可，后补的格子只会增加匹配不会破坏。
 */
export function refillWeights(board: Board, pos: Pos, kinds: number, luck: number, stage: number, cfg: DirectorConfig): number[] {
  const b3 = (cfg.boost3.base + cfg.boost3.luck * luck) * stage;
  const b2 = (cfg.boost2.base + cfg.boost2.luck * luck) * stage;
  const weights: number[] = [];
  for (let k = 0; k < kinds; k++) {
    const vertical = run(board, pos.r, pos.c, 1, 0, k);
    const horizontal = run(board, pos.r, pos.c, 0, -1, k) + run(board, pos.r, pos.c, 0, 1, k);
    const best = Math.max(vertical, horizontal);
    weights.push(best >= 2 ? 1 + b3 : best === 1 ? 1 + b2 : 1);
  }
  return weights;
}

/** 按权重抽样；权重全为 0 时退化为均匀。 */
export function pickWeighted(weights: number[], rng: Rng): number {
  let total = 0;
  for (const w of weights) total += w;
  if (total <= 0) return rng.int(weights.length);
  let x = rng.next() * total;
  for (let i = 0; i < weights.length; i++) {
    x -= weights[i];
    if (x < 0) return i;
  }
  return weights.length - 1;
}
