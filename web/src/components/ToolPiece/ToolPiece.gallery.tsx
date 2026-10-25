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
    'dryer · 直线五连或两把剪刀合成': () => cell(<ToolPiece tool="dryer" />),
    'fish · conch row / column · pearl shell · big wave': () => (
      <div data-theme="fish" style={{ display: 'flex', gap: 8, padding: 12, background: 'var(--bg)', borderRadius: 12 }}>
        {cell(<ToolPiece tool="combH" mode="fish" />)}
        {cell(<ToolPiece tool="combV" mode="fish" />)}
        {cell(<ToolPiece tool="scissors" mode="fish" />)}
        {cell(<ToolPiece tool="dryer" mode="fish" />)}
        {cell(<ToolPiece tool="combH" mode="fish" />, 40)}
        {cell(<ToolPiece tool="scissors" mode="fish" />, 40)}
      </div>
    ),
    'board size (44)': () => (
      <div style={{ display: 'flex', gap: 8 }}>
        {cell(<ToolPiece tool="combH" />, 44)}
        {cell(<ToolPiece tool="combV" />, 44)}
        {cell(<ToolPiece tool="scissors" />, 44)}
        {cell(<ToolPiece tool="dryer" />, 44)}
      </div>
    ),
    'small (40)': () => (
      <div style={{ display: 'flex', gap: 8 }}>
        {cell(<ToolPiece tool="combH" />, 40)}
        {cell(<ToolPiece tool="combV" />, 40)}
        {cell(<ToolPiece tool="scissors" />, 40)}
        {cell(<ToolPiece tool="dryer" />, 40)}
      </div>
    ),
  },
};

export default entry;
