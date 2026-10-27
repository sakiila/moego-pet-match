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
      <ScoreCard mode="normal" score={24800} saveState="saved" newRecord mvp={{ pet: maodu, kind: 1 }} review="review.pet.rush_success" title="title.scheduling_pro" stats={stats} />
    ),
    'today standing: rank 3, 1,240 behind': () => (
      <ScoreCard
        mode="normal"
        score={134200}
        saveState="saved"
        newRecord={false}
        mvp={{ pet: maodu, kind: 1 }}
        review="review.pet.high_chain.2"
        title="title.cleanup_chief"
        stats={{ tiles: 684, chain: 6, tools: 13 }}
        standing={{ rank: 3, score: 134200, leaderScore: 146600, participants: 12 }}
      />
    ),
    'faction week: all four tags (record, rank, streak, +team points)': () => (
      <ScoreCard mode="normal" score={98400} saveState="saved" newRecord mvp={{ pet: maodu, kind: 1 }} review="review.pet.rush_success" title="title.scheduling_pro" stats={stats}
        standing={{ rank: 2, score: 98400, leaderScore: 120000, participants: 12 }} streak={{ days: 4, today: true, firstToday: true }} faction={{ faction: 'dog', points: 128, capped: false }} />
    ),
    'faction week: capped for today': () => (
      <ScoreCard mode="normal" score={24800} saveState="saved" newRecord={false} mvp={{ pet: maodu, kind: 1 }} review="review.pet.normal" title="title.pet_officer" stats={stats} faction={{ faction: 'cat', points: 0, capped: true }} />
    ),
    'today standing: first + new record': () => (
      <ScoreCard
        mode="normal"
        score={184100}
        saveState="saved"
        newRecord
        mvp={{ pet: maodu, kind: 1 }}
        review="review.pet.rush_success"
        title="title.scheduling_pro"
        stats={stats}
        standing={{ rank: 1, score: 184100, leaderScore: 184100, participants: 12 }}
      />
    ),
    'today standing + streak day 3 (first clock-in today)': () => (
      <ScoreCard
        mode="normal"
        score={134200}
        saveState="saved"
        newRecord={false}
        mvp={{ pet: maodu, kind: 1 }}
        review="review.pet.high_chain"
        title="title.cleanup_chief"
        stats={{ tiles: 684, chain: 6, tools: 13 }}
        standing={{ rank: 3, score: 134200, leaderScore: 146600, participants: 12 }}
        streak={{ days: 3, today: true, firstToday: true }}
      />
    ),
    'streak first day': () => (
      <ScoreCard mode="normal" score={24800} saveState="saved" newRecord={false} mvp={{ pet: maodu, kind: 2 }} review="review.pet.normal" title="title.pet_officer" stats={stats} streak={{ days: 1, today: true, firstToday: true }} />
    ),
    'today standing: alone today': () => (
      <ScoreCard mode="normal" score={24800} saveState="saved" newRecord={false} mvp={{ pet: maodu, kind: 2 }} review="review.pet.normal" title="title.pet_officer" stats={stats} standing={{ rank: 1, score: 24800, leaderScore: 24800, participants: 1 }} />
    ),
    'developer certified (MVP is Maodu / Boluo) · zh/en': () => (
      <ScoreCard mode="normal" score={48200} saveState="saved" newRecord={false} mvp={{ pet: { ...maodu, id: 'pet_644053d683e0', name: 'Maodu 毛肚' }, kind: 1 }} review="review.pet.high_chain" title="title.chain_lead" stats={stats} certified />
    ),
    'owner quiz bonus (+100 included)': () => (
      <ScoreCard mode="normal" score={25800} quizBonus={100} saveState="saved" newRecord mvp={{ pet: maodu, kind: 1 }} review="review.pet.normal" title="title.pet_officer" stats={stats} />
    ),
    saving: () => (
      <ScoreCard mode="normal" score={24800} saveState="saving" newRecord={false} mvp={{ pet: maodu, kind: 2 }} review="review.pet.normal" title="title.pet_officer" stats={stats} />
    ),
    'save failed (retry below)': () => (
      <ScoreCard mode="normal" score={24800} saveState="failed" newRecord={false} mvp={{ pet: maodu, kind: 3 }} review="review.pet.normal" title="title.pet_officer" stats={stats} />
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
    'long review + long English name': () => (
      <ScoreCard
        mode="normal"
        score={24800}
        saveState="saved"
        newRecord={false}
        mvp={{ pet: { ...maodu, name: 'Sir Reginald Fluffington III' }, kind: 1 }}
        review="review.pet.rush_success.3"
        title="title.scheduling_pro"
        stats={stats}
      />
    ),
    'zero service (manager host)': () => (
      <ScoreCard
        mode="normal"
        score={0}
        saveState="saved"
        newRecord={false}
        mvp={null}
        review="review.pet.no_service.4"
        title="title.pet_officer"
        stats={{ tiles: 0, chain: 0, tools: 0 }}
        host={{ name: 'Sanxian', stickerSrc: '/img/pets/pet_4750baaed3f0/512' }}
      />
    ),
    'MVP removed (generic mark)': () => (
      <ScoreCard mode="normal" score={24800} saveState="saved" newRecord={false} mvp={{ pet: maodu, kind: 1 }} mvpRemoved review="review.pet.rush_success" title="title.scheduling_pro" stats={stats} />
    ),
    'fish MVP': () => (
      <ScoreCard
        mode="fish"
        score={1880}
        saveState="saved"
        newRecord
        mvp={{ pet: { id: 'f', name: '天蓝', nameEn: 'Sky Blue', imageBase: '/img/fish/fish_color_blue', emoji: '🐟' }, kind: 0 }}
        review="review.fish.high_chain.5"
        title="title.chain_lead"
        stats={stats}
      />
    ),
  },
};
export default entry;
