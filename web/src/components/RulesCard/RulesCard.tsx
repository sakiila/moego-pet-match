import type { GameMode } from '../../api/types';
import { useI18n } from '../../i18n';
import { Icon } from '../../ui/primitives/Icon';
import styles from './RulesCard.module.css';

/** 开局前只教三消与两种交换方式；工具用法留到首次自然出现时提示。鱼关强调同色匹配。 */
export function RulesCard({ mode = 'normal' }: { mode?: GameMode }) {
  const { t, locale } = useI18n();
  const duration = t('prep.timer_duration');
  const [beforeDuration, afterDuration] = t('prep.timer_hint').split(duration);
  return (
    <>
      <div className={styles.card} data-mode={mode}>
        <p className={styles.row}>
          <Icon name="prep-adjacent-swap" size={52} className={styles.instructionIcon} />
          <span>{t(mode === 'fish' ? 'fish.prep_rule' : 'prep.rule')}</span>
        </p>
        <p className={styles.row}>
          <Icon name="prep-sequential-tap" size={52} className={styles.instructionIcon} />
          <span>{t('prep.controls')}</span>
        </p>
      </div>
      <p className={styles.timer} data-mode={mode} data-locale={locale}>
        <Icon name="time-left" size={28} />
        <span>{beforeDuration}<strong className={styles.duration}>{duration}</strong>{afterDuration}</span>
      </p>
    </>
  );
}
