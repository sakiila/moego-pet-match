import type { GalleryEntry } from '../../dev/gallery/types';
import { PageLinks } from './PageLinks';

const noop = () => {};
const entry: GalleryEntry = {
  name: 'PageLinks',
  group: 'components',
  states: {
    'home footer': () => <PageLinks links={[{ label: '信息使用说明', onClick: noop }, { label: '资料删除申请', onClick: noop }, { label: '设置', onClick: noop }]} />,
    'identity (removal disabled)': () => <PageLinks links={[{ label: '信息使用说明', onClick: noop }, { label: '资料删除申请', onClick: noop, disabled: true }]} />,
    'English (wraps)': () => <PageLinks links={[{ label: 'How We Use Your Information', onClick: noop }, { label: 'Request Data Removal', onClick: noop }, { label: 'Settings', onClick: noop }]} />,
  },
};
export default entry;
