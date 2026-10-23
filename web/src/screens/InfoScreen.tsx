import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client';
import type { DeletionRequestView } from '../api/types';
import { BrandHeader } from '../components/BrandHeader/BrandHeader';
import { DeletionStatus } from '../components/DeletionStatus/DeletionStatus';
import { InfoSections } from '../components/InfoSections/InfoSections';
import { useDeletionRequest } from '../game/useDeletionRequest';
import { useI18n } from '../i18n';
import { Button } from '../ui/primitives/Button';
import { DeletionRequestOverlay } from './DeletionRequestOverlay';
import styles from './Screen.module.css';

export interface InfoScreenProps {
  /** 当前身份（身份页上为选中的同事）；没有身份时不能提交删除申请。 */
  player: { userId: string; name: string } | null;
  onBack: () => void;
  /** 打开后直接展开一般删除申请（从页尾「资料删除申请」进入）。 */
  openRemoval?: boolean;
  loadRequests?: (playerId: string) => Promise<DeletionRequestView[]>;
}

/** 完整信息使用说明 + 一般删除申请入口与本人申请的简单状态（待处理 / 已处理）。 */
export function InfoScreen({ player, onBack, openRemoval = false, loadRequests = api.getDeletionRequests }: InfoScreenProps) {
  const { t } = useI18n();
  const [requests, setRequests] = useState<DeletionRequestView[]>([]);
  const refresh = useCallback(async () => {
    if (!player) return;
    try {
      setRequests(await loadRequests(player.userId));
    } catch {
      // 状态只是辅助信息，读取失败时不展示
    }
  }, [loadRequests, player]);
  const removal = useDeletionRequest(player?.userId ?? null, refresh);

  useEffect(() => {
    void refresh();
    if (openRemoval && player) removal.open({ kind: 'general' });
  }, []);

  return (
    <main className={styles.screen}>
      <BrandHeader heading={t('info.full.title')} onBack={onBack} />
      <InfoSections playerName={player?.name ?? null} />
      {requests.length > 0 && (
        <div className={styles.list} data-testid="my-requests">
          {requests.map((r) => (
            <DeletionStatus key={r.requestId} status={r.status} label={r.petName ?? t('info.removal_link')} />
          ))}
        </div>
      )}
      <Button variant="secondary" block onClick={() => removal.open({ kind: 'general' })} disabled={!player} data-testid="general-removal">
        {t('info.removal_link')}
      </Button>
      <DeletionRequestOverlay target={removal.target} onSubmit={removal.submit} onClose={removal.close} />
    </main>
  );
}
