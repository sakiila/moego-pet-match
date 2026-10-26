import type { SocialPhoto } from '../../social/model';
import { resizeSocialPhoto } from '../../social/photos';

export async function readPreviewPhoto(file: File): Promise<SocialPhoto> {
  const blob = await resizeSocialPhoto(file);
  const src = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('photo_decode'));
    reader.readAsDataURL(blob);
  });
  return { id: crypto.randomUUID(), src, alt: file.name };
}
