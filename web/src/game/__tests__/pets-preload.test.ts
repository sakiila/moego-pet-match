import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { preloadPets, type PetInfo } from '../pets';

class FakeImage {
  static instances: FakeImage[] = [];
  src = '';
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

  it('waits for the large board sticker after the small sticker is ready', async () => {
    let ready = false;
    const preload = preloadPets([pet]).then(() => { ready = true; });

    finishImages(128, 'load');
    await vi.advanceTimersByTimeAsync(0);
    expect(ready).toBe(false);

    finishImages(512, 'load');
    await expect(preload).resolves.toBeUndefined();
  });

  it('preloads the same compact image URLs used by the visible pets', async () => {
    const preload = preloadPets([pet]);
    expect(FakeImage.instances.map(image => image.src)).toEqual([
      '/img/pets/preload-cat/128?format=webp&v=q85-v2',
      '/img/pets/preload-cat/512?format=webp&v=q85-v2',
    ]);
    finishImages(128, 'load');
    finishImages(512, 'load');
    await preload;
  });

  it('rejects when the large board sticker fails even if the small sticker is ready', async () => {
    const preload = preloadPets([pet]);

    finishImages(128, 'load');
    finishImages(512, 'error');

    await expect(preload).rejects.toThrow('failed to load /img/pets/preload-cat/512?format=webp&v=q85-v2');
  });
});
