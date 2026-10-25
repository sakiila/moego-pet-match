import type { GalleryEntry } from '../../dev/gallery/types';
import { FishFrame } from '../../dev/gallery/FishFrame';
import { translate } from '../../i18n';
import { ClosingSign } from './ClosingSign';

const entry: GalleryEntry = {
  name: 'ClosingSign',
  group: 'components',
  states: {
    中文: () => <ClosingSign locale="zh" label={translate('zh', 'round.finished')} />,
    English: () => <ClosingSign locale="en" label={translate('en', 'round.finished')} />,
    fish: () => <FishFrame><ClosingSign locale="zh" label={translate('zh', 'round.finished')} /></FishFrame>,
  },
};

export default entry;
