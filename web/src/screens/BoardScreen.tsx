import { useEffect, useState } from 'react';
import { Board } from '../components/Board/Board';
import { BrandHeader } from '../components/BrandHeader/BrandHeader';
import { QuitDialog } from '../components/QuitDialog/QuitDialog';
import { RushBar } from '../components/RushBar/RushBar';
import { SettingsDialog } from '../components/SettingsDialog/SettingsDialog';
import { StatusPanel } from '../components/StatusPanel/StatusPanel';
import { TipBar } from '../components/TipBar/TipBar';
import type { GameMode } from '../api/types';
import { UnderwaterBackdrop } from '../components/UnderwaterBackdrop/UnderwaterBackdrop';
import type { GameState, GameSummary } from '../engine';
import type { PetInfo } from '../game/pets';
import { useGameSession } from '../game/useGameSession';
import { useI18n } from '../i18n';
import styles from './Screen.module.css';

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
  const { t } = useI18n();
  const session = useGameSession(game, onFinished, { speed, startAt, mode, uncollected, families });
  const fish = mode === 'fish';
  const { view } = session;
  const [quitOpen, setQuitOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // 退出确认期间计时继续；到时自动关闭弹层并照常收尾结算
  useEffect(() => {
    if (view.timeUp && quitOpen) setQuitOpen(false);
  }, [view.timeUp, quitOpen]);

  if (import.meta.env.DEV) (window as unknown as { __petMatch?: unknown }).__petMatch = { view, attemptSwap: session.attemptSwap, peek: session.peek };

  return (
    <main className={styles.screen} data-theme={fish ? 'fish' : undefined}>
      {fish && <UnderwaterBackdrop />}
      <BrandHeader title={fish ? 'fish' : 'scheduling'} tagline={fish ? 'fish.prep_rule' : 'board.tagline'} />
      <StatusPanel timeLeftMs={view.timeLeftMs} score={view.frame.score} />
      <RushBar view={view.rush} mode={mode} />
      <div className={styles.boardArea}>
        <Board
          frame={view.frame}
          mode={mode}
          pets={pets}
          interactive={!view.timeUp}
          hint={view.hint}
          popups={view.popups}
          getPreview={session.preview}
          onSwap={session.attemptSwap}
          onDraggingChange={session.setDragging}
        />
      </div>
      <TipBar tip={view.tip} pets={pets} />
      <footer className={styles.footer}>
        <button type="button" onClick={() => setSettingsOpen(true)}>
          ⚙️ {t('nav.settings')}
        </button>
        <button type="button" onClick={() => setQuitOpen(true)} disabled={view.timeUp} data-testid="exit">
          {t('board.exit')} ↪
        </button>
      </footer>
      <QuitDialog
        open={quitOpen}
        onCancel={() => setQuitOpen(false)}
        onConfirm={() => {
          setQuitOpen(false);
          if (session.exit()) onExit();
        }}
      />
      <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </main>
  );
}
