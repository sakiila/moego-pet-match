import type { DailyManager, FactionState, GameMode, LeaderboardScope, LeaderboardView, PetDetail, PlayerPet, PlayerProfileView, PlayerView, SettleResponse } from '../api/types';
import type { GameSummary } from '../engine';
import { PREVIEW_PREP_PETS } from './prepPets';

/** Gallery-only examples. None of these loaders call the API or persist a game. */
export const HALLOWEEN_PETS = PREVIEW_PREP_PETS;
export const loadHalloweenFaction = async (): Promise<FactionState> => ({ phase: 'hidden' });
export const HALLOWEEN_ROWS = ['ADBCEFA', 'BCEFADB', 'EFADBCE', 'DBhACEF', 'CEFADxB', 'FADBCEF', 'ABCEFDA'];
export const HALLOWEEN_PLAYER: PlayerView = {
  userId: 'U_TEST_BOB', name: 'Bob',
  best: { normal: 24800, fish: null },
  progress: { completedNormalGames: 9, fishUnlocked: true },
  streak: { days: 3, today: true },
};
export const HALLOWEEN_MANAGER: DailyManager = {
  date: '2026-10-31', pet: { petId: HALLOWEEN_PETS[0].id, name: 'Deedee' },
};
export const HALLOWEEN_SUMMARY: GameSummary = {
  score: 24800, clearedCells: 120, clearedByMultiplier: [58, 21, 26, 15, 0],
  maxChain: 4, toolsFired: 3, combos: { cc: 0, cs: 0, dryer: 0 },
  validMoves: 20, actedInLastSeconds: false, rushSucceeded: true,
  pets: HALLOWEEN_PETS.map((pet, order) => ({
    id: pet.id, order, served: [18, 15, 17, 36, 17, 14][order], firstServedSeq: [2, 3, 2, 1, 4, 5][order],
  })),
};

export function previewSettlement(summary: GameSummary): SettleResponse {
  return {
    gameId: 'halloween-preview-7', score: summary.score,
    personalBest: { previous: Math.max(0, summary.score - 1200), current: summary.score, isNew: summary.score > 0 },
    newCollected: [HALLOWEEN_PETS[2], HALLOWEEN_PETS[5]]
      .filter(pet => summary.pets.some(served => served.id === pet.id && served.served > 0))
      .map(pet => ({ petId: pet.id, name: pet.name })),
    progress: { completedNormalGames: 9, fishUnlocked: true, unlockedNow: false, counted: summary.clearedCells > 0 },
    quiz: null, removedPetIds: [], newAchievements: [],
    streak: { days: 3, today: true, firstToday: true },
  };
}

const names = ['Emma', 'Sam Pineda', 'Yoo', 'Kai', 'Lily', 'Rachel', 'Bob', 'Luz', 'Jack'];
const scores = [49800, 42600, 39200, 35200, 32600, 29000, 24800, 24800, 23400];
const entries = names.map((name, index) => ({
  userId: name === 'Bob' ? HALLOWEEN_PLAYER.userId : `halloween-${name.toLowerCase().replaceAll(' ', '-')}`,
  name, score: scores[index], rank: index === 7 ? 7 : index + 1,
}));
export const loadHalloweenLeaderboard = async (mode: GameMode, _playerId: string, scope: LeaderboardScope): Promise<LeaderboardView> => ({
  mode, scope, date: '2026-10-31', entries, me: entries[6],
});
export const loadHalloweenLikes = async (targetId: string, viewerId: string) => ({
  receivedLikes: targetId === HALLOWEEN_PLAYER.userId ? 28 : 12,
  likedByViewer: false, canLike: targetId !== viewerId,
});
export const sendHalloweenLike = async () => ({ receivedLikes: 13, likedByViewer: true, canLike: false });
export const loadHalloweenTitles = async () => [];
export const loadHalloweenAchievements = async () => [];
export const loadHalloweenStanding = async () => ({ rank: 7, score: 24800, leaderScore: 49800, participants: entries.length });
export const loadHalloweenProfile = async (userId: string, mode: GameMode): Promise<PlayerProfileView> => {
  const person = entries.find(entry => entry.userId === userId) ?? entries[6];
  return {
    userId, name: person.name, mode, bestScore: person.score, completedGames: 9,
    collection: { collected: 18, total: 84 }, equippedTitle: null, unlockedTitles: [], recentGames: [],
  };
};
export const loadHalloweenPets = async (): Promise<PlayerPet[]> => HALLOWEEN_PETS.slice(1, 3).map(pet => ({ petId: pet.id, name: pet.name, collected: true }));
export const loadHalloweenPetDetail = async (petId: string): Promise<PetDetail> => {
  const pet = HALLOWEEN_PETS.find(item => item.id === petId) ?? HALLOWEEN_PETS[0];
  return { petId: pet.id, name: pet.name, own: false, collected: true, owner: { userId: HALLOWEEN_PLAYER.userId, name: 'Bob' }, quote: null, hasPhoto: false, listed: true, knownBy: null };
};
