import { useMemo } from 'react';
import type { GameMode } from '../../api/types';
import type { GalleryEntry } from '../../dev/gallery/types';
import type { GameSummary } from '../../engine';
import { SAMPLE_FISH, type PetInfo } from '../../game/pets';
import { shareCardModel } from '../../game/shareCard';
import { useShareCard } from '../../game/useShareCard';
import { useI18n } from '../../i18n';
import { ShareSheet } from './ShareSheet';

const ids = ['pet_644053d683e0', 'pet_b05057985e11', 'pet_4750baaed3f0', 'pet_c7ad902c2024', 'pet_7104fa8cdaea', 'pet_01714a23d2b5'];
const names = ['Maodu', 'Deedee', 'Sanxian', '7-Eleven', 'Banjo', 'Zuko'];
const PETS: PetInfo[] = ids.map((id, i) => ({ id, name: names[i], imageBase: `/img/pets/${id}`, emoji: '🐾' }));
const manager = { date: '2026-10-23', pet: { petId: 'pet_4750baaed3f0', name: 'Sanxian' } };

const summary = (served: number[], over: Partial<GameSummary> = {}): GameSummary => ({
  score: 2480,
  clearedCells: 186,
  clearedByMultiplier: [120, 40, 20, 6, 0],
  maxChain: 4,
  toolsFired: 2,
  combos: { cc: 0, cs: 0, ss: 0 },
  validMoves: 40,
  actedInLastSeconds: false,
  rushSucceeded: true,
  pets: served.map((s, order) => ({ id: `k${order}`, order, served: s, firstServedSeq: s ? 1 : null })),
  ...over,
});
const ZERO = summary([0, 0, 0, 0, 0, 0], { score: 0, clearedCells: 0, maxChain: 0, toolsFired: 0, rushSucceeded: false });

function Live({ mode = 'normal', pets = PETS, s, playerName = 'Bob 包博', noManager = false }: { mode?: GameMode; pets?: PetInfo[]; s: GameSummary; playerName?: string; noManager?: boolean }) {
  const { t, locale } = useI18n();
  const model = useMemo(
    () => shareCardModel({ summary: s, pets, mode, playerName, manager: noManager ? null : manager, locale, t }),
    [s, pets, mode, playerName, noManager, locale, t],
  );
  const card = useShareCard(model, mode, `share-${mode}.png`);
  return <ShareSheet open inline state={card.state} canShare={card.canShare} onSave={card.save} onShare={card.share} onRetry={card.retry} onClose={() => {}} />;
}

const noop = () => {};
const entry: GalleryEntry = {
  name: 'ShareSheet',
  group: 'components',
  states: {
    'normal · MVP (rush success)': () => <Live s={summary([40, 10, 8, 5, 3, 1])} />,
    'normal · zero service (manager host)': () => <Live s={ZERO} />,
    'normal · zero service, no manager': () => <Live s={ZERO} noManager />,
    'fish · MVP (chain 5)': () => <Live mode="fish" pets={[SAMPLE_FISH[3], ...SAMPLE_FISH.filter((_, i) => i !== 3)]} s={summary([50, 10, 8, 5, 3, 1], { score: 3260, maxChain: 5, rushSucceeded: true })} />,
    'fish · zero service': () => <Live mode="fish" pets={SAMPLE_FISH} s={ZERO} />,
    'long names (pet & player)': () => (
      <Live pets={[{ ...PETS[0], name: 'Sir Fluffington the Third' }, ...PETS.slice(1)]} s={summary([40, 1, 1, 1, 1, 1], { score: 128_460, rushSucceeded: false, toolsFired: 4 })} playerName="Alexandria Montgomery-Smith" />
    ),
    'image failed → retry': () => <Live pets={[{ ...PETS[0], imageBase: '/img/pets/missing' }, ...PETS.slice(1)]} s={summary([40, 1, 1, 1, 1, 1])} />,
    generating: () => <ShareSheet open inline state={{ kind: 'generating' }} canShare={false} onSave={noop} onShare={noop} onRetry={noop} onClose={noop} />,
    'ready with share button': () => <ShareSheet open inline state={{ kind: 'generating' }} canShare onSave={noop} onShare={noop} onRetry={noop} onClose={noop} />,
  },
};
export default entry;
