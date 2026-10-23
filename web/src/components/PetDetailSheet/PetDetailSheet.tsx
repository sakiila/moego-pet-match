import { useEffect, useState } from 'react';
import type { PetDetail } from '../../api/types';
import { quoteExcerpt } from '../../game/collection';
import { useI18n } from '../../i18n';
import { Avatar } from '../../ui/primitives/Avatar';
import { Button } from '../../ui/primitives/Button';
import { Sheet } from '../../ui/primitives/Sheet';
import styles from './PetDetailSheet.module.css';

export type PetDetailState =
  | { kind: 'loading' }
  | { kind: 'failed' }
  | { kind: 'unlisted' }
  | { kind: 'ready'; detail: PetDetail };

export interface PetDetailSheetProps {
  open: boolean;
  /** 打开时已知的名字（读取详情期间先显示）。 */
  name: string;
  state: PetDetailState;
  stickerSrc: string;
  silhouetteSrc: string;
  /** 处理后照片；无照片时为 null。 */
  photoSrc: string | null;
  ownerAvatarSrc: string | null;
  onClose: () => void;
  onRetry: () => void;
  onOpenShop: () => void;
  inline?: boolean;
}

/**
 * 图鉴详情：正面只有贴纸、名字与主人；翻面看处理后照片与「主人说」。
 * 未收集只给名字、剪影与解锁说明，并可直接开始营业；下架宠物不再打开原详情。
 */
export function PetDetailSheet(props: PetDetailSheetProps) {
  const { open, name, state, onClose, inline } = props;
  const { t } = useI18n();
  const [back, setBack] = useState(false);
  useEffect(() => setBack(false), [open, name]);

  const collected = state.kind === 'ready' && state.detail.collected;
  const badge = collected ? <span className={styles.badge}>🐾 {t('collection.filter_collected')}</span> : null;

  return (
    <Sheet open={open} inline={inline} label={name} closeLabel={t('action.close')} onClose={onClose} badge={badge}>
      <div className={styles.content} data-testid="pet-detail">
        {state.kind === 'ready' && collected && back ? (
          <Back {...props} detail={state.detail} onFlip={() => setBack(false)} />
        ) : (
          <Front {...props} onFlip={() => setBack(true)} />
        )}
      </div>
    </Sheet>
  );
}

function Front({ name, state, stickerSrc, silhouetteSrc, photoSrc, ownerAvatarSrc, onRetry, onOpenShop, onFlip }: PetDetailSheetProps & { onFlip: () => void }) {
  const { t } = useI18n();
  if (state.kind === 'unlisted') return <p className={styles.note}>{t('pet.unlisted')}</p>;
  const detail = state.kind === 'ready' ? state.detail : null;
  const collected = !!detail?.collected;
  const canFlip = collected && (!!photoSrc || !!detail?.quote);
  return (
    <div className={styles.face} key="front">
      <div className={styles.art} data-loading={state.kind === 'loading'}>
        {detail && <img src={collected ? stickerSrc : silhouetteSrc} alt="" />}
        {collected && <Sparks />}
      </div>
      <h2 className={styles.name}>{detail?.name ?? name}</h2>
      {collected && detail?.owner && (
        <span className={styles.owner}>
          <Avatar name={detail.owner.name} seed={detail.owner.userId} src={ownerAvatarSrc} size={32} />
          {t('pet.owner')} {detail.owner.name}
        </span>
      )}
      {state.kind === 'failed' && (
        <Button variant="secondary" onClick={onRetry}>
          {t('action.retry')}
        </Button>
      )}
      {detail && !collected && (
        <>
          <p className={styles.note}>{t('pet.unlock_hint')}</p>
          <Button size="lg" block onClick={onOpenShop}>
            🐾 {t('action.open_shop')}
          </Button>
        </>
      )}
      {canFlip && (
        <>
          <hr className={styles.rule} />
          <Button variant="secondary" size="lg" block onClick={onFlip} icon={<FlipIcon />} data-testid="flip">
            {t('pet.original_photo')}
          </Button>
        </>
      )}
    </div>
  );
}

function Back({ detail, photoSrc, onFlip }: PetDetailSheetProps & { detail: PetDetail; onFlip: () => void }) {
  const { t } = useI18n();
  const [expanded, setExpanded] = useState(false);
  const excerpt = detail.quote ? quoteExcerpt(detail.quote) : null;
  return (
    <div className={`${styles.face} ${styles.flipIn}`} key="back">
      {photoSrc && <img className={styles.photo} src={photoSrc} alt={detail.name} />}
      {detail.quote && (
        <section className={styles.quote}>
          <h3>{t('pet.owner_quote')}</h3>
          <p>{expanded || !excerpt ? detail.quote : excerpt}</p>
          {excerpt && (
            <button type="button" className={styles.more} onClick={() => setExpanded(!expanded)}>
              {t(expanded ? 'pet.quote_less' : 'pet.quote_more')}
            </button>
          )}
        </section>
      )}
      <Button variant="secondary" size="lg" block onClick={onFlip} icon={<FlipIcon />} data-testid="flip-back">
        {t('pet.flip_back')}
      </Button>
    </div>
  );
}

function FlipIcon() {
  return (
    <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden>
      <path d="M4 10a8 8 0 0 1 14-4l2 2M20 4v4h-4M20 14a8 8 0 0 1-14 4l-2-2M4 20v-4h4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
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
