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
    'today standing: rank 3, 1,240 behind': () => (
      <ScoreCard
        mode="normal"
        score={13420}
        saveState="saved"
        newRecord={false}
        mvp={{ pet: maodu, kind: 1 }}
        review="review.pet.high_chain"
        title="title.cleanup_chief"
        stats={{ tiles: 684, chain: 6, tools: 13 }}
        standing={{ rank: 3, score: 13420, leaderScore: 14660, participants: 12 }}
      />
    ),
    'today standing: first + new record': () => (
      <ScoreCard
        mode="normal"
        score={18410}
        saveState="saved"
        newRecord
        mvp={{ pet: maodu, kind: 1 }}
        review="review.pet.rush_success"
        title="title.scheduling_pro"
        stats={stats}
        standing={{ rank: 1, score: 18410, leaderScore: 18410, participants: 12 }}
      />
    ),
    'today standing + streak day 3 (first clock-in today)': () => (
      <ScoreCard
        mode="normal"
        score={13420}
        saveState="saved"
        newRecord={false}
        mvp={{ pet: maodu, kind: 1 }}
        review="review.pet.high_chain"
        title="title.cleanup_chief"
        stats={{ tiles: 684, chain: 6, tools: 13 }}
        standing={{ rank: 3, score: 13420, leaderScore: 14660, participants: 12 }}
        streak={{ days: 3, today: true, firstToday: true }}
      />
    ),
    'streak first day': () => (
      <ScoreCard mode="normal" score={2480} saveState="saved" newRecord={false} mvp={{ pet: maodu, kind: 2 }} review="review.pet.normal" title="title.pet_officer" stats={stats} streak={{ days: 1, today: true, firstToday: true }} />
    ),
    'today standing: alone today': () => (
      <ScoreCard mode="normal" score={2480} saveState="saved" newRecord={false} mvp={{ pet: maodu, kind: 2 }} review="review.pet.normal" title="title.pet_officer" stats={stats} standing={{ rank: 1, score: 2480, leaderScore: 2480, participants: 1 }} />
    ),
    'owner quiz bonus (+100 included)': () => (
      <ScoreCard mode="normal" score={2580} quizBonus={100} saveState="saved" newRecord mvp={{ pet: maodu, kind: 1 }} review="review.pet.normal" title="title.pet_officer" stats={stats} />
    ),
    saving: () => (
      <ScoreCard mode="normal" score={2480} saveState="saving" newRecord={false} mvp={{ pet: maodu, kind: 2 }} review="review.pet.normal" title="title.pet_officer" stats={stats} />
    ),
    'save failed (retry below)': () => (
      <ScoreCard mode="normal" score={2480} saveState="failed" newRecord={false} mvp={{ pet: maodu, kind: 3 }} review="review.pet.normal" title="title.pet_officer" stats={stats} />
    ),
    'long English names + 6-digit score': () => (
      <ScoreCard
        mode="normal"
        score={123456}
        saveState="saved"
        newRecord
        mvp={{ pet: { ...maodu, name: 'Sir Reginald Fluffington III' }, kind: 4 }}
        review="review.pet.high_chain"
        title="title.cleanup_chief"
        stats={{ tiles: 1234, chain: 12, tools: 56 }}
      />
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
    'MVP removed (generic mark)': () => (
      <ScoreCard mode="normal" score={2480} saveState="saved" newRecord={false} mvp={{ pet: maodu, kind: 1 }} mvpRemoved review="review.pet.rush_success" title="title.scheduling_pro" stats={stats} />
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
