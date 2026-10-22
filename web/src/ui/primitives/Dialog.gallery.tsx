import type { GalleryEntry } from '../../dev/gallery/types';
import { Button } from './Button';
import { Dialog } from './Dialog';

const noop = () => {};

const entry: GalleryEntry = {
  name: 'Dialog',
  group: 'primitives',
  states: {
    'title + body + actions': () => (
      <Dialog open inline title="Dialog title" onClose={noop} actions={<Button block>Primary</Button>}>
        Body text that explains the consequence of the action.
      </Dialog>
    ),
    'title only': () => <Dialog open inline title="Just a title" onClose={noop} />,
  },
};

export default entry;
