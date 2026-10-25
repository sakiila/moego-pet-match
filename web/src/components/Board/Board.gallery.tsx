import { useState } from 'react';
import { createGame, previewRange, trySwap, type GameState, type Pos, type Timeline } from '../../engine';
import { parseBoard } from '../../engine/board';
import type { GalleryEntry } from '../../dev/gallery/types';
import { clearHoldMs, impactOf } from '../../game/feedback';
import { frameAt, type PlaybackBase } from '../../game/playback';
import { PLACEHOLDER_PETS, SAMPLE_FISH } from '../../game/pets';
import { UnderwaterBackdrop } from '../UnderwaterBackdrop/UnderwaterBackdrop';
import { Button } from '../../ui/primitives/Button';
import { Board } from './Board';

const LINEUP = PLACEHOLDER_PETS.map((p) => p.id);
const FIXTURE = ['ABxDEFA', 'CDEFABC', 'EFAhCDE', 'ABCvEFA', 'CDEFABC', 'EFABCDE', 'ABCDEFA'];
const CASCADE_210 = ['EFEFDFD', 'DEDEFEF', 'FDFCEDE', 'EFEBDFD', 'DEDFAEF', 'EDFACDE', 'DEBABCC'];

const idle = (rows: string[]) => frameAt({ board: parseBoard(rows).board, score: 0, rushProgress: 0 }, null, 0);

/** 静态的清除帧：第 3 行三格正在清除，按强度等级带定格与震屏（陈列页用，动画会在挂载时播一次）。 */
function clearingFrame(level: number) {
  const base = idle(FIXTURE);
  const ids = [base.board[3][2], base.board[3][3], base.board[3][4]].map((x) => x!.id);
  const impact = impactOf(level);
  return {
    ...base,
    phase: 'clear' as const,
    busy: true,
    clearing: new Set(ids),
    clearMs: 180,
    clearLevel: level,
    holdMs: clearHoldMs(level),
    impact: impact === 'none' ? null : { kind: impact, key: level },
  };
}
const popup = (chain: number, level: number) => ({ key: level, score: 300 * level, chain, level, at: { r: 3, c: 3 }, startAt: 0 });

/** 可交互：真实引擎 + 墙钟驱动的时间线播放，方便单独调手感。 */
function Live({ rows, refill }: { rows?: string[]; refill?: number[] }) {
  const [game, setGame] = useState<{ state: GameState; base: PlaybackBase; timeline: Timeline | null; t0: number }>(() => {
    const state = createGame({ seed: 3, lineup: LINEUP, board: rows, refill });
    return { state, base: { board: state.board, score: 0, rushProgress: 0 }, timeline: null, t0: performance.now() };
  });
  const [, force] = useState(0);
  const g = performance.now() - game.t0;
  const frame = frameAt(game.base, game.timeline, g);
  if (frame.busy) requestAnimationFrame(() => force((n) => n + 1));

  const onSwap = (from: Pos, to: Pos) => {
    const r = trySwap(game.state, from, to, performance.now() - game.t0);
    if (!r.ok) return false;
    setGame({ ...game, state: r.state, base: { board: game.state.board, score: game.state.score, rushProgress: 0 }, timeline: r.timeline });
    return true;
  };

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <Board frame={frame} pets={PLACEHOLDER_PETS} interactive onSwap={onSwap} popups={frame.popups.filter((p) => g - p.startAt < 800)} getPreview={(a, b) => previewRange(game.state, a, b)} />
      <div>Score {frame.score}</div>
    </div>
  );
}

function Replay() {
  const [key, setKey] = useState(0);
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <Live key={key} rows={CASCADE_210} refill={[0, 1, 0, 0, 2, 0, 1, 2, 0]} />
      <Button variant="secondary" onClick={() => setKey((k) => k + 1)}>
        Reset (drag (4,4) → left for 210)
      </Button>
    </div>
  );
}

const p = (r: number, c: number) => ({ r, c });
const previewState = createGame({ seed: 1, lineup: LINEUP, board: FIXTURE });

const entry: GalleryEntry = {
  name: 'Board',
  group: 'components',
  states: {
    idle: () => <Board frame={idle(FIXTURE)} pets={PLACEHOLDER_PETS} interactive={false} />,
    selected: () => <Board frame={idle(FIXTURE)} pets={PLACEHOLDER_PETS} interactive={false} staticSelected={p(4, 3)} />,
    'tool preview (comb ⇄ neighbor)': () => (
      <Board
        frame={idle(FIXTURE)}
        pets={PLACEHOLDER_PETS}
        interactive={false}
        staticSelected={p(2, 3)}
        staticPreview={previewRange(previewState, p(2, 3), p(2, 4))}
      />
    ),
    'combo preview (comb ⇄ comb)': () => (
      <Board
        frame={idle(FIXTURE)}
        pets={PLACEHOLDER_PETS}
        interactive={false}
        staticSelected={p(2, 3)}
        staticPreview={previewRange(previewState, p(2, 3), p(3, 3))}
      />
    ),
    hint: () => <Board frame={idle(FIXTURE)} pets={PLACEHOLDER_PETS} interactive hint={{ from: p(0, 0), to: p(0, 1) }} />,
    'clearing ×1 (no hold)': () => <Board frame={clearingFrame(1)} pets={PLACEHOLDER_PETS} interactive={false} popups={[popup(1, 1)]} />,
    'clearing ×3 (hold 50 ms, orange chain tag)': () => <Board frame={clearingFrame(3)} pets={PLACEHOLDER_PETS} interactive={false} popups={[popup(3, 3)]} />,
    'clearing ×4 (hold 70 ms, punch)': () => <Board frame={clearingFrame(4)} pets={PLACEHOLDER_PETS} interactive={false} popups={[popup(4, 4)]} />,
    'clearing ×5 (hold 90 ms, shake, MAX tag)': () => <Board frame={clearingFrame(5)} pets={PLACEHOLDER_PETS} interactive={false} popups={[popup(5, 5)]} />,
    'popup: dryer at first batch (MAX tag without cascade)': () => <Board frame={idle(FIXTURE)} pets={PLACEHOLDER_PETS} interactive={false} popups={[popup(1, 5)]} />,
    'fish · tool preview (water jet ⇄ neighbor)': () => (
      <div data-theme="fish" style={{ position: 'relative', padding: 12, borderRadius: 16, overflow: 'hidden' }}>
        <UnderwaterBackdrop inline />
        <div style={{ position: 'relative' }}>
          <Board
            mode="fish"
            frame={idle(FIXTURE)}
            pets={SAMPLE_FISH}
            interactive={false}
            staticSelected={p(2, 3)}
            staticPreview={previewRange(previewState, p(2, 3), p(2, 4))}
          />
        </div>
      </div>
    ),
    'live · random': () => <Live />,
    'live · 210 cascade': () => <Replay />,
  },
};

export default entry;
