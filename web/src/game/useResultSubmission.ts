import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError, api } from '../api/client';
import type { ResultPayload, SettleResponse } from '../api/types';
import type { SaveState } from '../components/SaveStatus/SaveStatus';
import { petFromLineup } from './pets';

/**
 * 当前报告页提交本局结果。只在内存里保留原对局编号与冻结结果供重试：
 * 离开或刷新即丢弃，不做持久待提交队列或后台补传；重试不改变原局归属。
 */
export function useResultSubmission(gameId: string, playerId: string, payload: ResultPayload, onSaved: (r: SettleResponse) => void) {
  const [state, setState] = useState<SaveState>({ kind: 'saving' });
  const frozen = useRef({ gameId, playerId, payload });
  const savedRef = useRef(onSaved);
  savedRef.current = onSaved;

  const submit = useCallback(async () => {
    setState({ kind: 'saving' });
    const { gameId: id, playerId: who, payload: result } = frozen.current;
    try {
      const response = await api.submitResult(id, who, result);
      setState({ kind: 'saved', response, newPets: response.newCollected.map(petFromLineup) });
      savedRef.current(response);
    } catch (error) {
      // 明确的校验失败：保留报告、说明原因、不反复重试；其他情况可在当前报告重试
      setState(error instanceof ApiError && (error.kind === 'invalid' || error.kind === 'conflict') ? { kind: 'invalid' } : { kind: 'retryable' });
    }
  }, []);

  useEffect(() => {
    void submit();
  }, [submit]);

  return { state, retry: submit };
}
