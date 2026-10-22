import type { ReactNode } from 'react';
import type { GalleryEntry } from '../../dev/gallery/types';
import { ToolPiece } from './ToolPiece';

const cell = (children: ReactNode, size = 52) => <div style={{ width: size, height: size }}>{children}</div>;

const entry: GalleryEntry = {
  name: 'ToolPiece',
  group: 'components',
  states: {
    'comb · row': () => cell(<ToolPiece tool="combH" />),
    'comb · column': () => cell(<ToolPiece tool="combV" />),
    scissors: () => cell(<ToolPiece tool="scissors" />),
    'small (40)': () => (
      <div style={{ display: 'flex', gap: 8 }}>
        {cell(<ToolPiece tool="combH" />, 40)}
        {cell(<ToolPiece tool="combV" />, 40)}
        {cell(<ToolPiece tool="scissors" />, 40)}
      </div>
    ),
  },
};

export default entry;
