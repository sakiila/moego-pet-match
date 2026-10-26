import type { GalleryEntry } from '../../dev/gallery/types';
import { Sheet } from './Sheet';

const entry: GalleryEntry = {
  name: 'Sheet',
  group: 'primitives',
  states: {
    'suspended beneath pet detail': () => (
      <Sheet open inline suspended label="玩家名片" closeLabel="关闭" onClose={() => {}}>
        <p>名片内容与滚动位置保持，交互交由上层详情。</p>
      </Sheet>
    ),
    default: () => (
      <Sheet open inline label="示例" closeLabel="关闭" onClose={() => {}}>
        <p>底部抽屉内容。</p>
      </Sheet>
    ),
    'with badge': () => (
      <Sheet open inline label="示例" closeLabel="Close" onClose={() => {}} badge={<strong>Badge</strong>}>
        <p>{'Long content. '.repeat(80)}</p>
      </Sheet>
    ),
  },
};
export default entry;
