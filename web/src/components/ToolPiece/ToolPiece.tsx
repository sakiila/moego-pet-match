import type { ToolType } from '../../engine';
import styles from './ToolPiece.module.css';

const LABEL: Record<ToolType, string> = { combH: 'comb (row)', combV: 'comb (column)', scissors: 'scissors' };

function Comb() {
  return (
    <svg className={styles.icon} viewBox="0 0 48 48" aria-hidden>
      <rect x="6" y="10" width="36" height="12" rx="5" fill="var(--color-brand)" stroke="var(--color-ink)" strokeWidth="2.5" />
      {[10, 16, 22, 28, 34].map((x) => (
        <rect key={x} x={x} y="21" width="3.5" height="16" rx="1.5" fill="var(--color-brand)" stroke="var(--color-ink)" strokeWidth="2" />
      ))}
    </svg>
  );
}

function Scissors() {
  return (
    <svg className={styles.icon} viewBox="0 0 48 48" aria-hidden>
      <path d="M14 6 L30 30 M34 6 L18 30" stroke="var(--color-ink)" strokeWidth="4" strokeLinecap="round" />
      <circle cx="15" cy="36" r="7" fill="var(--color-paper)" stroke="var(--color-brand)" strokeWidth="4.5" />
      <circle cx="33" cy="36" r="7" fill="var(--color-paper)" stroke="var(--color-brand)" strokeWidth="4.5" />
    </svg>
  );
}

/** 方向／能力角标：横梳 ↔，竖梳 ↕，剪刀 ＋（十字）。 */
function Badge({ tool }: { tool: ToolType }) {
  const d = tool === 'combH' ? 'M3 12h18M7 8l-4 4 4 4M17 8l4 4-4 4' : tool === 'combV' ? 'M12 3v18M8 7l4-4 4 4M8 17l4 4 4-4' : 'M12 5v14M5 12h14';
  return (
    <span className={styles.badge}>
      <svg viewBox="0 0 24 24" aria-hidden>
        <path d={d} stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
    </span>
  );
}

export function ToolPiece({ tool }: { tool: ToolType }) {
  return (
    <div className={styles.tool} role="img" aria-label={LABEL[tool]}>
      {tool === 'scissors' ? <Scissors /> : <Comb />}
      <Badge tool={tool} />
    </div>
  );
}
