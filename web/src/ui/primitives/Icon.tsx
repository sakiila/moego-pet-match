import { ICON_CATALOG, type IconName as PngIconName } from '../icons/catalog';
import { MenuGlyph, type MenuGlyphName } from '../icons/MenuGlyph';
import styles from './Icon.module.css';

export type IconName = PngIconName | MenuGlyphName;

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
}

/**
 * 已确认原稿 PNG 与代码 SVG 菜单图标。调用处只认 name，素材替换只改本组件与 ui/icons。
 * 按显示尺寸用 srcset 选 1x / 2x / 3x。
 */
export function Icon({ name, size = 24, label, className }: IconProps) {
  if (name === 'my-titles' || name === 'clock-out') {
    return <svg className={`${styles.icon} ${className ?? ''}`} width={size} height={size} viewBox="0 0 32 32"
      role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true} focusable="false">
      <MenuGlyph name={name} />
    </svg>;
  }
  const { widths, aspect } = ICON_CATALOG[name];
  const width = Math.round(size * aspect);
  return (
    <img
      className={`${styles.icon} ${className ?? ''}`}
      src={URLS[`../icons/png/${name}@${widths[widths.length - 1]}.png`]}
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
}
