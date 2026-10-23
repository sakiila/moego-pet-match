import { useMemo } from 'react';
import type { DailyManager } from '../api/types';
import { ShareSheet } from '../components/ShareSheet/ShareSheet';
import { managerPosterModel } from '../game/shareCard';
import { useShareCard } from '../game/useShareCard';
import { useI18n } from '../i18n';
import { drawManagerPoster } from '../ui/canvas/drawShareCard';

/** 门店的店长小海报预览：点店长才打开；保存与分享沿用成绩卡的交互。 */
export function ManagerPosterOverlay({ manager, onClose }: { manager: DailyManager; onClose: () => void }) {
  const { t, locale } = useI18n();
  const draw = useMemo(() => {
    const model = managerPosterModel({ manager, locale, t });
    return () => drawManagerPoster(model);
  }, [manager, locale, t]);
  const card = useShareCard(draw, `moego-manager-${manager.date}.png`);
  return (
    <ShareSheet
      open
      title={t('manager.poster_title')}
      state={card.state}
      canShare={card.canShare}
      onSave={card.save}
      onShare={card.share}
      onRetry={card.retry}
      onClose={onClose}
    />
  );
}
