import type { PetInfo } from '../../game/pets';
import { useI18n } from '../../i18n';
import styles from './NewCollection.module.css';

/** 本局新收集：只在保存成功后显示，逐只列出名字（不把服务格数说成宠物数量）。 */
export function NewCollection({ pets }: { pets: PetInfo[] }) {
  const { t } = useI18n();
  if (pets.length === 0) return null;
  return (
    <section className={styles.box}>
      <h3 className={styles.title}>{t('report.new_collection')}</h3>
      <div className={styles.chips}>
        {pets.map((p) => (
          <span key={p.id} className={styles.chip}>
            <span className={styles.face} aria-hidden>
              {p.emoji}
            </span>
            {p.name}
          </span>
        ))}
      </div>
    </section>
  );
}
