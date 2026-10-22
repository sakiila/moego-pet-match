import type { GalleryEntry } from '../../dev/gallery/types';
import { Avatar } from './Avatar';

const entry: GalleryEntry = {
  name: 'Avatar',
  group: 'primitives',
  states: {
    'initials fallback': () => (
      <div style={{ display: 'flex', gap: 8 }}>
        <Avatar name="Bob" seed="U1" />
        <Avatar name="Alice Chen" seed="U2" />
        <Avatar name="张伟" seed="U3" />
        <Avatar name="samantha" seed="U4" />
      </div>
    ),
    'image failed → fallback': () => <Avatar name="Bob" src="/img/avatars/does-not-exist" />,
    sizes: () => (
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <Avatar name="Bob" size={28} />
        <Avatar name="Bob" size={48} />
        <Avatar name="Bob" size={72} />
      </div>
    ),
  },
};

export default entry;
