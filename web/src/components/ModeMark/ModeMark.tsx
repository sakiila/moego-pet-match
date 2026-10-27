import { useState } from 'react';
import type { GameMode } from '../../api/types';
import { Icon } from '../../ui/primitives/Icon';
import styles from './ModeMark.module.css';

/** 鱼关标识用天蓝色单鱼贴纸（内容素材，经 /img 代理）；图标库没有鱼。 */
export const FISH_MARK_SRC = '/img/fish/fish_color_blue/128';

export interface ModeMarkProps {
  mode: GameMode;
  size?: number;
  /** onAccent：放在橙色主按钮上，普通局用白色爪印。鱼关贴纸自带颜色，不随底色变化。 */
  tone?: 'default' | 'onAccent';
}

/** 模式标识：普通宠物局为爪印，鱼关为天蓝色小鱼，AI 挑战为「AI」字牌。用于开局／再来一局按钮、排行榜页签、阵容标题等。装饰性，读屏跳过。 */
export function ModeMark({ mode, size = 24, tone = 'default' }: ModeMarkProps) {
  const [failed, setFailed] = useState(false);
  if (mode === 'normal') return <Icon name={tone === 'onAccent' ? 'open-shop-white' : 'open-shop'} size={size} />;
  if (mode === 'ai') {
    return (
      <span className={`${styles.ai} ${tone === 'onAccent' ? styles.aiOnAccent : ''}`} style={{ width: size, height: size, fontSize: size * 0.42 }} aria-hidden>
        AI
      </span>
    );
  }
  if (failed) return null;
  return <img className={styles.fish} src={FISH_MARK_SRC} width={size} height={size} alt="" aria-hidden onError={() => setFailed(true)} draggable={false} />;
}
