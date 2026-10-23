import { useI18n } from '../../i18n';
import styles from './OwnPetBanner.module.css';

/** 本局实际抽到自家宠物时提示「{petName} 也来啦！」；没有则不显示。 */
export function OwnPetBanner({ names }: { names: string[] }) {
  const { t } = useI18n();
  return (
    <>
      {names.map((name) => (
        <p key={name} className={styles.banner}>
          {t('prep.own_pet', { petName: name })}
        </p>
      ))}
    </>
  );
}
