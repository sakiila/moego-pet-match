import { mkdir, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(new URL('../../../server/package.json', import.meta.url));
const sharp = require('sharp');
const source = fileURLToPath(new URL('../../../design/concepts/favicon-blue-cat-v3.png', import.meta.url));
const output = new URL('../../../web/public/', import.meta.url);
const { data, info } = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true });

// 与已确认图标库相同：以 alpha > 8 定位主体，外留 2px 抗锯齿余量。
let left = info.width, top = info.height, right = -1, bottom = -1;
for (let y = 0; y < info.height; y++) {
  for (let x = 0; x < info.width; x++) {
    if (data[(y * info.width + x) * 4 + 3] <= 8) continue;
    left = Math.min(left, x);
    top = Math.min(top, y);
    right = Math.max(right, x);
    bottom = Math.max(bottom, y);
  }
}
if (right < left) throw new Error('Favicon source is empty');
left = Math.max(0, left - 2);
top = Math.max(0, top - 2);
const crop = {
  left, top,
  width: Math.min(info.width, right + 3) - left,
  height: Math.min(info.height, bottom + 3) - top,
};
const image = sharp(source).extract(crop);
const resize = (size) => image.clone().resize(size, size, {
  fit: 'contain', background: '#0000', kernel: 'lanczos3',
});

await mkdir(output, { recursive: true });
const frames = [];
for (const size of [16, 32, 48]) {
  const png = await resize(size).png().toBuffer();
  frames.push({ size, png });
  if (size !== 48) await writeFile(new URL(`favicon-${size}x${size}.png`, output), png);
}

// ICO 容器保留 16 / 32 / 48px 三个无损 PNG 帧。
const header = Buffer.alloc(6 + frames.length * 16);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(frames.length, 4);
let offset = header.length;
for (const [index, { size, png }] of frames.entries()) {
  const entry = 6 + index * 16;
  header[entry] = header[entry + 1] = size;
  header.writeUInt16LE(1, entry + 4);
  header.writeUInt16LE(32, entry + 6);
  header.writeUInt32LE(png.length, entry + 8);
  header.writeUInt32LE(offset, entry + 12);
  offset += png.length;
}
await writeFile(new URL('favicon.ico', output), Buffer.concat([header, ...frames.map(({ png }) => png)]));
const touchIcon = await resize(180).png().toBuffer();
await sharp(touchIcon).flatten({ background: '#ffffff' }).removeAlpha().png()
  .toFile(fileURLToPath(new URL('apple-touch-icon.png', output)));
console.log(JSON.stringify({ source, crop, icoSizes: frames.map(({ size }) => size) }));
