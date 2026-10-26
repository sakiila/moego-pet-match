const TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
/** 与服务端重复校验；客户端缩图仅减少上传量，不作为安全边界。 */
export async function resizeSocialPhoto(file: File): Promise<Blob> {
  if (!TYPES.has(file.type)) throw new Error('photo_type');
  if (file.size > 12 * 1024 * 1024) throw new Error('photo_large');
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error('photo_decode');
  }
  try {
    const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('photo_decode');
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('photo_decode'))), 'image/jpeg', 0.85),
    );
  } finally {
    bitmap.close();
  }
}
