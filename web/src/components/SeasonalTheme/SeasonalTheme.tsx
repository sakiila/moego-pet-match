import { createContext, useContext, useEffect, useState, type CSSProperties, type HTMLAttributes, type ReactNode } from 'react';
import type { GameMode } from '../../api/types';
import { halloweenActive, halloweenEndLabel, halloweenPreview, nextHalloweenBoundary } from '../../game/halloween';
import { useI18n } from '../../i18n';
import { Icon } from '../../ui/primitives/Icon';
import styles from './SeasonalTheme.module.css';

const Availability = createContext(false);
const SurfaceTheme = createContext<boolean | null>(null);
const ART = import.meta.glob<string>('../../ui/art/halloween/*.{png,webp}', { eager: true, query: '?url', import: 'default' });
const art = (name: string) => ART[`../../ui/art/halloween/${name}`];

export function SeasonalThemeProvider({ active, children }: { active?: boolean; children: ReactNode }) {
  const [now, setNow] = useState(Date.now);
  const preview = typeof location === 'undefined' ? undefined : halloweenPreview(location.search, import.meta.env.DEV);
  const forced = active ?? preview;
  useEffect(() => {
    if (forced !== undefined) return;
    const boundary = nextHalloweenBoundary(now);
    if (boundary === null) return;
    const timeout = window.setTimeout(() => setNow(Date.now()), Math.min(Math.max(1, boundary - now), 2_147_483_647));
    return () => window.clearTimeout(timeout);
  }, [forced, now]);
  return <Availability.Provider value={forced ?? halloweenActive(now)}>{children}</Availability.Provider>;
}

export function useSeasonalTheme(mode: GameMode = 'normal'): boolean {
  const surface = useContext(SurfaceTheme);
  return mode !== 'fish' && surface === true;
}

export interface SeasonalSurfaceProps extends HTMLAttributes<HTMLElement> {
  as?: 'main' | 'div';
  surface: 'home' | 'board' | 'report' | 'leaderboard';
  mode?: GameMode;
  children: ReactNode;
}

/** 季节外观只包裹已有组件；鱼关保留原主题，装饰失败也不阻塞内容。 */
export function SeasonalSurface({ as: Element = 'main', surface, mode = 'normal', className, style, children, ...rest }: SeasonalSurfaceProps) {
  const available = useContext(Availability);
  const parent = useContext(SurfaceTheme);
  const active = mode !== 'fish' && (parent ?? available);
  const storefront = art('storefront.webp');
  const surfaceStyle = active && storefront
    ? { ...style, '--season-storefront-image': `url("${storefront}")` } as CSSProperties
    : style;
  return <SurfaceTheme.Provider value={active}>
    <Element {...rest} className={`${className ?? ''}${active ? ` ${styles.surface}` : ''}`}
      style={surfaceStyle} data-season={active ? 'halloween' : undefined} data-season-surface={active ? surface : undefined}>
      {active && <div className={styles.backdrop} data-season-backdrop aria-hidden>
        {art('header-left.webp') && <img className={styles.left} src={art('header-left.webp')} alt="" draggable={false} />}
        {art('header-right.webp') && <img className={styles.right} src={art('header-right.webp')} alt="" draggable={false} />}
      </div>}
      {children}
    </Element>
  </SurfaceTheme.Provider>;
}

export function SeasonalBadge() {
  const active = useContext(SurfaceTheme);
  const { t, locale } = useI18n();
  if (!active) return null;
  return <p className={styles.badge} data-testid="seasonal-badge">
    <Icon name="halloween-pumpkin" size={20} />
    <span>{t('halloween.limited', { end: halloweenEndLabel(locale) })}</span>
    <Icon name="halloween-pumpkin" size={20} />
  </p>;
}

export function HalloweenEmblem({ className }: { className?: string }) {
  return <Icon name="halloween-pumpkin" className={className} size={32} />;
}
