import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import type { AchievementId } from '../../api/types';
import { ACHIEVEMENT_DISPLAY_ORDER } from '../../game/achievementRarity';
import { petImage, type PetInfo } from '../../game/pets';
import { useI18n } from '../../i18n';
import { AchievementBadge, achievementName } from '../AchievementBadge/AchievementBadge';
import { Tilt } from '../Tilt/Tilt';
import styles from './ReportHarvest.module.css';

export interface ReportHarvestProps {
  /** 本局新收集的宠物（按独立宠物逐只）。 */
  pets: { pet: PetInfo; kind: number }[];
  /** 本局首次授予的称号。 */
  achievements?: AchievementId[];
  onSelectPet?: (pet: PetInfo, el: HTMLElement) => void;
  /** 点新称号卡打开「我的称号」（在那里佩戴）。 */
  onOpenTitles?: () => void;
}

/**
 * 本局收获（mobile-report-slim-v1）：新收集的宠物卡与新解锁的称号卡放同一排横向滑动（整卡吸附），
 * 只在服务端保存成功后点亮；一个都没有时整块不出现。按独立宠物逐只展开，不把服务格数说成宠物数。
 */
export function ReportHarvest({ pets, achievements = [], onSelectPet, onOpenTitles }: ReportHarvestProps) {
  const { t } = useI18n();
  const badges = ACHIEVEMENT_DISPLAY_ORDER.filter((id) => achievements.includes(id));
  const total = pets.length + badges.length;
  // 触摸设备没有悬停：卡片第一次滚动进入屏幕时依次倾斜扫一次，提示它们可以点
  const gridRef = useRef<HTMLDivElement>(null);
  const [nudge, setNudge] = useState(false);
  useEffect(() => {
    const el = gridRef.current;
    if (!el || nudge || !window.matchMedia('(hover: none)').matches || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setNudge(true);
          io.disconnect();
        }
      },
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [nudge, total]);
  if (total === 0) return null;
  return (
    <section className={styles.box} data-testid="report-harvest">
      <h3 className={styles.title}>
        {t('report.harvest')}
        <span className={styles.count}>{total}</span>
      </h3>
      <div className={styles.row} ref={gridRef} data-count={total}>
        {pets.map(({ pet, kind }, i) => (
          // 倾斜放在外层格子上，不与卡片自己的点亮动画冲突
          <TiltCell key={pet.id} enabled={!!onSelectPet} nudge={nudge} index={i}>
            <button
              type="button"
              className={styles.card}
              data-collected="true"
              disabled={!onSelectPet}
              onClick={(e) => onSelectPet?.(pet, e.currentTarget)}
              style={{ '--tint': `var(--pet-tint-${kind % 6})`, animationDelay: `${i * 80}ms` } as CSSProperties}
            >
              {petImage(pet, 512) ? <img src={petImage(pet, 512)!} alt="" /> : <span className={styles.emoji}>{pet.emoji}</span>}
              <span className={styles.name}>{pet.name}</span>
            </button>
          </TiltCell>
        ))}
        {badges.map((id, i) => (
          <TiltCell key={id} enabled={!!onOpenTitles} nudge={nudge} index={pets.length + i}>
            <button
              type="button"
              className={`${styles.card} ${styles.badge}`}
              disabled={!onOpenTitles}
              onClick={onOpenTitles}
              style={{ animationDelay: `${(pets.length + i) * 80}ms` }}
              data-testid="harvest-badge"
            >
              <span className={styles.tag}>{t('report.new_title_tag')}</span>
              <AchievementBadge id={id} large />
              <span className={styles.name}>{t(achievementName(id))}</span>
            </button>
          </TiltCell>
        ))}
      </div>
    </section>
  );
}

/** 可点时包一层倾斜；不可点时只是普通格子。 */
function TiltCell({ enabled, nudge, index, children }: { enabled: boolean; nudge: boolean; index: number; children: ReactNode }) {
  return enabled ? (
    <Tilt radius="var(--radius-lg)" nudge={nudge} index={index}>
      {children}
    </Tilt>
  ) : (
    <div>{children}</div>
  );
}
