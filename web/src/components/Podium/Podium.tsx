import { useState } from 'react';
import type { AchievementId, LeaderboardEntry } from '../../api/types';
import { useI18n } from '../../i18n';
import catSrc from '../../ui/art/hall-cat.webp';
import crownSrc from '../../ui/art/hall-crown.webp';
import dogSrc from '../../ui/art/hall-dog-v2.webp';
import laurelLeftSrc from '../../ui/art/hall-laurel-left.webp';
import laurelRightSrc from '../../ui/art/hall-laurel-right.webp';
import { AchievementAvatar } from '../AchievementAvatar/AchievementAvatar';
import { Sheet } from '../../ui/primitives/Sheet';
import styles from './Podium.module.css';
import { AchievementBadge, achievementName } from '../AchievementBadge/AchievementBadge';
import { conditionRevealed } from '../../game/achievementRules';

/** 台阶高度按位置（2 · 1 · 3）：中间最高、左侧次之、右侧最矮；颜色按真实名次（并列时两个第 2 名都是银色）。 */
const STEP = [styles.left, styles.center, styles.right];
const METAL: Record<number, string> = { 1: styles.gold, 2: styles.silver, 3: styles.bronze };

/**
 * 毛孩子光荣榜领奖台（参考 design/references/hall-of-fame-reference.webp）：
 * 头像坐在台阶上沿，第 1 名戴端正带白边的小皇冠（hall-of-fame-crown-v2）、名字两侧麦穗；台阶正面写名字、分数与大号名次。
 * 两侧品牌蓝猫与黑白狗扶着台阶打招呼（轻微摇摆，减少动态效果时静止）。
 */
export function Podium({ entries, onPlayerSelect, viewerTitles = [] }: { entries: LeaderboardEntry[]; onPlayerSelect?: (entry: LeaderboardEntry) => void; viewerTitles?: readonly AchievementId[] }) {
  const { t, locale } = useI18n();
  const [titlePreview, setTitlePreview] = useState<{ playerName: string; id: AchievementId } | null>(null);
  const top = entries.slice(0, 3);
  if (top.length === 0) return null;
  const order = [top[1], top[0], top[2]];
  return (
    <>
    <div className={styles.podium} data-testid="leaderboard-podium">
      {/* 宠物扶着两侧台阶：左侧台阶（第 2 位）有人才放蓝猫，右侧台阶（第 3 位）有人才放黑白狗，不悬空 */}
      {top.length >= 2 && <img className={`${styles.pet} ${styles.cat}`} src={catSrc} alt="" aria-hidden draggable={false} />}
      {top.length >= 3 && <img className={`${styles.pet} ${styles.dog}`} src={dogSrc} alt="" aria-hidden draggable={false} />}
      {order.map((e, i) =>
        e ? (
          <div key={e.userId} className={`${styles.place} ${STEP[i]} ${METAL[e.rank] ?? styles.bronze}`}>
            {e.rank === 1 && <img className={styles.crown} src={crownSrc} alt="" aria-hidden draggable={false} />}
            {e.rank === 1 && <Sparkles />}
            <span className={styles.avatar}>
              <AchievementAvatar name={e.name} seed={e.userId} src={`/img/avatars/${encodeURIComponent(e.userId)}`} equippedTitle={e.equippedTitle}
                revealed={!e.equippedTitle || conditionRevealed(e.equippedTitle, viewerTitles)}
                onTitleClick={!onPlayerSelect && e.equippedTitle ? () => e.equippedTitle && setTitlePreview({ playerName: e.name, id: e.equippedTitle }) : undefined} />
            </span>
            <div className={styles.step}>
              <span className={styles.nameRow}>
                {e.rank === 1 && <img className={styles.laurel} src={laurelLeftSrc} alt="" aria-hidden />}
                <span className={styles.name} title={e.name}>
                  {e.name}
                </span>
                {e.rank === 1 && <img className={styles.laurel} src={laurelRightSrc} alt="" aria-hidden />}
              </span>
              <span className={styles.score}>{t('leaderboard.points', { score: e.score.toLocaleString(locale === 'zh' ? 'zh-CN' : 'en-US') })}</span>
              <span className={styles.rank} aria-label={`#${e.rank}`}>
                {e.rank}
              </span>
            </div>
            {onPlayerSelect && <button type="button" className={styles.profileTrigger} onClick={() => onPlayerSelect(e)} aria-label={t('profile.open', {playerName:e.name})} />}
          </div>
        ) : (
          <div key={`empty-${i}`} />
        ),
      )}
    </div>
    {titlePreview && (
      <Sheet open label={t('achievement.worn_by', { playerName: titlePreview.playerName })} closeLabel={t('action.close')} onClose={() => setTitlePreview(null)}
        badge={<h2 className={styles.previewHeading}>{t('achievement.worn_by', { playerName: titlePreview.playerName })}</h2>}>
        <div className={styles.titlePreview}>
          <AchievementBadge id={titlePreview.id} large revealed={conditionRevealed(titlePreview.id, viewerTitles)} />
          <strong>{t(achievementName(titlePreview.id, conditionRevealed(titlePreview.id, viewerTitles)))}</strong>
          <span>{t('achievement.wearing')}</span>
        </div>
      </Sheet>
    )}
    </>
  );
}

/** 第 1 名头像旁的点缀：左侧两笔橙色短线，右侧一大一小两颗四角星，交替闪烁。 */
function Sparkles() {
  const star = 'M12 0 C13 8 16 11 24 12 C16 13 13 16 12 24 C11 16 8 13 0 12 C8 11 11 8 12 0 Z';
  return (
    <span className={styles.sparkles} aria-hidden>
      <span className={styles.dashes} />
      <svg className={`${styles.star} ${styles.starBig}`} viewBox="0 0 24 24">
        <path d={star} />
      </svg>
      <svg className={`${styles.star} ${styles.starSmall}`} viewBox="0 0 24 24">
        <path d={star} />
      </svg>
    </span>
  );
}
