import type { GalleryEntry } from '../../dev/gallery/types';
import type { PetInfo } from '../../game/pets';
import { ScoreCard } from './ScoreCard';

const maodu: PetInfo = { id: 'pet_x', name: 'Maodu', imageBase: '/img/pets/pet_b05057985e11', emoji: '🐱' };
const stats = { tiles: 120, chain: 4, tools: 3 };

const entry: GalleryEntry = {
  name: 'ScoreCard',
  group: 'components',
  states: {
    'saved + new record': () => (
      <ScoreCard mode="normal" score={2480} saveState="saved" newRecord mvp={{ pet: maodu, kind: 1 }} review="review.pet.rush_success" title="title.scheduling_pro" stats={stats} />
    ),
    saving: () => (
      <ScoreCard mode="normal" score={2480} saveState="saving" newRecord={false} mvp={{ pet: maodu, kind: 2 }} review="review.pet.normal" title="title.pet_officer" stats={stats} />
    ),
    'zero service (no MVP)': () => (
      <ScoreCard mode="normal" score={0} saveState="saved" newRecord={false} mvp={null} review="review.pet.no_service" title="title.pet_officer" stats={{ tiles: 0, chain: 0, tools: 0 }} />
    ),
    'zero service (manager host)': () => (
      <ScoreCard
        mode="normal"
        score={0}
        saveState="saved"
        newRecord={false}
        mvp={null}
        review="review.pet.no_service"
        title="title.pet_officer"
        stats={{ tiles: 0, chain: 0, tools: 0 }}
        host={{ name: 'Sanxian', stickerSrc: '/img/pets/pet_4750baaed3f0/512' }}
      />
    ),
    'fish MVP': () => (
      <ScoreCard
        mode="fish"
        score={1880}
        saveState="saved"
        newRecord
        mvp={{ pet: { id: 'f', name: '天蓝', nameEn: 'Sky Blue', imageBase: '/img/fish/fish_color_blue', emoji: '🐟' }, kind: 0 }}
        review="review.fish.high_chain"
        title="title.chain_lead"
        stats={stats}
      />
    ),
  },
};
export default entry;
