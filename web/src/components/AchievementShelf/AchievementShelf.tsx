import type { AchievementId, AchievementView } from '../../api/types';
import { useI18n } from '../../i18n';
import { Sheet } from '../../ui/primitives/Sheet';
import { Icon } from '../../ui/primitives/Icon';
import { StatusMessage } from '../StatusMessage/StatusMessage';
import { AchievementBadge, achievementName, achievementCondition } from '../AchievementBadge/AchievementBadge';
import { ACHIEVEMENT_RARITY } from '../../game/achievementRarity';
import styles from './AchievementShelf.module.css';

export interface AchievementShelfProps {
  view: AchievementView | null;
  failed: boolean;
  saving: boolean;
  saveFailed: boolean;
  onRetry: () => void;
  onSelect: (id: AchievementId | null) => void;
  onClose: () => void;
  inline?: boolean;
}

export function AchievementShelf({ view, failed, saving, saveFailed, onRetry, onSelect, onClose, inline }: AchievementShelfProps) {
  const { t } = useI18n();
  const ordered = view ? [...view.achievements.filter(a => a.unlockedAt), ...view.achievements.filter(a => !a.unlockedAt)] : [];
  return (
    <Sheet open inline={inline} label={t('achievement.my_titles')} closeLabel={t('action.close')} onClose={onClose} badge={<h2 className={styles.title}><Icon name="my-titles" size={24} />{t('achievement.my_titles')}</h2>}>
      <div className={styles.root} data-testid="achievement-shelf" aria-busy={saving}>
        <p className={styles.hint}>{t('achievement.pick_hint')}</p>
        {failed ? <StatusMessage tone="error" text={t('achievement.load_failed')} actionLabel={t('action.retry')} onAction={onRetry} /> : !view ? <p role="status">{t('achievement.loading')}</p> : <>
          <div className={styles.summary}>
            <strong>{t('achievement.unlocked_count', { count: view.achievements.filter(a => a.unlockedAt).length, total: view.achievements.length })}</strong>
            <button type="button" className={styles.remove} disabled={saving || !view.equippedTitle} onClick={() => onSelect(null)}>{t('achievement.remove')}</button>
          </div>
          {saveFailed && <StatusMessage tone="error" text={t('achievement.equip_failed')} />}
          <ul className={styles.list}>
            {ordered.map(a => {
              const unlocked = !!a.unlockedAt;
              const wearing = view.equippedTitle === a.id;
              const rarity = ACHIEVEMENT_RARITY[a.id];
              return <li key={a.id} className={styles.row} data-rarity={rarity} data-wearing={wearing || undefined} data-locked={!unlocked || undefined}>
                <AchievementBadge id={a.id} locked={!unlocked} large rarity />
                <div className={styles.details}>
                  <span className={styles.rarity}>{t(`achievement.rarity_${rarity}`)}</span>
                  <strong>{t(achievementName(a.id))}</strong>
                  <span className={styles.condition}>{t(achievementCondition(a.id), { current: a.current, target: a.target })}</span>
                  {!unlocked && <progress className={styles.progress} value={a.current} max={Math.max(1, a.target)} aria-label={t(achievementName(a.id))} />}
                </div>
                {unlocked ? <button className={styles.equip} type="button" disabled={saving || wearing} aria-pressed={wearing} onClick={() => onSelect(a.id)} aria-label={t(wearing ? 'achievement.wearing_named' : 'achievement.equip_named', { title: t(achievementName(a.id)) })}>{wearing ? t('achievement.wearing') : t('achievement.equip')}</button> : <span className={styles.locked}>{t('achievement.locked')}</span>}
              </li>;
            })}
          </ul>
          <p className={styles.footnote}>{t('achievement.no_score')}</p>
        </>}
      </div>
    </Sheet>
  );
}
