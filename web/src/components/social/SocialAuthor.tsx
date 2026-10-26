import type { ReactNode } from 'react';
import { useI18n } from '../../i18n';
import type { SocialPerson } from '../../social/model';
import { AchievementAvatar } from '../AchievementAvatar/AchievementAvatar';
import styles from './Social.module.css';

/** 头像与名字；传 onOpen 时整块可点，打开玩家卡片。 */
export function SocialAuthor({
  person,
  onOpen,
  children,
}: {
  person: SocialPerson;
  onOpen?: (person: SocialPerson) => void;
  children?: ReactNode;
}) {
  const { t } = useI18n();
  const content = (
    <>
      <AchievementAvatar name={person.name} src={person.avatarSrc} seed={person.id} equippedTitle={person.title} />
      <span className={styles.authorText}>
        <strong className={styles.name}>{person.name}</strong>
        {children}
      </span>
    </>
  );
  return onOpen ? (
    <button
      type="button"
      className={styles.authorButton}
      aria-label={t('social.open_profile', { name: person.name })}
      onClick={() => onOpen(person)}
    >
      {content}
    </button>
  ) : (
    <span className={styles.authorButton}>{content}</span>
  );
}
