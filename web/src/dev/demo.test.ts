import { describe, expect, it } from 'vitest';
import { RULES, advance, createGame, getSummary, trySwap } from '../engine';
import { demoHighlights, planDemo } from './demo';

const LINEUP = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6'];
const game = (seed: number) => createGame({ seed, lineup: LINEUP });

describe('宣传片演示走法', () => {
  it('同一组种子每次算出同一套走法', () => {
    const a = planDemo(game(135), { seed: 135, play: 2 });
    const b = planDemo(game(135), { seed: 135, play: 2 });
    expect(b.moves).toEqual(a.moves);
    expect(b.summary).toEqual(a.summary);
    expect(planDemo(game(135), { seed: 135, play: 3 }).moves).not.toEqual(a.moves);
  });

  it('按计划时刻重放走法，终局与计划一致（棋盘页就是这样逐步播放的）', () => {
    const plan = planDemo(game(135), { seed: 135, play: 2 });
    let state = game(135);
    for (const m of plan.moves) {
      const r = trySwap(state, m.from, m.to, m.at);
      if (!r.ok) throw new Error(`rejected at ${m.at}`);
      state = r.state;
    }
    expect(getSummary(advance(state, Math.max(RULES.durationMs, state.busyUntil)).state)).toEqual(plan.summary);
  });

  it('选定的 135 / 2：开局普通消除，喝彩逐级升温，催单完成', () => {
    const h = demoHighlights(planDemo(game(135), { seed: 135, play: 2 }));
    expect(h.plainOpening).toBe(true);
    expect(h.escalates).toBe(true);
    expect(h.wow).toBeLessThan(10_000);
    expect(h.rushBonus).not.toBeNull();
  });

  it('greedy 每步取得分最高的交换', () => {
    const plan = planDemo(game(135), { seed: 135, style: 'greedy' });
    const first = plan.moves[0];
    const best = Math.max(
      ...[...Array(RULES.size)].flatMap((_, r) =>
        [...Array(RULES.size)].flatMap((_, c) =>
          [{ r, c: c + 1 }, { r: r + 1, c }].map((to) => {
            const res = trySwap(game(135), { r, c }, to, first.at);
            return res.ok && res.timeline.kind === 'chain' ? res.state.score : 0;
          }),
        ),
      ),
    );
    expect(first.score).toBe(best);
  });
});
