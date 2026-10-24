import { useState } from 'react';
import type { GalleryEntry } from '../../dev/gallery/types';
import { PhotoPicker } from './PhotoPicker';

/** 1×1 PNG，演示可预览状态；HEIC 用无法解码的字节演示文件名占位。 */
const PNG = Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='), (c) => c.charCodeAt(0));
const png = new File([PNG], 'oreo.png', { type: 'image/png' });
/** 带四边标记的竖图与横图，用来确认预览完整、不裁切。 */
const framed = (w: number, h: number, name: string) =>
  new File(
    [`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="${w}" height="${h}" fill="#f6c89a"/><rect x="6" y="6" width="${w - 12}" height="${h - 12}" fill="none" stroke="#d6411e" stroke-width="12"/><text x="50%" y="50%" font-size="${w / 8}" text-anchor="middle" dominant-baseline="middle" fill="#1f2227">${w}×${h}</text></svg>`],
    name,
    { type: 'image/svg+xml' },
  );
const portrait = framed(900, 1600, 'portrait.svg');
const landscape = framed(1600, 900, 'landscape.svg');
const heic =new File([new Uint8Array([0, 0, 0, 24, 102, 116, 121, 112])], 'IMG_2041.HEIC', { type: 'image/heic' });

function Live({ initial = null, error }: { initial?: File | null; error?: string }) {
  const [file, setFile] = useState<File | null>(initial);
  return <PhotoPicker file={file} onChange={setFile} error={error} />;
}

const entry: GalleryEntry = {
  name: 'PhotoPicker',
  group: 'components',
  states: {
    empty: () => <Live />,
    'empty · required error': () => <Live error="先选一张照片吧。" />,
    selected: () => <Live initial={png} />,
    'portrait photo · full': () => <Live initial={portrait} />,
    'landscape photo · full': () => <Live initial={landscape} />,
    'HEIC · preview unavailable': () => <Live initial={heic} />,
    'too large error': () => <Live initial={png} error="照片超过 20 MB，换一张小一点的吧。" />,
    disabled: () => <PhotoPicker file={png} onChange={() => {}} disabled />,
  },
};
export default entry;
