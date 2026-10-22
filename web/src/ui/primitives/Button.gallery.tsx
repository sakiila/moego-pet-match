import type { GalleryEntry } from '../../dev/gallery/types';
import { useI18n, type MessageKey } from '../../i18n';
import { Button } from './Button';

function Label({ k }: { k: MessageKey }) {
  return <>{useI18n().t(k)}</>;
}

const entry: GalleryEntry = {
  name: 'Button',
  group: 'primitives',
  states: {
    primary: () => <Button><Label k="action.play_again" /></Button>,
    secondary: () => <Button variant="secondary"><Label k="action.back_to_shop" /></Button>,
    'large block': () => <Button size="lg" block><Label k="action.open_shop" /></Button>,
    disabled: () => <Button disabled><Label k="action.retry" /></Button>,
    'long text': () => <Button variant="secondary">Back to the Shop and Keep Playing Later</Button>,
  },
};

export default entry;
