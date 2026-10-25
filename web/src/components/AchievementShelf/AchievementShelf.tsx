import type { AchievementId, AchievementView } from '../../api/types';
import { useI18n } from '../../i18n';
import { Sheet } from '../../ui/primitives/Sheet';
import { Icon } from '../../ui/primitives/Icon';
import { StatusMessage } from '../StatusMessage/StatusMessage';
import { AchievementBadge, achievementName, achievementCondition } from '../AchievementBadge/AchievementBadge';
import { ACHIEVEMENT_DISPLAY_ORDER, ACHIEVEMENT_RARITY } from '../../game/achievementRarity';
import { HIDDEN_ACHIEVEMENT_IDS } from '../../game/achievementRules';
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
  const { t, locale } = useI18n();
  const byRarity = view ? [...view.achievements].sort((a,b) => ACHIEVEMENT_DISPLAY_ORDER.indexOf(a.id) - ACHIEVEMENT_DISPLAY_ORDER.indexOf(b.id)) : [];
  const ordered = [...byRarity.filter(a => a.unlockedAt), ...byRarity.filter(a => !a.unlockedAt)];
  return (
    <Sheet open inline={inline} label={t('achievement.my_titles')} closeLabel={t('action.close')} onClose={onClose} badge={<h2 className={styles.title}><Icon name="my-titles" size={24} />{t('achievement.my_titles')}</h2>}>
      <div className={styles.root} data-testid="achievement-shelf" data-locale={locale} aria-busy={saving}>
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
              // 未解锁的隐藏称号：只露稀有度，名字换成「隐藏称号」、条件不揭晓、不画进度
              const hidden = !unlocked && HIDDEN_ACHIEVEMENT_IDS.includes(a.id);
              return <li key={a.id} className={styles.row} data-rarity={rarity} data-wearing={wearing || undefined} data-locked={!unlocked || undefined} data-hidden={hidden || undefined}>
                <AchievementBadge id={a.id} locked={!unlocked} hidden={hidden} size={56} rarity />
                <div className={styles.details}>
                  <strong>{hidden ? t('achievement.hidden_name') : t(achievementName(a.id))}</strong>
                  <span className={styles.condition}>{hidden ? t('achievement.hidden_condition') : t(achievementCondition(a.id), { current: a.current, target: a.target })}</span>
                  {!unlocked && !hidden && <progress className={styles.progress} value={a.current} max={Math.max(1, a.target)} aria-label={t(achievementName(a.id))} />}
                </div>
                <span className={styles.rarity}>{t(`achievement.rarity_${rarity}`)}</span>
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
