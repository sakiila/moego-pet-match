type AudioOutput = { ctx: AudioContext; out: AudioNode };
type Voice = { ctx: AudioContext; source: AudioBufferSourceNode; gain: GainNode; startedAt: number };

/** 按需解码一次；异步加载可取消播放意图，停止后保留曲中位置。 */
export function createLoopMusic(getAudio: () => AudioOutput | null, url: string, level: number) {
  let buffer: AudioBuffer | null = null;
  let loading: Promise<void> | null = null;
  let wanted = false;
  let playing: Voice | null = null;
  let offset = 0;
  const voices = new Set<Voice>();

  const release = (voice: Voice) => {
    if (!voices.delete(voice)) return;
    voice.source.onended = null;
    voice.source.disconnect();
    voice.gain.disconnect();
  };

  const load = async (ctx: AudioContext) => {
    try {
      const response = await fetch(url);
      if (!response.ok) return;
      buffer = await ctx.decodeAudioData(await response.arrayBuffer());
    } catch {
      // 网络或解码失败保持静音；后续操作可以重试，不阻塞页面。
    } finally {
      loading = null;
    }
  };

  return {
    start: async () => {
      wanted = true;
      const audio = getAudio();
      if (!audio || playing) return;
      if (!buffer) {
        loading ??= load(audio.ctx);
        await loading;
      }
      if (!wanted || playing || !buffer || audio.ctx.state !== 'running') return;
      const { ctx, out } = audio;
      const source = ctx.createBufferSource();
      const gain = ctx.createGain();
      source.buffer = buffer;
      source.loop = true;
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(level, ctx.currentTime + .35);
      source.connect(gain);
      gain.connect(out);
      const voice = { ctx, source, gain, startedAt: ctx.currentTime };
      voices.add(voice);
      playing = voice;
      source.onended = () => release(voice);
      source.start(ctx.currentTime, offset);
    },
    stop: (fadeSeconds = 0) => {
      wanted = false;
      if (playing && buffer) {
        offset = (offset + Math.max(0, playing.ctx.currentTime - playing.startedAt)) % buffer.duration;
      }
      const current = playing;
      playing = null;
      if (fadeSeconds > 0 && current) {
        const now = current.ctx.currentTime;
        current.gain.gain.cancelScheduledValues(now);
        current.gain.gain.setValueAtTime(current.gain.gain.value, now);
        current.gain.gain.linearRampToValueAtTime(0, now + fadeSeconds);
        current.source.stop(now + fadeSeconds);
      } else if (fadeSeconds === 0) {
        // 即使上一首正在淡出，切后台前也彻底断开，防止恢复时残音复活。
        for (const voice of voices) {
          voice.source.stop(voice.ctx.currentTime);
          release(voice);
        }
      }
    },
  };
}
