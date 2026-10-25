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
const personalBest = { previous: 2400, current: 25800, isNew: true };
/** 模拟服务端：答对 +100，答错、跳过不加分。 */
const reveal = async (c: string | null) => ({
  correct: c === null ? null : c === 'U2',
  skipped: c === null,
  owner,
  bonus: c === 'U2' ? 100 : 0,
  score: c === 'U2' ? 25800 : 24800,
  personalBest,
});

const entry: GalleryEntry = {
  name: 'QuizCard',
  group: 'components',
  states: {
    'question (click to answer)': () => (
      <QuizCard quiz={quiz} pet={PLACEHOLDER_PETS[0]} kind={0} onAnswer={reveal} />
    ),
    'answer fails → can retry': () => <QuizCard quiz={quiz} pet={PLACEHOLDER_PETS[0]} kind={0} onAnswer={() => Promise.reject(new Error('down'))} />,
    'developer egg: Maodu question (answer to see the extra line)': () => (
      <QuizCard quiz={{ ...quiz, petId: 'pet_644053d683e0', petName: 'Maodu 毛肚', options: [{ userId: 'U1', name: 'Alice Chen' }, { userId: 'U2', name: 'Bob 包博' }, { userId: 'U3', name: 'Samantha Sullivan' }] }} pet={{ ...PLACEHOLDER_PETS[1], name: 'Maodu 毛肚' }} kind={1} developer onAnswer={async (c) => ({ ...(await reveal(c)), owner: { userId: 'U2', name: 'Bob 包博' } })} />
    ),
  },
};
export default entry;
