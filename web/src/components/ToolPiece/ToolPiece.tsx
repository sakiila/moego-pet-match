import type { GameMode } from '../../api/types';
import type { ToolType } from '../../engine';
import { useI18n } from '../../i18n';
import { Icon, type IconName } from '../../ui/primitives/Icon';
import styles from './ToolPiece.module.css';

const LABEL: Record<ToolType, string> = { combH: 'comb (row)', combV: 'comb (column)', scissors: 'scissors', dryer: 'hair dryer' };

/**
 * 已确认道具图标（tool-family-original-v6）。横／竖／十字能力角标已画在图里，与实际清除范围一致；
 * 吹风机与大浪花清全盘，不带角标。鱼关：海螺（开口朝向区分横纵）、珍珠贝壳、大浪花。
 */
const ART: Record<GameMode, Record<ToolType, IconName>> = {
  normal: { combH: 'comb-horizontal', combV: 'comb-vertical', scissors: 'scissors', dryer: 'hair-dryer' },
  fish: { combH: 'conch-horizontal', combV: 'conch-vertical', scissors: 'pearl-shell', dryer: 'big-wave' },
};

/** 工具棋子：能力只由 tool 决定；mode 只换外观。 */
export function ToolPiece({ tool, mode = 'normal' }: { tool: ToolType; mode?: GameMode }) {
  const { t } = useI18n();
  const fish = mode === 'fish';
  const label = fish
    ? tool === 'dryer'
      ? t('fish.big_wave')
      : `${t(tool === 'scissors' ? 'fish.pearl_shell' : 'fish.conch')}${tool === 'scissors' ? '' : tool === 'combH' ? ' ↔' : ' ↕'}`
    : LABEL[tool];
  return (
    <div className={`${styles.tool} ${fish ? styles.fish : ''}`} role="img" aria-label={label}>
      <Icon name={ART[mode][tool]} size={48} className={styles.icon} />
    </div>
  );
}
