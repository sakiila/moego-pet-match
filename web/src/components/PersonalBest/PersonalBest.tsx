import { useI18n } from '../../i18n';
import styles from './PersonalBest.module.css';

/** 门店只展示普通宠物局个人最好；没有记录时给出邀请文案。 */
export function PersonalBest({ score }: { score: number | null }) {
  const { t, locale } = useI18n();
  if (score === null) return <p className={styles.best}>{t('home.no_record')}</p>;
  return (
    <p className={styles.best}>
      {t('home.personal_best')} <span className={styles.score}>{score.toLocaleString(locale === 'zh' ? 'zh-CN' : 'en-US')}</span>
    </p>
  );
}
