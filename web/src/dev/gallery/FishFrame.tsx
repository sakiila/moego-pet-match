import type { ReactNode } from 'react';
import { UnderwaterBackdrop } from '../../components/UnderwaterBackdrop/UnderwaterBackdrop';

/** 陈列页用：在鱼关主题与水下背景里展示组件，不依赖顶部的主题切换。 */
export function FishFrame({ children }: { children: ReactNode }) {
  return (
    <div data-theme="fish" style={{ position: 'relative', padding: 12, borderRadius: 16, overflow: 'hidden', color: 'var(--fg)' }}>
      <UnderwaterBackdrop inline />
      <div style={{ position: 'relative', display: 'grid', gap: 12 }}>{children}</div>
    </div>
  );
}
