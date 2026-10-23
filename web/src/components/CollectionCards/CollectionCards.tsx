import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { petImage, type PetInfo } from '../../game/pets';
import { useI18n } from '../../i18n';
import { Tilt } from '../Tilt/Tilt';
import styles from './CollectionCards.module.css';

/** 本局新收集：只在服务端保存成功后点亮；按独立宠物逐只展开，不把服务格数说成宠物数。点击打开同一套图鉴详情。 */
export function CollectionCards({ pets, onSelect }: { pets: { pet: PetInfo; kind: number }[]; onSelect?: (pet: PetInfo, el: HTMLElement) => void }) {
  const { t } = useI18n();
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
  }, [nudge, pets.length]);
  if (pets.length === 0) return null;
  return (
    <section className={styles.box} data-testid="new-collection">
      <h3 className={styles.title}>
        {t('report.new_collection')}
        <span className={styles.count}>{pets.length}</span>
      </h3>
      <div className={styles.grid} ref={gridRef}>
        {pets.map(({ pet, kind }, i) => (
          // 倾斜放在外层格子上，不与卡片自己的点亮动画冲突
          <TiltCell key={pet.id} enabled={!!onSelect} nudge={nudge} index={i}>
            <button
              type="button"
              className={styles.card}
              disabled={!onSelect}
              onClick={(e) => onSelect?.(pet, e.currentTarget)}
              style={{ '--tint': `var(--pet-tint-${kind % 6})`, animationDelay: `${i * 80}ms` } as CSSProperties}
            >
              {petImage(pet, 512) ? <img src={petImage(pet, 512)!} alt="" /> : <span className={styles.emoji}>{pet.emoji}</span>}
              <span className={styles.name}>{pet.name}</span>
            </button>
          </TiltCell>
        ))}
      </div>
    </section>
  );
}

/** 可点时包一层倾斜；不可点（无 onSelect）时只是普通格子。 */
function TiltCell({ enabled, nudge, index, children }: { enabled: boolean; nudge: boolean; index: number; children: ReactNode }) {
  return enabled ? (
    <Tilt radius="var(--radius-lg)" nudge={nudge} index={index}>
      {children}
    </Tilt>
  ) : (
    <div>{children}</div>
  );
}
