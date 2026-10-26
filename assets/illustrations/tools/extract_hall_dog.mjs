/**
 * Re-extract the approved dog artwork without regenerating its colors or anatomy.
 * The white fur meets the canvas at the forehead, cheeks and two crop edges.
 * Close those openings before flooding the connected white background.
 * Run from any directory after installing the server's sharp dependency.
 */
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(new URL('../../../server/package.json', import.meta.url));
const sharp = require('sharp');
const source = fileURLToPath(new URL('../../../design/concepts/hall-of-fame-dog-v1.png', import.meta.url));
const target = fileURLToPath(new URL('../ui/hall-dog-v3.png', import.meta.url));
const { data: rgb, info: { width, height } } = await sharp(source).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const sealed = new Uint8Array(width * height);
const background = new Uint8Array(width * height);
const queue = new Uint32Array(width * height);
let read = 0;
let write = 0;

function seal(x1, y1, x2, y2) {
  const steps = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1));
  for (let i = 0; i <= steps; i++) {
    const x = Math.round(x1 + (x2 - x1) * i / steps);
    const y = Math.round(y1 + (y2 - y1) * i / steps);
    sealed[y * width + x] = 1;
  }
}

// Exact crop coordinates of the approved artwork, not a new body contour.
seal(379, 508, 379, 981);
seal(379, 981, 805, 981);
// White cheek between the tip of the left ear and the bandana has no black outline.
seal(434, 450, 458, 450);
seal(730, 520, 746, 520);
// Interpolate only the white-on-white opening between the two black head patches.
for (const [a, b] of [
  [[685, 169], [700, 174]],
  [[700, 174], [716, 179]],
  [[716, 179], [735, 186]],
]) seal(...a, ...b);

function visit(index) {
  const i = index * 3;
  if (!background[index] && !sealed[index] && Math.min(rgb[i], rgb[i + 1], rgb[i + 2]) > 232) {
    background[index] = 1;
    queue[write++] = index;
  }
}
for (let x = 0; x < width; x++) { visit(x); visit((height - 1) * width + x); }
for (let y = 0; y < height; y++) { visit(y * width); visit(y * width + width - 1); }
while (read < write) {
  const p = queue[read++];
  const x = p % width;
  if (x > 0) visit(p - 1);
  if (x < width - 1) visit(p + 1);
  if (p >= width) visit(p - width);
  if (p < width * (height - 1)) visit(p + width);
}

// Keep source RGB verbatim. Only coverage at the exterior antialiased edge varies.
const output = Buffer.alloc(width * height * 4);
for (let p = 0; p < width * height; p++) {
  const i = p * 3;
  const o = p * 4;
  output[o] = rgb[i]; output[o + 1] = rgb[i + 1]; output[o + 2] = rgb[i + 2];
  if (background[p]) continue;
  const x = p % width;
  const edge = !sealed[p] && ((x > 0 && background[p - 1]) || (x < width - 1 && background[p + 1]) || (p >= width && background[p - width]) || (p < width * (height - 1) && background[p + width]));
  output[o + 3] = edge ? Math.round(255 * Math.max(0.3, Math.min(1, (255 - Math.min(rgb[i], rgb[i + 1], rgb[i + 2])) / 110))) : 255;
}
await sharp(output, { raw: { width, height, channels: 4 } })
  .extract({ left: 379, top: 162, width: 661, height: 820 })
  .png().toFile(target);
console.log(target);
