import { useState } from 'react';
import type { GalleryEntry } from '../../dev/gallery/types';
import { SearchInput } from './SearchInput';

function Demo({ initial, loading = false }: { initial: string; loading?: boolean }) {
  const [v, setV] = useState(initial);
  return <SearchInput value={v} onChange={setV} placeholder="Search your Slack name" clearLabel="Clear" loading={loading} />;
}

const entry: GalleryEntry = {
  name: 'SearchInput',
  group: 'primitives',
  states: {
    empty: () => <Demo initial="" />,
    filled: () => <Demo initial="Bob" />,
    'loading (spinner before the clear button)': () => <Demo initial="Bob" loading />,
    'loading · long query': () => <Demo initial="Maximilian Alexander Featherstonehaugh" loading />,
  },
};

export default entry;
