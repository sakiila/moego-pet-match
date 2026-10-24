import type { NextUp as NextUpPick } from '../../game/nextUp';
import { useI18n, type MessageKey } from '../../i18n';
import { Icon } from '../../ui/primitives/Icon';
import styles from './NextUp.module.css';

export interface NextUpProps {
  nextUp: NextUpPick;
  /** 说这句话的毛孩子（通常是本局 MVP）；没有时气泡不带头像。 */
  speaker?: { name: string; src: string } | null;
  /** 预告指向图鉴（成就、里程碑）时显示「去图鉴」。 */
  onOpenCollection?: () => void;
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
 * 报告末尾「下一件事」（mobile-report-next-up-v1）：毛孩子开口预告离玩家最近的一件事，
 * 一句话、一张气泡，次于新收集与竞猜；文案在 i18n，按预告种类选 key。
 */
export function NextUp({ nextUp, speaker = null, onOpenCollection }: NextUpProps) {
  const { t } = useI18n();
  let text: string;
  let toCollection = false;
  switch (nextUp.kind) {
    case 'fish':
      text = t(nextUp.rounds === 1 ? 'report.next_up_fish_1' : 'report.next_up_fish_2');
      break;
    case 'achievement':
      text = t(ACHIEVEMENT_KEY[nextUp.id] ?? 'report.next_up_friends', { n: nextUp.remaining });
      toCollection = true;
      break;
    case 'milestone':
      text = t('report.next_up_milestone', { n: nextUp.remaining, percent: nextUp.percent });
      toCollection = true;
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
        {toCollection && onOpenCollection && (
          <button type="button" className={styles.action} onClick={onOpenCollection} data-testid="next-up-collection">
            {t('report.next_up_go_collection')}
            <Icon name="forward-arrow" size={14} />
          </button>
        )}
      </div>
    </section>
  );
}
