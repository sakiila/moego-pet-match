import type { NextUp as NextUpPick } from '../../game/nextUp';
import { useI18n, type MessageKey } from '../../i18n';
import { achievementName } from '../AchievementBadge/AchievementBadge';
import styles from './NextUp.module.css';

export interface NextUpProps {
  nextUp: NextUpPick;
  /** 说这句话的今日店长；没有时气泡不带头像。 */
  speaker?: { name: string; src: string } | null;
}

const ACHIEVEMENT_KEY: Record<string, MessageKey> = {
  cats: 'report.next_up_cats',
  dogs: 'report.next_up_dogs',
  friends: 'report.next_up_friends',
  species: 'report.next_up_species',
  neighbors: 'report.next_up_neighbors',
  album: 'report.next_up_album',
};

/**
 * 报告尾声「店长说」（mobile-report-slim-v1）：一句话直说「再做什么 → 得到什么」，
 * 由今日店长的气泡说出；只报离玩家最近的一件事。文案在 i18n，按预告种类选 key。
 */
export function NextUp({ nextUp, speaker = null }: NextUpProps) {
  const { t } = useI18n();
  let text: string;
  switch (nextUp.kind) {
    case 'fish':
      text = t('report.next_up_fish', { n: nextUp.rounds });
      break;
    case 'achievement':
      text = t(ACHIEVEMENT_KEY[nextUp.id] ?? 'report.next_up_friends', { n: nextUp.remaining, title: t(achievementName(nextUp.id)) });
      break;
    case 'milestone':
      text = t('report.next_up_milestone', { n: nextUp.remaining, percent: nextUp.percent });
      break;
    default:
      text = t('report.next_up_tomorrow');
  }
  return (
    <section className={styles.block} data-testid="next-up" data-kind={nextUp.kind}>
      {speaker && (
        <span className={styles.speaker}>
          <img src={speaker.src} alt={speaker.name} />
        </span>
      )}
      <div className={`${styles.bubble} ${speaker ? styles.withTail : ''}`}>
        <span className={styles.label}>{t('report.next_up_label')}</span>
        <p className={styles.text}>{text}</p>
      </div>
    </section>
  );
}
