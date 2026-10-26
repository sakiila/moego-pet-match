import { useI18n } from '../../i18n';
import { Icon } from '../../ui/primitives/Icon';
import { Button } from '../../ui/primitives/Button';
import { SocialHeader } from './SocialChrome';
import styles from './Social.module.css';

export function SocialGate({
  onContinue,
  onBack,
  onInfo,
}: {
  onContinue: () => void;
  onBack: () => void;
  onInfo: () => void;
}) {
  const { t } = useI18n();
  return (
    <>
      <SocialHeader title={t('social.title')} onHome={onBack} />
      <section className={styles.gate}>
        <Icon name="social-feed" size={124} />
        <h1>{t('social.gate_title')}</h1>
        <p>{t('social.gate_body')}</p>
        <div className={styles.gateScope}>
          <Icon name="social-shield" size={28} />
          {t('social.gate_scope')}
        </div>
        <div className={styles.gateActions}>
          <Button block onClick={onContinue}>
            {t('social.preview_enter')}
          </Button>
          <Button block variant="secondary" onClick={onBack}>
            {t('action.back_to_shop')}
          </Button>
        </div>
        <p className={styles.preview}>{t('social.preview_gate')}</p>
        <button className={styles.textButton} onClick={onInfo}>
          {t('social.info')}
        </button>
      </section>
    </>
  );
}
