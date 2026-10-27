import type { GalleryEntry } from '../../dev/gallery/types';
import { Podium } from './Podium';

const e = (rank: number, name: string, score: number) => ({ rank, userId: name, name, score });

const entry: GalleryEntry = {
  name: 'Podium',
  group: 'components',
  states: {
    'equipped titles': () => <Podium entries={[{...e(1,'Alexandria Montgomery',9999),equippedTitle:'species'},{...e(2,'Bob',9000),equippedTitle:'cats'},{...e(3,'Sam',8999),equippedTitle:'dogs'}]} />,
    'titles · long names + six digits': () => <Podium entries={[{...e(1,'Alexandria Catherine Montgomery-Wellington',1234567),equippedTitle:'neighbors'},{...e(2,'Maximilian Alexander Featherstonehaugh',999999),equippedTitle:'species'},{...e(3,'Samantha Sullivan',123456),equippedTitle:'album'}]} />,
    'three players': () => <Podium entries={[e(1, 'Emma', 4980), e(2, 'Sam Pineda', 4260), e(3, 'Yoo', 3920)]} />,
    'tie for second': () => <Podium entries={[e(1, 'Emma', 4980), e(2, 'Bob', 2480), e(2, 'Luz', 2480)]} />,
    'two players (no dog)': () => <Podium entries={[e(1, 'Bob', 12790), e(2, 'Bob 包博', 90)]} />,
    'only one': () => <Podium entries={[e(1, 'Emma', 4980)]} />,
    'tie for first': () => <Podium entries={[e(1, 'Emma', 4980), e(1, 'Mia', 4980), e(3, 'Yoo', 3920)]} />,
    'six-digit scores': () => <Podium entries={[e(1, 'Mia', 123456), e(2, 'Alex', 98765), e(3, 'Sam', 87654)]} />,
    'first + last names': () => <Podium entries={[e(1, 'Vicky Ren', 9999), e(2, 'Kevin Zhang', 4260), e(3, 'Annie Liu', 3920)]} />,
    'long names': () => <Podium entries={[e(1, 'Maximilian Featherstonehaugh', 9999), e(2, 'Zhang Wei(张伟)', 4260), e(3, 'Samantha Sullivan', 3920)]} />,
  },
};
export default entry;
