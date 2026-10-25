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

/**
 * 读取整张册页的布局，而非截取视口；只画册页内的内容。高分辨率贴纸全部就绪后才生成 PNG，
 * 任一素材失败都交给预览重试，避免把缺图保存为成功。DOM 位置在等待图片前冻结。
 */
export async function drawStickerSheet(sheet: HTMLElement, onProgress?: (loaded: number, total: number) => void): Promise<Blob> {
  await document.fonts.ready;
  const bounds = sheet.getBoundingClientRect();
  if (!bounds.width || !bounds.height) throw new Error('Sticker sheet is not visible');
  const css = getComputedStyle(sheet);
  const token = (key: string) => css.getPropertyValue(key).trim();
  const relative = (el: Element) => {
    const box = el.getBoundingClientRect();
    return { x: box.x - bounds.x, y: box.y - bounds.y, width: box.width, height: box.height };
  };
  const labels = [...sheet.querySelectorAll<HTMLElement>('[data-album-text]')].map((el) => {
    const style = getComputedStyle(el);
    return { ...relative(el), text: el.textContent ?? '', font: style.font, color: style.color };
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
  // 透明外边距包含胶带、纸边与阴影；输出宽度固定 1200px，纵向随整张纸增长。
  const margin = parseFloat(token('--space-5'));
  const scale = 1200 / (bounds.width + margin * 2);
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = Math.ceil((bounds.height + margin * 2) * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas unavailable');
  ctx.fillStyle = token('--color-paper');
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.scale(scale, scale);
  ctx.translate(margin, margin);

  // 限制并发；即使格子在屏幕外、尚未触发懒加载，也独立加载完整册页的高清素材。
  const images: HTMLImageElement[] = new Array(slots.length);
  let next = 0;
  let loaded = 0;
  onProgress?.(0, slots.length);
  await Promise.all(Array.from({ length: Math.min(8, slots.length) }, async () => {
    while (next < slots.length) {
      const i = next++;
      images[i] = await loadImage(slots[i].src);
      onProgress?.(++loaded, slots.length);
    }
  }));

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
  for (const label of labels) {
    ctx.font = label.font;
    ctx.fillStyle = label.color;
    ctx.textBaseline = 'middle';
    // 页面长名字单行省略；导出保留完整署名，缩到同一行可用宽度内。
    const textWidth = ctx.measureText(label.text).width;
    ctx.save();
    ctx.translate(label.x, label.y + label.height / 2);
    const fit = Math.min(1, label.width / Math.max(1, textWidth));
    ctx.scale(fit, fit);
    ctx.fillText(label.text, 0, 0);
    ctx.restore();
  }
  slots.forEach((slot, i) => {
    ctx.save();
    ctx.strokeStyle = slot.color;
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
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

  return new Promise((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('PNG export failed')), 'image/png'));
}
