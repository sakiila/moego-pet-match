import type { GalleryEntry } from '../../dev/gallery/types';
import { ReportSummary } from './ReportSummary';

const entry: GalleryEntry = {
  name: 'ReportSummary',
  group: 'components',
  states: {
    typical: () => <ReportSummary score={2480} clearedCells={186} maxChain={4} toolsFired={6} />,
    'zero (no moves)': () => <ReportSummary score={0} clearedCells={0} maxChain={0} toolsFired={0} />,
    'large numbers': () => <ReportSummary score={1_234_560} clearedCells={9_999} maxChain={12} toolsFired={88} />,
  },
};

export default entry;
