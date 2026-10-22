import { Avatar } from '../../ui/primitives/Avatar';
import styles from './ColleagueCard.module.css';

export interface ColleagueCardProps {
  userId: string;
  name: string;
  selected: boolean;
  onSelect: () => void;
}

/** 搜索结果中的同事：头像 + 完整名字（长名换行，不截断）；选中只表示卡片选中，不代表已验证本人。 */
export function ColleagueCard({ userId, name, selected, onSelect }: ColleagueCardProps) {
  return (
    <button type="button" className={styles.card} aria-pressed={selected} onClick={onSelect} data-user-id={userId}>
      <Avatar name={name} seed={userId} src={`/img/avatars/${encodeURIComponent(userId)}`} size={44} />
      <span className={styles.name}>{name}</span>
      {selected && (
        <span className={styles.check} aria-hidden>
          ✓
        </span>
      )}
    </button>
  );
}
