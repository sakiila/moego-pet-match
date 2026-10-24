import { useI18n } from '../../i18n';
import styles from './OwnPetBanner.module.css';

/** 只提示阵容中的第一只自家宠物，最多一行；没有则不显示。 */
export function OwnPetBanner({ names }: { names: string[] }) {
  const { t } = useI18n();
  const [before, after] = t('prep.own_pet').split('{petName}');
  const name = names[0];
  if (!name) return null;
  return (
    <p className={styles.banner} title={t('prep.own_pet', { petName: name })}>
      {before && <span className={styles.suffix}>{before}</span>}
      <em className={styles.name}>{name}</em>
      <span className={styles.suffix}>{after}</span>
    </p>
  );
}
