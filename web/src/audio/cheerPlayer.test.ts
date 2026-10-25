import { afterEach, describe, expect, it, vi } from 'vitest';
import { createCheerPlayer } from './cheerPlayer';

const clips = { nice: '/nice.mp3', great: '/great.mp3', amazing: '/amazing.mp3', wow: '/wow.mp3' };

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
}

function audio() {
  const sources: Array<{
    buffer: AudioBuffer | null;
    onended: (() => void) | null;
    connect: ReturnType<typeof vi.fn>;
    disconnect: ReturnType<typeof vi.fn>;
    start: ReturnType<typeof vi.fn>;
    stop: ReturnType<typeof vi.fn>;
  }> = [];
  const gain = { gain: { value: 0 }, connect: vi.fn() };
  const context = {
    state: 'running',
    destination: {},
    createGain: vi.fn(() => gain),
    createBufferSource: vi.fn(() => {
      const source = { buffer: null, onended: null, connect: vi.fn(), disconnect: vi.fn(), start: vi.fn(), stop: vi.fn() };
      sources.push(source);
      return source;
    }),
    decodeAudioData: vi.fn(async () => ({ duration: 0.6 }) as AudioBuffer),
  };
  return { context, sources, gain, player: createCheerPlayer(() => context as unknown as AudioContext, clips) };
}

afterEach(() => { vi.unstubAllGlobals(); });

describe('cheer voice channel', () => {
  it('preloads all four clips once without starting a voice', async () => {
    const fetch = vi.fn(async (_url: string) => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(1) }));
    vi.stubGlobal('fetch', fetch);
    const { player, context, sources } = audio();

    await Promise.all([player.preload(), player.preload()]);
    await player.preload();

    expect(fetch.mock.calls.map((call) => call[0])).toEqual(Object.values(clips));
    expect(context.decodeAudioData).toHaveBeenCalledTimes(4);
    expect(sources).toHaveLength(0);
  });

  it('drops an unready cheer instead of playing it after decoding completes', async () => {
    const decoded = deferred<AudioBuffer>();
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(1) })));
    const { player, context, sources } = audio();
    context.decodeAudioData.mockImplementation(() => decoded.promise);
    const loading = player.preload();

    expect(player.play('nice')).toBe(false);
    player.stop();
    decoded.resolve({ duration: 0.6 } as AudioBuffer);
    await loading;

    expect(sources).toHaveLength(0);
    expect(player.play('great')).toBe(true);
    expect(sources[0].start).toHaveBeenCalledOnce();
  });

  it('replaces the current voice and ignores the old source ending later', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(1) })));
    const { player, sources } = audio();
    await player.preload();

    player.play('nice');
    const oldEnded = sources[0].onended;
    player.play('great');
    expect(sources[0].stop).toHaveBeenCalledOnce();
    expect(sources[0].disconnect).toHaveBeenCalledOnce();
    oldEnded?.();
    player.play('amazing');

    expect(sources[1].stop).toHaveBeenCalledOnce();
    expect(sources[2].start).toHaveBeenCalledOnce();
  });

  it('stops immediately and remains stopped when the context resumes', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(1) })));
    const { player, context, sources } = audio();
    await player.preload();
    player.play('wow');

    player.stop();
    player.stop();
    context.state = 'suspended';
    expect(player.play('nice')).toBe(false);
    context.state = 'running';

    expect(sources).toHaveLength(1);
    expect(sources[0].stop).toHaveBeenCalledOnce();
    expect(sources[0].disconnect).toHaveBeenCalledOnce();
  });

  it('keeps successful clips usable after a load failure and retries only the failed clip', async () => {
    const fetch = vi.fn(async (url: string) => ({ ok: url !== clips.nice, arrayBuffer: async () => new ArrayBuffer(1) }));
    vi.stubGlobal('fetch', fetch);
    const { player } = audio();
    await expect(player.preload()).resolves.toBeUndefined();

    expect(player.play('nice')).toBe(false);
    expect(player.play('great')).toBe(true);
    fetch.mockImplementation(async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(1) }));
    await player.preload();

    expect(fetch).toHaveBeenCalledTimes(5);
    expect(player.play('nice')).toBe(true);
  });

  it('cancels the old voice even when the replacement clip is unavailable', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url: string) => ({ ok: url !== clips.nice, arrayBuffer: async () => new ArrayBuffer(1) })));
    const { player, sources } = audio();
    await player.preload();
    player.play('great');

    expect(player.play('nice')).toBe(false);

    expect(sources[0].stop).toHaveBeenCalledOnce();
    expect(sources).toHaveLength(1);
  });

  it('handles decode failures without starting any speech or rejecting preload', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(1) })));
    const { player, context, sources } = audio();
    context.decodeAudioData.mockRejectedValue(new Error('unsupported clip'));

    await expect(player.preload()).resolves.toBeUndefined();

    expect(player.play('nice')).toBe(false);
    expect(sources).toHaveLength(0);
  });

  it('uses a dedicated calibrated voice gain connected directly to the output', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(1) })));
    const { player, context, gain, sources } = audio();
    await player.preload();
    player.play('nice');

    expect(gain.gain.value).toBe(0.85);
    expect(gain.connect).toHaveBeenCalledWith(context.destination);
    expect(sources[0].connect).toHaveBeenCalledWith(gain);
  });

  it('stays silent without WebAudio and does not fetch unused clips', async () => {
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    const player = createCheerPlayer(() => null, clips);

    await player.preload();

    expect(player.play('nice')).toBe(false);
    expect(() => player.stop()).not.toThrow();
    expect(fetch).not.toHaveBeenCalled();
  });
});
