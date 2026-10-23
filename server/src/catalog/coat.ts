import sharp from 'sharp';

/**
 * 毛色特征：从透明贴纸的毛发区域（去掉白描边）统计得到，用于阵容抽样避开外观相近的宠物。
 * [L, a, b, 深色占比, 浅色占比]：L/a/b 为 CIELAB 均值；深色 L < 35，浅色 L > 75 且低饱和。
 * 只取均值会把黑白双色算成灰色，所以另记深浅占比。
 */
export type Coat = [number, number, number, number, number];

/** 与图鉴剪影、棋盘同源的 128 px 贴纸足够统计；描边宽度约 3–4 px，取离透明区 5 px 以外的像素。 */
const RIM = 5;

const linear = (v: number) => {
  const c = v / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};

function toLab(r: number, g: number, b: number): [number, number, number] {
  const R = linear(r);
  const G = linear(g);
  const B = linear(b);
  const x = (R * 0.4124 + G * 0.3576 + B * 0.1805) / 0.95047;
  const y = R * 0.2126 + G * 0.7152 + B * 0.0722;
  const z = (R * 0.0193 + G * 0.1192 + B * 0.9505) / 1.08883;
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  return [116 * f(y) - 16, 500 * (f(x) - f(y)), 200 * (f(y) - f(z))];
}

export async function coatOf(png: Buffer): Promise<Coat> {
  const { data, info } = await sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const opaque = (x: number, y: number) => data[(y * w + x) * 4 + 3] >= 250;
  let n = 0;
  let sL = 0;
  let sa = 0;
  let sb = 0;
  let dark = 0;
  let light = 0;
  for (let y = RIM; y < h - RIM; y++) {
    for (let x = RIM; x < w - RIM; x++) {
      if (!opaque(x, y) || !opaque(x - RIM, y) || !opaque(x + RIM, y) || !opaque(x, y - RIM) || !opaque(x, y + RIM)) continue;
      const i = (y * w + x) * 4;
      const [L, a, b] = toLab(data[i], data[i + 1], data[i + 2]);
      n++;
      sL += L;
      sa += a;
      sb += b;
      if (L < 35) dark++;
      else if (L > 75 && Math.hypot(a, b) < 18) light++;
    }
  }
  if (n === 0) throw new Error('sticker has no opaque fur area');
  const r = (v: number, d = 1) => Math.round(v * 10 ** d) / 10 ** d;
  return [r(sL / n), r(sa / n), r(sb / n), r(dark / n, 3), r(light / n, 3)];
}

/** 外观距离：Lab 均值差，加上深浅占比差（×60，使「纯黑」与「黑白」拉开）。 */
export function coatDistance(p: Coat, q: Coat): number {
  return Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2], 60 * (p[3] - q[3]), 60 * (p[4] - q[4]));
}
