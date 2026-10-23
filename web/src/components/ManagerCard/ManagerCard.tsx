import { useState } from 'react';
import { useI18n } from '../../i18n';
import styles from './ManagerCard.module.css';

export interface ManagerCardProps {
  name: string;
  stickerSrc: string;
  /** shop：门店橱窗与上班宣言；signature：报告末尾的形象与签名。 */
  variant?: 'shop' | 'signature';
  /** 门店：点店长打开店长小海报（不自动弹出）。 */
  onOpen?: () => void;
}

/** 今日店长：全公司同一只；宣言为游戏模板台词，不冒充主人原话。 */
export function ManagerCard({ name, stickerSrc, variant = 'shop', onOpen }: ManagerCardProps) {
  const { t } = useI18n();
  const [failed, setFailed] = useState(false);
  // 贴纸读取失败时保留同尺寸空位，橱窗布局不塌
  const sticker = failed ? (
    <span className={styles.sticker} aria-hidden />
  ) : (
    <img className={styles.sticker} src={stickerSrc} alt="" onError={() => setFailed(true)} />
  );
  const plate = (
    <span className={styles.plate}>
      {t('home.manager')} · {name}
    </span>
  );

  if (variant === 'signature') {
    return (
      <figure className={styles.signature} data-testid="manager-signature">
        <span className={styles.avatar}>{sticker}</span>
        <figcaption>
          {plate}
          <q>{t('home.manager_line')}</q>
        </figcaption>
      </figure>
    );
  }

  return (
    <figure className={styles.shop} data-testid="manager-card">
      {onOpen && <button type="button" className={styles.open} onClick={onOpen} aria-label={t('manager.poster_title')} data-testid="manager-open" />}
      <span className={styles.awning} aria-hidden />
      <div className={styles.window}>
        <span className={styles.bubble}>{t('home.manager_line')}</span>
        {sticker}
        <span className={styles.counter} aria-hidden>
          🐾
        </span>
        <figcaption className={styles.caption}>{plate}</figcaption>
      </div>
    </figure>
  );
}
