import type { GameMode } from '../../api/types';
import type { CheerKind } from '../../game/cheers';
import { useI18n } from '../../i18n';
import styles from './CheerCallout.module.css';

export interface CheerCalloutProps {
  kind: CheerKind | null;
  mode?: GameMode;
  /** 陈列页用：保留静态文字；游戏内由事件 key 重播整段动画。 */
  animate?: boolean;
}

/** 棋盘内的短暂喝彩，生命周期由游戏会话管理，不占布局或接收手势。 */
export function CheerCallout({ kind, mode = 'normal', animate = true }: CheerCalloutProps) {
  const { t } = useI18n();
  if (kind === null) return null;

  return (
    <div
      className={styles.callout}
      data-kind={kind}
      data-mode={mode}
      data-theme={mode === 'fish' ? 'fish' : undefined}
      data-animate={animate}
      data-testid="cheer-callout"
      aria-hidden="true"
    >
      <div className={styles.message}>
        <span className={styles.word}>{t(`board.cheer_${kind}`)}</span>
        {kind !== 'nice' ? <span className={styles.sparkles} /> : null}
      </div>
    </div>
  );
}
