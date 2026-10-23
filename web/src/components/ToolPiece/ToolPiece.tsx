import type { GameMode } from '../../api/types';
import type { ToolType } from '../../engine';
import { useI18n } from '../../i18n';
import styles from './ToolPiece.module.css';

const LABEL: Record<ToolType, string> = { combH: 'comb (row)', combV: 'comb (column)', scissors: 'scissors', dryer: 'hair dryer' };

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

/** 鱼关的梳子外观：水流喷头（喷口朝右，水花由喷口射出）。 */
function WaterJet() {
  return (
    <svg className={styles.icon} viewBox="0 0 48 48" aria-hidden>
      <path d="M8 30 L8 22 Q8 18 12 18 L28 18 L28 30 Z" fill="var(--color-brand)" stroke="var(--color-ink)" strokeWidth="2.5" strokeLinejoin="round" />
      <rect x="27" y="20" width="9" height="8" rx="2" fill="var(--color-surface-muted)" stroke="var(--color-ink)" strokeWidth="2.5" />
      <path d="M12 30 L10 40 L18 40 L20 30" fill="var(--color-brand-strong)" stroke="var(--color-ink)" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M39 18 l4 -3 M40 24 h5 M39 30 l4 3" stroke="var(--color-cat-blue)" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

/** 鱼关的剪刀外观：气泡机（圆机身 + 冒出的泡泡）。 */
function BubbleMachine() {
  return (
    <svg className={styles.icon} viewBox="0 0 48 48" aria-hidden>
      <rect x="6" y="20" width="30" height="20" rx="9" fill="var(--color-brand)" stroke="var(--color-ink)" strokeWidth="2.5" />
      <circle cx="16" cy="30" r="4.5" fill="var(--color-surface-muted)" stroke="var(--color-ink)" strokeWidth="2" />
      <rect x="28" y="14" width="6" height="7" rx="2" fill="var(--color-surface-muted)" stroke="var(--color-ink)" strokeWidth="2" />
      <circle cx="37" cy="10" r="4" fill="none" stroke="var(--color-cat-blue)" strokeWidth="2.5" />
      <circle cx="43" cy="18" r="2.5" fill="none" stroke="var(--color-cat-blue)" strokeWidth="2" />
      <circle cx="29" cy="6" r="2.5" fill="none" stroke="var(--color-cat-blue)" strokeWidth="2" />
    </svg>
  );
}

/** 吹风机：机身、喷口与风线。 */
function Dryer() {
  return (
    <svg className={styles.icon} viewBox="0 0 48 48" aria-hidden>
      <path d="M8 12 Q8 8 12 8 L30 8 Q38 8 38 16 L38 20 Q38 26 30 26 L12 26 Q8 26 8 22 Z" fill="var(--color-brand)" stroke="var(--color-ink)" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M16 26 L13 42 L22 42 L24 26" fill="var(--color-brand-strong)" stroke="var(--color-ink)" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M42 11 l4 -2 M43 17 h4 M42 23 l4 2" stroke="var(--color-cat-blue)" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

/** 鱼关的吹风机外观：大浪花（卷起的浪头）。 */
function BigWave() {
  return (
    <svg className={styles.icon} viewBox="0 0 48 48" aria-hidden>
      <path d="M5 38 Q5 16 24 12 Q38 10 42 22 Q36 18 30 22 Q34 24 33 30 Q30 38 20 38 Z" fill="var(--color-brand)" stroke="var(--color-ink)" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M5 40 Q14 36 24 40 T43 40" fill="none" stroke="var(--color-cat-blue)" strokeWidth="3" strokeLinecap="round" />
      <circle cx="38" cy="10" r="3" fill="none" stroke="var(--color-cat-blue)" strokeWidth="2.5" />
    </svg>
  );
}

/** 方向／能力角标：横向 ↔，竖向 ↕，十字 ＋；鱼关沿用同一套标识，与实际清除范围一致。 */
function Badge({ tool }: { tool: ToolType }) {
  const d =
    tool === 'combH'
      ? 'M3 12h18M7 8l-4 4 4 4M17 8l4 4-4 4'
      : tool === 'combV'
        ? 'M12 3v18M8 7l4-4 4 4M8 17l4 4 4-4'
        : tool === 'dryer'
          ? 'M12 3v18M3 12h18M6 6l12 12M18 6L6 18'
          : 'M12 5v14M5 12h14';
  return (
    <span className={styles.badge}>
      <svg viewBox="0 0 24 24" aria-hidden>
        <path d={d} stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
    </span>
  );
}

/** 工具棋子：能力只由 tool 决定；mode 只换外观（鱼关为水流喷头 / 气泡机）。 */
export function ToolPiece({ tool, mode = 'normal' }: { tool: ToolType; mode?: GameMode }) {
  const { t } = useI18n();
  const fish = mode === 'fish';
  const label = fish
    ? tool === 'dryer'
      ? t('fish.big_wave')
      : `${t(tool === 'scissors' ? 'fish.bubble_machine' : 'fish.water_jet')}${tool === 'scissors' ? '' : tool === 'combH' ? ' ↔' : ' ↕'}`
    : LABEL[tool];
  return (
    <div className={`${styles.tool} ${fish ? styles.fish : ''}`} role="img" aria-label={label}>
      {tool === 'dryer' ? fish ? <BigWave /> : <Dryer /> : fish ? tool === 'scissors' ? <BubbleMachine /> : <WaterJet /> : tool === 'scissors' ? <Scissors /> : <Comb />}
      <Badge tool={tool} />
    </div>
  );
}
