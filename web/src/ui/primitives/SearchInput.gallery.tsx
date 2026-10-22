import { useState } from 'react';
import type { GalleryEntry } from '../../dev/gallery/types';
import { SearchInput } from './SearchInput';

function Demo({ initial }: { initial: string }) {
  const [v, setV] = useState(initial);
  return <SearchInput value={v} onChange={setV} placeholder="Search your Slack name" clearLabel="Clear" />;
}

const entry: GalleryEntry = {
  name: 'SearchInput',
  group: 'primitives',
  states: { empty: () => <Demo initial="" />, filled: () => <Demo initial="Bob" /> },
};

export default entry;
