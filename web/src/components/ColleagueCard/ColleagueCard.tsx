import { Avatar } from '../../ui/primitives/Avatar';
import { Icon } from '../../ui/primitives/Icon';
import blueCatSrc from '../../ui/art/blue-cat.webp';
import styles from './ColleagueCard.module.css';

export interface ColleagueCardProps {
  userId: string;
  name: string;
  selected: boolean;
  onSelect: () => void;
}

/**
 * 搜索结果中的同事：头像 + 完整名字（长名换行，不截断）；选中只表示卡片选中，不代表已验证本人。
 * 选中时右上方的品牌蓝猫从卡片后面探出头、爪尖搭在边框上（mobile-identity-v2），系统减少动态效果时直接出现。
 */
export function ColleagueCard({ userId, name, selected, onSelect }: ColleagueCardProps) {
  return (
    <div className={styles.wrap}>
      {selected && (
        <>
          <span className={styles.peek} aria-hidden>
            <img className={styles.cat} src={blueCatSrc} alt="" width={108} height={56} draggable={false} />
          </span>
          <span className={styles.paws} aria-hidden>
            <img className={styles.cat} src={blueCatSrc} alt="" width={108} height={56} draggable={false} />
          </span>
        </>
      )}
      <button type="button" className={styles.card} aria-pressed={selected} onClick={onSelect} data-user-id={userId}>
        <Avatar name={name} seed={userId} src={`/img/avatars/${encodeURIComponent(userId)}`} size={56} />
        <span className={styles.name}>{name}</span>
        {selected && <Icon name="selected-check" size={32} />}
      </button>
    </div>
  );
}
