import { COPYRIGHT, GITHUB_REPOSITORY_URL } from '../app/project';
import { GAME_VERSION } from '../app/version';
import type { GalleryEntry } from '../dev/gallery/types';
import { HomeScreen, type HomeScreenProps } from './HomeScreen';
import { loadPlayerPetDetailPreview, loadPlayerPetsPreview } from '../dev/gallery/playerPets';
import { useI18n } from '../i18n';
import { FACTION_SAMPLES } from '../components/FactionCard/factionFixtures';

const noop = () => {};
const loadLikes = async () => ({ receivedLikes: 12, likedByViewer: false, canLike: false });
const loadProfile = async (userId: string, mode: 'normal' | 'fish') => ({
  userId, name: 'Bob', mode, bestScore: 24800, completedGames: 12,
  collection: { collected: 18, total: 80 }, equippedTitle: null, unlockedTitles: [], recentGames: [],
});
function HomePreview(props: Omit<HomeScreenProps, 'copyright'>) {
  return <HomeScreen soundTipPreview={false} {...props} copyright={COPYRIGHT} loadLikes={loadLikes} loadProfile={loadProfile} loadPets={loadPlayerPetsPreview} loadPetDetail={loadPlayerPetDetailPreview} />;
}
const player = (best: number | null) => ({
  userId: 'U_TEST_BOB',
  name: 'Bob',
  best: { normal: best, fish: null },
  progress: { completedNormalGames: 0, fishUnlocked: false }, streak: { days: 0, today: false },
});

// 阵营周示例：loader 放在模块级，保证引用稳定
const factionNotJoined = async () => FACTION_SAMPLES.notJoined;
const factionCat = async () => FACTION_SAMPLES.cat;
const factionFog = async () => FACTION_SAMPLES.fog;
const factionEnded = async () => FACTION_SAMPLES.endedWin;
const factionJoin = async () => FACTION_SAMPLES.cat;

const manager = { date: '2026-10-23', pet: { petId: 'pet_4750baaed3f0', name: 'Sanxian' } };

function ClockOutFailedPreview() {
  const { t } = useI18n();
  return <HomePreview repositoryUrl={GITHUB_REPOSITORY_URL} version={GAME_VERSION} player={player(24800)} manager={manager} clockOutError={t('auth.logout_failed')} onOpenShop={noop} onCollection={noop} onLeaderboard={noop} onMyPets={noop} onInfo={noop} onClockOut={noop} />;
}

const entry: GalleryEntry = {
  name: 'HomeScreen',
  group: 'screens',
  states: {
    'clock out failed / retry': () => <ClockOutFailedPreview />,
    'first browser visit · sound tip': () => <HomePreview soundTipPreview repositoryUrl={GITHUB_REPOSITORY_URL} version={GAME_VERSION} player={player(null)} manager={manager} onOpenShop={noop} onCollection={noop} onLeaderboard={noop} onMyPets={noop} onInfo={noop} onClockOut={noop} />,
    'equipped legendary · C size': () => <HomePreview repositoryUrl={GITHUB_REPOSITORY_URL} version={GAME_VERSION} player={{ ...player(24800), equippedTitle: 'album' }} manager={manager} onOpenShop={noop} onCollection={noop} onLeaderboard={noop} onMyPets={noop} onInfo={noop} onClockOut={noop} onTitles={noop} />,
    'first visit': () => <HomePreview repositoryUrl={GITHUB_REPOSITORY_URL} version={GAME_VERSION} player={player(null)} manager={manager} onOpenShop={noop} onCollection={noop} onLeaderboard={noop} onMyPets={noop} onInfo={noop} onClockOut={noop} />,
    'long English name + equipped title + own profile': () => <HomePreview repositoryUrl={GITHUB_REPOSITORY_URL} version={GAME_VERSION} player={{ ...player(24800), name: 'Alexandria Catherine Montgomery-Wellington', equippedTitle: 'album' }} manager={manager} onOpenShop={noop} onCollection={noop} onLeaderboard={noop} onMyPets={noop} onInfo={noop} onClockOut={noop} onTitles={noop} />,
    'streak 3 days, clocked in today': () => (
      <HomePreview repositoryUrl={GITHUB_REPOSITORY_URL} version={GAME_VERSION} player={{ ...player(24800), streak: { days: 3, today: true } }} manager={manager} onOpenShop={noop} onCollection={noop} onLeaderboard={noop} onMyPets={noop} onInfo={noop} onClockOut={noop} />
    ),
    'streak 3 days, not yet today': () => (
      <HomePreview repositoryUrl={GITHUB_REPOSITORY_URL} version={GAME_VERSION} player={{ ...player(24800), streak: { days: 3, today: false } }} manager={manager} onOpenShop={noop} onCollection={noop} onLeaderboard={noop} onMyPets={noop} onInfo={noop} onClockOut={noop} />
    ),
    'with record': () => <HomePreview repositoryUrl={GITHUB_REPOSITORY_URL} version={GAME_VERSION} player={player(24800)} manager={manager} onOpenShop={noop} onCollection={noop} onLeaderboard={noop} onMyPets={noop} onInfo={noop} onClockOut={noop} />,
    'update available · refresh prompt above 开始营业': () => <HomePreview repositoryUrl={GITHUB_REPOSITORY_URL} version={GAME_VERSION} player={player(24800)} manager={manager} updateAvailable onRefresh={() => alert('reload')} onOpenShop={noop} onCollection={noop} onLeaderboard={noop} onMyPets={noop} onInfo={noop} onClockOut={noop} />,
    'faction week · not joined': () => <HomePreview repositoryUrl={GITHUB_REPOSITORY_URL} version={GAME_VERSION} player={player(24800)} manager={manager} loadFaction={factionNotJoined} joinFaction={factionJoin} onOpenShop={noop} onCollection={noop} onLeaderboard={noop} onMyPets={noop} onInfo={noop} onClockOut={noop} />,
    'faction week · joined cat + streak': () => <HomePreview repositoryUrl={GITHUB_REPOSITORY_URL} version={GAME_VERSION} player={{ ...player(24800), streak: { days: 3, today: true } }} manager={manager} loadFaction={factionCat} joinFaction={factionJoin} onOpenShop={noop} onCollection={noop} onLeaderboard={noop} onMyPets={noop} onInfo={noop} onClockOut={noop} />,
    'faction week · fog': () => <HomePreview repositoryUrl={GITHUB_REPOSITORY_URL} version={GAME_VERSION} player={player(24800)} manager={manager} loadFaction={factionFog} joinFaction={factionJoin} onOpenShop={noop} onCollection={noop} onLeaderboard={noop} onMyPets={noop} onInfo={noop} onClockOut={noop} />,
    'faction week · ended, won badge': () => <HomePreview repositoryUrl={GITHUB_REPOSITORY_URL} version={GAME_VERSION} player={player(24800)} manager={manager} loadFaction={factionEnded} joinFaction={factionJoin} onOpenShop={noop} onCollection={noop} onLeaderboard={noop} onMyPets={noop} onInfo={noop} onClockOut={noop} />,
    'manager unavailable': () => <HomePreview repositoryUrl={GITHUB_REPOSITORY_URL} version={GAME_VERSION} player={player(24800)} manager={null} onOpenShop={noop} onCollection={noop} onLeaderboard={noop} onMyPets={noop} onInfo={noop} onClockOut={noop} />,
  },
};

export default entry;
