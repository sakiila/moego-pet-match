import { useRef, type ReactNode } from 'react';
import { AnimatePresence, LazyMotion, domAnimation, m, useReducedMotion } from 'motion/react';
import { MOTION } from '../../ui/motion';

/** 页面层级：更深为前进（右滑入），更浅为返回（左滑入），同级按前进处理。 */
const DEPTH: Record<string, number> = {
  boot: 0,
  bootFailed: 0,
  identity: 0,
  home: 1,
  petdex: 2,
  leaderboard: 2,
  myPets: 2,
  info: 2,
  upload: 2,
  prep: 2,
  board: 2,
  report: 2,
};

interface Custom {
  dir: 1 | -1;
  /** 进入棋盘页时不横移：棋盘位置必须从第一帧就稳定，玩家随时可能开始拖动。 */
  enterSlide: boolean;
  exitSlide: boolean;
  reduced: boolean;
}

const variants = {
  initial: (c: Custom) => ({ opacity: 0, x: c.reduced || !c.enterSlide ? 0 : c.dir * MOTION.slidePx }),
  enter: (c: Custom) => ({ opacity: 1, x: 0, transition: { duration: c.reduced ? 0.01 : MOTION.pageEnterS, ease: MOTION.easeOut } }),
  // 退出中的页面不再接收点击，避免连点触发两次跳转
  exit: (c: Custom) => ({
    opacity: 0,
    x: c.reduced || !c.exitSlide ? 0 : -c.dir * (MOTION.slidePx / 2),
    pointerEvents: 'none' as const,
    transition: { duration: c.reduced ? 0.01 : MOTION.pageExitS, ease: 'easeIn' as const },
  }),
};

export interface ScreenTransitionProps {
  /** 路由名；名字变化才触发过渡（同一路由内的重绘不动画）。 */
  routeName: string;
  children: ReactNode;
}

/** 页面切换：旧页淡出 → 新页淡入并按前进 / 返回方向滑入。遵守系统「减少动态效果」。 */
export function ScreenTransition({ routeName, children }: ScreenTransitionProps) {
  const reduced = useReducedMotion() ?? false;
  const last = useRef(routeName);
  const dir = useRef<1 | -1>(1);
  const custom = useRef<Custom>({ dir: 1, enterSlide: true, exitSlide: true, reduced });
  if (last.current !== routeName) {
    dir.current = (DEPTH[routeName] ?? 1) < (DEPTH[last.current] ?? 1) ? -1 : 1;
    custom.current = { dir: dir.current, enterSlide: routeName !== 'board', exitSlide: last.current !== 'board', reduced };
    last.current = routeName;
  } else {
    custom.current = { ...custom.current, reduced };
  }
  return (
    <LazyMotion features={domAnimation} strict>
      <AnimatePresence mode="wait" initial={false} custom={custom.current}>
        <m.div key={routeName} custom={custom.current} variants={variants} initial="initial" animate="enter" exit="exit">
          {children}
        </m.div>
      </AnimatePresence>
    </LazyMotion>
  );
}
