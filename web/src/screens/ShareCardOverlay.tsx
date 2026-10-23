import { useMemo } from 'react';
import type { DailyManager, GameMode } from '../api/types';
import { ShareSheet } from '../components/ShareSheet/ShareSheet';
import type { GameSummary } from '../engine';
import type { PetInfo } from '../game/pets';
import { shareCardModel } from '../game/shareCard';
import { useShareCard } from '../game/useShareCard';
import { useI18n } from '../i18n';

export interface ShareCardOverlayProps {
  mode: GameMode;
  summary: GameSummary;
  pets: PetInfo[];
  /** 原对局玩家姓名。 */
  playerName: string;
  manager: DailyManager | null;
  onClose: () => void;
}

/** 报告的分享预览：打开时按本局冻结结果与当前语言生成成绩卡。 */
export function ShareCardOverlay({ mode, summary, pets, playerName, manager, onClose }: ShareCardOverlayProps) {
  const { t, locale } = useI18n();
  const model = useMemo(
    () => shareCardModel({ summary, pets, mode, playerName, manager, locale, t }),
    [summary, pets, mode, playerName, manager, locale, t],
  );
  const card = useShareCard(model, mode, `moego-pet-allstars-${mode}-${summary.score}.png`);
  return <ShareSheet open state={card.state} canShare={card.canShare} onSave={card.save} onShare={card.share} onRetry={card.retry} onClose={onClose} />;
}
