/**
 * 宣传片挑种子：用真实引擎按演示走法（casual，可复现的随机走子）打完一批「棋盘种子 × 走法种子」，
 * 留下开局是普通消除、喝彩 Nice → Great → Amazing → Wow 依次首次出现、催单完成的局，按 Wow 出现时刻排序。
 * 用法（在 web/ 下）：npx vite-node scripts/demo-seeds.ts -- [棋盘种子数=200] [每盘走法数=10] [列出=10]
 */
import { createGame } from '../src/engine';
import { demoHighlights, planDemo } from '../src/dev/demo';

const [seeds = 200, plays = 10, top = 10] = process.argv.slice(2).filter((a) => a !== '--').map(Number);
const LINEUP = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6'];
const sec = (ms: number | null) => (ms === null ? '—' : (ms / 1000).toFixed(1));

const rows = [];
for (let seed = 1; seed <= seeds; seed++) {
  const initial = createGame({ seed, lineup: LINEUP });
  for (let play = 0; play < plays; play++) {
    const plan = planDemo(initial, { seed, play });
    const h = demoHighlights(plan);
    if (!h.plainOpening || !h.escalates || h.rushBonus === null) continue;
    rows.push({ seed, play, h, score: plan.summary.score, chain: plan.summary.maxChain, moves: plan.moves.length });
  }
}
rows.sort((a, b) => a.h.wow! - b.h.wow! || b.score - a.score);

console.log(`扫描 ${seeds} 个棋盘 × ${plays} 种走法，${rows.length} 局符合分镜（单位：秒）`);
console.table(
  rows.slice(0, top).map(({ seed, play, h, score, chain, moves }) => ({
    demo: seed,
    play,
    梳子: sec(h.comb),
    Nice: sec(h.nice),
    Great: sec(h.great),
    Amazing: sec(h.amazing),
    Wow: sec(h.wow),
    催单: sec(h.rushBonus),
    最高连消: chain,
    步数: moves,
    总分: score,
  })),
);
