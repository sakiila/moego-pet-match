import type { PlayerView } from '../api/types';
import { BrandHeader } from '../components/BrandHeader/BrandHeader';
import { NavTile } from '../components/NavTile/NavTile';
import { PersonalBest } from '../components/PersonalBest/PersonalBest';
import { PhotoNotice } from '../components/PhotoNotice/PhotoNotice';
import { useI18n } from '../i18n';
import { Avatar } from '../ui/primitives/Avatar';
import { Button } from '../ui/primitives/Button';
import styles from './Screen.module.css';

export interface HomeScreenProps {
  player: PlayerView;
  onOpenShop: () => void;
  onLeaderboard: () => void;
  onSwitchIdentity: () => void;
}

/** 门店：单一主动作「开始营业」；今日店长、图鉴与我的宠物在阶段 3 接入。 */
export function HomeScreen({ player, onOpenShop, onLeaderboard, onSwitchIdentity }: HomeScreenProps) {
  const { t } = useI18n();
  return (
    <main className={styles.screen}>
      <BrandHeader
        title="game"
        tagline="access.subtitle"
        trailing={
          <button type="button" className={styles.avatarButton} onClick={onSwitchIdentity} aria-label={player.name} data-testid="switch-identity">
            <Avatar name={player.name} seed={player.userId} src={`/img/avatars/${encodeURIComponent(player.userId)}`} size={36} />
          </button>
        }
      />
      <div className={styles.grow} />
      <Button size="lg" block onClick={onOpenShop} data-testid="open-shop">
        🐾 {t('action.open_shop')}
      </Button>
      <PersonalBest score={player.best.normal} />
      <nav className={styles.navRow}>
        <NavTile icon="🏆" label={t('nav.leaderboard')} onClick={onLeaderboard} />
      </nav>
      <PhotoNotice />
    </main>
  );
}
