import type { ReactNode } from 'react';
import type { GalleryEntry } from '../../dev/gallery/types';
import { BackToTop } from './BackToTop';

/** 陈列格把 fixed 限定在格内；给出一屏高度，按钮落在格的右下角。 */
function Frame({ children }: { children: ReactNode }) {
  return <div style={{ minHeight: 160 }}>{children}</div>;
}

const entry: GalleryEntry = {
  name: 'BackToTop',
  group: 'primitives',
  states: {
    'visible (scrolled past one screen)': () => (
      <Frame>
        <BackToTop visible label="返回顶部" onClick={() => {}} />
      </Frame>
    ),
    'hidden (near top)': () => (
      <Frame>
        <BackToTop visible={false} label="返回顶部" onClick={() => {}} />
      </Frame>
    ),
    English: () => (
      <Frame>
        <BackToTop visible label="Back to top" onClick={() => {}} />
      </Frame>
    ),
  },
};
export default entry;
