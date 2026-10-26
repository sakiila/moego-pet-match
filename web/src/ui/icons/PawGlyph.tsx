export type PawGlyphName = 'paw-print' | 'paw-cute' | 'paw-pets' | 'paw-play' | 'paw-love';
export function isPawGlyph(name: string): name is PawGlyphName { return name.startsWith('paw-'); }

/** 爪印簿的简单原生图形；界面仍统一经 Icon 取用，不从效果图切素材。 */
export function PawGlyph({ name }: { name: PawGlyphName }) {
  if (name === 'paw-print') return <g fill="currentColor">
    <ellipse cx="7" cy="12" rx="3.3" ry="4.3" transform="rotate(-28 7 12)" />
    <ellipse cx="13" cy="7" rx="3.2" ry="4.4" transform="rotate(-10 13 7)" />
    <ellipse cx="21" cy="7" rx="3.2" ry="4.4" transform="rotate(12 21 7)" />
    <ellipse cx="27" cy="13" rx="3" ry="4.1" transform="rotate(28 27 13)" />
    <path d="M9 22c1-3 4-7 8-7s7 4 8 7c2 6-2 8-5 7l-3-1-3 1c-4 1-7-2-5-7Z" />
  </g>;
  return <g fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    {name === 'paw-love' ? <path d="M16 28 5 17C-4 8 9-1 16 8c7-9 20 0 11 9Z" />
      : name === 'paw-play' ? <><circle cx="16" cy="16" r="12" /><path d="M7 6c9 5 9 15 18 20M25 6c-9 5-9 15-18 20" /></>
      : name === 'paw-cute' ? <><path d="m5 13-1-9 9 4h6l9-4-1 9c7 17-29 17-22 0Z" /><path d="m10 17 1 1m10-1-1 1m-6 3 2 1 2-1" /></>
      : <><path d="M10 21c2-8 10-8 12 0 2 7-2 7-6 5-4 2-8 2-6-5Z" /><ellipse cx="5" cy="14" rx="3" ry="4" /><ellipse cx="12" cy="7" rx="3" ry="4" /><ellipse cx="21" cy="7" rx="3" ry="4" /><ellipse cx="28" cy="14" rx="2.6" ry="4" /></>}
  </g>;
}
