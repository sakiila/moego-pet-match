import { createHash } from 'node:crypto';
import sharp from 'sharp';

/**
 * 卡背照片：整张原图（合照保留全图）按 EXIF 方向摆正后缩到长边 1600 的 JPEG。
 * sharp 默认不写入任何元数据，拍摄位置等 EXIF 随之去除。
 */
export async function makeCardPhoto(originalPath: string): Promise<{ body: Buffer; hash: string }> {
  const body = await sharp(originalPath).rotate().resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 84, mozjpeg: true }).toBuffer();
  return { body, hash: createHash('sha256').update(body).digest('hex').slice(0, 12) };
}

/** 由贴纸透明通道生成剪影（未收集卡片用），不泄露毛色与花纹。 */
export async function makeSilhouette(sticker: Buffer): Promise<Buffer> {
  const { width, height } = await sharp(sticker).metadata();
  const alpha = await sharp(sticker).ensureAlpha().extractChannel('alpha').toBuffer();
  return sharp({ create: { width: width!, height: height!, channels: 3, background: { r: 155, g: 160, b: 168 } } })
    .joinChannel(alpha)
    .png()
    .toBuffer();
}
