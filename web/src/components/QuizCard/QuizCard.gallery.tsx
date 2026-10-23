import type { GalleryEntry } from '../../dev/gallery/types';
import { PLACEHOLDER_PETS } from '../../game/pets';
import { QuizCard } from './QuizCard';

const quiz = {
  quizId: 'q',
  petId: 'mochi',
  petName: 'Mochi',
  options: [
    { userId: 'U1', name: 'Alice Chen' },
    { userId: 'U2', name: 'Zhang Wei(张伟)' },
    { userId: 'U3', name: 'Samantha Sullivan' },
  ],
};
const owner = { userId: 'U2', name: 'Zhang Wei(张伟)' };

const entry: GalleryEntry = {
  name: 'QuizCard',
  group: 'components',
  states: {
    'question (click to answer)': () => (
      <QuizCard quiz={quiz} pet={PLACEHOLDER_PETS[0]} kind={0} onAnswer={async (c) => ({ correct: c === 'U2', skipped: c === null, owner })} />
    ),
    'answer fails → can retry': () => <QuizCard quiz={quiz} pet={PLACEHOLDER_PETS[0]} kind={0} onAnswer={() => Promise.reject(new Error('down'))} />,
  },
};
export default entry;
