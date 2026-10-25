import type { GameMode } from '../../api/types';
import { RushTicket, type RushTicketView } from '../RushTicket/RushTicket';
import styles from './RushBar.module.css';

export type RushView = { state: 'hidden' } | RushTicketView;

/** 固定槽位始终保留，递单、完成与收起都不推动棋盘。 */
export function RushBar({ view, mode = 'normal' }: { view: RushView; mode?: GameMode }) {
  return (
    <div className={styles.slot} data-testid="rush" data-state={view.state}>
      {view.state === 'hidden' ? null : <RushTicket view={view} mode={mode} />}
    </div>
  );
}
