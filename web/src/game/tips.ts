import { RULES, type Board } from '../engine';
import type { MessageKey } from '../i18n';

export type Tutorial = 'comb' | 'scissors' | 'combo';

/** 卡关提示：棋盘稳定且约 5 秒没有有效操作。无效交换不重置计时。 */
export function hintDue(g: number, quietSince: number): boolean {
  return g - quietSince >= RULES.hintIdleMs;
}

/** 首次自然出现工具 / 相邻工具时的带教；同一内容只提醒一次。 */
export function nextTutorial(board: Board, seen: ReadonlySet<string>): Tutorial | null {
  const size = board.length;
  let firstTool: Tutorial | null = null;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const p = board[r][c];
      if (p?.type !== 'tool') continue;
      firstTool ??= p.tool === 'scissors' ? 'scissors' : 'comb';
      const right = board[r][c + 1];
      const down = board[r + 1]?.[c];
      if (!seen.has('combo') && (right?.type === 'tool' || down?.type === 'tool')) return 'combo';
    }
  }
  return firstTool && !seen.has('tool') ? firstTool : null;
}

export interface TipInputs {
  finishing: boolean;
  shuffling: boolean;
  tutorial: Tutorial | null;
  hint: boolean;
  lastSeconds: boolean;
}

/** 棋盘外提示区同一时刻至多一条：收尾 > 洗牌 > 带教 > 卡关提示 > 最后 10 秒。 */
export function pickTip(t: TipInputs): MessageKey | null {
  if (t.finishing) return 'round.finishing';
  if (t.shuffling) return 'board.shuffle';
  if (t.tutorial === 'combo') return 'tutorial.tool_combo';
  if (t.tutorial === 'comb') return 'tutorial.comb';
  if (t.tutorial === 'scissors') return 'tutorial.scissors';
  if (t.hint) return 'board.move_hint';
  if (t.lastSeconds) return 'round.last_seconds';
  return null;
}

const SEEN_KEY = 'pet-match.tutorial-seen';

export function loadSeenTutorials(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(SEEN_KEY) ?? '[]') as string[]);
  } catch {
    return new Set();
  }
}

export function saveSeenTutorials(seen: ReadonlySet<string>) {
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify([...seen]));
  } catch {
    // 无法记住时下次可能再提示一次
  }
}
