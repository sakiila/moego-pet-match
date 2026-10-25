import { useI18n } from '../../i18n';
import { Icon } from '../../ui/primitives/Icon';
import styles from './PhotoNotice.module.css';

export interface PhotoNoticeProps {
  /** 开发者彩蛋：传入毛肚、菠萝的贴纸地址时，用两只并排的小头像代替相机图标（文案里的「铲屎官」有了脸）。 */
  faces?: string[];
}

/** 首页底部常驻的人工处理提示，保留用户指定原句。 */
export function PhotoNotice({ faces }: PhotoNoticeProps) {
  const { t } = useI18n();
  return (
    <p className={styles.notice}>
      {faces?.length ? (
        <span className={styles.faces} aria-hidden>
          {faces.map((src) => (
            <img key={src} className={styles.face} src={src} alt="" draggable={false} />
          ))}
        </span>
      ) : (
        <Icon name="choose-photo" size={28} />
      )}
      <span>{t('home.photo_notice')}</span>
    </p>
  );
}
