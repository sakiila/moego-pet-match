import type { GameMode } from '../../api/types';
import type { ManagerPosterModel, ShareCardModel } from '../../game/shareCard';

/** 导出尺寸：约 4:5 竖幅，与两张已确认的分享卡图稿比例一致。 */
export const SHARE_CARD = { width: 1080, height: 1350 } as const;

const IMAGE_TIMEOUT_MS = 10_000;
type Ctx = CanvasRenderingContext2D;
type Tokens = ReturnType<typeof readTokens>;

/** 颜色与字体从 tokens 读取；鱼关的变量挂在 data-theme="fish" 上，临时挂一个节点读出。 */
function readTokens(mode: GameMode) {
  const probe = document.createElement('div');
  if (mode === 'fish') probe.dataset.theme = 'fish';
  probe.style.display = 'none';
  document.body.appendChild(probe);
  const css = getComputedStyle(probe);
  const v = (name: string) => css.getPropertyValue(name).trim();
  const tokens = {
    brand: v('--color-brand'),
    brandSoft: v('--color-brand-soft'),
    ink: v('--color-ink'),
    paper: v('--color-paper'),
    line: v('--color-line'),
    yellow: v('--color-dog-yellow'),
    blue: v('--color-cat-blue'),
    shadow: v('--share-shadow'),
    font: v('--font-sans'),
    bg: v('--bg'),
    waterTop: v('--water-top'),
    waterDeep: v('--water-deep'),
    beam: v('--water-beam'),
    bubble: v('--water-bubble'),
    weed: v('--water-weed'),
    rock: v('--water-rock'),
    ice: v('--pet-tint-0'),
  };
  probe.remove();
  return tokens;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const timer = setTimeout(() => reject(new Error('image timeout')), IMAGE_TIMEOUT_MS);
    img.onload = () => {
      clearTimeout(timer);
      resolve(img);
    };
    img.onerror = () => {
      clearTimeout(timer);
      reject(new Error(`failed to load ${src}`));
    };
    img.src = src;
  });
}

/** 贴纸 PNG 四周留有透明边；按不透明区域裁切，主角才能按实际轮廓放满。 */
function trimmed(img: HTMLImageElement): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = img.naturalWidth;
  c.height = img.naturalHeight;
  const g = c.getContext('2d')!;
  g.drawImage(img, 0, 0);
  const { data, width, height } = g.getImageData(0, 0, c.width, c.height);
  let [x0, y0, x1, y1] = [width, height, -1, -1];
  for (let y = 0; y < height; y += 2) {
    for (let x = 0; x < width; x += 2) {
      if (data[(y * width + x) * 4 + 3] > 16) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  if (x1 < 0) return c;
  const out = document.createElement('canvas');
  out.width = x1 - x0 + 1;
  out.height = y1 - y0 + 1;
  out.getContext('2d')!.drawImage(c, x0, y0, out.width, out.height, 0, 0, out.width, out.height);
  return out;
}

// ---------- 文字排版 ----------

const CJK = '⺀-鿿　-〿＀-￯';
const TOKEN = new RegExp(`[${CJK}]|[^\\s${CJK}]+|\\s+`, 'g');
/** 不放在行首的标点（简单避头）。 */
const NO_LINE_START = /^[，。？！、：；」』）”’,.!?:;)]/;

function wrap(ctx: Ctx, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  let line = '';
  for (const tok of text.match(TOKEN) ?? [text]) {
    const next = line + tok;
    if (line.trim() && ctx.measureText(next.trimEnd()).width > maxWidth && !NO_LINE_START.test(tok)) {
      lines.push(line.trimEnd());
      line = tok.trimStart();
    } else {
      line = next;
    }
  }
  if (line.trim()) lines.push(line.trimEnd());
  return lines;
}

/**
 * 评语按图稿在句中标点处断成两行（如「临时加单？/ 安排得明明白白。」），字更大、更易读；
 * 没有合适的标点或两行放不下时，一行放得下就一行，否则逐字折行。
 */
