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
    'with icon (large)': () => <Button size="lg" block iconName="open-shop-white"><Label k="action.open_shop" /></Button>,
    'with icon (secondary)': () => <Button variant="secondary" iconName="save-image"><Label k="share.save" /></Button>,
    'with icon disabled': () => <Button size="lg" block disabled iconName="open-shop-white"><Label k="identity.title" /></Button>,
    disabled: () => <Button disabled><Label k="action.retry" /></Button>,
    'long text': () => <Button variant="secondary">Back to the Shop and Keep Playing Later</Button>,
  },
};

export default entry;
