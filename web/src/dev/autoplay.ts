/**
 * 开发验收：用真实引擎自动打完一局，得到与服务端校验口径一致的结算结果。
 * 只被 App 在开发环境（?report=）按需动态引入，生产构建不会包含。
 *   greedy：每步取得分最高的有效交换（连锁、道具多，报告内容丰富）
 *   casual：随机有效交换（分数较低）
 *   zero：一步不动（零服务局，看店长鼓励评语）
 */
import { RULES, advance, getSummary, trySwap, type GameState, type GameSummary, type SwapResult } from '../engine';
import { validMoves } from '../engine/moves';

export type AutoplayStyle = 'greedy' | 'casual' | 'zero';

export const parseAutoplayStyle = (value: string | null): AutoplayStyle => (value === 'casual' || value === 'zero' ? value : 'greedy');

const pick = <T>(list: T[]): T => list[Math.floor(Math.random() * list.length)];

export function autoplay(initial: GameState, style: AutoplayStyle = 'greedy'): GameSummary {
  let state = initial;
  let t = 800;
  while (style !== 'zero' && t < RULES.durationMs) {
    const tried = validMoves(state.board).map((m) => trySwap(state, m.from, m.to, t));
    const ok = tried.filter((r): r is Extract<SwapResult, { ok: true }> => r.ok && r.timeline.kind === 'chain');
    if (ok.length === 0) break;
    let next = pick(ok);
    if (style === 'greedy') {
      const best = Math.max(...ok.map((r) => r.state.score));
      next = pick(ok.filter((r) => r.state.score === best));
    }
    state = next.state;
    // 模拟玩家看盘的间隔
    t = Math.max(t, state.busyUntil) + 250 + Math.floor(Math.random() * 600);
  }
  const done = advance(state, Math.max(RULES.durationMs, state.busyUntil)).state;
  return getSummary(done);
}
