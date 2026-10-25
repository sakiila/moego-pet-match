import { describe, expect, it, vi } from 'vitest';
import { fitLongEdge, preparePhoto, type PhotoCodec } from '../preparePhoto';

describe('fitLongEdge', () => {
  it('scales the long edge down to 2560', () => {
    expect(fitLongEdge(4032, 3024)).toEqual({ width: 2560, height: 1920 });
    expect(fitLongEdge(3024, 4032)).toEqual({ width: 1920, height: 2560 });
  });

  it('never upscales', () => {
    expect(fitLongEdge(1200, 900)).toEqual({ width: 1200, height: 900 });
    expect(fitLongEdge(2560, 100)).toEqual({ width: 2560, height: 100 });
  });
});

const original = new File(['original-bytes'], 'IMG_0001.HEIC', { type: 'image/heic' });

describe('preparePhoto', () => {
  it('re-encodes decodable photos as a resized JPEG', async () => {
    const close = vi.fn();
    const encode = vi.fn().mockResolvedValue(new Blob(['jpeg'], { type: 'image/jpeg' }));
    const codec: PhotoCodec = { decode: async () => ({ source: {} as CanvasImageSource, width: 4032, height: 3024, close }), encode };

    const out = await preparePhoto(original, codec);

    expect(encode).toHaveBeenCalledWith(expect.anything(), 2560, 1920);
    expect(out.name).toBe('IMG_0001.jpg');
    expect(out.type).toBe('image/jpeg');
    expect(close).toHaveBeenCalled();
  });

  it('falls back to the original file when the browser cannot decode it', async () => {
    const codec: PhotoCodec = { decode: () => Promise.reject(new Error('unsupported')), encode: vi.fn() };
    await expect(preparePhoto(original, codec)).resolves.toBe(original);
    expect(codec.encode).not.toHaveBeenCalled();
  });

  it('falls back to the original file when encoding fails', async () => {
    const close = vi.fn();
    const codec: PhotoCodec = {
      decode: async () => ({ source: {} as CanvasImageSource, width: 800, height: 600, close }),
      encode: () => Promise.reject(new Error('encode failed')),
    };
    await expect(preparePhoto(original, codec)).resolves.toBe(original);
    expect(close).toHaveBeenCalled();
  });
});
