import type { GalleryEntry } from '../../dev/gallery/types';
import { Tilt } from './Tilt';

const card = (label: string) => (
  <Tilt radius="var(--radius-lg)">
    <div style={{ display: 'grid', placeItems: 'center', gap: 4, width: 160, height: 190, padding: 12, borderRadius: 'var(--radius-lg)', background: 'var(--pet-tint-0)' }}>
      <img src="/img/pets/pet_644053d683e0/512" alt="" style={{ width: '80%' }} />
      <strong>{label}</strong>
    </div>
  </Tilt>
);

const entry: GalleryEntry = {
  name: 'Tilt',
  group: 'components',
  states: {
    '鼠标悬停倾斜 + 高光 + 景深': () => card('Maodu'),
    '触摸：按下倾向按压点，松手回正': () => card('Boluo'),
  },
};

export default entry;
