import type { LeaderboardView, PlayerProfileView } from '../api/types';
import type { GalleryEntry } from '../dev/gallery/types';
import { LeaderboardScreen } from './LeaderboardScreen';
import { ACHIEVEMENT_IDS } from '../game/achievementRules';
import { loadPlayerPetDetailPreview, loadPlayerPetsPreview } from '../dev/gallery/playerPets';

const petPreview = { loadPets: loadPlayerPetsPreview, loadPetDetail: loadPlayerPetDetailPreview };

const noop = () => {};
const player = (fishUnlocked: boolean) => ({
  userId: 'bob',
  name: 'Bob',
  best: { normal: 24800, fish: null },
  progress: { completedNormalGames: 3, fishUnlocked }, streak: { days: 0, today: false },
});
const names = ['Emma', 'Sam Pineda', 'Yoo', 'Kai', 'Mia', 'Fiona', 'Bob', 'Luz', 'Rachel Shaw', 'Theo'];
const scores = [49800, 42600, 39200, 31000, 29000, 26400, 24800, 24800, 23600, 1200];
const ranked: LeaderboardView = {
  mode: 'normal',
  scope: 'today',
  date: '2026-10-24',
  entries: names.map((n, i) => ({ rank: i === 7 ? 7 : i + 1, userId: n.toLowerCase(), name: n, score: scores[i], equippedTitle: ACHIEVEMENT_IDS[i % ACHIEVEMENT_IDS.length] })),
  me: { rank: 7, userId: 'bob', name: 'Bob', score: 24800, equippedTitle: 'album' },
};

const profilePreview = async (userId: string, mode: 'normal' | 'fish'): Promise<PlayerProfileView> => {
  const person = ranked.entries.find(entry => entry.userId === userId)!;
  return {
    userId, name: person.name, mode, bestScore: person.score, completedGames: 12,
    collection: {collected:18,total:80}, equippedTitle:person.equippedTitle ?? null,
    unlockedTitles:ACHIEVEMENT_IDS.filter(id => ['cats','dogs','friends',person.equippedTitle].includes(id)),
    recentGames:[0,1,2,3,4].map(i => ({gameId:`preview-${i}`,completedAt:new Date(Date.UTC(2026,9,24-Math.floor(i/2),8)).toISOString(),score:Math.max(0,person.score-i*200),newCollected:[3,1,0,2,0][i]})),
  };
};

/** 陈列页不调用接口：看名片的人尚未解锁隐藏称号。 */
const viewerTitlesPreview = async () => [];
const likesPreview = async (targetId: string, viewerId: string) => ({ receivedLikes: 12, likedByViewer: false, canLike: targetId !== viewerId });
const sendLikePreview = async () => ({ receivedLikes: 13, likedByViewer: true, canLike: false });

const entry: GalleryEntry = {
  name: 'LeaderboardScreen',
  group: 'screens',
  states: {
    'local API · click player': () => <LeaderboardScreen {...petPreview} player={{...player(true),userId:'U_TEST_BOB'}} initialScope="all" onBack={noop} onChallenge={noop} />,
    'today (default), near me (fish unlocked)': () => (
      <LeaderboardScreen {...petPreview} loadLikes={likesPreview} sendLike={sendLikePreview} loadProfile={profilePreview} loadViewerTitles={viewerTitlesPreview} player={player(true)} onBack={noop} onChallenge={noop} load={async (mode, _p, scope) => ({ ...ranked, mode, scope })} />
    ),
    'all-time, near me': () => (
      <LeaderboardScreen {...petPreview} loadLikes={likesPreview} sendLike={sendLikePreview} loadProfile={profilePreview} loadViewerTitles={viewerTitlesPreview} player={player(true)} initialScope="all" onBack={noop} onChallenge={noop} load={async (mode, _p, scope) => ({ ...ranked, mode, scope })} />
    ),
    'today: nobody played yet': () => (
      <LeaderboardScreen {...petPreview} loadLikes={likesPreview} sendLike={sendLikePreview} loadProfile={profilePreview} loadViewerTitles={viewerTitlesPreview} player={player(false)} onBack={noop} onChallenge={noop} load={async (mode, _p, scope) => ({ ...ranked, mode, scope, entries: [], me: null })} />
    ),
    'today: others played, not me': () => (
      <LeaderboardScreen {...petPreview} loadLikes={likesPreview} sendLike={sendLikePreview} loadProfile={profilePreview} loadViewerTitles={viewerTitlesPreview}
        player={player(false)}
        onBack={noop}
        onChallenge={noop}
        load={async (mode, _p, scope) => ({ ...ranked, mode, scope, me: null, entries: ranked.entries.filter((e) => e.userId !== 'bob') })}
      />
    ),
    'opened on fish tab (from Fish Report)': () => (
      <LeaderboardScreen {...petPreview} loadLikes={likesPreview} sendLike={sendLikePreview} loadProfile={profilePreview} loadViewerTitles={viewerTitlesPreview} player={player(true)} initialMode="fish" onBack={noop} onChallenge={noop} load={async (mode) => ({ ...ranked, mode })} />
    ),
    'fish requested but locked → pet shop tab': () => (
      <LeaderboardScreen {...petPreview} loadLikes={likesPreview} sendLike={sendLikePreview} loadProfile={profilePreview} loadViewerTitles={viewerTitlesPreview} player={player(false)} initialMode="fish" onBack={noop} onChallenge={noop} load={async (mode) => ({ ...ranked, mode })} />
    ),
    'all-time: no score yet': () => (
      <LeaderboardScreen {...petPreview} loadLikes={likesPreview} sendLike={sendLikePreview} loadProfile={profilePreview} loadViewerTitles={viewerTitlesPreview}
        player={player(false)}
        initialScope="all"
        onBack={noop}
        onChallenge={noop}
        load={async (mode, _p, scope) => ({ ...ranked, mode, scope, me: null, entries: ranked.entries.filter((e) => e.userId !== 'bob') })}
      />
    ),
    'load failed': () => <LeaderboardScreen {...petPreview} loadLikes={likesPreview} sendLike={sendLikePreview} loadProfile={profilePreview} loadViewerTitles={viewerTitlesPreview} player={player(false)} onBack={noop} onChallenge={noop} load={() => Promise.reject(new Error('down'))} />,
  },
};
export default entry;
