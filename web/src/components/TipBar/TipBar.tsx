import { useI18n, type MessageKey } from '../../i18n';
import styles from './TipBar.module.css';

const ICON: Partial<Record<MessageKey, string>> = {
  'tutorial.comb': '🪮',
  'tutorial.scissors': '✂️',
  'tutorial.tool_combo': '🤝',
  'board.move_hint': '👉',
  'board.shuffle': '🔀',
  'round.finishing': '⏰',
  'round.last_seconds': '⏱️',
};

/** 棋盘外的提示区：固定高度，同一时刻至多一条，出现与消失不推动棋盘。 */
export function TipBar({ tip }: { tip: MessageKey | null }) {
  const { t } = useI18n();
  return (
    <div className={styles.slot} data-testid="tip" aria-live="polite">
      {tip && (
        <div key={tip} className={styles.tip}>
          <span className={styles.icon} aria-hidden>
            {ICON[tip] ?? '💡'}
          </span>
          <span>{t(tip)}</span>
        </div>
      )}
    </div>
  );
}
