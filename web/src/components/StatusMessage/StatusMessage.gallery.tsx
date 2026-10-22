import type { GalleryEntry } from '../../dev/gallery/types';
import { StatusMessage } from './StatusMessage';

const entry: GalleryEntry = {
  name: 'StatusMessage',
  group: 'components',
  states: {
    info: () => <StatusMessage text="正在保存本局结果……" />,
    'error + retry': () => <StatusMessage tone="error" text="暂时没能读取同事名单，请重试。" actionLabel="重试" onAction={() => {}} />,
    'long text': () => <StatusMessage text="We couldn't find your coworker profile. Try another name or contact Bob." />,
  },
};

export default entry;
