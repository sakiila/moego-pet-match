import { useState } from 'react';
import type { AchievementId } from '../../api/types';
import { useI18n } from '../../i18n';
import { AchievementBadge, achievementName } from '../AchievementBadge/AchievementBadge';
import { StatusMessage } from '../StatusMessage/StatusMessage';
import styles from './AchievementUnlocks.module.css';

/** 只呈现本局成功结算首次授予的徽章；佩戴失败可重试，不改变已授予状态。 */
export function AchievementUnlocks({ ids, equippedTitle, onEquip, onOpenTitles }: { ids: AchievementId[]; equippedTitle?: AchievementId | null; onEquip?: (id: AchievementId) => Promise<void>; onOpenTitles?: () => void }) {
  const { t } = useI18n();
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);
  if (!ids.length) return null;
  const equip = async (id: AchievementId) => {
    if (!onEquip || saving) return;
    setSaving(true); setFailed(false);
    try { await onEquip(id); } catch { setFailed(true); } finally { setSaving(false); }
  };
  return <section className={styles.root} data-testid="achievement-unlocks">
    <h2>{t('achievement.new_unlocks')}</h2>
    <ul className={styles.grid}>{ids.map(id => <li key={id} className={styles.item}>
      <AchievementBadge id={id} large />
      <strong>{t(achievementName(id))}</strong>
      {onEquip && <button type="button" aria-label={equippedTitle === id ? t('achievement.wearing') : t('achievement.equip_named', { title: t(achievementName(id)) })} disabled={saving || equippedTitle === id} onClick={() => void equip(id)}>{t(equippedTitle === id ? 'achievement.wearing' : 'achievement.equip')}</button>}
    </li>)}</ul>
    {failed && <StatusMessage tone="error" text={t('achievement.equip_failed')} />}
    {onOpenTitles && <button type="button" className={styles.all} onClick={onOpenTitles}>{t('achievement.my_titles')}</button>}
  </section>;
}
