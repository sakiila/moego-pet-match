import { useRef, type CSSProperties, type PointerEvent, type ReactNode } from 'react';

/** 最大倾斜角（度）。 */
const MAX_TILT = 12;

export interface TiltProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** 高光与外圈圆角，跟随被包裹卡片的圆角。 */
  radius?: string;
  /** 触摸设备：进入屏幕时按 index 错开自动倾斜扫一次（由外部控制何时置 true）。 */
  nudge?: boolean;
  index?: number;
}

const reducedMotion = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * 卡片随指针倾斜（Apple TV 风格）：卡片按指针位置 3D 倾斜，高光跟着指针走，
 * 内部图片反向微移形成景深。鼠标悬停即倾斜；触摸按下时倾向按压点，松手回正。
 * 不改变布局与点击行为；系统开启「减少动态效果」时不倾斜。样式见 ui/global.css 的 .tilt。
 */
export function Tilt({ children, className, style, radius, nudge, index = 0 }: TiltProps) {
  const ref = useRef<HTMLDivElement>(null);

  const follow = (e: PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el || reducedMotion()) return;
    // 触摸 / 笔只在按下时跟随，避免手指滑动滚动页面时卡片乱晃
    if (e.pointerType !== 'mouse' && e.buttons === 0) return;
    const box = el.getBoundingClientRect();
    const x = Math.min(1, Math.max(0, (e.clientX - box.left) / box.width));
    const y = Math.min(1, Math.max(0, (e.clientY - box.top) / box.height));
    const nx = x * 2 - 1;
    const ny = y * 2 - 1;
    el.style.setProperty('--ry', `${nx * MAX_TILT}deg`);
    el.style.setProperty('--rx', `${-ny * MAX_TILT}deg`);
    el.style.setProperty('--gx', `${x * 100}%`);
    el.style.setProperty('--gy', `${y * 100}%`);
    el.style.setProperty('--px', String(nx));
    el.style.setProperty('--py', String(ny));
    el.dataset.pointer = e.pointerType === 'mouse' ? 'mouse' : 'touch';
    el.dataset.active = '';
  };

  const reset = () => {
    const el = ref.current;
    if (!el) return;
    delete el.dataset.active;
    for (const v of ['--rx', '--ry', '--px', '--py']) el.style.removeProperty(v);
  };

  return (
    <div
      ref={ref}
      className={`tilt${className ? ` ${className}` : ''}`}
      data-nudge={nudge ? '' : undefined}
      style={{ ...(radius ? { '--tilt-radius': radius } : null), '--nudge-i': index, ...style } as CSSProperties}
      onPointerEnter={follow}
      onPointerMove={follow}
      onPointerDown={follow}
      onPointerUp={reset}
      onPointerCancel={reset}
      onPointerLeave={reset}
    >
      {children}
    </div>
  );
}
