import type { GalleryEntry } from '../../dev/gallery/types';
import { Podium } from './Podium';

const e = (rank: number, name: string, score: number) => ({ rank, userId: name, name, score });

const entry: GalleryEntry = {
  name: 'Podium',
  group: 'components',
  states: {
    'three players': () => <Podium entries={[e(1, 'Emma', 4980), e(2, 'Sam Pineda', 4260), e(3, 'Yoo', 3920)]} />,
    'tie for second': () => <Podium entries={[e(1, 'Emma', 4980), e(2, 'Bob', 2480), e(2, 'Luz', 2480)]} />,
    'only one': () => <Podium entries={[e(1, 'Emma', 4980)]} />,
    'long names': () => <Podium entries={[e(1, 'Maximilian Featherstonehaugh', 9999), e(2, 'Zhang Wei(张伟)', 4260), e(3, 'Samantha Sullivan', 3920)]} />,
  },
};
export default entry;
