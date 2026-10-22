import { useEffect, useState } from 'react';
import { Board } from '../components/Board/Board';
import { BrandHeader } from '../components/BrandHeader/BrandHeader';
import { QuitDialog } from '../components/QuitDialog/QuitDialog';
import { RushBar } from '../components/RushBar/RushBar';
import { SettingsDialog } from '../components/SettingsDialog/SettingsDialog';
import { StatusPanel } from '../components/StatusPanel/StatusPanel';
import { TipBar } from '../components/TipBar/TipBar';
import type { GameState, GameSummary } from '../engine';
import type { PetInfo } from '../game/pets';
import { useGameSession } from '../game/useGameSession';
import { useI18n } from '../i18n';
import styles from './Screen.module.css';

export interface BoardScreenProps {
  game: GameState;
  pets: PetInfo[];
  /** 开发验证用：游戏时钟倍速与起始时刻。 */
  speed?: number;
  startAt?: number;
  onFinished: (summary: GameSummary) => void;
  onExit: () => void;
}

export function BoardScreen({ game, pets, speed, startAt, onFinished, onExit }: BoardScreenProps) {
  const { t } = useI18n();
  const session = useGameSession(game, onFinished, { speed, startAt });
  const { view } = session;
  const [quitOpen, setQuitOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // 退出确认期间计时继续；到时自动关闭弹层并照常收尾结算
  useEffect(() => {
    if (view.timeUp && quitOpen) setQuitOpen(false);
  }, [view.timeUp, quitOpen]);

  if (import.meta.env.DEV) (window as unknown as { __petMatch?: unknown }).__petMatch = { view, attemptSwap: session.attemptSwap, peek: session.peek };

  return (
    <main className={styles.screen}>
      <BrandHeader tagline />
      <StatusPanel timeLeftMs={view.timeLeftMs} score={view.frame.score} />
      <RushBar view={view.rush} />
      <div className={styles.boardArea}>
        <Board
          frame={view.frame}
          pets={pets}
          interactive={!view.timeUp}
          hint={view.hint}
          popups={view.popups}
          getPreview={session.preview}
          onSwap={session.attemptSwap}
          onDraggingChange={session.setDragging}
        />
      </div>
      <TipBar tip={view.tip} />
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
