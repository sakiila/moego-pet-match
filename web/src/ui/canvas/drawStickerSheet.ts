import type { Locale } from '../../i18n';
import { SHARE_URL } from '../../game/shareUrl';
import logoSrc from '../art/moego-logo.webp';
import titleZhSrc from '../art/title-zh.webp';
import titleEnSrc from '../art/title-en.webp';
import { PAPER_EDGE, TAPE_EDGE } from './stickerSheetShape';

type Point = readonly [number, number];

function outline(ctx: CanvasRenderingContext2D, points: readonly Point[], width: number, height: number) {
  ctx.beginPath();
  points.forEach(([x, y], i) => {
    if (i === 0) ctx.moveTo(x * width / 100, y * height / 100);
    else ctx.lineTo(x * width / 100, y * height / 100);
  });
  ctx.closePath();
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const finish = (error?: Error) => {
      clearTimeout(timer);
      img.onload = img.onerror = null;
      if (error) reject(error);
      else resolve(img);
    };
    const timer = window.setTimeout(() => finish(new Error('Sticker image timed out')), 10_000);
    img.onload = () => finish();
    img.onerror = () => finish(new Error('Sticker image unavailable'));
    img.src = src;
  });
}

function paw(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, angle: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.beginPath();
  ctx.ellipse(0, size * 0.35, size * 0.55, size * 0.45, 0, 0, Math.PI * 2);
  ctx.fill();
  for (const [dx, dy] of [[-0.62, -0.25], [-0.22, -0.62], [0.22, -0.62], [0.62, -0.25]]) {
    ctx.beginPath();
    ctx.ellipse(dx * size, dy * size, size * 0.2, size * 0.26, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

interface StickerSheetCopy {
  locale: Locale;
  collectedLabel: string;
  footer: string;
}

/**
 * 读取整张真实册页，加入品牌页头与文案，不导出页面导航和按钮。高分辨率贴纸全部就绪后才生成 PNG，
 * 任一素材失败都交给预览重试，避免把缺图保存为成功。DOM 位置在等待图片前冻结。
 */
export async function drawStickerSheet(sheet: HTMLElement, copy: StickerSheetCopy, onProgress?: (loaded: number, total: number) => void): Promise<Blob> {
  await document.fonts.ready;
  const bounds = sheet.getBoundingClientRect();
  if (!bounds.width || !bounds.height) throw new Error('Sticker sheet is not visible');
  const css = getComputedStyle(sheet);
  const token = (key: string) => css.getPropertyValue(key).trim();
  const number = (key: string) => parseFloat(token(key));
  const relative = (el: Element) => {
    const box = el.getBoundingClientRect();
    return { x: box.x - bounds.x, y: box.y - bounds.y, width: box.width, height: box.height };
  };
  const labels = [...sheet.querySelectorAll<HTMLElement>('[data-album-text]')].map((el) => {
    const style = getComputedStyle(el);
    return { ...relative(el), text: el.textContent ?? '', font: `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`, color: style.color };
  });
  const slots = [...sheet.querySelectorAll<HTMLElement>('[data-album-slot]')].map((el) => {
    const style = getComputedStyle(el);
    return {
      ...relative(el), src: el.dataset.exportSrc!, collected: el.dataset.collected === 'true',
      tilt: Number(el.dataset.tilt), color: style.borderColor, radius: parseFloat(style.borderRadius),
    };
  });
  const tape = sheet.querySelector<HTMLElement>('[data-album-tape]')!;
  const tapeCss = getComputedStyle(tape);
  const tapeBox = { x: tape.offsetLeft, y: tape.offsetTop, width: tape.offsetWidth, height: tape.offsetHeight };
  const tapeTransform = new DOMMatrix(tapeCss.transform);
  // 品牌区固定比例，整张纸按宽度等比放大；末行不满或目录增长也完整保留。
  const width = number('--album-share-width');
  const margin = number('--album-share-margin');
  const header = number('--album-share-header');
  const footer = number('--album-share-footer');
  const scale = (width - margin * 2) / bounds.width;
  const paperBottom = header + bounds.height * scale;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = Math.ceil(paperBottom + footer);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas unavailable');
  ctx.fillStyle = token('--color-paper');
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 限制并发；即使格子在屏幕外、尚未触发懒加载，也独立加载完整册页的高清素材。
  const images: HTMLImageElement[] = new Array(slots.length);
  let next = 0;
  let loaded = 0;
  onProgress?.(0, slots.length);
  const petsReady = Promise.all(Array.from({ length: Math.min(8, slots.length) }, async () => {
    while (next < slots.length) {
      const i = next++;
      images[i] = await loadImage(slots[i].src);
      onProgress?.(++loaded, slots.length);
    }
  }));
  const [logo, title] = await Promise.all([
    loadImage(logoSrc),
    loadImage(copy.locale === 'zh' ? titleZhSrc : titleEnSrc),
    petsReady,
  ]);

  const logoWidth = number('--album-share-logo-width');
  ctx.drawImage(logo, (width - logoWidth) / 2, number('--album-share-logo-top'), logoWidth, logoWidth * logo.naturalHeight / logo.naturalWidth);
  const titleWidth = number('--album-share-title-width');
  ctx.drawImage(title, (width - titleWidth) / 2, number('--album-share-title-top'), titleWidth, titleWidth * title.naturalHeight / title.naturalWidth);

  ctx.save();
  ctx.translate(margin, header);
  ctx.scale(scale, scale);

  ctx.save();
  ctx.shadowColor = token('--share-shadow');
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 3;
  ctx.fillStyle = token('--album-paper');
  outline(ctx, PAPER_EDGE, bounds.width, bounds.height);
  ctx.fill();
  ctx.restore();

  ctx.save();
  outline(ctx, PAPER_EDGE, bounds.width, bounds.height);
  ctx.clip();
  ctx.fillStyle = token('--album-fiber');
  for (let y = 0; y < bounds.height; y += 3) ctx.fillRect(0, y, bounds.width, 0.35);
  const [player, count] = labels;
  const collected = slots.filter((slot) => slot.collected).length;
  const countParts = [
    { text: `${copy.collectedLabel} `, font: count.font, color: token('--color-ink') },
    { text: String(collected), font: `${token('--weight-display')} ${number('--text-xs') * number('--album-share-count-scale')}px ${token('--font-sans')}`, color: token('--color-brand') },
    { text: ` / ${slots.length}`, font: count.font, color: count.color },
  ].map((part) => {
    ctx.font = part.font;
    return { ...part, width: ctx.measureText(part.text).width };
  });
  let countX = bounds.width - number('--space-3') - countParts.reduce((sum, part) => sum + part.width, 0);
  ctx.textBaseline = 'middle';
  ctx.font = player.font;
  ctx.fillStyle = player.color;
  // 缩放完整署名以容纳长名字，为右侧真实收集数留出空间。
  const playerWidth = Math.max(1, countX - player.x - number('--space-3'));
  const fit = Math.min(1, playerWidth / Math.max(1, ctx.measureText(player.text).width));
  ctx.save();
  ctx.translate(player.x, player.y + player.height / 2);
  ctx.scale(fit, fit);
  ctx.fillText(player.text, 0, 0);
  ctx.restore();
  for (const part of countParts) {
    ctx.font = part.font;
    ctx.fillStyle = part.color;
    ctx.fillText(part.text, countX, count.y + count.height / 2);
    countX += part.width;
  }
  slots.forEach((slot, i) => {
    ctx.save();
    ctx.strokeStyle = slot.color;
    ctx.lineWidth = number('--album-slot-stroke') / scale;
    ctx.setLineDash([3 / scale, 3 / scale]);
    ctx.beginPath();
    ctx.roundRect(slot.x, slot.y, slot.width, slot.height, slot.radius);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.translate(slot.x + slot.width / 2, slot.y + slot.height / 2);
    if (slot.collected) {
      ctx.rotate(slot.tilt * Math.PI / 180);
      ctx.shadowColor = token('--share-shadow');
      ctx.shadowBlur = 1.5;
      ctx.shadowOffsetY = 1;
    } else ctx.globalAlpha = Number(token('--album-silhouette-opacity'));
    const img = images[i];
    const fit = Math.min(slot.width / img.naturalWidth, slot.height / img.naturalHeight) * Number(token('--album-sticker-scale'));
    const w = img.naturalWidth * fit;
    const h = img.naturalHeight * fit;
    ctx.drawImage(img, -w / 2, -h / 2, w, h);
    ctx.restore();
  });
  ctx.restore();

  ctx.save();
  ctx.translate(tapeBox.x + tapeBox.width / 2, tapeBox.y + tapeBox.height / 2);
  ctx.transform(tapeTransform.a, tapeTransform.b, tapeTransform.c, tapeTransform.d, 0, 0);
  ctx.translate(-tapeBox.width / 2, -tapeBox.height / 2);
  ctx.fillStyle = token('--album-tape');
  outline(ctx, TAPE_EDGE, tapeBox.width, tapeBox.height);
  ctx.fill();
  ctx.clip();
  ctx.fillStyle = token('--album-tape-fiber');
  for (let x = 0; x < tapeBox.width; x += 3) ctx.fillRect(x, 0, 0.4, tapeBox.height);
  ctx.restore();
  ctx.restore();

  const pawSize = number('--album-share-paw-size');
  const gap = number('--album-share-footer-gap');
  const footerY = paperBottom + footer / 3;
  const footerFont = (size: number) => `${token('--weight-bold')} ${size}px ${token('--font-sans')}`;
  const fontSize = number('--album-share-footer-size');
  ctx.font = footerFont(fontSize);
  const footerWidth = width - margin * 2 - (pawSize * 2 + gap) * 2;
  ctx.font = footerFont(fontSize * Math.min(1, footerWidth / Math.max(1, ctx.measureText(copy.footer).width)));
  const textWidth = ctx.measureText(copy.footer).width;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = token('--color-ink-muted');
  ctx.fillText(copy.footer, width / 2, footerY);
  ctx.fillStyle = token('--color-brand');
  paw(ctx, (width - textWidth) / 2 - gap - pawSize, footerY, pawSize, -0.3);
  paw(ctx, (width + textWidth) / 2 + gap + pawSize, footerY, pawSize, 0.3);

  ctx.font = `${token('--weight-regular')} ${number('--share-url-size')}px ${token('--font-sans')}`;
  ctx.fillStyle = token('--fg-muted');
  ctx.fillText(SHARE_URL, width / 2, paperBottom + footer * 2 / 3);

  return new Promise((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('PNG export failed')), 'image/png'));
}
