import type { GalleryEntry } from '../../dev/gallery/types';
import { AvatarStack } from './AvatarStack';

const people = [
  { name: 'Bob', seed: 'U_TEST_BOB', src: '/img/avatars/U_TEST_BOB' },
  { name: 'Alice Chen', seed: 'U_TEST_ALICE' },
  { name: 'Zhang Wei(张伟)', seed: 'U_TEST_ZHANG' },
  { name: 'Samantha Sullivan', seed: 'U_TEST_SAM' },
  { name: 'Maximilian Alexander Featherstonehaugh', seed: 'U_TEST_LONG' },
];

const entry: GalleryEntry = {
  name: 'AvatarStack',
  group: 'primitives',
  states: {
    one: () => <AvatarStack people={people.slice(0, 1)} total={1} />,
    'five, no overflow': () => <AvatarStack people={people} total={5} />,
    'overflow +18': () => <AvatarStack people={people} total={23} />,
    'overflow +128 (long count)': () => <AvatarStack people={people} total={133} />,
    'image failed → initials': () => <AvatarStack people={[{ name: 'Bob', seed: 'U1', src: '/img/avatars/does-not-exist' }, ...people.slice(1, 3)]} total={3} />,
  },
};

export default entry;
