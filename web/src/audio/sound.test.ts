import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe('audio unlock completion', () => {
  it('waits for a suspended context to finish resuming', async () => {
    let finishResume!: () => void;
    const resumed = new Promise<void>((resolve) => { finishResume = resolve; });
    const context = {
      state: 'suspended', destination: {},
      createGain: () => ({ gain: { value: 0 }, connect: vi.fn() }),
      resume: vi.fn(() => resumed),
    };
    vi.stubGlobal('window', { AudioContext: class { constructor() { return context; } } });
    const sound = await import('./sound');

    let complete = false;
    const unlocking = sound.unlockAudio();
    void Promise.resolve(unlocking).then(() => { complete = true; });
    await Promise.resolve();

    expect(context.resume).toHaveBeenCalledOnce();
    expect(complete).toBe(false);
    finishResume();
    await unlocking;
    expect(complete).toBe(true);
  });

  it('returns a resolved promise when the context is already running', async () => {
    const context = {
      state: 'running', destination: {},
      createGain: () => ({ gain: { value: 0 }, connect: vi.fn() }),
      resume: vi.fn(),
    };
    vi.stubGlobal('window', { AudioContext: class { constructor() { return context; } } });
    const sound = await import('./sound');

    const unlocking = sound.unlockAudio();

    expect(unlocking).toBeInstanceOf(Promise);
    await expect(unlocking).resolves.toBeUndefined();
    expect(context.resume).not.toHaveBeenCalled();
  });

  it('returns a resolved promise when WebAudio is unavailable', async () => {
    vi.stubGlobal('window', {});
    const sound = await import('./sound');

    const unlocking = sound.unlockAudio();

    expect(unlocking).toBeInstanceOf(Promise);
    await expect(unlocking).resolves.toBeUndefined();
  });
});

describe('recorded cheer sound integration', () => {
  it('cancels the voice before suspending WebAudio so returning cannot resume speech', async () => {
    const order: string[] = [];
    const stop = vi.fn(() => { order.push('stop'); });
    const source = { connect: vi.fn(), disconnect: vi.fn(), start: vi.fn(), stop, buffer: null, onended: null };
    const context = {
      state: 'running', destination: {},
      createGain: () => ({ gain: { value: 0 }, connect: vi.fn() }),
      decodeAudioData: async () => ({ duration: 0.6 }),
      createBufferSource: () => source,
      suspend: vi.fn(async () => { order.push('suspend'); }),
    };
    vi.stubGlobal('window', { AudioContext: class { constructor() { return context; } } });
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(1) })));
    const sound = await import('./sound');
    await sound.preloadCheers();
    expect(sound.playCheer('nice')).toBe(true);

    sound.suspendAudio();

    expect(order).toEqual(['stop', 'suspend']);
    expect(source.disconnect).toHaveBeenCalledOnce();
  });
});
