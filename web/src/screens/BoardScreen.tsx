import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import { Board } from '../components/Board/Board';
import { BoardControls } from '../components/BoardControls/BoardControls';
import { BoardLayout } from '../components/BoardLayout/BoardLayout';
import { BrandHeader } from '../components/BrandHeader/BrandHeader';
import { QuitDialog } from '../components/QuitDialog/QuitDialog';
import { RushBar } from '../components/RushBar/RushBar';
import { SettingsDialog } from '../components/SettingsDialog/SettingsDialog';
import { StatusPanel } from '../components/StatusPanel/StatusPanel';
import { TimeUpBanner } from '../components/TimeUpBanner/TimeUpBanner';
import { TipBar } from '../components/TipBar/TipBar';
import type { GameMode } from '../api/types';
import type { GameState, GameSummary } from '../engine';
import type { PetInfo } from '../game/pets';
import { useGameSession } from '../game/useGameSession';
import { selectFarewellPets } from '../game/farewell';
import { MOTION } from '../ui/motion';
import { preloadIcon } from '../ui/primitives/Icon';

export interface BoardScreenProps {
  mode?: GameMode;
  game: GameState;
  pets: PetInfo[];
  /** 开发验证用：游戏时钟倍速与起始时刻。 */
  speed?: number;
  startAt?: number;
  /** 本局阵容中尚未收集的宠物与家庭分组（局内贴纸用）。 */
  uncollected?: ReadonlySet<string>;
  families?: Readonly<Record<string, string>>;
  onFinished: (summary: GameSummary) => void;
  onExit: () => void;
}

export function BoardScreen({ mode = 'normal', game, pets, speed, startAt, uncollected, families, onFinished, onExit }: BoardScreenProps) {
  useEffect(() => {
    preloadIcon('closing-sign-zh-hd-v2', 240);
    preloadIcon('closing-sign-en', 240);
  }, []);
  // 时间到后先停一拍显示「收工」，再进入报告；结果已冻结，成绩在进入报告时提交
  const [ending, setEnding] = useState<GameSummary | null>(null);
  const reduced = useReducedMotion();
  const finishedRef = useRef(onFinished);
  finishedRef.current = onFinished;
  useEffect(() => {
    if (!ending) return;
    const id = window.setTimeout(() => finishedRef.current(ending), reduced ? MOTION.timeUpHoldReducedMs : MOTION.timeUpHoldMs);
    return () => window.clearTimeout(id);
  }, [ending, reduced]);
  const [quitOpen, setQuitOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const session = useGameSession(game, setEnding, { speed, startAt, mode, uncollected, families, cheersEnabled: !quitOpen && !settingsOpen });
  const { view } = session;

  // 退出确认期间计时继续；到时自动关闭弹层并照常收尾结算
  useEffect(() => {
    if (view.timeUp && quitOpen) setQuitOpen(false);
    if (view.timeUp && settingsOpen) setSettingsOpen(false);
  }, [view.timeUp, quitOpen, settingsOpen]);

  if (import.meta.env.DEV) (window as unknown as { __petMatch?: unknown }).__petMatch = { view, attemptSwap: session.attemptSwap, peek: session.peek };

  return (
    <BoardLayout
      mode={mode}
      header={<BrandHeader title="scheduling" boardArt tagline="board.tagline" />}
      status={<StatusPanel timeLeftMs={view.timeLeftMs} score={view.frame.score} />}
      rush={<RushBar view={view.rush} mode={mode} />}
      board={<Board
          frame={view.frame}
          mode={mode}
          pets={pets}
          interactive={!view.timeUp}
          hint={view.hint}
          popups={view.popups}
          cheer={view.cheer}
          getPreview={session.preview}
          onSwap={session.attemptSwap}
          onDraggingChange={session.setDragging}
      />}
      tip={<TipBar tip={view.tip} pets={pets} />}
      controls={<BoardControls timeUp={view.timeUp} onSettings={() => setSettingsOpen(true)} onExit={() => setQuitOpen(true)} />}
    >
      <QuitDialog
        open={quitOpen}
        onCancel={() => setQuitOpen(false)}
        onConfirm={() => {
          setQuitOpen(false);
          if (session.exit()) onExit();
        }}
      />
      <SettingsDialog variant="board" open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      {ending && <TimeUpBanner pets={selectFarewellPets(ending, pets)} mode={mode} />}
    </BoardLayout>
  );
}
