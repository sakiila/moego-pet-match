import styles from './UnderwaterBackdrop.module.css';

/** 固定的气泡位置（百分比坐标、半径、上浮周期），保证每次渲染一致。 */
const BUBBLES = [
  [6, 82, 5, 9],
  [12, 30, 3, 12],
  [88, 22, 4, 10],
  [93, 64, 6, 14],
  [72, 88, 3, 8],
  [28, 92, 4, 11],
  [52, 12, 2.5, 13],
  [96, 40, 3, 9],
  [3, 52, 2.5, 15],
] as const;

/**
 * 鱼关的深蓝水下背景：光束用渐变、气泡与水草用 SVG，只作装饰，不参与匹配、不拦截触摸。
 * fixed 铺满视口用于页面；inline 只铺满父容器，用于陈列页。减少动态效果时气泡不上浮。
 */
export function UnderwaterBackdrop({ inline = false }: { inline?: boolean }) {
  return (
    <div className={`${styles.water} ${inline ? styles.inline : ''}`} aria-hidden>
      <span className={styles.beams} />
      <svg className={styles.bubbles} viewBox="0 0 100 100" preserveAspectRatio="none">
        {BUBBLES.map(([x, y, r, s], i) => (
          <circle key={i} cx={x} cy={y} r={r / 4} style={{ animationDuration: `${s}s`, animationDelay: `${-i * 1.3}s` }} />
        ))}
      </svg>
      <svg className={styles.floor} viewBox="0 0 390 120" preserveAspectRatio="xMidYMax slice">
        <path className={styles.rock} d="M0 120 L0 96 Q30 78 64 92 Q96 70 130 94 Q170 84 196 100 Q240 76 280 96 Q320 80 352 94 Q372 86 390 92 L390 120 Z" />
        <g className={styles.weed}>
          <path d="M22 100 C14 80 30 66 20 46 C30 62 28 80 34 100 Z" />
          <path d="M40 100 C38 84 48 72 44 58 C52 72 50 88 50 100 Z" />
          <path d="M338 100 C330 78 346 64 336 40 C350 60 346 80 352 100 Z" />
          <path d="M362 100 C360 86 370 76 366 62 C376 76 372 90 374 100 Z" />
        </g>
      </svg>
    </div>
  );
}
