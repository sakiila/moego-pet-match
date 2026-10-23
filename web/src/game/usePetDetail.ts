import { useCallback, useRef, useState } from 'react';
import { ApiError, api } from '../api/client';
import type { PetDetail } from '../api/types';
import type { PetDetailState } from '../components/PetDetailCard/PetDetailCard';

export interface OpenPet {
  petId: string;
  name: string;
  state: PetDetailState;
  /** 被点开的列表卡片，详情卡从它飞出、关闭时飞回。 */
  origin: HTMLElement | null;
}

/** 打开图鉴详情：按需读取；下架（404）显示「已下架」，读取失败可重试，不当作下架。 */
export function usePetDetail(playerId: string, load: (petId: string, playerId: string) => Promise<PetDetail> = api.getPetDetail) {
  const [open, setOpen] = useState<OpenPet | null>(null);
  const latest = useRef<string | null>(null);
  const openRef = useRef<OpenPet | null>(null);
  openRef.current = open;

  const fetchDetail = useCallback(
    async (petId: string, name: string, origin?: HTMLElement | null) => {
      latest.current = petId;
      // 重试时沿用第一次点开的卡片
      const from = origin ?? openRef.current?.origin ?? null;
      setOpen({ petId, name, state: { kind: 'loading' }, origin: from });
      let state: PetDetailState;
      try {
        const detail = await load(petId, playerId);
        state = detail.listed ? { kind: 'ready', detail } : { kind: 'unlisted' };
      } catch (error) {
        state = error instanceof ApiError && error.kind === 'not_found' ? { kind: 'unlisted' } : { kind: 'failed' };
      }
      if (latest.current === petId) setOpen({ petId, name, state, origin: from });
    },
    [load, playerId],
  );

  const close = useCallback(() => {
    latest.current = null;
    setOpen(null);
  }, []);

  return { open, show: fetchDetail, close };
}
