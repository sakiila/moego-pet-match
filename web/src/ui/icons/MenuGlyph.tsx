import { useId } from 'react';

export type MenuGlyphName = 'my-titles' | 'clock-out';

/** 已选第 2 稿「奖章与收工牌」；原生 SVG 保留小尺寸清晰度。 */
export function MenuGlyph({ name }: { name: MenuGlyphName }) {
  const id = useId();
  const orange = `${id}-orange`;
  const ivory = `${id}-ivory`;
  return <>
    <defs>
      <linearGradient id={orange} x1="0" y1="0" x2="0.8" y2="1">
        <stop stopColor="var(--menu-icon-highlight)" />
        <stop offset="0.35" stopColor="var(--color-brand)" />
        <stop offset="1" stopColor="var(--color-brand-strong)" />
      </linearGradient>
      <linearGradient id={ivory} x1="0" y1="0" x2="0" y2="1">
        <stop stopColor="var(--receipt-paper)" />
        <stop offset="1" stopColor="var(--menu-icon-ivory-edge)" />
      </linearGradient>
    </defs>
    <g stroke="var(--color-ink)" strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round">
      {name === 'my-titles' ? <>
        <path d="m8 20-5 7 6 1 3 2 4-7m8-3 5 7-6 1-3 2-4-7" fill={`url(#${ivory})`} />
        <circle cx="16" cy="13" r="11" fill={`url(#${orange})`} />
        <path d="m16 6 2.2 4.5 5 .7-3.6 3.5.9 5-4.5-2.4-4.5 2.4.9-5-3.6-3.5 5-.7Z"
          fill="var(--receipt-paper)" stroke="var(--receipt-paper)" strokeWidth="1.2" />
      </> : <>
        <path d="M5 12 16 4l11 8" fill="none" />
        <circle cx="16" cy="4" r="2.8" fill={`url(#${orange})`} />
        <g transform="rotate(-4 16 20)">
          <rect x="2" y="11" width="28" height="19" rx="3.5" fill={`url(#${orange})`} />
          <path d="M18 14.5a6 6 0 1 0 4.8 9 5.2 5.2 0 0 1-4.8-9Z" fill="var(--receipt-paper)" stroke="none" />
        </g>
      </>}
    </g>
  </>;
}
