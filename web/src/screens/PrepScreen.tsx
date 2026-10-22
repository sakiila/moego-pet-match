import { BrandHeader } from '../components/BrandHeader/BrandHeader';
import { LineupPanel } from '../components/LineupPanel/LineupPanel';
import { RulesCard } from '../components/RulesCard/RulesCard';
import type { PetInfo } from '../game/pets';
import { useI18n } from '../i18n';
import { Button } from '../ui/primitives/Button';
import styles from './Screen.module.css';

/** 开局准备：棋盘的计时前状态，读说明不计时，点「开始这班」后才进入 90 秒。 */
export function PrepScreen({ pets, onStart }: { pets: PetInfo[]; onStart: () => void }) {
  const { t } = useI18n();
  return (
    <main className={styles.screen}>
      <BrandHeader />
      <LineupPanel pets={pets} />
      <RulesCard />
      <div className={styles.grow} />
      <Button size="lg" block onClick={onStart} data-testid="start">
        🐾 {t('prep.start')}
      </Button>
    </main>
  );
}
