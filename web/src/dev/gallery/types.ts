import type { ReactNode } from 'react';

/**
 * 每个组件旁放一个 `*.gallery.tsx`，默认导出 GalleryEntry，陈列页会自动收录。
 * states 列出该组件的全部状态（默认、选中、禁用、加载、空、错误、长文本等）。
 */
export interface GalleryEntry {
  name: string;
  group: 'primitives' | 'components' | 'screens';
  states: Record<string, () => ReactNode>;
}
