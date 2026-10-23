import { useState } from 'react';
import type { DailyManager, PlayerView } from '../api/types';
import { BrandHeader } from '../components/BrandHeader/BrandHeader';
import { ManagerCard } from '../components/ManagerCard/ManagerCard';
import { NavTile } from '../components/NavTile/NavTile';
import { PageLinks } from '../components/PageLinks/PageLinks';
import { SettingsDialog } from '../components/SettingsDialog/SettingsDialog';
import { PersonalBest } from '../components/PersonalBest/PersonalBest';
import { PhotoNotice } from '../components/PhotoNotice/PhotoNotice';
import { avatarUrl, stickerUrl } from '../game/pets';
import { useI18n } from '../i18n';
import { Avatar } from '../ui/primitives/Avatar';
import { Button } from '../ui/primitives/Button';
import { ManagerPosterOverlay } from './ManagerPosterOverlay';
import styles from './Screen.module.css';

export interface HomeScreenProps {
  player: PlayerView;
  /** 今日店长；读取失败或尚未读取时为 null，门店照常可开局。 */
  manager: DailyManager | null;
  onOpenShop: () => void;
  onCollection: () => void;
  onLeaderboard: () => void;
  onMyPets: () => void;
  /** 信息使用说明；removal 为 true 时直接展开一般删除申请。 */
  onInfo: (removal: boolean) => void;
  onSwitchIdentity: () => void;
}

/** 门店：今日店长欢迎、单一主动作「开始营业」、个人最好、三个次级入口与页尾链接。 */
export function HomeScreen({ player, manager, onOpenShop, onCollection, onLeaderboard, onMyPets, onInfo, onSwitchIdentity }: HomeScreenProps) {
  const { t } = useI18n();
  const [poster, setPoster] = useState(false);
  const [settings, setSettings] = useState(false);
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
      {manager && <ManagerCard name={manager.pet.name} stickerSrc={stickerUrl(manager.pet.petId, 512)} onOpen={() => setPoster(true)} />}
      <div className={styles.grow} />
      <Button size="lg" block onClick={onOpenShop} data-testid="open-shop">
        🐾 {t('action.open_shop')}
      </Button>
      <PersonalBest score={player.best.normal} />
      <nav className={styles.navRow}>
        <NavTile icon="📖" label={t('nav.collection')} onClick={onCollection} />
        <NavTile icon="🏆" label={t('nav.leaderboard')} onClick={onLeaderboard} />
        <NavTile icon="🐶" label={t('nav.my_pets')} onClick={onMyPets} />
      </nav>
      <PhotoNotice />
      <PageLinks
        links={[
          { label: t('info.use_link'), onClick: () => onInfo(false), testId: 'link-info' },
          { label: t('info.removal_link'), onClick: () => onInfo(true), testId: 'link-removal' },
          { label: t('nav.settings'), onClick: () => setSettings(true), testId: 'link-settings' },
        ]}
      />
      <SettingsDialog open={settings} onClose={() => setSettings(false)} />
      {poster && manager && <ManagerPosterOverlay manager={manager} onClose={() => setPoster(false)} />}
    </main>
  );
}
