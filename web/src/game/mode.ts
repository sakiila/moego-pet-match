import type { GameMode } from '../api/types';

/** 棋盘外观只有两套：AI 挑战沿用普通局的宠物棋盘。 */
export type BoardTheme = 'normal' | 'fish';

export const themeOf = (mode: GameMode): BoardTheme => (mode === 'fish' ? 'fish' : 'normal');
