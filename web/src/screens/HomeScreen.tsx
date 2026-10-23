import type { DailyManager, PlayerView } from '../api/types';
import { BrandHeader } from '../components/BrandHeader/BrandHeader';
import { ManagerCard } from '../components/ManagerCard/ManagerCard';
import { NavTile } from '../components/NavTile/NavTile';
import { PersonalBest } from '../components/PersonalBest/PersonalBest';
import { PhotoNotice } from '../components/PhotoNotice/PhotoNotice';
import { avatarUrl, stickerUrl } from '../game/pets';
import { useI18n } from '../i18n';
import { Avatar } from '../ui/primitives/Avatar';
import { Button } from '../ui/primitives/Button';
import styles from './Screen.module.css';

export interface HomeScreenProps {
  player: PlayerView;
  /** 今日店长；读取失败或尚未读取时为 null，门店照常可开局。 */
  manager: DailyManager | null;
  onOpenShop: () => void;
  onCollection: () => void;
  onLeaderboard: () => void;
  onSwitchIdentity: () => void;
}

/** 门店：今日店长欢迎、单一主动作「开始营业」、个人最好与次级入口；「我的宠物」在阶段 4 接入。 */
export function HomeScreen({ player, manager, onOpenShop, onCollection, onLeaderboard, onSwitchIdentity }: HomeScreenProps) {
  const { t } = useI18n();
  return (
    <main className={styles.screen}>
      <BrandHeader
        title="game"
        tagline="access.subtitle"
        trailing={
          <button type="button" className={styles.avatarButton} onClick={onSwitchIdentity} aria-label={player.name} data-testid="switch-identity">
            <Avatar name={player.name} seed={player.userId} src={avatarUrl(player.userId)} size={36} />
          </button>
        }
      />
      <div className={styles.grow} />
      {manager && <ManagerCard name={manager.pet.name} stickerSrc={stickerUrl(manager.pet.petId, 512)} />}
      <div className={styles.grow} />
      <Button size="lg" block onClick={onOpenShop} data-testid="open-shop">
        🐾 {t('action.open_shop')}
      </Button>
      <PersonalBest score={player.best.normal} />
      <nav className={styles.navRow}>
        <NavTile icon="📖" label={t('nav.collection')} onClick={onCollection} />
        <NavTile icon="🏆" label={t('nav.leaderboard')} onClick={onLeaderboard} />
      </nav>
      <PhotoNotice />
    </main>
  );
}
