/** 上传前缩图：长边上限与 JPEG 质量。publish 只用到长边 1600，2560 留足人工裁切余量。 */
export const PHOTO_LONG_EDGE = 2560;
export const PHOTO_JPEG_QUALITY = 0.88;

/** 按长边上限等比缩小，只缩不放。 */
export function fitLongEdge(width: number, height: number, max = PHOTO_LONG_EDGE): { width: number; height: number } {
  const scale = Math.min(1, max / Math.max(width, height));
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}

export interface DecodedPhoto {
  source: CanvasImageSource;
  width: number;
  height: number;
  close?: () => void;
}

/** 解码并按拍摄方向摆正；先用 createImageBitmap，不支持或失败时退回 <img>。 */
export async function decodePhoto(file: Blob): Promise<DecodedPhoto> {
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
      return { source: bitmap, width: bitmap.width, height: bitmap.height, close: () => bitmap.close() };
    } catch {
      // Safari 旧版本不认 options 或个别格式，交给 <img>
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return { source: img, width: img.naturalWidth, height: img.naturalHeight, close: () => URL.revokeObjectURL(url) };
  } catch (error) {
    URL.revokeObjectURL(url);
    throw error;
  }
}

/** 把解码结果画到画布上并导出 JPEG；透明处垫白底。 */
export async function encodeJpeg(photo: DecodedPhoto, width: number, height: number): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas unavailable');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, width, height);
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(photo.source, 0, 0, width, height);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', PHOTO_JPEG_QUALITY));
  if (!blob) throw new Error('encode failed');
  return blob;
}

export interface PhotoCodec {
  decode: (file: Blob) => Promise<DecodedPhoto>;
  encode: (photo: DecodedPhoto, width: number, height: number) => Promise<Blob>;
}

const browserCodec: PhotoCodec = { decode: decodePhoto, encode: encodeJpeg };

/**
 * 上传前处理：能解码的一律缩到长边 2560 的 JPEG（同时去掉 EXIF）；
 * 解码或编码失败（如非 Safari 的 HEIC）时原样返回原图。
 */
export async function preparePhoto(file: File, codec: PhotoCodec = browserCodec): Promise<File> {
  let photo: DecodedPhoto;
  try {
    photo = await codec.decode(file);
  } catch {
    return file;
  }
  try {
    const size = fitLongEdge(photo.width, photo.height);
    const blob = await codec.encode(photo, size.width, size.height);
    const base = file.name.replace(/\.[^.]*$/, '') || 'photo';
    return new File([blob], `${base}.jpg`, { type: 'image/jpeg' });
  } catch {
    return file;
  } finally {
    photo.close?.();
  }
}
