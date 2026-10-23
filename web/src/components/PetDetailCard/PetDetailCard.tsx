import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import type { PetDetail } from '../../api/types';
import { quoteExcerpt } from '../../game/collection';
import { useI18n } from '../../i18n';
import { Avatar } from '../../ui/primitives/Avatar';
import { Button } from '../../ui/primitives/Button';
import { Tilt } from '../Tilt/Tilt';
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
  /** 被点开的列表卡片：从它的位置翻转飞出，关闭时飞回它当前所在的位置；缺省时淡入淡出。 */
  origin?: HTMLElement | null;
  onClose: () => void;
  onRetry: () => void;
  onOpenShop: () => void;
  /** 自家宠物：打开资料删除申请（低强调入口）。 */
  onRequestRemoval?: () => void;
  /** 陈列页：不飞行、不遮罩全屏，直接静态展示。 */
  inline?: boolean;
}

const OPEN_MS = 640;
const CLOSE_MS = 520;
const OPEN_EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';
const CLOSE_EASE = 'cubic-bezier(0.5, 0, 0.2, 1)';

const reduced = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/** 起点卡片相对终点卡片中心的位移与按宽度的缩放。 */
function moveTo(from: DOMRect, to: DOMRect) {
  const dx = from.left + from.width / 2 - (to.left + to.width / 2);
  const dy = from.top + from.height / 2 - (to.top + to.height / 2);
  return `translate(${dx}px, ${dy}px) scale(${from.width / to.width})`;
}

/**
 * 图鉴详情卡：点开时列表里的卡片翻转着飞到屏幕中央，点遮罩或右上角关闭就翻转着收回原位。
 * 落地先显示正面（贴纸、名字、主人）；点卡片本身翻到背面（处理后照片与「主人说」），再点翻回。
 * 未收集只给名字、剪影与解锁说明；自家宠物即使未收集也显示完整资料。开始营业、重试、资料删除申请放在卡片下方。
 */
export function PetDetailCard(props: PetDetailCardProps) {
  const { name, state, origin, onClose, onRetry, onOpenShop, onRequestRemoval, inline } = props;
  const { t } = useI18n();
  const [flipped, setFlipped] = useState(false);
  const [closing, setClosing] = useState(false);
  const flyRef = useRef<HTMLDivElement>(null);
  const flipperRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  const detail = state.kind === 'ready' ? state.detail : null;
  const collected = !!detail?.collected;
  const full = collected || !!detail?.own;
  const canFlip = full && (!!props.photoSrc || !!detail?.quote);

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
      return;
    }
    origin!.style.visibility = 'hidden';
    fly.animate([{ transform: moveTo(from, fly.getBoundingClientRect()) }, { transform: 'none' }], { duration: OPEN_MS, easing: OPEN_EASE });
    flipper.animate([{ transform: 'rotateY(0deg)' }, { transform: 'rotateY(360deg)' }], { duration: OPEN_MS, easing: OPEN_EASE });
    return () => {
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
    const done = fly.animate([{ transform: 'none' }, { transform: moveTo(to, fly.getBoundingClientRect()) }], { duration: CLOSE_MS, easing: CLOSE_EASE, fill: 'forwards' });
    // 背面时只转半圈回到正面，落回原位时与列表里的卡片同一面
    flipper.animate([{ transform: `rotateY(${flipped ? 180 : 0}deg)` }, { transform: 'rotateY(360deg)' }], { duration: CLOSE_MS, easing: CLOSE_EASE, fill: 'forwards' });
    void done.finished.then(() => {
      if (origin) origin.style.visibility = '';
      onClose();
    });
  };

  useEffect(() => {
    if (inline) return;
    const onKey = (e: globalThis.KeyboardEvent) => e.key === 'Escape' && close();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const flip = () => canFlip && !closing && setFlipped((f) => !f);
  const onKey = (e: KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target === e.currentTarget) {
      e.preventDefault();
      flip();
    }
  };

  const overlay = (
    <div className={`${styles.overlay} ${inline ? styles.inline : ''}`} role="dialog" aria-modal="true" aria-label={detail?.name ?? name} data-testid="pet-detail" data-closing={closing || undefined}>
      <div className={styles.backdrop} ref={backdropRef} onClick={close} aria-hidden />
      <button type="button" className={styles.close} onClick={close} aria-label={t('action.close')} data-testid="detail-close">
        <svg viewBox="0 0 24 24" aria-hidden>
          <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
        </svg>
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
                <div className={`${styles.face} ${styles.front}`} data-shine={collected || undefined} data-testid="detail-front">
                  <Front {...props} />
                  {collected && <Twinkles />}
                </div>
                <div className={`${styles.face} ${styles.back}`} data-shine={collected || undefined} data-testid="detail-back">
                  {full && detail ? <Back detail={detail} photoSrc={props.photoSrc} /> : <Pattern />}
                </div>
              </div>
            </div>
          </Tilt>
        </div>
        <div className={styles.actions}>
          {state.kind === 'unlisted' && <p className={styles.note}>{t('pet.unlisted')}</p>}
          {state.kind === 'failed' && (
            <Button variant="secondary" onClick={onRetry}>
              {t('action.retry')}
            </Button>
          )}
          {detail && !collected && (
            <>
              <p className={styles.note}>{t('pet.unlock_hint')}</p>
              {/* 自家宠物从「我的宠物」查看完整资料，不在这里引导开局（图稿 mobile-my-pets-v1） */}
              {!detail.own && (
                <Button size="lg" onClick={onOpenShop}>
                  🐾 {t('action.open_shop')}
                </Button>
              )}
            </>
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

function Front({ name, state, stickerSrc, silhouetteSrc, ownerAvatarSrc }: PetDetailCardProps) {
  const { t } = useI18n();
  const detail = state.kind === 'ready' ? state.detail : null;
  const full = !!detail && (detail.collected || detail.own);
  return (
    <div className={styles.frontBody}>
      <div className={styles.art} data-loading={state.kind === 'loading'}>
        {detail && <img src={full ? stickerSrc : silhouetteSrc} alt="" draggable={false} />}
        {full && <Sparks />}
      </div>
      <h2 className={styles.name}>{detail?.name ?? name}</h2>
      {full && detail?.owner && (
        <span className={styles.owner}>
          <Avatar name={detail.owner.name} seed={detail.owner.userId} src={ownerAvatarSrc} size={32} />
          {t('pet.owner')} {detail.owner.name}
        </span>
      )}
    </div>
  );
}

function Back({ detail, photoSrc }: { detail: PetDetail; photoSrc: string | null }) {
  const { t } = useI18n();
  const [expanded, setExpanded] = useState(false);
  const excerpt = detail.quote ? quoteExcerpt(detail.quote) : null;
  return (
    <div className={styles.backBody}>
      {photoSrc && <img className={styles.photo} src={photoSrc} alt={detail.name} draggable={false} />}
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
