import type { PetDetail } from '../../api/types';
import type { GalleryEntry } from '../../dev/gallery/types';
import { PetDetailCard, type PetDetailState } from './PetDetailCard';

const id = 'pet_4750baaed3f0';
const detail: PetDetail = {
  petId: id,
  name: 'Sanxian',
  collected: true,
  own: false,
  owner: { userId: 'U_TEST_BOB', name: 'Bob Bao' },
  quote: '三弦是一只很会撒娇的猫。每天早上准时叫醒全家！最喜欢在键盘上睡觉，开会时经常出镜。也很爱吃冻干。',
  hasPhoto: true,
  listed: true,
  knownBy: {
    count: 23,
    recent: [
      { userId: 'U_TEST_ALICE', name: 'Alice Chen' },
      { userId: 'U_TEST_ZHANG', name: 'Zhang Wei(张伟)' },
      { userId: 'U_TEST_BOB', name: 'Bob Bao' },
      { userId: 'U_TEST_SAM', name: 'Samantha Sullivan' },
      { userId: 'U_TEST_LONG', name: 'Maximilian Alexander Featherstonehaugh' },
    ],
  },
};

const card = (state: PetDetailState, name = 'Sanxian', removable = false, developer = false, petId = id) => (
  <PetDetailCard
    inline
    name={name}
    state={state}
    developer={developer}
    stickerSrc={`/img/pets/${petId}/512`}
    silhouetteSrc={`/img/silhouettes/${petId}/512`}
    photoSrc={state.kind === 'ready' && state.detail.hasPhoto ? `/img/photos/${id}?playerId=U_TEST_BOB` : null}
    ownerAvatarSrc="/img/avatars/U_TEST_BOB"
    colleagueAvatarSrc={(userId) => `/img/avatars/${userId}`}
    onClose={() => {}}
    onRetry={() => {}}
    onOpenShop={() => {}}
    onRequestRemoval={removable ? () => {} : undefined}
  />
);

const entry: GalleryEntry = {
  name: 'PetDetailCard',
  group: 'components',
  states: {
    'collected (tap card to flip)': () => card({ kind: 'ready', detail }),
    'collected · nobody yet': () => card({ kind: 'ready', detail: { ...detail, knownBy: { count: 0, recent: [] } } }),
    'collected · known by 1 (only me)': () =>
      card({ kind: 'ready', detail: { ...detail, knownBy: { count: 1, recent: [{ userId: 'U_TEST_BOB', name: 'Bob Bao' }] } } }),
    'collected · known by 3 (no overflow)': () => card({ kind: 'ready', detail: { ...detail, knownBy: { count: 3, recent: detail.knownBy!.recent.slice(0, 3) } } }),
    'collected, no photo or quote (no flip)': () => card({ kind: 'ready', detail: { ...detail, hasPhoto: false, quote: null } }),
    'own pet · collected (removal link)': () => card({ kind: 'ready', detail: { ...detail, own: true } }, 'Sanxian', true),
    'own pet · not collected (full profile)': () => card({ kind: 'ready', detail: { ...detail, own: true, collected: false } }, 'Sanxian', true),
    'own pet · nobody yet (known-by hidden)': () =>
      card({ kind: 'ready', detail: { ...detail, own: true, collected: false, knownBy: { count: 0, recent: [] } } }, 'Sanxian', true),
    uncollected: () => card({ kind: 'ready', detail: { ...detail, collected: false, owner: null, quote: null, hasPhoto: false, knownBy: null } }),
    'developer egg · Maodu collected (stamp + developer owner line)': () =>
      card({ kind: 'ready', detail: { ...detail, petId: 'pet_644053d683e0', name: 'Maodu 毛肚', owner: { userId: 'U03FPQWGTN2', name: 'Bob 包博' }, quote: '别点我，我在踩键盘写代码。' } }, 'Maodu 毛肚', false, true, 'pet_644053d683e0'),
    'developer egg · Boluo not collected (stamp on silhouette)': () =>
      card({ kind: 'ready', detail: { ...detail, petId: 'pet_2f55c03f6968', name: 'Boluo 菠萝', collected: false, owner: null, quote: null, hasPhoto: false, knownBy: null } }, 'Boluo 菠萝', false, true, 'pet_2f55c03f6968'),
    loading: () => card({ kind: 'loading' }),
    failed: () => card({ kind: 'failed' }),
    unlisted: () => card({ kind: 'unlisted' }),
    'long names': () => card({ kind: 'ready', detail: { ...detail, name: 'Sir Fluffington the Third of Shanghai', owner: { userId: 'U1', name: 'Alexandria Montgomery-Smith' } } }),
  },
};
export default entry;
