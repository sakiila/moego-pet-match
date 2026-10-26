import { useState } from 'react';
import type { DailyManager, PetDetail, PlayerView } from '../api/types';
import { BrandHeader } from '../components/BrandHeader/BrandHeader';
import { ManagerCard } from '../components/ManagerCard/ManagerCard';
import { StatusMessage } from '../components/StatusMessage/StatusMessage';
import { DEVELOPER_PETS, managerLineKey } from '../game/easterEggs';
import { NavTile } from '../components/NavTile/NavTile';
import { HomeFooter } from '../components/HomeFooter/HomeFooter';
import { HomePlayerActions } from '../components/HomePlayerActions/HomePlayerActions';
import { StreakLine } from '../components/StreakLine/StreakLine';
import { SettingsDialog } from '../components/SettingsDialog/SettingsDialog';
import { PhotoNotice } from '../components/PhotoNotice/PhotoNotice';
import { SoundTip } from '../components/SoundTip/SoundTip';
import { useSoundTip } from '../game/useSoundTip';
import { stickerUrl } from '../game/pets';
import { usePlayerLikes } from '../game/usePlayerLikes';
import type { PlayerLikesLoader } from '../game/playerLikes';
import { useI18n } from '../i18n';
import { Button } from '../ui/primitives/Button';
import { ManagerPosterOverlay } from './ManagerPosterOverlay';
import { PlayerProfileOverlay, type PlayerPetsLoader, type ProfileLoader } from './PlayerProfileOverlay';
import styles from './Screen.module.css';

export interface HomeScreenProps {
  player: PlayerView;
  version: string;
  repositoryUrl: string;
  /** 页脚版权方与制作人（原文）。 */
  copyright: { holder: string; author: string };
  /** 今日店长；读取失败或尚未读取时为 null，门店照常可开局。 */
  manager: DailyManager | null;
  /** 服务端已部署新版本（或规则版本不一致）：在「开始营业」上方提示刷新，不拦截其他操作。 */
  updateAvailable?: boolean;
  onRefresh?: () => void;
  onOpenShop: () => void;
  onCollection: () => void;
  onLeaderboard: () => void;
  onMyPets: () => void;
  /** 信息使用说明；removal 为 true 时直接展开一般删除申请。 */
  onInfo: (removal: boolean) => void;
  onClockOut: () => void;
  clockOutError?: string;
  onTitles?: () => void;
  /** 陈列页使用示例数据，不读取玩家 API。 */
  loadLikes?: PlayerLikesLoader;
  loadProfile?: ProfileLoader;
  loadPets?: PlayerPetsLoader;
  loadPetDetail?: (petId: string, playerId: string) => Promise<PetDetail>;
  /** 陈列页可固定提示状态，不读写浏览器的一次性展示记录。 */
  soundTipPreview?: boolean;
}

/** 门店：今日店长欢迎、单一主动作「开始营业」、三个次级入口与页尾链接。 */
export function HomeScreen({ player, version, repositoryUrl, copyright, manager, updateAvailable = false, onRefresh, onOpenShop, onCollection, onLeaderboard, onMyPets, onInfo, onClockOut, clockOutError, onTitles, loadLikes, loadProfile, loadPets, loadPetDetail, soundTipPreview }: HomeScreenProps) {
  const { t } = useI18n();
  const [poster, setPoster] = useState(false);
  const [settings, setSettings] = useState(false);
  const [profile, setProfile] = useState(false);
  const soundTip = useSoundTip(soundTipPreview);
  const likes = usePlayerLikes(player.userId, player.userId, loadLikes);
  return (
    <main className={`${styles.screen} ${styles.home}`}>
      <BrandHeader
        title="game"
        tagline="access.subtitle"
        trailing={
          <HomePlayerActions player={player} likes={likes} onProfile={() => setProfile(true)} onClockOut={onClockOut} onTitles={onTitles} />
        }
      />
      <div className={styles.grow} />
      {manager && <ManagerCard name={manager.pet.name} stickerSrc={stickerUrl(manager.pet.petId, 512)} line={t(managerLineKey(manager.pet.petId))} onOpen={() => setPoster(true)} />}
      <div className={styles.grow} />
      {updateAvailable && <StatusMessage text={t('home.update_available')} actionLabel={t('action.refresh')} actionIcon="retry" onAction={onRefresh} />}
      {clockOutError && <StatusMessage tone="error" text={clockOutError} actionLabel={t('action.retry')} onAction={onClockOut} />}
      <Button size="lg" block onClick={onOpenShop} data-testid="open-shop">
        {t('action.open_shop')}
      </Button>
      <StreakLine streak={player.streak} />
      <nav className={styles.navRow}>
        <NavTile icon="pet-collection" label={t('nav.collection')} onClick={onCollection} />
        <NavTile icon="leaderboard" label={t('nav.leaderboard')} onClick={onLeaderboard} />
        <NavTile icon="my-pets" label={t('nav.my_pets')} onClick={onMyPets} />
      </nav>
      <PhotoNotice faces={DEVELOPER_PETS.map((id) => stickerUrl(id, 128))} />
      <HomeFooter
        version={version}
        repositoryUrl={repositoryUrl}
        copyright={copyright}
        links={[
          { label: t('home.footer_info'), onClick: () => onInfo(false), testId: 'link-info' },
          { label: t('home.footer_removal'), onClick: () => onInfo(true), testId: 'link-removal' },
          { label: t('nav.settings'), onClick: () => { soundTip.dismiss(); setSettings(true); }, testId: 'link-settings',
            icon: soundTip.open ? 'settings' : undefined,
            hint: soundTip.open ? { id: 'home-sound-tip', content: <SoundTip onClose={soundTip.dismiss} /> } : undefined },
        ]}
      />
      <SettingsDialog open={settings} onClose={() => setSettings(false)} />
      {poster && manager && <ManagerPosterOverlay manager={manager} onClose={() => setPoster(false)} />}
      {profile && <PlayerProfileOverlay player={player} viewerId={player.userId} mode="normal" load={loadProfile} loadLikes={loadLikes}
        loadPets={loadPets} loadPetDetail={loadPetDetail}
        onOpenShop={() => { setProfile(false); onOpenShop(); }}
        onClose={() => { setProfile(false); void likes.refresh(); }} />}
    </main>
  );
}
