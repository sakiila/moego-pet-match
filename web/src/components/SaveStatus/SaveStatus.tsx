import type { SettleResponse } from '../../api/types';
import type { PetInfo } from '../../game/pets';
import { useI18n } from '../../i18n';
import { StatusMessage } from '../StatusMessage/StatusMessage';

export type SaveState =
  | { kind: 'saving' }
  | { kind: 'saved'; response: SettleResponse; newPets: PetInfo[] }
  | { kind: 'retryable' }
  | { kind: 'invalid' };

/**
 * 报告页保存状态说明：提交中 / 暂未确认可重试 / 校验未通过。已记录时由分数卡上的标记承接，这里不再重复。
 * 失败不伪装成功，校验失败不重试。
 */
export function SaveStatus({ state, onRetry }: { state: SaveState; onRetry: () => void }) {
  const { t } = useI18n();
  switch (state.kind) {
    case 'saving':
      return <StatusMessage text={t('report.saving')} />;
    case 'retryable':
      return <StatusMessage tone="error" text={t('report.sync_retryable')} actionLabel={t('report.sync_retry')} actionIcon="retry" onAction={onRetry} />;
    case 'invalid':
      return <StatusMessage tone="error" text={t('report.validation_failed')} />;
    case 'saved':
      return null;
  }
}
