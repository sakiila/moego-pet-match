import { useState } from 'react';
import type { GalleryEntry } from '../../dev/gallery/types';
import { SoundTip } from './SoundTip';

function Preview() {
  const [open, setOpen] = useState(true);
  return open ? <SoundTip onClose={() => setOpen(false)} /> : null;
}

const entry: GalleryEntry = {
  name: 'SoundTip',
  group: 'components',
  states: {
    'first visit · close to dismiss · zh / en': () => <Preview />,
    dismissed: () => null,
  },
};

export default entry;
