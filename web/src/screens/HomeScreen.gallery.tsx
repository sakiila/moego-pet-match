import { COPYRIGHT, GITHUB_REPOSITORY_URL } from '../app/project';
import { GAME_VERSION } from '../app/version';
import type { GalleryEntry } from '../dev/gallery/types';
import { HomeScreen, type HomeScreenProps } from './HomeScreen';

const noop = () => {};
const loadLikes = async () => ({ receivedLikes: 12, likedByViewer: false, canLike: false });
const loadProfile = async (userId: string, mode: 'normal' | 'fish') => ({
  userId, name: 'Bob', mode, bestScore: 24800, completedGames: 12,
  collection: { collected: 18, total: 80 }, equippedTitle: null, unlockedTitles: [], recentGames: [],
});
function HomePreview(props: Omit<HomeScreenProps, 'copyright'>) {
  return <HomeScreen {...props} copyright={COPYRIGHT} loadLikes={loadLikes} loadProfile={loadProfile} />;
}
const player = (best: number | null) => ({
  userId: 'U_TEST_BOB',
  name: 'Bob',
  best: { normal: best, fish: null },
  progress: { completedNormalGames: 0, fishUnlocked: false }, streak: { days: 0, today: false },
});

const manager = { date: '2026-10-23', pet: { petId: 'pet_4750baaed3f0', name: 'Sanxian' } };

const entry: GalleryEntry = {
  name: 'HomeScreen',
  group: 'screens',
  states: {
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
    'manager unavailable': () => <HomePreview repositoryUrl={GITHUB_REPOSITORY_URL} version={GAME_VERSION} player={player(24800)} manager={null} onOpenShop={noop} onCollection={noop} onLeaderboard={noop} onMyPets={noop} onInfo={noop} onClockOut={noop} />,
  },
};

export default entry;
