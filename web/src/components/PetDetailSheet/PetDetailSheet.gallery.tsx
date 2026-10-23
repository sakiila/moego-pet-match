import type { PetDetail } from '../../api/types';
import type { GalleryEntry } from '../../dev/gallery/types';
import { PetDetailSheet, type PetDetailState } from './PetDetailSheet';

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
};

const sheet = (state: PetDetailState, name = 'Sanxian', removable = false) => (
  <PetDetailSheet
    open
    inline
    name={name}
    state={state}
    stickerSrc={`/img/pets/${id}/512`}
    silhouetteSrc={`/img/silhouettes/${id}/512`}
    photoSrc={state.kind === 'ready' && state.detail.hasPhoto ? `/img/photos/${id}?playerId=U_TEST_BOB` : null}
    ownerAvatarSrc="/img/avatars/U_TEST_BOB"
    onClose={() => {}}
    onRetry={() => {}}
    onOpenShop={() => {}}
    onRequestRemoval={removable ? () => {} : undefined}
  />
);

const entry: GalleryEntry = {
  name: 'PetDetailSheet',
  group: 'components',
  states: {
    collected: () => sheet({ kind: 'ready', detail }),
    'collected, no photo or quote (no flip)': () => sheet({ kind: 'ready', detail: { ...detail, hasPhoto: false, quote: null } }),
    'own pet · collected (removal link)': () => sheet({ kind: 'ready', detail: { ...detail, own: true } }, 'Sanxian', true),
    'own pet · not collected (full profile)': () => sheet({ kind: 'ready', detail: { ...detail, own: true, collected: false } }, 'Sanxian', true),
    uncollected: () => sheet({ kind: 'ready', detail: { ...detail, collected: false, owner: null, quote: null, hasPhoto: false } }),
    loading: () => sheet({ kind: 'loading' }),
    failed: () => sheet({ kind: 'failed' }),
    unlisted: () => sheet({ kind: 'unlisted' }),
    'long names': () => sheet({ kind: 'ready', detail: { ...detail, name: 'Sir Fluffington the Third of Shanghai', owner: { userId: 'U1', name: 'Alexandria Montgomery-Smith' } } }),
  },
};
export default entry;
