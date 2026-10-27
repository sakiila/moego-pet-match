import type { GalleryEntry } from '../../dev/gallery/types';
import { PREVIEW_PREP_PETS } from '../../dev/prepPets';
import { stickerUrl } from '../../game/pets';
import { SeasonalSurface, SeasonalThemeProvider } from '../SeasonalTheme/SeasonalTheme';
import { SocialEntry } from './SocialEntry';

const faces = [PREVIEW_PREP_PETS[0], PREVIEW_PREP_PETS[1]].map(pet => stickerUrl(pet.id, 128));
const preview = (active: boolean, images = faces) => <SeasonalThemeProvider active={active}>
  <SeasonalSurface as="div" surface="home" style={{ padding: 'var(--space-4)' }}>
    <SocialEntry faces={images} onOpen={() => {}} />
  </SeasonalSurface>
</SeasonalThemeProvider>;

export default {
  name: 'SocialEntry',
  group: 'components',
  states: {
    default: () => <SocialEntry onOpen={() => {}} />,
    'Halloween pets': () => preview(true),
    'image unavailable': () => preview(true, ['/missing-pet-a', '/missing-pet-b']),
  },
} satisfies GalleryEntry;
