import type { SettleResponse } from '../../api/types';
import type { PetInfo } from '../../game/pets';
import { useI18n } from '../../i18n';
import { FishInvitation } from '../FishInvitation/FishInvitation';
import { NewCollection } from '../NewCollection/NewCollection';
import { StatusMessage } from '../StatusMessage/StatusMessage';
import styles from './SaveStatus.module.css';

export type SaveState =
  | { kind: 'saving' }
  | { kind: 'saved'; response: SettleResponse; newPets: PetInfo[] }
  | { kind: 'retryable' }
  | { kind: 'invalid' };

/**
 * 报告页保存状态：提交中 / 已记录 / 暂未确认可重试 / 校验未通过。
 * 只有已记录才显示个人新纪录、本局新收集与鱼关邀请；失败不伪装成功，校验失败不重试。
 */
export function SaveStatus({ state, onRetry }: { state: SaveState; onRetry: () => void }) {
  const { t } = useI18n();
  switch (state.kind) {
    case 'saving':
      return <StatusMessage text={t('report.saving')} />;
    case 'retryable':
      return <StatusMessage tone="error" text={t('report.sync_retryable')} actionLabel={t('report.sync_retry')} onAction={onRetry} />;
    case 'invalid':
      return <StatusMessage tone="error" text={t('report.validation_failed')} />;
    case 'saved':
      return (
        <div className={styles.box} data-testid="save-saved">
          <StatusMessage text={`✓ ${t('report.saved')}`} />
          {state.response.personalBest.isNew && <span className={styles.badge}>{t('report.personal_best')}</span>}
          <NewCollection pets={state.newPets} />
          {state.response.progress.unlockedNow && <FishInvitation />}
        </div>
      );
  }
}
