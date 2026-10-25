import { useState } from 'react';
import type { QuizQuestion, QuizResult } from '../../api/types';
import type { PetInfo } from '../../game/pets';
import { useI18n } from '../../i18n';
import { Avatar } from '../../ui/primitives/Avatar';
import { PetTile } from '../PetTile/PetTile';
import styles from './QuizCard.module.css';

export interface QuizCardProps {
  quiz: QuizQuestion;
  pet: PetInfo;
  kind: number;
  /** 作答（choice 为 null 表示跳过）；返回揭晓结果。 */
  onAnswer: (choice: string | null) => Promise<QuizResult>;
  /** 开发者彩蛋：题目是毛肚或菠萝时，揭晓后多一句点明「家长就是写这个游戏的人」（game/easterEggs）。 */
  developer?: boolean;
}

/** 猜主人：可跳过；作答后在原卡片揭晓真实主人与头像。答对总分加分，答错不责备、不扣分。 */
export function QuizCard({ quiz, pet, kind, onAnswer, developer = false }: QuizCardProps) {
  const { t } = useI18n();
  const [picked, setPicked] = useState<string | null>(null);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [busy, setBusy] = useState(false);

  const answer = async (choice: string | null) => {
    if (busy || result) return;
    setBusy(true);
    setPicked(choice);
    try {
      setResult(await onAnswer(choice));
    } catch {
      setPicked(null);
    } finally {
      setBusy(false);
    }
  };

  if (result?.skipped) return null;
  return (
    <section className={styles.card} data-testid="quiz">
      <div className={styles.head}>
        <span className={styles.pet}>
          <PetTile pet={pet} tint={kind} size={64} />
        </span>
        <p className={styles.question}>{t('quiz.question', { petName: quiz.petName })}</p>
      </div>
      <div className={styles.options}>
        {quiz.options.map((o) => {
          const state = !result ? undefined : o.userId === result.owner.userId ? 'owner' : o.userId === picked ? 'wrong' : undefined;
          return (
            <button key={o.userId} type="button" className={styles.option} disabled={!!result || busy} data-result={state} onClick={() => answer(o.userId)}>
              <Avatar name={o.name} seed={o.userId} src={`/img/avatars/${encodeURIComponent(o.userId)}`} size={36} />
              {o.name}
            </button>
          );
        })}
      </div>
      {result ? (
        <p className={styles.reveal} role="status">
          {result.correct ? t('quiz.correct', { points: result.bonus }) : t('quiz.incorrect', { ownerName: result.owner.name })}
          {developer && (
            <span className={styles.aside} data-testid="quiz-developer">
              {t(result.correct ? 'quiz.developer_correct' : 'quiz.developer_incorrect')}
            </span>
          )}
        </p>
      ) : (
        <button type="button" className={styles.skip} onClick={() => answer(null)} disabled={busy}>
          {t('quiz.skip')}
        </button>
      )}
    </section>
  );
}
