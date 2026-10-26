import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import type { PetDetail } from '../../api/types';
import { quoteExcerpt } from '../../game/collection';
import { developerStampUrl } from '../../game/titleStamps';
import { useI18n } from '../../i18n';
import { Avatar } from '../../ui/primitives/Avatar';
import { AvatarStack } from '../../ui/primitives/AvatarStack';
import { Button } from '../../ui/primitives/Button';
import { Tilt } from '../Tilt/Tilt';
import { Icon } from '../../ui/primitives/Icon';
import styles from './PetDetailCard.module.css';

export type PetDetailState =
  | { kind: 'loading' }
  | { kind: 'failed' }
  | { kind: 'unlisted' }
  | { kind: 'ready'; detail: PetDetail };

export interface PetDetailCardProps {
  /** 读取详情期间先显示的名字。 */
  name: string;
  state: PetDetailState;
  stickerSrc: string;
  silhouetteSrc: string;
  /** 处理后照片；无照片时为 null。 */
  photoSrc: string | null;
  ownerAvatarSrc: string | null;
  /** 认识人数区的同事头像地址。 */
  colleagueAvatarSrc: (userId: string) => string | null;
  /** 被点开的列表卡片：从它的位置翻转飞出，关闭时飞回它当前所在的位置；缺省时淡入淡出。 */
  origin?: HTMLElement | null;
  onClose: () => void;
  onRetry: () => void;
  onOpenShop: () => void;
  /** 自家宠物：打开资料删除申请（低强调入口）。 */
  onRequestRemoval?: () => void;
  /** 陈列页：不飞行、不遮罩全屏，直接静态展示。 */
  inline?: boolean;
  /** 玩家名片中的详情卡需叠在 Sheet 上方。 */
  aboveSheet?: boolean;
  /** 开发者彩蛋：毛肚、菠萝的卡正面右上盖「开发者家的认证」章（未收集也盖），主人行追加「本游戏开发者」（game/easterEggs）。 */
  developer?: boolean;
  /** 独立于整面翻转的局外动作。 */
  action?: ReactNode;
  /** 上层爪印簿打开时保留卡片并暂停交互。 */
  suspended?: boolean;
  onReady?: () => void;
}

const OPEN_MS = 640;
const CLOSE_MS = 520;
const OPEN_EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';
const CLOSE_EASE = 'cubic-bezier(0.5, 0, 0.2, 1)';

const reduced = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/** 翻面过渡转到一半（90°）所需的毫秒数：按元素的 transition 时长与 cubic-bezier 缓动求解。 */
function flipHalfMs(el: HTMLElement) {
  const style = getComputedStyle(el);
  const duration = parseFloat(style.transitionDuration) * 1000 || 0;
  const bezier = /cubic-bezier\(([^)]+)\)/.exec(style.transitionTimingFunction);
  if (!bezier) return duration / 2;
  const [x1, y1, x2, y2] = bezier[1].split(',').map(Number);
  const at = (s: number, p1: number, p2: number) => 3 * (1 - s) ** 2 * s * p1 + 3 * (1 - s) * s ** 2 * p2 + s ** 3;
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    if (at(mid, y1, y2) < 0.5) lo = mid;
    else hi = mid;
  }
  return at((lo + hi) / 2, x1, x2) * duration;
}

/** 起点卡片相对终点卡片中心的位移与按宽度的缩放。 */
function moveTo(from: DOMRect, to: DOMRect) {
  const dx = from.left + from.width / 2 - (to.left + to.width / 2);
  const dy = from.top + from.height / 2 - (to.top + to.height / 2);
  return `translate(${dx}px, ${dy}px) scale(${from.width / to.width})`;
}

/**
 * 图鉴详情卡：点开时列表里的卡片翻转着飞到屏幕中央，点遮罩或右上角关闭就翻转着收回原位。
 * 落地先显示正面（贴纸、名字、主人）；点卡片本身翻到背面（处理后照片与「主人说」），再点翻回。
 * 未收集只给名字与剪影；自家宠物即使未收集也显示完整资料。开始营业、重试、资料删除申请放在卡片下方。
 */
