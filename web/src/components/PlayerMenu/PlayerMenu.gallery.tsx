import type { GalleryEntry } from '../../dev/gallery/types';
import { avatarUrl } from '../../game/pets';
import { BrandHeader } from '../BrandHeader/BrandHeader';
import { PlayerMenu } from './PlayerMenu';

const noop = () => {};

const entry: GalleryEntry = {
  name: 'PlayerMenu',
  group: 'components',
  states: {
    'menu icons · titles and clock out': () => <BrandHeader title="game" trailing={<PlayerMenu name="Bob" userId="U_TEST_BOB" onClockOut={noop} onTitles={noop} defaultOpen />} />,
    'with my posts': () => <BrandHeader title="game" trailing={<PlayerMenu name="Bob" userId="U_TEST_BOB" onClockOut={noop} onTitles={noop} actions={[{ icon: 'paw-print', label: '我的动态', onClick: noop }]} defaultOpen />} />,
    'legendary · C size': () => <BrandHeader title="game" trailing={<PlayerMenu name="Bob" userId="U_TEST_BOB" onClockOut={noop} equippedTitle="album" onTitles={noop} />} />,
    'equipped title': () => <BrandHeader title="game" trailing={<PlayerMenu name="Alexandria Catherine Montgomery-Wellington" userId="U_LONG" onClockOut={noop} equippedTitle="species" onTitles={noop} />} />,
    default: () => <BrandHeader title="game" trailing={<PlayerMenu name="Bob" userId="U_TEST_BOB" avatarSrc={avatarUrl('U_TEST_BOB')} onClockOut={noop} />} />,
    'open with titles': () => <BrandHeader title="game" trailing={<PlayerMenu name="Bob" userId="U_TEST_BOB" onClockOut={noop} equippedTitle="cats" onTitles={noop} defaultOpen />} />,
    open: () => <BrandHeader title="game" trailing={<PlayerMenu name="Bob" userId="U_TEST_BOB" onClockOut={noop} defaultOpen />} />,
    'missing avatar': () => <BrandHeader title="game" trailing={<PlayerMenu name="Bob" userId="U_TEST_BOB" onClockOut={noop} />} />,
    'long English name': () => <BrandHeader title="game" trailing={<PlayerMenu name="Alexandria Catherine Montgomery-Wellington" userId="U_LONG" onClockOut={noop} defaultOpen />} />,
  },
};

export default entry;