function reviewLines(ctx: Ctx, text: string, maxWidth: number): string[] {
  const mid = text.length / 2;
  const breaks = [...text.matchAll(/[，。？！,.?!]\s*/g)]
    .map((m) => m.index! + m[0].length)
    .filter((i) => i > 2 && i < text.length - 2)
    .sort((a, b) => Math.abs(a - mid) - Math.abs(b - mid));
  for (const at of breaks.slice(0, 2)) {
    const parts = [text.slice(0, at).trim(), text.slice(at).trim()];
    if (parts.every((p) => ctx.measureText(p).width <= maxWidth)) return parts;
  }
  if (ctx.measureText(text).width <= maxWidth) return [text];
  return wrap(ctx, text, maxWidth);
}

/** 从大到小找能放进 maxLines 行的字号。 */
function fit(ctx: Ctx, font: (size: number) => string, text: string, maxWidth: number, maxLines: number, from: number, to: number, split = wrap) {
  for (let size = from; size > to; size -= 2) {
    ctx.font = font(size);
    const lines = split(ctx, text, maxWidth);
    if (lines.length <= maxLines) return { size, lines };
  }
  ctx.font = font(to);
  return { size: to, lines: split(ctx, text, maxWidth).slice(0, maxLines) };
}

// ---------- 形状与装饰 ----------

function roundRect(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** 收据纸：圆角上缘，底边一排小波浪。 */
function receipt(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  const scallops = 26;
  const sw = w / scallops;
  ctx.beginPath();
  ctx.moveTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - sw / 2);
  for (let i = scallops; i > 0; i--) ctx.arc(x + (i - 0.5) * sw, y + h - sw / 2, sw / 2, 0, Math.PI, false);
  ctx.closePath();
}

/** 手绘感的短线：从中心向外放射。 */
function sparks(ctx: Ctx, cx: number, cy: number, angles: number[], color: string, r0 = 0, len = 34) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 11;
  ctx.lineCap = 'round';
  for (const a of angles) {
    const rad = (a * Math.PI) / 180;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(rad) * r0, cy + Math.sin(rad) * r0);
    ctx.lineTo(cx + Math.cos(rad) * (r0 + len), cy + Math.sin(rad) * (r0 + len));
    ctx.stroke();
  }
  ctx.restore();
}

