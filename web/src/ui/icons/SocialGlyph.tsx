export const SOCIAL_GLYPHS = [
  'social-feed',
  'social-create',
  'social-bell',
  'social-tip',
  'social-pencil',
  'social-delete',
  'social-link',
  'social-more',
  'social-send',
  'social-shield',
] as const;
export type SocialGlyphName = (typeof SOCIAL_GLYPHS)[number];
export const isSocialGlyph = (name: string): name is SocialGlyphName =>
  (SOCIAL_GLYPHS as readonly string[]).includes(name);

/** 社交图标按确认稿用原生 SVG 实现；统一由 Icon 调用，不使用页面切图。 */
export function SocialGlyph({ name }: { name: SocialGlyphName }) {
  const cream = 'var(--receipt-paper)';
  const orange = 'var(--color-brand)';
  return (
    <g stroke="var(--color-ink)" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
      {name === 'social-feed' && (
        <>
          <rect x="9" y="5" width="20" height="23" rx="4" transform="rotate(12 19 16)" fill="var(--color-brand-soft)" />
          <rect x="3" y="3" width="21" height="24" rx="4" transform="rotate(-10 13 15)" fill={cream} />
          <g fill={orange} stroke="none">
            <ellipse cx="9" cy="12" rx="2" ry="3" />
            <ellipse cx="15" cy="11" rx="2" ry="3" />
            <ellipse cx="20" cy="15" rx="2" ry="2.6" />
            <ellipse cx="6" cy="17" rx="2" ry="2.6" />
            <path d="M10 17c-2 1-4 5-2 6 2 1 3-1 5-1s3 2 5 0c2-2-1-6-3-6-2-1-3 0-5 1Z" />
          </g>
        </>
      )}
      {name === 'social-create' && (
        <>
          <rect x="3" y="3" width="23" height="25" rx="4" fill={cream} />
          <circle cx="20" cy="10" r="3" fill={orange} stroke="none" />
          <path d="m6 22 6-8 5 6 3-3 4 5" fill={orange} stroke="none" />
          <path d="m17 26 2-6L28 9l4 4-10 12Z" fill={orange} />
          <path d="m19 20 4 4" />
        </>
      )}
      {name === 'social-bell' && (
        <>
          <path d="M6 22c4-4 2-7 4-12 1-3 3-4 6-4s5 1 6 4c2 5 0 8 4 12Z" fill={cream} />
          <path d="M12 23c0 6 8 6 8 0" fill={orange} />
          <path d="M16 3v3" />
        </>
      )}
      {name === 'social-tip' && (
        <>
          <path d="M14 26c0-4-6-6-6-13a8 8 0 0 1 16 0c0 7-6 9-6 13Z" fill={cream} />
          <path d="M13 29h6" />
          <path d="M24 3l-2 4M28 8l-4 2" stroke={orange} strokeWidth="3" />
        </>
      )}
      {name === 'social-pencil' && (
        <g stroke="var(--color-paper)" fill="none" strokeWidth="2.6">
          <path d="m8 25 1-6L21 7l5 5-12 12Z" />
          <path d="m18 10 5 5M8 28h17" />
        </g>
      )}
      {name === 'social-delete' && (
        <>
          <path d="M7 10h18l-2 19H9Z" fill={cream} />
          <path d="M11 6V3h10v3" fill={orange} />
          <rect x="4" y="6" width="24" height="5" rx="2" fill={cream} />
          <path d="M13 15v9m6-9v9" stroke={orange} />
        </>
      )}
      {name === 'social-link' && (
        <>
          <path d="M14 5H7a3 3 0 0 0-3 3v17a3 3 0 0 0 3 3h17a3 3 0 0 0 3-3v-8" fill="none" />
          <path d="M19 3h10v10M29 3 14 18" fill="none" stroke={orange} strokeWidth="3.5" />
        </>
      )}
      {name === 'social-more' && (
        <g fill="var(--color-ink)" stroke="none">
          <circle cx="6" cy="16" r="2.5" />
          <circle cx="16" cy="16" r="2.5" />
          <circle cx="26" cy="16" r="2.5" />
        </g>
      )}
      {name === 'social-send' && <path d="m3 3 26 13L3 29l5-13Z M8 16h20" fill={cream} />}
      {name === 'social-shield' && (
        <>
          <path d="m16 3 12 5v8c0 7-12 13-12 13S4 23 4 16V8Z" fill={cream} stroke={orange} />
          <path d="m10 15 4 4 8-9" fill="none" stroke={orange} />
        </>
      )}
    </g>
  );
}
