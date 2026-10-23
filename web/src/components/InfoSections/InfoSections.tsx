import type { MessageKey } from '../../i18n';
import { useI18n } from '../../i18n';
import { RichText } from '../../ui/primitives/RichText';
import styles from './InfoSections.module.css';

const SECTIONS: MessageKey[] = ['info.full.collect', 'info.full.display', 'info.full.ai', 'info.full.storage', 'info.full.removal'];

/**
 * 完整信息使用说明（UI_COPY 2.3 的六项要点）。同意方式一句带当前选中的同事名字；
 * 还没选身份时不显示这一句（身份页上确认按钮本身已写明以谁的身份继续）。
 */
export function InfoSections({ playerName }: { playerName: string | null }) {
  const { t } = useI18n();
  return (
    <div className={styles.wrap} data-testid="info-sections">
      <p className={styles.intro}>{t('info.full.intro')}</p>
      {SECTIONS.map((key) => (
        <RichText key={key} className={styles.section} text={t(key)} />
      ))}
      {playerName && <RichText className={styles.section} text={t('info.full.consent', { playerName })} />}
    </div>
  );
}
