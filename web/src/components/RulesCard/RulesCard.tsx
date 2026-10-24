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
          <Icon name={mode === 'normal' ? 'prep-adjacent-swap' : 'adjacent-swap'} size={mode === 'normal' ? 52 : 30} className={styles.instructionIcon} />
          <span>{t(mode === 'fish' ? 'fish.prep_rule' : 'prep.rule')}</span>
        </p>
        <p className={styles.row}>
          <Icon name={mode === 'normal' ? 'prep-sequential-tap' : 'tap-swap'} size={mode === 'normal' ? 52 : 30} className={styles.instructionIcon} />
          <span>{t('prep.controls')}</span>
        </p>
      </div>
      <p className={styles.timer} data-mode={mode} data-locale={locale}>
        <Icon name="time-left" size={mode === 'normal' ? 28 : 20} />
        {mode === 'normal' ? (
          <span>{beforeDuration}<strong className={styles.duration}>{duration}</strong>{afterDuration}</span>
        ) : <span>{t('prep.timer_hint')}</span>}
      </p>
    </>
  );
}
