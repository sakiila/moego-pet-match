import { useI18n } from '../../i18n';
import { Avatar } from '../../ui/primitives/Avatar';
import styles from './OwnerRow.module.css';

/** 上传的主人：固定为当前游戏身份，只读展示，不提供修改入口。 */
export function OwnerRow({ name, userId, avatarSrc }: { name: string; userId: string; avatarSrc: string }) {
  const { t } = useI18n();
  return (
    <div className={styles.wrap}>
      <div className={styles.row}>
        <Avatar name={name} seed={userId} src={avatarSrc} size={44} />
        <span className={styles.name}>{t('upload.owner', { ownerName: name })}</span>
      </div>
      <p className={styles.hint}>{t('upload.owner_hint')}</p>
    </div>
  );
}
