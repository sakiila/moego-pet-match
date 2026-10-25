import type { GalleryEntry } from '../../dev/gallery/types';
import { FishFrame } from '../../dev/gallery/FishFrame';
import { RushTicket } from './RushTicket';
import styles from './RushTicket.module.css';

const entry: GalleryEntry = {
  name: 'RushTicket',
  group: 'components',
  states: {
    'active 0/12 · zh / en': () => <RushTicket view={{ state: 'active', served: 0, secondsLeft: 20 }} />,
    'active 7/12 · zh / en': () => <RushTicket view={{ state: 'active', served: 7, secondsLeft: 8 }} />,
    'active 11/12 · last second': () => <RushTicket view={{ state: 'active', served: 11, secondsLeft: 1 }} />,
    success: () => <RushTicket view={{ state: 'success' }} />,
    expired: () => <div className={styles.stillPreview}><RushTicket view={{ state: 'expired' }} /></div>,
    'fish · long title · zh / en': () => (
      <FishFrame>
        <RushTicket mode="fish" view={{ state: 'active', served: 7, secondsLeft: 20 }} />
      </FishFrame>
    ),
    'fish · success / expired': () => (
      <div className={styles.stillPreview}>
        <FishFrame>
          <RushTicket mode="fish" view={{ state: 'success' }} />
          <RushTicket mode="fish" view={{ state: 'expired' }} />
        </FishFrame>
      </div>
    ),
    'narrow · English long copy via Locale selector': () => (
      <div className={`${styles.narrowPreview} ${styles.stillPreview}`}>
        <RushTicket mode="fish" view={{ state: 'active', served: 7, secondsLeft: 20 }} />
        <RushTicket view={{ state: 'success' }} />
        <RushTicket view={{ state: 'expired' }} />
      </div>
    ),
  },
};

export default entry;
