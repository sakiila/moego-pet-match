/** Apply only the two user-requested belly corrections from the ImageGen edit. */
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(new URL('../../../server/package.json', import.meta.url));
const sharp = require('sharp');
const source = new URL('../ui/hall-dog-v3.png', import.meta.url);
const target = new URL('../ui/hall-dog-v4.png', import.meta.url);
const { data: original, info: { width, height } } = await sharp(fileURLToPath(source)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const generated = await sharp(fileURLToPath(new URL('./generated.png', import.meta.url))).resize(width, height).ensureAlpha().raw().toBuffer();
const output = Buffer.from(original);
const ease = value => { const t = Math.max(0, Math.min(1, value)); return t * t * (3 - 2 * t); };
let changed = 0;

// Match the generated curve to the original boundary at both ends of each patch.
// Feather inside opaque body pixels; every alpha value and all other pixels stay intact.
for (const { side, top, bottom, offset } of [
  { side: 'left', top: 530, bottom: 575, offset: 7 },
  { side: 'right', top: 550, bottom: 625, offset: -5 },
]) {
  for (let y = top; y <= bottom; y++) {
    const shift = offset * (1 - ease((y - top) / (bottom - top)));
    const white = [];
    for (let x = 20; x < 270; x++) {
      const p = (y * width + x) * 4;
      if (generated[p + 3] > 250 && Math.min(generated[p], generated[p + 1], generated[p + 2]) > 150) white.push(x);
    }
    if (!white.length) throw new Error(`Missing generated belly contour on row ${y}`);
    const boundary = (side === 'left' ? white[0] : white.at(-1)) + shift;
    for (let x = Math.ceil(boundary - 15); x <= Math.floor(boundary + 15); x++) {
      const weight = (1 - ease((Math.abs(x - boundary) - 9) / 6)) * Math.min(ease((y - top) / 6), ease((bottom - y) / 6));
      if (!weight) continue;
      const p = (y * width + x) * 4;
      if (original[p + 3] !== 255) throw new Error('Correction must remain inside the opaque dog');
      const sampleX = x - shift;
      const a = Math.floor(sampleX);
      const fraction = sampleX - a;
      for (let c = 0; c < 3; c++) {
        const color = generated[(y * width + a) * 4 + c] * (1 - fraction) + generated[(y * width + a + 1) * 4 + c] * fraction;
        output[p + c] = Math.round(original[p + c] * (1 - weight) + color * weight);
      }
      changed++;
    }
  }
}
await sharp(output, { raw: { width, height, channels: 4 } }).png().toFile(fileURLToPath(target));
console.log(`Applied ${changed} local pixel corrections; preserved original alpha and all other pixels.`);
