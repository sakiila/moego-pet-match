import type { GalleryEntry } from '../../dev/gallery/types';
import { RichText } from './RichText';

const entry: GalleryEntry = {
  name: 'RichText',
  group: 'primitives',
  states: {
    'bold + line breaks': () => <RichText text="1. **内部展示**：上架后用于棋盘与图鉴。<br>2. **AI 与人工处理**：人工核对后上架。<br>3. **随时申请移除**：可提交删除申请。" />,
    'no markup (HTML is not parsed)': () => <RichText text="Plain text with <b>tags</b> stays as text." />,
  },
};
export default entry;
