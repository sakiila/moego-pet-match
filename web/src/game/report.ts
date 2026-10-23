import type { GameMode } from '../api/types';
import type { GameSummary } from '../engine';
import type { MessageKey } from '../i18n';

/** 报告判定全部来自冻结结果，分享、重试与切换语言都复用，不重新抽取。 */

/**
 * MVP：服务次数最多；平手比首次服务批次，同批取本局阵容登记顺序靠前者。
 * 零服务返回 null（省略 MVP，由店长鼓励承接）。返回阵容登记顺序下标。
 */
export function judgeMvp(summary: GameSummary): number | null {
  const served = summary.pets.filter((p) => p.served > 0);
  if (served.length === 0) return null;
  const best = [...served].sort(
    (a, b) => b.served - a.served || (a.firstServedSeq ?? Infinity) - (b.firstServedSeq ?? Infinity) || a.order - b.order,
  )[0];
  return best.order;
}

export type TitleKey = Extract<MessageKey, `title.${string}`>;

/** 主称号：按固定优先级取首个满足的一项（合体中的两个工具按两个计；发动吹风机即「全店大扫除」）。 */
export function judgeTitle(summary: GameSummary): TitleKey {
  if (summary.combos.dryer > 0) return 'title.cleanup_chief';
  if (summary.maxChain >= 5) return 'title.chain_lead';
  if (summary.rushSucceeded) return 'title.scheduling_pro';
  if (summary.toolsFired >= 3) return 'title.tool_pro';
  if (summary.actedInLastSeconds) return 'title.last_second';
  return 'title.pet_officer';
}

/** 角色评语：零服务 > 单次最高连锁 ≥ 5 > 催单成功 > 发动过合体 > 普通完成；鱼关用 review.fish.*。 */
export function judgeReview(summary: GameSummary, mode: GameMode): MessageKey {
  const prefix = mode === 'fish' ? 'review.fish' : 'review.pet';
  const combos = summary.combos.cc + summary.combos.cs + summary.combos.dryer;
  const which =
    summary.clearedCells === 0
      ? 'no_service'
      : summary.maxChain >= 5
        ? 'high_chain'
        : summary.rushSucceeded
          ? 'rush_success'
          : combos > 0
            ? 'tool_combo'
            : 'normal';
  return `${prefix}.${which}` as MessageKey;
}
