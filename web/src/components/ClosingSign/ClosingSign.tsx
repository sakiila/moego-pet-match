import type { Locale } from '../../i18n';
import { Icon } from '../../ui/primitives/Icon';
import styles from './ClosingSign.module.css';

export interface ClosingSignProps {
  locale: Locale;
  label: string;
}

/** 已确认的挂牌造型；中英均使用高分辨率透明素材，等比显示。 */
export function ClosingSign({ locale, label }: ClosingSignProps) {
  return (
    <div className={styles.sign} data-testid="closing-sign" data-locale={locale}>
      <Icon name={locale === 'en' ? 'closing-sign-en' : 'closing-sign-zh-hd-v2'} size={240} label={label} className={styles.art} />
    </div>
  );
}
