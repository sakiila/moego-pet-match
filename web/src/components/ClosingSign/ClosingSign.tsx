import type { Locale } from '../../i18n';
import { Icon } from '../../ui/primitives/Icon';
import styles from './ClosingSign.module.css';

export interface ClosingSignProps {
  locale: Locale;
  label: string;
}

/** 已确认挂牌原图，保留绳结、描边与文字的原始比例。 */
export function ClosingSign({ locale, label }: ClosingSignProps) {
  return (
    <div className={styles.sign} data-testid="closing-sign" data-locale={locale}>
      <Icon name={locale === 'en' ? 'closing-sign-en' : 'closing-sign-zh'} size={240} label={label} className={styles.art} />
    </div>
  );
}
