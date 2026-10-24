import type { GalleryEntry } from '../../dev/gallery/types';
import { useI18n } from '../../i18n';
import { EmptyState } from './EmptyState';

function ZeroCollected() {
  return <EmptyState icon="empty-collection" layout="row" text={useI18n().t('collection.empty')} />;
}

function SearchEmpty() {
  return <EmptyState icon="empty-search" text={useI18n().t('collection.search_empty')} />;
}

const entry: GalleryEntry = {
  name: 'EmptyState',
  group: 'components',
  states: {
    'zero collected (row)': () => <ZeroCollected />,
    'search empty (stack)': () => <SearchEmpty />,
    'long text': () => <EmptyState icon="empty-search" text="No matches in this view. Try a pet's name or a different filter, or check the spelling of the owner's name." />,
  },
};

export default entry;