function star(ctx: Ctx, cx: number, cy: number, r: number, color: string) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const rad = (i * Math.PI) / 4 - Math.PI / 2;
    const d = i % 2 ? r * 0.28 : r;
    ctx.lineTo(cx + Math.cos(rad) * d, cy + Math.sin(rad) * d);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function paw(ctx: Ctx, cx: number, cy: number, s: number, color: string, angle = -0.3) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(0, s * 0.35, s * 0.55, s * 0.45, 0, 0, Math.PI * 2);
  ctx.fill();
  for (const [x, y] of [[-0.62, -0.25], [-0.22, -0.62], [0.22, -0.62], [0.62, -0.25]]) {
    ctx.beginPath();
    ctx.ellipse(x * s, y * s, s * 0.2, s * 0.26, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function bubble(ctx: Ctx, cx: number, cy: number, r: number, k: Tokens) {
  ctx.save();
  ctx.strokeStyle = k.blue;
  ctx.globalAlpha = 0.8;
  ctx.lineWidth = Math.max(2, r * 0.16);
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = k.paper;
  ctx.beginPath();
  ctx.arc(cx - r * 0.35, cy - r * 0.35, r * 0.22, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** 骨头形名牌（普通局）：先描所有部件的边，再整体填色，只留外轮廓。 */
function bonePlate(ctx: Ctx, cx: number, cy: number, w: number, h: number, k: Tokens) {
  const r = h * 0.36;
  const shape = () => {
    ctx.beginPath();
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
      ctx.moveTo(cx + sx * (w / 2 - r * 0.2) + r, cy + sy * h * 0.3);
      ctx.arc(cx + sx * (w / 2 - r * 0.2), cy + sy * h * 0.3, r, 0, Math.PI * 2);
    }
    ctx.rect(cx - w / 2 + r * 0.3, cy - h / 2, w - r * 0.6, h);
  };
  ctx.save();
  shape();
  ctx.strokeStyle = k.ink;
  ctx.lineWidth = 10;
  ctx.stroke();
  shape();
  ctx.fillStyle = k.brandSoft;
  ctx.fill();
  ctx.restore();
}

/** 气泡形名牌（鱼关）。 */
function bubblePlate(ctx: Ctx, cx: number, cy: number, w: number, h: number, k: Tokens) {
  ctx.save();
  ctx.fillStyle = k.ice;
  ctx.strokeStyle = k.blue;
  ctx.lineWidth = 5;
  roundRect(ctx, cx - w / 2, cy - h / 2, w, h, h / 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
  bubble(ctx, cx - w / 2 + 6, cy - h / 2 + 12, 14, k);
  bubble(ctx, cx + w / 2 - 8, cy + h / 2 - 10, 18, k);
}

/** 对话气泡：圆角框 + 小尾巴（成绩卡在左上，店长海报在左下指向店长）；先描边再填色，只留外轮廓。 */
function speech(ctx: Ctx, x: number, y: number, w: number, h: number, k: Tokens, tail: 'top' | 'bottom' = 'top') {
  const shape = () => {
    roundRect(ctx, x, y, w, h, Math.min(90, h / 2));
    if (tail === 'top') {
      ctx.moveTo(x + 104, y + 10);
      ctx.lineTo(x + 92, y - 36);
      ctx.lineTo(x + 166, y + 10);
    } else {
      ctx.moveTo(x + 70, y + h - 10);
      ctx.lineTo(x + 20, y + h + 54);
      ctx.lineTo(x + 150, y + h - 10);
    }
    ctx.closePath();
  };
  ctx.save();
  shape();
  ctx.strokeStyle = k.ink;
  ctx.lineWidth = 12;
  ctx.lineJoin = 'round';
  ctx.stroke();
  shape();
  ctx.fillStyle = k.paper;
  ctx.fill();
  ctx.restore();
}

/** 称号章：略微倾斜的橙色徽章。 */
function stamp(ctx: Ctx, cx: number, cy: number, text: string, k: Tokens) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-0.16);
  const one = fit(ctx, (s) => `900 ${s}px ${k.font}`, text, 300, 1, 44, 32);
  const { size, lines } = ctx.measureText(text).width <= 300 ? one : fit(ctx, (s) => `900 ${s}px ${k.font}`, text, 240, 2, 40, 26);
  const w = Math.max(...lines.map((l) => ctx.measureText(l).width)) + 56;
  const h = lines.length * size * 1.15 + 34;
  ctx.fillStyle = k.brand;
  roundRect(ctx, -w / 2, -h / 2, w, h, 22);
  ctx.fill();
  ctx.strokeStyle = k.paper;
  ctx.lineWidth = 4;
  roundRect(ctx, -w / 2 + 8, -h / 2 + 8, w - 16, h - 16, 16);
  ctx.stroke();
  ctx.fillStyle = k.paper;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  lines.forEach((l, i) => ctx.fillText(l, 0, (i - (lines.length - 1) / 2) * size * 1.15));
  ctx.restore();
}

// ---------- 版面 ----------

/** 两种模式的纵向位置；普通局对照 share-card-pets-v1，鱼关对照 share-card-fish-v2。 */
const LAYOUT = {
  normal: { paper: [40, 60, 1000, 1250], header: 140, hero: [540, 410, 500, 370], stamp: [870, 440], plate: 642, bubble: [700, 962], scoreLabel: 1004, score: 1176, rule: 1206, player: 1246 },
  fish: { paper: [60, 235, 960, 1060], header: 132, hero: [520, 430, 780, 290], stamp: [860, 310], plate: 626, bubble: [688, 952], scoreLabel: 994, score: 1160, rule: 1196, player: 1236 },
} as const;

function background(ctx: Ctx, mode: GameMode, k: Tokens) {
  const { width: W, height: H } = SHARE_CARD;
  const [x, y, w, h] = LAYOUT[mode].paper;
  if (mode === 'fish') {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, k.waterTop);
    g.addColorStop(0.45, k.bg);
    g.addColorStop(1, k.waterDeep);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = k.beam;
    for (const bx of [80, 330, 610, 860]) {
      ctx.beginPath();
      ctx.moveTo(bx, 0);
      ctx.lineTo(bx + 90, 0);
      ctx.lineTo(bx + 230, H * 0.55);
      ctx.lineTo(bx + 150, H * 0.55);
      ctx.closePath();
      ctx.fill();
    }
    for (const [bx, by, r] of [[40, 40, 14], [140, 30, 10], [1044, 210, 18], [990, 36, 12], [32, 520, 14], [1046, 760, 16], [30, 980, 20], [1050, 1060, 12]]) bubble(ctx, bx, by, r, k);
    // 底部礁石与水草
    ctx.fillStyle = k.rock;
    ctx.beginPath();
    ctx.moveTo(0, H);
    for (let i = 0; i <= 10; i++) ctx.lineTo(i * 108, H - 40 - (i % 2 ? 24 : 0));
    ctx.lineTo(W, H);
    ctx.fill();
    ctx.fillStyle = k.weed;
    for (const wx of [24, 56, 1020, 1052]) {
      ctx.beginPath();
      ctx.moveTo(wx - 14, H);
      ctx.quadraticCurveTo(wx - 30, H - 160, wx, H - 260);
      ctx.quadraticCurveTo(wx + 6, H - 150, wx + 14, H);
      ctx.fill();
    }
  } else {
    ctx.fillStyle = k.paper;
    ctx.fillRect(0, 0, W, H);
  }
  ctx.save();
  ctx.shadowColor = k.shadow;
  ctx.shadowBlur = 30;
  ctx.shadowOffsetY = 8;
  ctx.fillStyle = k.paper;
  receipt(ctx, x, y, w, h, 40);
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = mode === 'fish' ? k.paper : k.ink;
  ctx.lineWidth = 5;
  receipt(ctx, x, y, w, h, 40);
  ctx.stroke();
}

function header(ctx: Ctx, model: Pick<ShareCardModel, 'mode' | 'brand'>, mode: GameMode, k: Tokens) {
  const y = LAYOUT[mode].header;
  const fg = mode === 'fish' ? k.paper : k.ink;
  const sep = /[A-Za-z]$/.test(model.brand.lead) ? ' ' : '';
  for (let size = 66; size >= 40; size -= 4) {
    const word = `900 ${size}px ${k.font}`;
    const pill = `800 ${Math.round(size * 0.52)}px ${k.font}`;
    ctx.font = word;
    const moe = ctx.measureText('Moe').width;
    const go = ctx.measureText('Go').width;
    const lead = ctx.measureText(model.brand.lead + sep).width;
    const accent = ctx.measureText(model.brand.accent).width;
    ctx.font = pill;
    const pw = ctx.measureText(model.mode).width + 48;
    const gap = size * 0.5;
    const total = moe + go + gap * 2 + 4 + lead + accent + gap + pw;
    if (total > 960 && size > 40) continue;
    let x = 540 - total / 2;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.font = word;
    ctx.fillStyle = fg;
    ctx.fillText('Moe', x, y);
    ctx.fillStyle = k.brand;
    ctx.fillText('Go', (x += moe), y);
    x += go + gap;
    ctx.fillStyle = mode === 'fish' ? k.bubble : k.line;
    ctx.fillRect(x, y - size * 0.45, 4, size * 0.9);
    x += 4 + gap;
    ctx.fillStyle = fg;
    ctx.fillText(model.brand.lead + sep, x, y);
    ctx.fillStyle = k.brand;
    ctx.fillText(model.brand.accent, (x += lead), y);
    x += accent + gap;
    const ph = size * 0.9;
    ctx.fillStyle = mode === 'fish' ? k.ice : k.paper;
    ctx.strokeStyle = mode === 'fish' ? k.blue : k.ink;
    ctx.lineWidth = 4;
    roundRect(ctx, x, y - ph / 2, pw, ph, ph / 2);
    ctx.fill();
    ctx.stroke();
    ctx.font = pill;
    ctx.fillStyle = k.ink;
    ctx.textAlign = 'center';
    ctx.fillText(model.mode, x + pw / 2, y + 2);
    return;
  }
}

function hero(ctx: Ctx, img: HTMLCanvasElement, mode: GameMode, k: Tokens) {
  const [cx, cy, bw, bh] = LAYOUT[mode].hero;
  const scale = Math.min(bw / img.width, bh / img.height);
  const w = img.width * scale;
  const h = img.height * scale;
  // 手绘短线与小星星，不压住主角
  sparks(ctx, cx - bw / 2 - 10, cy - bh * 0.18, [200, 225, 250], k.brand, 30);
  sparks(ctx, cx + bw / 2 + 10, cy - bh * 0.3, [-70, -40, -10], k.brand, 30);
  star(ctx, cx - bw * 0.36, cy - bh * 0.42, 30, k.yellow);
  star(ctx, cx - bw / 2 - 30, cy + bh * 0.2, 24, k.yellow);
  if (mode === 'fish') {
    for (const [dx, dy, r] of [[-0.42, -0.4, 26], [0.36, 0.48, 22], [-0.5, 0.42, 18], [0.46, -0.05, 14]]) bubble(ctx, cx + dx * bw, cy + dy * bh, r, k);
  } else {
    paw(ctx, cx - bw / 2 - 40, cy + bh * 0.05, 30, k.brand);
    paw(ctx, cx + bw / 2 + 40, cy + bh * 0.42, 24, k.brand, 0.3);
  }
  ctx.save();
  ctx.shadowColor = k.shadow;
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 10;
  ctx.drawImage(img, cx - w / 2, cy - h / 2, w, h);
  ctx.restore();
}

function plate(ctx: Ctx, label: string, mode: GameMode, k: Tokens) {
  const y = LAYOUT[mode].plate;
  const { size } = fit(ctx, (s) => `800 ${s}px ${k.font}`, label, 620, 1, 44, 28);
  const w = ctx.measureText(label).width + (mode === 'fish' ? 90 : 120);
  if (mode === 'fish') bubblePlate(ctx, 540, y, w, size + 36, k);
  else bonePlate(ctx, 540, y, w, size + 36, k);
  ctx.fillStyle = k.ink;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, 540, y + 2);
}