export function PetDetailCard(props: PetDetailCardProps) {
  const { name, origin, onClose, onRetry, onOpenShop, onRequestRemoval, inline, aboveSheet, suspended = false } = props;
  const { t } = useI18n();
  const [flipped, setFlipped] = useState(false);
  const [closing, setClosing] = useState(false);
  // 落地后才开始循环动画，避免飞行期间每帧重绘
  const [settled, setSettled] = useState(!!inline);
  // 第一次落地后才换上读取到的详情：飞行途中换内容（主人行、认识人数头像、背面大照片）会让卡片中途重排、重新光栅化而顿一下。
  // 只置一次，关闭飞回时不再切回读取中
  const [landed, setLanded] = useState(!!inline);
  useEffect(() => { if (settled) props.onReady?.(); }, [settled, props.onReady]);
  const state: PetDetailState = landed ? props.state : { kind: 'loading' };
  // 背面照片（长边 1600）落地后稍等再加载，或一翻面就加载；背面的光带第一次翻面才挂上
  const [photoReady, setPhotoReady] = useState(!!inline);
  const [everFlipped, setEverFlipped] = useState(false);
  useEffect(() => {
    if (!landed || photoReady) return;
    const timer = window.setTimeout(() => setPhotoReady(true), 500);
    return () => window.clearTimeout(timer);
  }, [landed, photoReady]);
  // 详情读取完成前，沿用被点卡片上已有的贴纸与「已收集」状态，飞行期间内容不跳变
  const [hint] = useState(() => ({ src: origin?.querySelector('img')?.currentSrc || null, collected: origin?.dataset.collected === 'true' || origin?.dataset.own === 'true' }));
  const flyRef = useRef<HTMLDivElement>(null);
  const flipperRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const hasFocused = useRef(false);
  useEffect(() => {
    if (inline || suspended) return;
    const previous = document.activeElement;
    const overlay = backdropRef.current?.parentElement;
    if (!hasFocused.current) {
      overlay?.querySelector<HTMLButtonElement>('button')?.focus({ preventScroll: true });
      hasFocused.current = true;
    }
    const trapFocus = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'Tab' || !overlay) return;
      const controls = [...overlay.querySelectorAll<HTMLElement>('button:not(:disabled), [href], [tabindex="0"]')]
        .filter(element => !element.closest('[inert]') && element.getClientRects().length > 0);
      const first = controls[0];
      const last = controls.at(-1);
      if (!first || !last) return;
      const active = document.activeElement;
      if (!overlay.contains(active) || (event.shiftKey ? active === first : active === last)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus({ preventScroll: true });
      }
    };
    document.addEventListener('keydown', trapFocus, true);
    return () => {
      document.removeEventListener('keydown', trapFocus, true);
      const target = origin?.isConnected ? origin : previous;
      if (target instanceof HTMLElement && target.isConnected) target.focus({ preventScroll: true });
    };
  }, [inline, suspended, origin]);

  const detail = state.kind === 'ready' ? state.detail : null;
  const collected = detail ? detail.collected : hint.collected;
  const full = !!detail && (detail.collected || detail.own);
  const availableDetail = props.state.kind === 'ready' ? props.state.detail : null;
  const hasFlipSide = !!availableDetail && (availableDetail.collected || availableDetail.own) && (!!props.photoSrc || !!availableDetail.quote);
  const canFlip = full && hasFlipSide;
  const decorated = collected && landed;

  // 打开：起点卡片先隐藏（像被拿起来），再翻转着飞到屏幕中央
  useLayoutEffect(() => {
    if (inline) return;
    const fly = flyRef.current;
    const flipper = flipperRef.current;
    const backdrop = backdropRef.current;
    if (!fly || !flipper || !backdrop) return;
    backdrop.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: 'ease-out', fill: 'backwards' });
    const from = origin?.isConnected ? origin.getBoundingClientRect() : null;
    if (!from || reduced()) {
      fly.animate([{ opacity: 0, transform: 'scale(0.92)' }, { opacity: 1, transform: 'none' }], { duration: 220, easing: 'ease-out', fill: 'backwards' });
      setSettled(true);
      setLanded(true);
      return;
    }
    // 起点卡片先留着，飞行前 100 ms 内与飞出的卡片交叉淡入，再隐藏，避免一帧空位
    const hide = window.setTimeout(() => {
      if (origin) origin.style.visibility = 'hidden';
    }, 100);
    fly.animate([{ opacity: 0, transform: moveTo(from, fly.getBoundingClientRect()) }, { opacity: 1, offset: 0.18 }, { opacity: 1, transform: 'none' }], { duration: OPEN_MS, easing: OPEN_EASE });
    flipper.animate([{ transform: 'rotateY(0deg)' }, { transform: 'rotateY(360deg)' }], { duration: OPEN_MS, easing: OPEN_EASE });
    // 落地后先换内容、挂上光带与星光（此时卡片静止，重绘不显卡），再隔两帧才让光带转起来
    let frame = 0;
    const settle = window.setTimeout(() => {
      setLanded(true);
      frame = requestAnimationFrame(() => (frame = requestAnimationFrame(() => setSettled(true))));
    }, OPEN_MS);
    return () => {
      window.clearTimeout(hide);
      window.clearTimeout(settle);
      cancelAnimationFrame(frame);
      if (origin) origin.style.visibility = '';
    };
  }, [inline, origin]);

  // 弹层打开期间锁住页面滚动
  useEffect(() => {
    if (inline) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [inline]);

  const close = () => {
    if (closing) return;
    setClosing(true);
    const fly = flyRef.current;
    const flipper = flipperRef.current;
    const backdrop = backdropRef.current;
    const to = origin?.isConnected ? origin.getBoundingClientRect() : null;
    if (inline || !fly || !flipper || !backdrop) return onClose();
    backdrop.animate([{ opacity: 1 }, { opacity: 0 }], { duration: CLOSE_MS, easing: 'ease-in', fill: 'forwards' });
    if (!to || reduced()) {
      const fade = fly.animate([{ opacity: 1 }, { opacity: 0, transform: 'scale(0.92)' }], { duration: 200, easing: 'ease-in', fill: 'forwards' });
      void fade.finished.then(onClose);
      return;
    }
    // 光带先停；落到原位前最后 30% 的时间，起点卡片先显示、飞行的卡片同时淡出，落地不会「啪」地跳一下
    setSettled(false);
    window.setTimeout(() => {
      if (origin) origin.style.visibility = '';
    }, CLOSE_MS * 0.7);
    const done = fly.animate(
      [{ transform: 'none', opacity: 1 }, { opacity: 1, offset: 0.7 }, { transform: moveTo(to, fly.getBoundingClientRect()), opacity: 0 }],
      { duration: CLOSE_MS, easing: CLOSE_EASE, fill: 'forwards' },
    );
    // 背面时只转半圈回到正面，落回原位时与列表里的卡片同一面
    flipper.animate([{ transform: `rotateY(${flipped ? 180 : 0}deg)` }, { transform: 'rotateY(360deg)' }], { duration: CLOSE_MS, easing: CLOSE_EASE, fill: 'forwards' });
    void done.finished.then(onClose);
  };

  useEffect(() => {
    if (inline || suspended) return;
    const onKey = (e: globalThis.KeyboardEvent) => e.key === 'Escape' && close();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const flip = () => {
    if (!canFlip || closing) return;
    const flipper = flipperRef.current;
    if (flipper) flipper.style.setProperty('--flip-half', `${Math.round(flipHalfMs(flipper))}ms`);
    setEverFlipped(true);
    setPhotoReady(true);
    setFlipped((f) => !f);
  };
  const onKey = (e: KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target === e.currentTarget) {
      e.preventDefault();
      flip();
    }
  };

  const overlay = (
    <div className={`${styles.overlay} ${inline ? styles.inline : ''} ${aboveSheet ? styles.aboveSheet : ''}`} role="dialog" aria-modal="true" aria-label={detail?.name ?? name} inert={suspended || undefined} aria-hidden={suspended || undefined} data-testid="pet-detail" data-closing={closing || undefined} data-settled={settled || undefined}>
      <div className={styles.backdrop} ref={backdropRef} onClick={close} aria-hidden />
      <button type="button" className={styles.close} onClick={close} aria-label={t('action.close')} data-testid="detail-close">
        <Icon name="close" size={20} />
      </button>
      <div className={styles.column}>
        <div className={styles.fly} ref={flyRef}>
          <Tilt radius="var(--radius-lg)" className={styles.tilt}>
            <div
              className={styles.stage}
              role={canFlip ? 'button' : undefined}
              tabIndex={canFlip ? 0 : undefined}
              aria-label={canFlip ? t(flipped ? 'pet.flip_back' : 'pet.original_photo') : undefined}
              data-flippable={canFlip || undefined}
              onClick={flip}
              onKeyDown={onKey}
              data-testid="flip"
            >
              <div className={styles.flipper} ref={flipperRef} data-flipped={flipped || undefined}>
                {/* 飞行期间卡片保持素面：光带、星光、发光阴影都等落地后再挂，起飞第一帧不用光栅化大块渐变与遮罩 */}
                <div className={`${styles.face} ${styles.front}`} inert={aboveSheet && flipped || undefined} aria-hidden={aboveSheet ? flipped : undefined} data-shine={decorated || undefined} data-testid="detail-front">
                  <Front {...props} state={state} previewSrc={hint.src} previewCollected={hint.collected} />
                  {decorated && <ShineRing />}
                  {decorated && <Twinkles />}
                  {/* 翻面图标只挂在当前朝上的一面：iOS Safari 会把背面的合成层子元素镜像透出来 */}
                  {hasFlipSide && !flipped && <FlipHint />}
                </div>
                <div className={`${styles.face} ${styles.back}`} inert={aboveSheet && !flipped || undefined} aria-hidden={aboveSheet ? !flipped : undefined} data-shine={decorated || undefined} data-testid="detail-back">
                  {full && detail ? <Back detail={detail} photoSrc={photoReady ? props.photoSrc : null} /> : <Pattern />}
                  {decorated && everFlipped && <ShineRing />}
                  {hasFlipSide && flipped && <FlipHint />}
                </div>
              </div>
            </div>
          </Tilt>
        </div>
        <div className={styles.actions}>
          {detail && props.action}
          {state.kind === 'unlisted' && <p className={styles.note}>{t('pet.unlisted')}</p>}
          {state.kind === 'failed' && (
            <Button variant="secondary" iconName="retry" onClick={onRetry}>
              {t('action.retry')}
            </Button>
          )}
          {/* 自家宠物从「我的宠物」查看完整资料，不在这里引导开局（图稿 mobile-my-pets-v1） */}
          {detail && !collected && !detail.own && (
            <Button size="lg" iconName="open-shop-white" onClick={onOpenShop}>
              {t('action.open_shop')}
            </Button>
          )}
          {detail?.own && onRequestRemoval && (
            <button type="button" className={styles.remove} onClick={onRequestRemoval} data-testid="detail-remove">
              {t('info.removal_link')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
  return inline ? overlay : createPortal(overlay, document.body);
}

function Front({
  name,
  state,
  stickerSrc,
  silhouetteSrc,
  ownerAvatarSrc,
  colleagueAvatarSrc,
  previewSrc,
  previewCollected,
  developer = false,
}: PetDetailCardProps & { previewSrc: string | null; previewCollected: boolean }) {
  const { t, locale } = useI18n();
  const detail = state.kind === 'ready' ? state.detail : null;
  const full = !!detail && (detail.collected || detail.own);
  const stamp = developer ? developerStampUrl(locale) : null;
  // 大图地址一开始就按被点卡片的收集状态定下，读取完成后通常不变，飞行途中不换图；
  // 起点卡片的小图（如贴纸册 128）垫在下面，大图解码完成盖上后再撤掉，不闪空白
  const src = detail ? (full ? stickerSrc : silhouetteSrc) : previewSrc ? (previewCollected ? stickerSrc : silhouetteSrc) : null;
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);
  const underlay = previewSrc && previewSrc !== src && loadedSrc !== src ? previewSrc : null;
  return (
    <div className={styles.frontBody}>
      <div className={styles.art} data-loading={state.kind === 'loading' && !previewSrc}>
        {underlay && <img className={styles.underlay} src={underlay} alt="" draggable={false} />}
        {src && <img src={src} alt="" draggable={false} decoding="async" onLoad={() => setLoadedSrc(src)} />}
        {full && <Sparks />}
        {stamp && <img className={styles.devStamp} src={stamp} alt={t('report.developer_certified')} draggable={false} data-testid="detail-developer" />}
      </div>
      <h2 className={styles.name}>{detail?.name ?? name}</h2>
      {/* 主人行始终占位：读取完成后出现时，名字不会被顶得跳一下 */}
      <div className={styles.ownerSlot}>
        {full && detail?.owner && (
          <span className={styles.owner}>
            <Avatar name={detail.owner.name} seed={detail.owner.userId} src={ownerAvatarSrc} size={32} />
            {t('pet.owner')} {detail.owner.name}
            {developer && <span className={styles.ownerRole}>· {t('pet.owner_developer')}</span>}
          </span>
        )}
      </div>
      {/* 认识人数区始终占位，落地补上详情时不改变头像与名字的位置。 */}
      <div className={styles.knownBySlot}>
        {full && detail?.knownBy && detail.knownBy.count > 0 && (
          <div className={styles.knownBy}>
            {detail.knownBy.count === 1 ? t('pet.known_by_one') : t('pet.known_by_other', { count: detail.knownBy.count })}
            <AvatarStack
              people={detail.knownBy.recent.map((c) => ({ name: c.name, seed: c.userId, src: colleagueAvatarSrc(c.userId) }))}
              total={detail.knownBy.count}
              moreLabel={(rest) => t('pet.known_by_more', { count: rest })}
              size={24}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function Back({ detail, photoSrc }: { detail: PetDetail; photoSrc: string | null }) {
  const { t } = useI18n();
  const [expanded, setExpanded] = useState(false);
  const excerpt = detail.quote ? quoteExcerpt(detail.quote) : null;
  return (
    <div className={styles.backBody}>
      {photoSrc && <img className={styles.photo} src={photoSrc} alt={detail.name} draggable={false} decoding="async" />}
      {detail.quote && (
        <section className={styles.quote}>
          <h3>{t('pet.owner_quote')}</h3>
          <p>{expanded || !excerpt ? detail.quote : excerpt}</p>
          {excerpt && (
            <button
              type="button"
              className={styles.more}
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(!expanded);
              }}
            >
              {t(expanded ? 'pet.quote_less' : 'pet.quote_more')}
            </button>
          )}
        </section>
      )}
    </div>
  );
}

function FlipHint() {
  return (
    <span className={styles.flipHint} aria-hidden>
      <Icon name="flip-card-vertical-v3" size={28} className={styles.flipIcon} />
    </span>
  );
}

/** 已收集：边框光带。圆环遮罩固定不动，里面的大块渐变只做旋转（合成器动画，不重绘）。 */
function ShineRing() {
  return (
    <span className={styles.shineRing} aria-hidden>
      <span className={styles.shineSpin} />
    </span>
  );
}

/** 已收集卡片正面角落的星光，错开节奏闪烁。 */
function Twinkles() {
  return (
    <>
      {[0, 1, 2, 3].map((i) => (
        <svg key={i} className={styles.twinkle} data-i={i} viewBox="0 0 24 24" aria-hidden>
          <path d="M12 1l2.6 8.4L23 12l-8.4 2.6L12 23l-2.6-8.4L1 12l8.4-2.6z" fill="currentColor" />
        </svg>
      ))}
    </>
  );
}

/** 没有背面资料时的卡背：爪印图案。 */
function Pattern() {
  return (
    <svg className={styles.pattern} viewBox="0 0 100 100" aria-hidden>
      <ellipse cx="50" cy="62" rx="20" ry="16" fill="currentColor" />
      <ellipse cx="28" cy="40" rx="8" ry="10" fill="currentColor" />
      <ellipse cx="42" cy="28" rx="8" ry="10" fill="currentColor" />
      <ellipse cx="58" cy="28" rx="8" ry="10" fill="currentColor" />
      <ellipse cx="72" cy="40" rx="8" ry="10" fill="currentColor" />
    </svg>
  );
}

/** 贴纸两侧的手绘短线，呼应图稿的「闪动」装饰。 */
function Sparks() {
  return (
    <svg className={styles.sparks} viewBox="0 0 200 200" aria-hidden>
      <path d="M22 70l14 12M14 92l18 4M170 120l-14 10M182 138l-18 2" stroke="currentColor" strokeWidth="7" strokeLinecap="round" />
    </svg>
  );
}
