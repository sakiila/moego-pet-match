import type { CheerKind } from '../game/cheers';

/** 录音已统一到 -18 LUFS；独立人声通道避免再次乘上合成音效的低总增益。 */
const VOICE_LEVEL = 0.85;

/** 只同步播放已经解码的录音；加载完成本身永远不会触发声音。 */
export function createCheerPlayer(getContext: () => AudioContext | null, clips: Record<CheerKind, string>) {
  const buffers = new Map<CheerKind, AudioBuffer>();
  const pending = new Map<CheerKind, Promise<void>>();
  let output: GainNode | null = null;
  let playing: AudioBufferSourceNode | null = null;

  const stop = () => {
    if (!playing) return;
    const source = playing;
    playing = null;
    source.onended = null;
    source.stop();
    source.disconnect();
  };

  return {
    preload: async () => {
      const context = getContext();
      if (!context) return;
      await Promise.all((Object.keys(clips) as CheerKind[]).map((kind) => {
        if (buffers.has(kind)) return;
        const existing = pending.get(kind);
        if (existing) return existing;
        const loading = (async () => {
          try {
            const response = await fetch(clips[kind]);
            if (!response.ok) return;
            const bytes = await response.arrayBuffer();
            buffers.set(kind, await context.decodeAudioData(bytes));
          } catch {
            // 录音不可用时保留视觉反馈；下一次预加载可重试失败项。
          } finally {
            pending.delete(kind);
          }
        })();
        pending.set(kind, loading);
        return loading;
      }));
    },
    play: (kind: CheerKind) => {
      stop();
      const context = getContext();
      const buffer = buffers.get(kind);
      if (!context || context.state !== 'running' || !buffer) return false;
      if (!output) {
        output = context.createGain();
        output.gain.value = VOICE_LEVEL;
        output.connect(context.destination);
      }
      const source = context.createBufferSource();
      source.buffer = buffer;
      source.connect(output);
      source.onended = () => {
        if (playing !== source) return;
        playing = null;
        source.disconnect();
      };
      playing = source;
      source.start();
      return true;
    },
    stop,
  };
}
