import type { MessageKey } from '../../i18n';
import { useI18n } from '../../i18n';
import { RichText } from '../../ui/primitives/RichText';
import styles from './InfoSections.module.css';

const SECTIONS: MessageKey[] = ['info.full.collect', 'info.full.display', 'info.full.ai', 'info.full.storage', 'info.full.removal', 'info.full.consent'];

/** 完整信息使用说明（UI_COPY 2.3 的六项要点）；选择身份前后展示相同正文。 */
export function InfoSections() {
  const { t } = useI18n();
  return (
    <div className={styles.wrap} data-testid="info-sections">
      <p className={styles.intro}>{t('info.full.intro')}</p>
      {SECTIONS.map((key) => (
        <RichText key={key} className={styles.section} text={t(key)} />
      ))}
    </div>
  );
}