/** 评语气泡：在留给它的高度内选最大的字号；没有主角时居中放在页头与分数之间，并放大。 */
function review(ctx: Ctx, text: string, mode: GameMode, hasHero: boolean, k: Tokens) {
  const L = LAYOUT[mode];
  const quoted = `“${text}”`;
  const [top0, bottom] = hasHero ? L.bubble : [L.header + 120, L.scoreLabel - 60];
  // 气泡总高 = 行高 × 行数 + 上下留白 70 + 描边
  const avail = bottom - top0 - 80;
  let size = hasHero ? 76 : 88;
  let lines: string[] = [];
  for (; size > 36; size -= 2) {
    ctx.font = `900 ${size}px ${k.font}`;
    lines = reviewLines(ctx, quoted, 760);
    if (lines.length * size * 1.25 <= avail) break;
  }
  const lh = size * 1.25;
  const h = lines.length * lh + 70;
  const w = Math.min(900, Math.max(...lines.map((l) => ctx.measureText(l).width)) + 140);
  const top = hasHero ? top0 : (top0 + bottom) / 2 - h / 2;
  speech(ctx, 540 - w / 2, top, w, h, k);
  if (!hasHero) {
    star(ctx, 540 - w / 2 + 40, top - 70, 30, k.yellow);
    star(ctx, 540 + w / 2 - 60, top + h + 60, 22, k.yellow);
  }
  ctx.fillStyle = k.ink;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  lines.forEach((l, i) => ctx.fillText(l, 540, top + 35 + lh * (i + 0.5)));
}

