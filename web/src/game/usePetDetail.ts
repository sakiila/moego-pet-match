import { useCallback, useRef, useState } from 'react';
import { ApiError, api } from '../api/client';
import type { PetDetail } from '../api/types';
import type { PetDetailState } from '../components/PetDetailSheet/PetDetailSheet';

export interface OpenPet {
  petId: string;
  name: string;
  state: PetDetailState;
}

/** 打开图鉴详情：按需读取；下架（404）显示「已下架」，读取失败可重试，不当作下架。 */
export function usePetDetail(playerId: string, load: (petId: string, playerId: string) => Promise<PetDetail> = api.getPetDetail) {
  const [open, setOpen] = useState<OpenPet | null>(null);
  const latest = useRef<string | null>(null);

  const fetchDetail = useCallback(
    async (petId: string, name: string) => {
      latest.current = petId;
      setOpen({ petId, name, state: { kind: 'loading' } });
      let state: PetDetailState;
      try {
        const detail = await load(petId, playerId);
        state = detail.listed ? { kind: 'ready', detail } : { kind: 'unlisted' };
      } catch (error) {
        state = error instanceof ApiError && error.kind === 'not_found' ? { kind: 'unlisted' } : { kind: 'failed' };
      }
      if (latest.current === petId) setOpen({ petId, name, state });
    },
    [load, playerId],
  );

  const close = useCallback(() => {
    latest.current = null;
    setOpen(null);
  }, []);

  return { open, show: fetchDetail, close };
}
