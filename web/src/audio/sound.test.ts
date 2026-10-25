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

  it('recovers an iOS-interrupted context so the next effect can play', async () => {
    const start = vi.fn();
    const gain = { gain: { value: 0, setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() }, connect: vi.fn() };
    gain.connect.mockReturnValue(gain);
    const context = {
      state: 'interrupted', currentTime: 1, destination: {},
      createGain: () => gain,
      createOscillator: () => ({ frequency: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() }, connect: vi.fn().mockReturnValue(gain), start, stop: vi.fn() }),
      resume: vi.fn(async () => { context.state = 'running'; }),
    };
    vi.stubGlobal('window', { AudioContext: class { constructor() { return context; } } });
    const sound = await import('./sound');

    await sound.unlockAudio();
    sound.playSound('pop');

    expect(context.resume).toHaveBeenCalledOnce();
    expect(start).toHaveBeenCalledOnce();
  });

  it('can retry on the next gesture if the browser rejects a resume attempt', async () => {
    const context = {
      state: 'suspended', destination: {},
      createGain: () => ({ gain: { value: 0 }, connect: vi.fn() }),
      resume: vi.fn()
        .mockRejectedValueOnce(new Error('user gesture required'))
        .mockImplementationOnce(async () => { context.state = 'running'; }),
    };
    vi.stubGlobal('window', { AudioContext: class { constructor() { return context; } } });
    const sound = await import('./sound');

    await expect(sound.unlockAudio()).resolves.toBeUndefined();
    await expect(sound.unlockAudio()).resolves.toBeUndefined();

    expect(context.resume).toHaveBeenCalledTimes(2);
    expect(context.state).toBe('running');
  });

  it('does not try to resume a closed context', async () => {
    const context = {
      state: 'closed', destination: {},
      createGain: () => ({ gain: { value: 0 }, connect: vi.fn() }),
      resume: vi.fn(),
    };
    vi.stubGlobal('window', { AudioContext: class { constructor() { return context; } } });
    const sound = await import('./sound');

    await expect(sound.unlockAudio()).resolves.toBeUndefined();

    expect(context.resume).not.toHaveBeenCalled();
  });

  it('switches the iOS audio session to playback so the silent switch does not mute the game', async () => {
    const context = {
      state: 'running', destination: {},
      createGain: () => ({ gain: { value: 0 }, connect: vi.fn() }),
      resume: vi.fn(),
    };
    const audioSession = { type: 'auto' };
    vi.stubGlobal('window', { AudioContext: class { constructor() { return context; } } });
    vi.stubGlobal('navigator', { userAgent: 'iPhone', maxTouchPoints: 5, audioSession });
    const sound = await import('./sound');

    await sound.unlockAudio();
    expect(audioSession.type).toBe('playback');

    sound.releaseAudioSession();
    expect(audioSession.type).toBe('auto');
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
