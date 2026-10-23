import { useCallback, useState } from 'react';
import { api } from '../api/client';

/** 要申请移除的对象：某只自家宠物，或不针对宠物的一般申请。 */
export type DeletionTarget = { kind: 'pet'; petId: string; name: string; ownerName: string } | { kind: 'general' };

/** 打开 / 关闭删除申请弹层并提交；提交成功后调用 onSubmitted（用于刷新状态）。 */
export function useDeletionRequest(playerId: string | null, onSubmitted?: () => void) {
  const [target, setTarget] = useState<DeletionTarget | null>(null);
  const submit = useCallback(
    async (note: string) => {
      if (!playerId || !target) throw new Error('no player');
      await api.requestDeletion(playerId, target.kind === 'pet' ? target.petId : null, note);
      onSubmitted?.();
    },
    [playerId, target, onSubmitted],
  );
  return { target, open: setTarget, close: useCallback(() => setTarget(null), []), submit };
}
