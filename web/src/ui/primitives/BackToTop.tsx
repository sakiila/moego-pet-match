import { useCallback, useEffect, useState } from 'react';
import styles from './BackToTop.module.css';

export interface BackToTopProps {
  /** 是否显示；隐藏时淡出且不可点、不进读屏。 */
  visible: boolean;
  /** 无障碍名称。 */
  label: string;
  onClick: () => void;
}

/** 返回顶部：固定在页面列右下角的白底炭黑描边圆钮，橙色顶线＋向上箭头，贴纸式硬阴影。 */
export function BackToTop({ visible, label, onClick }: BackToTopProps) {
  return (
    <button type="button" className={styles.button} data-visible={visible} aria-label={label} title={label} aria-hidden={!visible || undefined} tabIndex={visible ? 0 : -1} onClick={onClick}>
      <svg className={styles.arrow} viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 3.5h14M12 21V9M6 14.5l6-6 6 6" />
      </svg>
    </button>
  );
}

const reduced = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/** 页面滚过约一屏后显示返回顶部；点击平滑回顶，减少动态效果时直接跳回。 */
export function useBackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const update = () => setVisible(window.scrollY > window.innerHeight);
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  const scrollToTop = useCallback(() => window.scrollTo({ top: 0, behavior: reduced() ? 'auto' : 'smooth' }), []);

  return { visible, scrollToTop };
}
