import type { ReactNode } from 'react';
import type { GameMode } from '../../api/types';
import { UnderwaterBackdrop } from '../UnderwaterBackdrop/UnderwaterBackdrop';
import styles from './BoardLayout.module.css';

export interface BoardLayoutProps {
  mode?: GameMode;
  header: ReactNode;
  status: ReactNode;
  rush: ReactNode;
  board: ReactNode;
  tip: ReactNode;
  controls: ReactNode;
  children?: ReactNode;
}

/** 固定六个区域；任务与提示变化时，棋盘的大小和位置保持不变。 */
export function BoardLayout({ mode = 'normal', header, status, rush, board, tip, controls, children }: BoardLayoutProps) {
  return <main className={styles.screen} data-theme={mode === 'fish' ? 'fish' : undefined} data-testid="board-layout">
    {mode === 'fish' && <UnderwaterBackdrop />}
    <div className={styles.header}>{header}</div>
    <div className={styles.status}>{status}</div>
    <div className={styles.rush}>{rush}</div>
    <div className={styles.boardArea}>{board}</div>
    <div className={styles.tip}>{tip}</div>
    <div className={styles.controls}>{controls}</div>
    {children}
  </main>;
}

