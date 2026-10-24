import { useI18n } from '../../i18n';
import { Button } from '../../ui/primitives/Button';
import { Icon } from '../../ui/primitives/Icon';
import styles from './UploadReceived.module.css';

/** 上传成功：只表示资料已收到，后续人工处理；不提示已上架，也不立即进入阵容。 */
export function UploadReceived({ petName, onPlay, onHome }: { petName: string; onPlay: () => void; onHome: () => void }) {
  const { t } = useI18n();
  return (
    <section className={styles.box} data-testid="upload-received">
      <Icon name="completed-mark" size={72} />
      <p className={styles.pet}>{petName}</p>
      <p className={styles.message}>{t('upload.received')}</p>
      <div className={styles.actions}>
        <Button size="lg" block iconName="open-shop-white" onClick={onPlay} data-testid="upload-play">
          {t('action.keep_playing')}
        </Button>
        <Button size="lg" block variant="secondary" iconName="back-to-shop" onClick={onHome}>
          {t('action.back_to_shop')}
        </Button>
      </div>
    </section>
  );
}
