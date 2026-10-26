import { afterEach, describe, expect, it, vi } from 'vitest';
import { createLoopMusic } from './loopMusic';

function setup() {
  const sources: Array<{
    buffer: AudioBuffer | null; loop: boolean; onended: (() => void) | null;
    connect: ReturnType<typeof vi.fn>; disconnect: ReturnType<typeof vi.fn>;
    start: ReturnType<typeof vi.fn>; stop: ReturnType<typeof vi.fn>;
  }> = [];
  const out = {};
  const context = {
    state: 'running', currentTime: 10,
    createGain: vi.fn(() => ({
      gain: { value: 0, setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn(), cancelScheduledValues: vi.fn() },
      connect: vi.fn(), disconnect: vi.fn(),
    })),
    createBufferSource: vi.fn(() => {
      const source = { buffer: null, loop: false, onended: null, connect: vi.fn(), disconnect: vi.fn(), start: vi.fn(), stop: vi.fn() };
      sources.push(source);
      return source;
    }),
    decodeAudioData: vi.fn(async () => ({ duration: 76.8 }) as AudioBuffer),
  };
  const fetch = vi.fn(async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(1) }));
  vi.stubGlobal('fetch', fetch);
  const player = createLoopMusic(() => ({ ctx: context as unknown as AudioContext, out: out as AudioNode }), '/lobby.mp3', .55);
  return { player, context, sources, fetch };
}

afterEach(() => { vi.unstubAllGlobals(); });

describe('lobby music lifecycle', () => {
  it('loads on demand and keeps one uninterrupted loop across repeated starts', async () => {
    const { player, sources, fetch } = setup();
    expect(fetch).not.toHaveBeenCalled();

    await Promise.all([player.start(), player.start()]);
    await player.start();

    expect(fetch).toHaveBeenCalledOnce();
    expect(sources).toHaveLength(1);
    expect(sources[0].loop).toBe(true);
    expect(sources[0].start).toHaveBeenCalledWith(10, 0);
  });

  it('does not start when loading finishes after music is disabled or the page is hidden', async () => {
    const { player, context, sources } = setup();
    let finish!: (buffer: AudioBuffer) => void;
    context.decodeAudioData.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
    const loading = player.start();
    await vi.waitFor(() => expect(context.decodeAudioData).toHaveBeenCalledOnce());
    player.stop();
    finish({ duration: 76.8 } as AudioBuffer);
    await loading;

    expect(sources).toHaveLength(0);
  });

  it('resumes from the previous position after the board or background, including wraparound', async () => {
    const { player, context, sources } = setup();
    await player.start();
    context.currentTime = 90; // 80 seconds later, slightly beyond one loop.
    player.stop();
    context.currentTime = 150;
    await player.start();

    expect(sources[0].stop).toHaveBeenCalledWith(90);
    expect(sources[0].disconnect).toHaveBeenCalledOnce();
    expect(sources[1].start.mock.calls[0][0]).toBe(150);
    expect(sources[1].start.mock.calls[0][1]).toBeCloseTo(3.2);
  });

  it('immediately cancels fading voices before suspending the context', async () => {
    const { player, context, sources } = setup();
    await player.start();
    player.stop(.12);
    expect(sources[0].stop).toHaveBeenCalledWith(10.12);
    context.currentTime = 10.03;
    player.stop();

    expect(sources[0].stop).toHaveBeenLastCalledWith(10.03);
    expect(sources[0].disconnect).toHaveBeenCalledOnce();
  });

  it('retries loading after a network failure and uses the cached buffer thereafter', async () => {
    const { player, sources, fetch } = setup();
    fetch.mockRejectedValueOnce(new Error('offline'));
    await expect(player.start()).resolves.toBeUndefined();
    expect(sources).toHaveLength(0);
    await player.start();
    player.stop();
    await player.start();

    expect(fetch).toHaveBeenCalledTimes(2);
    expect(sources).toHaveLength(2);
  });

  it('waits for audio to be running and never fetches when WebAudio is unavailable', async () => {
    const { player, context, sources, fetch } = setup();
    context.state = 'suspended';
    await player.start();
    expect(sources).toHaveLength(0);
    context.state = 'running';
    await player.start();
    expect(sources).toHaveLength(1);

    fetch.mockClear();
    const unavailable = createLoopMusic(() => null, '/lobby.mp3', .55);
    await unavailable.start();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('allows a fresh start after a decoding failure', async () => {
    const { player, context, sources } = setup();
    context.decodeAudioData.mockRejectedValueOnce(new Error('invalid audio'));
    await expect(player.start()).resolves.toBeUndefined();
    expect(sources).toHaveLength(0);
    await player.start();
    expect(sources).toHaveLength(1);
  });
});
