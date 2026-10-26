import type { CSSProperties } from 'react';
import { ICON_CATALOG, type IconName as PngIconName } from '../icons/catalog';
import { MenuGlyph, type MenuGlyphName } from '../icons/MenuGlyph';
import { isSocialGlyph, SocialGlyph, type SocialGlyphName } from '../icons/SocialGlyph';
import styles from './Icon.module.css';

export type IconName = PngIconName | MenuGlyphName | SocialGlyphName;

const URLS = import.meta.glob<string>('../icons/png/*.png', { eager: true, query: '?url', import: 'default' });

function srcSet(name: PngIconName) {
  return ICON_CATALOG[name].widths.map((w) => `${URLS[`../icons/png/${name}@${w}.png`]} ${w}w`).join(', ');
}

/** 开局时预载短暂演出用的原稿，避免挂牌一闪而过时才开始下载。 */
export function preloadIcon(name: PngIconName, height: number): void {
  if (typeof Image === 'undefined') return;
  const { widths, aspect } = ICON_CATALOG[name];
  const preload = new Image();
  preload.srcset = srcSet(name);
  preload.sizes = `${Math.round(height * aspect)}px`;
  preload.src = URLS[`../icons/png/${name}@${widths[widths.length - 1]}.png`];
  void preload.decode().catch(() => undefined);
}

export interface IconProps {
  name: IconName;
  /** 显示高度（px）；宽图标（称号框）按原比例算宽度。 */
  size?: number;
  /** 只有图标、没有文字时必须提供，作为读屏名称；旁边已有文字时省略，读屏跳过图标。 */
  label?: string;
  className?: string;
  /** 保留原 PNG，所有尺寸按透明轮廓叠加同一套流光与星芒。 */
  effect?: 'aurora';
}

/**
 * 已确认原稿 PNG 与代码 SVG 菜单图标。调用处只认 name，素材替换只改本组件与 ui/icons。
 * 按显示尺寸用 srcset 选 1x / 2x / 3x。
 */
export function Icon({ name, size = 24, label, className, effect }: IconProps) {
  if (isSocialGlyph(name)) return <svg className={`${styles.icon} ${className ?? ''}`} width={size} height={size} viewBox="0 0 34 34"
    role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true} focusable="false"><SocialGlyph name={name}/></svg>;
  if (name === 'my-titles' || name === 'clock-out') {
    return <svg className={`${styles.icon} ${className ?? ''}`} width={size} height={size} viewBox="0 0 32 32"
      role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true} focusable="false">
      <MenuGlyph name={name} />
    </svg>;
  }
  const { widths, aspect } = ICON_CATALOG[name];
  const width = Math.round(size * aspect);
  const src = URLS[`../icons/png/${name}@${widths[widths.length - 1]}.png`];
  const art = (
    <img
      className={`${styles.icon} ${effect ? styles.art : className ?? ''}`}
      src={src}
      srcSet={srcSet(name)}
      sizes={`${width}px`}
      width={width}
      height={size}
      alt={label ?? ''}
      aria-hidden={label ? undefined : true}
      decoding="async"
      draggable={false}
    />
  );
  if (!effect) return art;
  return <span className={`${styles.effect} ${className ?? ''}`} data-icon-effect={effect}
    style={{ width, height: size, '--icon-effect-mask': `url("${src}")` } as CSSProperties}>
    {art}
    <span className={styles.light} aria-hidden>
      <span className={styles.sheen} />
      <span className={styles.starTop} />
      <span className={styles.starSides} />
    </span>
  </span>;
}