function score(ctx: Ctx, model: ShareCardModel, mode: GameMode, k: Tokens) {
  const L = LAYOUT[mode];
  const { size } = fit(ctx, (s) => `900 ${s}px ${k.font}`, model.score, 760, 1, 200, 110);
  const w = ctx.measureText(model.score).width;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = k.brandSoft;
  ctx.fillText(model.score, 546, L.score + 8);
  ctx.fillStyle = k.brand;
  ctx.fillText(model.score, 540, L.score);
  sparks(ctx, 540 + w / 2 + 30, L.score - size * 0.45, [-40, -10, 20], k.brand, 10, 30);
  ctx.font = `800 40px ${k.font}`;
  ctx.fillStyle = k.ink;
  ctx.textAlign = 'left';
  ctx.fillText(model.scoreLabel, Math.max(110, 540 - w / 2), L.scoreLabel);
  // 收据虚线与玩家署名
  ctx.strokeStyle = k.line;
  ctx.lineWidth = 3;
  ctx.setLineDash([14, 10]);
  ctx.beginPath();
  ctx.moveTo(L.paper[0] + 40, L.rule);
  ctx.lineTo(L.paper[0] + L.paper[2] - 40, L.rule);
  ctx.stroke();
  ctx.setLineDash([]);
  fit(ctx, (s) => `800 ${s}px ${k.font}`, model.player, 860, 1, 36, 24);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(model.player, 540, L.player);
}

