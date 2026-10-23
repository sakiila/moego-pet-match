import { useCallback, useEffect, useRef, useState } from 'react';
import type { GameMode } from '../api/types';
import { drawShareCard } from '../ui/canvas/drawShareCard';
import type { ShareCardModel } from './shareCard';

export type ShareCardState = { kind: 'generating' } | { kind: 'ready'; url: string; file: File } | { kind: 'failed' };

/**
 * 生成成绩卡图片并提供保存 / 系统分享。打开时生成一次，失败可重试；
 * 分享取消（AbortError）不算失败。所有动作都由玩家主动触发，不自动发送。
 */
export function useShareCard(model: ShareCardModel | null, mode: GameMode, fileName: string) {
  const [state, setState] = useState<ShareCardState>({ kind: 'generating' });
  const urlRef = useRef<string | null>(null);

  const generate = useCallback(async () => {
    if (!model) return;
    setState({ kind: 'generating' });
    try {
      const blob = await drawShareCard(model, mode);
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      const url = URL.createObjectURL(blob);
      urlRef.current = url;
      setState({ kind: 'ready', url, file: new File([blob], fileName, { type: 'image/png' }) });
    } catch {
      setState({ kind: 'failed' });
    }
  }, [model, mode, fileName]);

  useEffect(() => {
    void generate();
  }, [generate]);

  useEffect(
    () => () => {
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    },
    [],
  );

  const canShare = state.kind === 'ready' && typeof navigator.canShare === 'function' && navigator.canShare({ files: [state.file] });

  const save = useCallback(() => {
    if (state.kind !== 'ready') return;
    const a = document.createElement('a');
    a.href = state.url;
    a.download = fileName;
    a.click();
  }, [state, fileName]);

  const share = useCallback(async () => {
    if (state.kind !== 'ready') return;
    try {
      await navigator.share({ files: [state.file] });
    } catch (error) {
      if ((error as { name?: string }).name !== 'AbortError') setState({ kind: 'failed' });
    }
  }, [state]);

  return { state, canShare, save, share, retry: generate };
}
