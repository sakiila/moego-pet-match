import { useCallback, useRef, useState, type CSSProperties } from 'react';
import { useShareCard } from '../../game/useShareCard';
import { useI18n } from '../../i18n';
import { drawStickerSheet } from '../../ui/canvas/drawStickerSheet';
import { PAPER_EDGE, TAPE_EDGE, polygonCss, stickerTilt } from '../../ui/canvas/stickerSheetShape';
import { Button } from '../../ui/primitives/Button';
import { ShareSheet } from '../ShareSheet/ShareSheet';
import styles from './StickerSheet.module.css';

export { stickerTilt } from '../../ui/canvas/stickerSheetShape';

export interface StickerSheetPet {
  petId: string;
  name: string;
  collected: boolean;
  /** 已收集为贴纸，未收集为剪影；格子约 40px，传 128 尺寸即可。 */
  imageSrc: string;
  /**
   * 导出用素材，默认同 imageSrc；仍须按收集状态传入贴纸或剪影。
   * 导出图宽 1200px，每张贴纸约占 130px，128 尺寸已够用，且多半已在浏览器缓存里。
   */
  exportSrc?: string;
}

export interface StickerSheetProps {
  playerName: string;
  /** 按传入顺序固定格位（图鉴传主人英文名、再宠物英文名的顺序），组件不重排。 */
  pets: StickerSheetPet[];
  /** 传出被点的格子，详情卡从它飞出、关闭时飞回。 */
  onOpen: (pet: StickerSheetPet, el: HTMLElement) => void;
  /** 纸下方的一行小字说明。 */
  caption?: string;
  /** 手指按下、鼠标移入或键盘聚焦时，提前预取详情要用的大图。 */
  onPreload?: (pet: StickerSheetPet) => void;
}

/** 图鉴贴纸册：一张纸上排出全部宠物，已收集为倾斜贴纸、未收集为淡剪影加虚线待贴位；格内不写字。 */
export function StickerSheet({ playerName, pets, onOpen, caption, onPreload }: StickerSheetProps) {
  const { t } = useI18n();
  const sheetRef = useRef<HTMLDivElement>(null);
  const [preview, setPreview] = useState(false);
  const closePreview = useCallback(() => setPreview(false), []);
  const draw = useCallback((onProgress?: (loaded: number, total: number) => void) => {
    if (!sheetRef.current) return Promise.reject(new Error('Sticker sheet unavailable'));
    return drawStickerSheet(sheetRef.current, onProgress);
  }, []);
  const title = t('collection.sheet_title', { playerName });
  const collected = pets.filter((p) => p.collected).length;
  return (
    <section className={styles.root}>
      <figure className={styles.album}>
        <div ref={sheetRef} className={styles.sheet} data-testid="sticker-sheet" style={{ '--album-edge': polygonCss(PAPER_EDGE), '--album-tape-edge': polygonCss(TAPE_EDGE) } as CSSProperties}>
          <span className={styles.tape} data-album-tape aria-hidden="true" />
          <div className={styles.heading}>
            <h2 className={styles.title} data-album-text title={title}>{title}</h2>
            <span className={styles.count} data-album-text aria-label={t('collection.progress', { collected, total: pets.length })}>{collected} / {pets.length}</span>
          </div>
          <ul className={styles.grid}>
            {pets.map((p) => (
              <li key={p.petId}>
                <button
                  type="button"
                  className={styles.slot}
                  data-album-slot
                  data-collected={p.collected}
                  data-export-src={p.exportSrc ?? p.imageSrc}
                  data-tilt={stickerTilt(p.petId)}
                  style={p.collected ? { ['--tilt' as string]: `${stickerTilt(p.petId)}deg` } : undefined}
                  aria-label={p.collected ? p.name : `${p.name} · ${t('collection.filter_uncollected')}`}
                  onPointerDown={() => onPreload?.(p)}
                  onPointerEnter={() => onPreload?.(p)}
                  onFocus={() => onPreload?.(p)}
                  onClick={(e) => onOpen(p, e.currentTarget)}
                >
                  <StickerImage src={p.imageSrc} />
                </button>
              </li>
            ))}
          </ul>
        </div>
        {caption && <figcaption className={styles.caption}>{caption}</figcaption>}
      </figure>
      <div className={styles.share}>
        <Button block iconName="share-image" onClick={() => setPreview(true)} data-testid="sticker-share">
          {t('collection.sheet_share')}
        </Button>
        <p className={styles.caption}>{t('collection.sheet_share_hint')}</p>
      </div>
      {preview && <StickerSheetPreview draw={draw} onClose={closePreview} />}
    </section>
  );
}

type DrawSheet = (onProgress?: (loaded: number, total: number) => void) => Promise<Blob>;

function StickerSheetPreview({ draw, onClose }: { draw: DrawSheet; onClose: () => void }) {
  const { t } = useI18n();
  // 贴纸逐张加载，预览里显示已就绪的比例
  const [progress, setProgress] = useState(0);
  const drawWithProgress = useCallback(() => {
    setProgress(0);
    return draw((loaded, total) => setProgress(total ? loaded / total : 1));
  }, [draw]);
  const card = useShareCard(drawWithProgress, 'moego-sticker-album.png');
  return <ShareSheet open title={t('collection.sheet_preview')} state={card.state} progress={progress} canShare={card.canShare} onSave={card.save} onShare={card.share} onRetry={card.retry} onClose={onClose} imageLayout="natural" />;
}

/** 加载失败只留空的待贴位，不显示破图。 */
function StickerImage({ src }: { src: string }) {
  const [failed, setFailed] = useState(false);
  return failed ? null : <img src={src} alt="" loading="lazy" decoding="async" onError={() => setFailed(true)} />;
}
