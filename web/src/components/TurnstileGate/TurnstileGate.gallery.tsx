import { TurnstileGate } from './TurnstileGate';
import type { GalleryEntry } from '../../dev/gallery/types';
const entry: GalleryEntry = { name: 'TurnstileGate', group: 'components', states: {
  checking: () => <TurnstileGate siteKey={null} gameId="preview" onToken={() => {}} onRetry={() => {}} preview="checking" />,
  verified: () => <TurnstileGate siteKey={null} gameId="preview" onToken={() => {}} onRetry={() => {}} preview="verified" />,
  failed: () => <TurnstileGate siteKey={null} gameId="preview" onToken={() => {}} onRetry={() => {}} preview="failed" />,
} };
export default entry;
