import type { GalleryEntry } from '../dev/gallery/types';
import { InfoScreen } from './InfoScreen';

const noop = () => {};
const player = { userId: 'U03FPQWGTN2', name: 'Bob 包博' };

const entry: GalleryEntry = {
  name: 'InfoScreen',
  group: 'screens',
  states: {
    'with player': () => <InfoScreen player={player} onBack={noop} loadRequests={async () => []} />,
    'with requests (pending / processed)': () => (
      <InfoScreen
        player={player}
        onBack={noop}
        loadRequests={async () => [
          { requestId: 'a', petId: 'pet_644053d683e0', petName: 'Maodu', status: 'pending', createdAt: '2026-10-23T06:00:00Z' },
          { requestId: 'b', petId: null, petName: null, status: 'processed', createdAt: '2026-10-20T06:00:00Z' },
        ]}
      />
    ),
    'no player (identity page, removal disabled)': () => <InfoScreen player={null} onBack={noop} loadRequests={async () => []} />,
  },
};
export default entry;
