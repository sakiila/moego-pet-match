import type { GameMode } from '../../api/types';
import { RULES } from '../../engine';
import { useI18n } from '../../i18n';
import { Icon } from '../../ui/primitives/Icon';
import { HalloweenEmblem, useSeasonalTheme } from '../SeasonalTheme/SeasonalTheme';
import styles from './RushTicket.module.css';

export type RushTicketView =
  | { state: 'active'; served: number; secondsLeft: number }
  | { state: 'success' }
  | { state: 'expired' };

export interface RushTicketProps {
  view: RushTicketView;
  mode?: GameMode;
}

/** 只呈现引擎给出的催单状态，不控制任务计时、奖励或反馈停留。 */
export function RushTicket({ view, mode = 'normal' }: RushTicketProps) {
  const { t, locale } = useI18n();
  const fish = mode === 'fish';
  const halloween = useSeasonalTheme(mode);
  const count = view.state === 'active'
    ? Math.max(0, Math.min(view.served, RULES.rush.target))
    : RULES.rush.target;
  const progressLabel = t(fish ? 'fish.rush_served' : 'rush.served', { count });

  return (
    <div className={`${styles.ticket} ${view.state === 'expired' ? styles.expired : ''}`} data-locale={locale} data-mode={mode} data-state={view.state}>
      <Icon name="rush-clip" className={styles.clip} size={28} />

      {view.state === 'expired' ? (
        <div className={styles.expiredContent} role="status">
          <Icon name="rush-expired-clipboard" className={styles.expiredIcon} size={36} />
          <span className={styles.expiredMessage}>{t('rush.expired')}</span>
        </div>
      ) : (
        <>
          <div className={styles.header}>
            {view.state === 'active' ? (
              <>
                <div className={styles.title}>
                  {halloween ? <HalloweenEmblem className={styles.titleIcon} /> : <Icon name="rush-clipboard" className={styles.titleIcon} size={32} />}
                  <span className={styles.titleText}>
                    {halloween ? t('halloween.rush_title') : fish ? t('fish.rush_title') : (
                      <>{t('rush.title_lead')}<span className={styles.accent}>{t('rush.title_accent')}</span></>
                    )}
                  </span>
                  {!fish && <Icon name="rush-accent" className={styles.titleAccent} size={16} />}
                </div>
                <div className={styles.remaining}>
                  <Icon name="rush-clock" className={styles.clockIcon} size={24} />
                  <span>{t('rush.seconds_lead')}</span>
                  <strong className={styles.seconds}>{Math.max(0, view.secondsLeft)}</strong>
                  <span>{t('rush.seconds_unit')}</span>
                </div>
              </>
            ) : (
              <div className={styles.successContent} role="status">
                <Icon name="rush-check" className={styles.successIcon} size={40} />
                <span className={styles.successMessage}>
                  {t('rush.success_lead')}<span className={styles.accent}>{t('rush.success_accent')}</span>
                </span>
                <span className={styles.bonus}>
                  <strong>{t('rush.bonus')}</strong><span>{t('rush.bonus_unit')}</span>
                </span>
              </div>
            )}
          </div>

          <div className={styles.progressRow}>
            <span className={styles.served}>
              {fish ? progressLabel : (
                <>
                  <span>{t('rush.served_lead')}</span>
                  <span className={styles.fraction}>
                    <strong>{count}</strong><span>/{RULES.rush.target}</span>
                  </span>
                  <span>{t('rush.served_unit')}</span>
                </>
              )}
            </span>
            <span
              className={styles.track}
              role="progressbar"
              aria-label={progressLabel}
              aria-valuenow={count}
              aria-valuemin={0}
              aria-valuemax={RULES.rush.target}
            >
              <span className={styles.fill} style={{ width: `${count / RULES.rush.target * 100}%` }} />
            </span>
          </div>
        </>
      )}
    </div>
  );
}