/** 按冻结的卡面内容绘制成绩卡并导出 PNG。主角图读取失败时整体失败（由预览提供重试）。 */
export async function drawShareCard(model: ShareCardModel, mode: GameMode): Promise<Blob> {
  const k = readTokens(mode);
  await document.fonts?.ready;
  const img = model.hero ? trimmed(await loadImage(model.hero.src)) : null;
  const canvas = document.createElement('canvas');
  canvas.width = SHARE_CARD.width;
  canvas.height = SHARE_CARD.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas unavailable');
  background(ctx, mode, k);
  header(ctx, model, mode, k);
  if (img) hero(ctx, img, mode, k);
  review(ctx, model.review, mode, !!img, k);
  if (img && model.hero) plate(ctx, model.hero.label, mode, k);
  const [sx, sy] = img ? LAYOUT[mode].stamp : [800, mode === 'fish' ? LAYOUT.fish.paper[1] + 110 : LAYOUT.normal.header + 150];
  stamp(ctx, sx, sy, model.title, k);
  score(ctx, model, mode, k);
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('export failed'))), 'image/png'));
}

// ---------- 店长小海报（对照 manager-poster-v1） ----------

/** 橙白条纹遮阳篷，底边一排半圆垂边；每段垂边单独描边，白色那段在白纸上也看得出。 */
function awning(ctx: Ctx, x: number, y: number, w: number, h: number, k: Tokens) {
  const n = 10;
  const stripe = w / n;
  ctx.save();
  ctx.strokeStyle = k.ink;
  ctx.lineWidth = 5;
  for (let i = 0; i < n; i++) {
    ctx.fillStyle = i % 2 ? k.paper : k.brand;
    ctx.beginPath();
    ctx.arc(x + (i + 0.5) * stripe, y + h, stripe / 2, 0, Math.PI);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  roundRect(ctx, x, y, w, h, 22);
  ctx.save();
  ctx.clip();
  for (let i = 0; i < n; i++) {
    ctx.fillStyle = i % 2 ? k.paper : k.brand;
    ctx.fillRect(x + i * stripe, y, stripe + 1, h);
  }
  ctx.restore();
  roundRect(ctx, x, y, w, h, 22);
  ctx.stroke();
  ctx.restore();
}

/** 按冻结的店长内容绘制店长小海报并导出 PNG。 */
export async function drawManagerPoster(model: ManagerPosterModel): Promise<Blob> {
  const k = readTokens('normal');
  await document.fonts?.ready;
  const img = trimmed(await loadImage(model.hero.src));
  const canvas = document.createElement('canvas');
  canvas.width = SHARE_CARD.width;
  canvas.height = SHARE_CARD.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas unavailable');
  background(ctx, 'normal', k);
  header(ctx, model, 'normal', k);

  // 橱窗：遮阳篷与两侧立柱（店长在柜台后探头）
  ctx.fillStyle = k.brandSoft;
  ctx.strokeStyle = k.ink;
  ctx.lineWidth = 5;
  for (const px of [150, 896]) {
    ctx.fillRect(px, 300, 34, 640);
    ctx.strokeRect(px, 300, 34, 640);
  }
  awning(ctx, 110, 230, 860, 80, k);

  // 主角：店长贴纸
  const [cx, cy, bw, bh] = [540, 660, 640, 540];
  const scale = Math.min(bw / img.width, bh / img.height);
  const w = img.width * scale;
  const h = img.height * scale;
  sparks(ctx, cx - bw / 2 - 10, cy - 60, [190, 215, 240], k.brand, 30);
  sparks(ctx, cx + bw / 2 + 20, cy + 60, [-30, 0, 30], k.brand, 30);
  star(ctx, cx - bw / 2 + 10, cy + 150, 34, k.yellow);
  star(ctx, cx + bw / 2 + 30, cy + 200, 26, k.yellow);
  paw(ctx, 96, 520, 34, k.brand);
  paw(ctx, 980, 760, 30, k.brand, 0.3);
  ctx.save();
  ctx.shadowColor = k.shadow;
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 10;
  ctx.drawImage(img, cx - w / 2, cy + bh / 2 - h, w, h);
  ctx.restore();

  // 柜台盖住贴纸下缘
  ctx.fillStyle = k.paper;
  ctx.strokeStyle = k.ink;
  ctx.lineWidth = 5;
  roundRect(ctx, 96, 920, 888, 40, 12);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = k.brandSoft;
  ctx.fillRect(120, 960, 840, 120);
  ctx.strokeRect(120, 960, 840, 120);
  paw(ctx, 540, 1040, 30, k.brand, 0);

  // 名牌压在柜台上
  ctx.font = `800 46px ${k.font}`;
  const label = model.hero.label;
  const lw = Math.min(700, ctx.measureText(label).width) + 120;
  bonePlate(ctx, 540, 940, lw, 82, k);
  fit(ctx, (s) => `800 ${s}px ${k.font}`, label, 600, 1, 46, 30);
  ctx.fillStyle = k.ink;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, 540, 942);

  // 宣言气泡：右上，尾巴指向店长
  // 宣言气泡：右上，尾巴指向店长；最多 3 行，避免压住店长的脸（英文较长时变宽、字变小）
  const { size, lines } = fit(ctx, (s) => `900 ${s}px ${k.font}`, model.line, 470, 3, 70, 34, reviewLines);
  const lh = size * 1.25;
  const bh2 = lines.length * lh + 64;
  const bw2 = Math.max(...lines.map((l) => ctx.measureText(l).width)) + 90;
  const bx = 1000 - bw2;
  const by = Math.max(178, 440 - bh2);
  speech(ctx, bx, by, bw2, bh2, k, 'bottom');
  ctx.fillStyle = k.ink;
  lines.forEach((l, i) => ctx.fillText(l, bx + bw2 / 2, by + 32 + lh * (i + 0.5)));

  // 收据虚线与北京日期
  ctx.strokeStyle = k.line;
  ctx.lineWidth = 3;
  ctx.setLineDash([14, 10]);
  ctx.beginPath();
  ctx.moveTo(80, 1132);
  ctx.lineTo(1000, 1132);
  ctx.stroke();
  ctx.setLineDash([]);
  fit(ctx, (s) => `800 ${s}px ${k.font}`, model.date, 860, 1, 40, 26);
  ctx.fillStyle = k.ink;
  ctx.fillText(model.date, 540, 1196);
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('export failed'))), 'image/png'));
}
