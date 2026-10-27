import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LINEUP_WAIT_MS, loadPetImage, petImage, preloadPets, waitForLineup, type PetInfo } from '../pets';

class FakeImage {
  static instances: FakeImage[] = [];
  src = '';
  fetchPriority = 'auto';
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;

  constructor() {
    FakeImage.instances.push(this);
  }
}

const pet: PetInfo = {
  id: 'preload-cat',
  name: 'Preload Cat',
  imageBase: '/img/pets/preload-cat',
  emoji: '🐱',
};

function finishImages(size: 128 | 512, outcome: 'load' | 'error') {
  for (const image of FakeImage.instances) {
    if (image.src.split('?')[0].endsWith(`/${size}`)) {
      if (outcome === 'load') image.onload?.();
      else image.onerror?.();
    }
  }
}

describe('preloadPets opening readiness', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    FakeImage.instances = [];
    vi.stubGlobal('Image', FakeImage);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('只等待 128 小图，高清请求未完成时也可以准备就绪', async () => {
    const high = loadPetImage(petImage(pet, 512)!);
    const preload = preloadPets([pet]);
    finishImages(128, 'load');
    await expect(preload).resolves.toBeUndefined();
    finishImages(512, 'load');
    await high;
  });

  it('默认只请求实际可显示的小图，并提高必需图片的优先级', async () => {
    const preload = preloadPets([pet]);
    expect(FakeImage.instances.map(image => image.src)).toEqual([
      '/img/pets/preload-cat/128?format=webp&v=q85-v2',
    ]);
    expect(FakeImage.instances[0].fetchPriority).toBe('high');
    finishImages(128, 'load');
    await preload;
  });

  it('高清失败不会让已就绪的小图准备失败', async () => {
    const high = loadPetImage(petImage(pet, 512)!);
    const highFailed = expect(high).rejects.toThrow('failed to load /img/pets/preload-cat/512?format=webp&v=q85-v2');
    const preload = preloadPets([pet]);
    finishImages(128, 'load');
    finishImages(512, 'error');
    await expect(preload).resolves.toBeUndefined();
    await highFailed;
  });

  it('必需的小图失败仍阻止开始，并允许重新请求', async () => {
    const preload = preloadPets([pet]);
    const failed = expect(preload).rejects.toThrow('failed to load /img/pets/preload-cat/128?format=webp&v=q85-v2');
    finishImages(128, 'error');
    await failed;
    const retry = preloadPets([pet]);
    expect(FakeImage.instances).toHaveLength(2);
    finishImages(128, 'load');
    await expect(retry).resolves.toBeUndefined();
  });

  it('合并同时加载的同一 URL，必需请求可提高已有请求的优先级', async () => {
    const pending = loadPetImage(petImage(pet, 128)!);
    const preload = preloadPets([pet, pet]);
    expect(FakeImage.instances).toHaveLength(1);
    expect(FakeImage.instances[0].fetchPriority).toBe('high');
    finishImages(128, 'load');
    await Promise.all([pending, preload]);
  });

  it('下一轮仍重新确认浏览器图片可用，不把上次成功直接当作本次就绪', async () => {
    const first = preloadPets([pet]);
    finishImages(128, 'load');
    await first;
    let ready = false;
    const next = preloadPets([pet]).then(() => { ready = true; });
    expect(FakeImage.instances).toHaveLength(2);
    await vi.advanceTimersByTimeAsync(0);
    expect(ready).toBe(false);
    finishImages(128, 'load');
    await next;
  });

  it('必需图片超时后释放在途记录，可重新尝试', async () => {
    const preload = preloadPets([pet]);
    const timedOut = expect(preload).rejects.toThrow('preload timeout');
    await vi.advanceTimersByTimeAsync(10_000);
    await timedOut;
    const retry = preloadPets([pet]);
    expect(FakeImage.instances).toHaveLength(2);
    finishImages(128, 'load');
    await expect(retry).resolves.toBeUndefined();
  });

  it('显式要求 512 的调用仍等待 512 完成', async () => {
    let ready = false;
    const preload = preloadPets([pet], 512).then(() => { ready = true; });
    finishImages(128, 'load');
    await vi.advanceTimersByTimeAsync(0);
    expect(ready).toBe(false);
    finishImages(512, 'load');
    await preload;
  });

  it('高清失败后短暂退避，避免每次补落都重复请求，退避结束后可以重试', async () => {
    const src = '/img/pets/background-retry/512';
    const first = loadPetImage(src);
    const failed = expect(first).rejects.toThrow('failed to load');
    finishImages(512, 'error');
    await failed;
    await expect(loadPetImage(src)).rejects.toThrow('cooling down');
    expect(FakeImage.instances).toHaveLength(1);
    await vi.advanceTimersByTimeAsync(30_000);
    const retry = loadPetImage(src);
    expect(FakeImage.instances).toHaveLength(2);
    finishImages(512, 'load');
    await retry;
  });

  it('必需请求可绕过高清失败退避，不影响开局重试', async () => {
    const src = '/img/pets/required-retry/512';
    const first = loadPetImage(src);
    const failed = expect(first).rejects.toThrow('failed to load');
    finishImages(512, 'error');
    await failed;
    const required = loadPetImage(src, 'high');
    expect(FakeImage.instances).toHaveLength(2);
    expect(FakeImage.instances[1].fetchPriority).toBe('high');
    finishImages(512, 'load');
    await required;
  });

  it('占位宠物无需请求图片', async () => {
    await expect(preloadPets([{ id: 'demo', name: 'Demo', emoji: '🐶' }])).resolves.toBeUndefined();
    expect(FakeImage.instances).toHaveLength(0);
  });
});

describe('waitForLineup 开局兜底等待', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    FakeImage.instances = [];
    vi.stubGlobal('Image', FakeImage);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  const settled = (promise: Promise<void>) => {
    let done = false;
    void promise.then(() => { done = true; });
    return () => done;
  };

  it('小图全部就绪时立即放行', async () => {
    const isDone = settled(waitForLineup([pet]));
    finishImages(128, 'load');
    await vi.advanceTimersByTimeAsync(0);
    expect(isDone()).toBe(true);
  });

  it('个别请求卡住时，等满兜底时间就放行，不等到 10 秒超时', async () => {
    const isDone = settled(waitForLineup([pet]));
    await vi.advanceTimersByTimeAsync(LINEUP_WAIT_MS - 1);
    expect(isDone()).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect(isDone()).toBe(true);
    expect(LINEUP_WAIT_MS).toBeLessThan(10_000);
    finishImages(128, 'load');
  });

  it('小图加载失败也放行，由棋子回退表情', async () => {
    const wait = waitForLineup([pet]);
    finishImages(128, 'error');
    await expect(wait).resolves.toBeUndefined();
  });
});
