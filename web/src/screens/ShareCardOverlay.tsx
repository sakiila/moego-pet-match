import { useMemo } from 'react';
import type { DailyManager, GameMode } from '../api/types';
import { ShareSheet } from '../components/ShareSheet/ShareSheet';
import type { GameSummary } from '../engine';
import type { PetInfo } from '../game/pets';
import { shareCardModel } from '../game/shareCard';
import { useShareCard } from '../game/useShareCard';
import { useI18n } from '../i18n';
import { themeOf } from '../game/mode';
import { drawShareCard } from '../ui/canvas/drawShareCard';

export interface ShareCardOverlayProps {
  mode: GameMode;
  summary: GameSummary;
  pets: PetInfo[];
  /** 原对局玩家姓名。 */
  playerName: string;
  manager: DailyManager | null;
  /** 本局阵容里当前已下架的宠物（结算返回）。 */
  removed?: string[];
  /** 本局总分（含猜主人奖励）；缺省为引擎分数。 */
  score?: number;
  onClose: () => void;
}

/** 报告的分享预览：打开时按本局冻结结果与当前语言生成成绩卡。 */
export function ShareCardOverlay({ mode, summary, pets, playerName, manager, removed = [], score = summary.score, onClose }: ShareCardOverlayProps) {
  const { t, locale } = useI18n();
  // 用内容作依赖，避免每次渲染的新数组重新生成图片
  const removedKey = removed.join(',');
  const draw = useMemo(() => {
    const model = shareCardModel({ summary, pets, mode, playerName, manager, locale, t, removed: new Set(removedKey ? removedKey.split(',') : []), score });
    return () => drawShareCard(model, themeOf(mode));
  }, [summary, pets, mode, playerName, manager, locale, t, removedKey, score]);
  const card = useShareCard(draw, `moego-pet-allstars-${mode}-${score}.png`);
  return <ShareSheet open state={card.state} canShare={card.canShare} onSave={card.save} onShare={card.share} onRetry={card.retry} onClose={onClose} />;
}
