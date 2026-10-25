import { useCallback, useEffect, useRef, useState } from 'react';
import { SHARE_URL } from './shareUrl';

export type ShareCardState = { kind: 'generating' } | { kind: 'ready'; url: string; file: File } | { kind: 'failed' };

/**
 * 生成分享图片（成绩卡、店长海报）并提供保存 / 系统分享。draw 需保持引用稳定（useMemo / useCallback）。打开时生成一次，失败可重试；
 * 分享取消（AbortError）不算失败。所有动作都由玩家主动触发，不自动发送。
 */
export function useShareCard(draw: (() => Promise<Blob>) | null, fileName: string) {
  const [state, setState] = useState<ShareCardState>({ kind: 'generating' });
  const urlRef = useRef<string | null>(null);
  const generationRef = useRef(0);

  const generate = useCallback(async () => {
    if (!draw) return;
    const generation = ++generationRef.current;
    setState({ kind: 'generating' });
    try {
      const blob = await draw();
      if (generation !== generationRef.current) return;
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      const url = URL.createObjectURL(blob);
      urlRef.current = url;
      setState({ kind: 'ready', url, file: new File([blob], fileName, { type: 'image/png' }) });
    } catch {
      if (generation === generationRef.current) setState({ kind: 'failed' });
    }
  }, [draw, fileName]);

  useEffect(() => {
    void generate();
    return () => {
      generationRef.current++;
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    };
  }, [generate]);

  const canShare = state.kind === 'ready' && typeof navigator.canShare === 'function' && navigator.canShare({ files: [state.file], text: SHARE_URL });

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
      await navigator.share({ files: [state.file], text: SHARE_URL });
    } catch (error) {
      if ((error as { name?: string }).name !== 'AbortError') setState({ kind: 'failed' });
    }
  }, [state]);

  return { state, canShare, save, share, retry: generate };
}
