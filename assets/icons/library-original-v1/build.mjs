import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { c, defs } from './src/style.mjs';
import { utility, settings, actions } from './src/functions.mjs';
import { operations } from './src/operations.mjs';
import { tools } from './src/tools.mjs';
import { rush, report, rankings, collection } from './src/feedback.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../../..');
const require = createRequire(import.meta.url);
const sharp = require(process.env.ICON_SHARP_MODULE || 'sharp');
const groups = JSON.parse(await fs.readFile(path.join(here, 'groups.json'), 'utf8'));
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
const write = async (relative, value) => { const target = path.join(here, relative); await fs.mkdir(path.dirname(target), { recursive: true }); await fs.writeFile(target, value); };
const xml = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');
const homeNames = [['open-shop', '开始营业'], ['pet-collection', '宠物图鉴'], ['leaderboard', '排行榜'], ['my-pets', '我的宠物'], ['open-shop-white', '开始营业白色版']];
const home = await Promise.all(homeNames.map(async ([id, label]) => ({ id, label, group: '01-home', width: 256, height: 256, svg_source: await fs.readFile(path.join(here, 'src/home', id + '.svg'), 'utf8'), ...(id.endsWith('-white') ? { variant: 'white', base: 'open-shop' } : {}), source_method: 'First-batch native SVG copied byte-for-byte' })));
const all = [...home, ...utility, ...operations, ...tools, ...rush, ...report, ...rankings, ...collection, ...settings, ...actions];
if (new Set(all.map(asset => asset.id)).size !== all.length) throw new Error('Duplicate icon id');
const exports = [];
const rendered = [];
for (const asset of all) {
  const { body, svg_source, ...metadata } = asset;
  const width = asset.width;
  const height = asset.height;
  const art = width === 256 ? `<g transform="translate(8 8) scale(.94)">${body}</g>` : `<g transform="translate(8 16)">${body}</g>`;
  const svg = svg_source || `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-labelledby="title"><title id="title">${xml(asset.label)}</title><defs>${defs}</defs>${art}</svg>\n`;
  if (/<image|<foreignObject|<script|data:image/.test(svg)) throw new Error('Non-native SVG: ' + asset.id);
  const svgFile = `svg/${asset.group}/${asset.id}.svg`;
  await write(svgFile, svg);
  const record = { ...metadata, svg: svgFile, svg_sha256: hash(svg), png: [] };
  for (const size of [32, 40, 48, 512]) {
    const pngWidth = size;
    const pngHeight = Math.max(1, Math.round(size * height / width));
    const png = await sharp(Buffer.from(svg), { density: size / width * 72 }).resize(pngWidth, pngHeight).png().toBuffer();
    const { data, info } = await sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    let visible = 0, transparent = 0, edgeVisible = 0;
    const bounds = { left: pngWidth, top: pngHeight, right: -1, bottom: -1 };
    for (let y = 0; y < pngHeight; y++) for (let x = 0; x < pngWidth; x++) {
      const offset = (y * pngWidth + x) * info.channels;
      const alpha = data[offset + 3];
      if (!alpha) transparent++;
      else {
        visible++;
        bounds.left = Math.min(bounds.left, x); bounds.right = Math.max(bounds.right, x);
        bounds.top = Math.min(bounds.top, y); bounds.bottom = Math.max(bounds.bottom, y);
        if (x === 0 || y === 0 || x === pngWidth - 1 || y === pngHeight - 1) edgeVisible++;
        if (asset.variant === 'white' && [data[offset], data[offset + 1], data[offset + 2]].some(channel => channel !== 255)) throw new Error('Non-white variant pixel: ' + asset.id);
      }
    }
    if (!visible || !transparent || edgeVisible) throw new Error(`Empty, opaque or clipped PNG: ${asset.id} ${size}px (${edgeVisible} edge pixels)`);
    const pngFile = `png/${size}/${asset.group}/${asset.id}.png`;
    await write(pngFile, png);
    record.png.push({ file: pngFile, width: pngWidth, height: pngHeight, sha256: hash(png), alpha: true, painted_bounds: bounds, edge_visible_pixels: edgeVisible });
  }
  exports.push(record);
  rendered.push({ ...record, svg_source: svg });
}

for (const group of groups) {
  const projectReference = path.join(root, 'design/concepts', group.reference + '.png');
  const localReference = 'reference/' + group.reference + '.png';
  const reference = await fs.readFile(await fs.access(projectReference).then(() => projectReference, () => path.join(here, localReference)));
  await write(localReference, reference);
  group.reference_file = localReference;
  group.reference_sha256 = hash(reference);
  group.asset_count = exports.filter(asset => asset.group === group.id).length;
}

function namespace(svg, prefix) {
  return svg.replace(/id="([^"]+)"/g, (_, id) => `id="${prefix}-${id}"`).replace(/url\(#([^)]+)\)/g, (_, id) => `url(#${prefix}-${id})`).replace(/aria-labelledby="([^"]+)"/g, (_, id) => `aria-labelledby="${prefix}-${id}"`);
}
const inner = svg => svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
const symbols = rendered.map(asset => `<symbol id="${asset.id}" viewBox="0 0 ${asset.width} ${asset.height}">${inner(namespace(asset.svg_source, asset.id))}</symbol>`).join('');
await write('sprite.svg', `<svg xmlns="http://www.w3.org/2000/svg">${symbols}</svg>\n`);

const cols = 8, cellWidth = 180, cellHeight = 176, sheetWidth = cols * cellWidth + 32, sheetHeight = Math.ceil(rendered.length / cols) * cellHeight + 112;
let sheet = `<svg xmlns="http://www.w3.org/2000/svg" width="${sheetWidth}" height="${sheetHeight}" viewBox="0 0 ${sheetWidth} ${sheetHeight}"><rect width="100%" height="100%" fill="#faf8f3"/><text x="32" y="43" font-family="Arial,sans-serif" font-size="26" font-weight="bold" fill="${c.ink}">MoeGo / Complete icon library</text><text x="32" y="73" font-family="Arial,sans-serif" font-size="15" fill="${c.grayDark}">10 groups / ${exports.length} standalone assets / SVG + transparent PNG</text>`;
rendered.forEach((asset, index) => {
  const x = 16 + index % cols * cellWidth, y = 96 + Math.floor(index / cols) * cellHeight;
  sheet += `<rect x="${x + 6}" y="${y}" width="160" height="148" rx="14" fill="${asset.variant === 'white' ? c.orange : c.paper}"/><svg x="${x + 26}" y="${y + 4}" width="120" height="120" viewBox="0 0 ${asset.width} ${asset.height}" preserveAspectRatio="xMidYMid meet">${inner(namespace(asset.svg_source, 'sheet-' + asset.id))}</svg><text x="${x + 86}" y="${y + 139}" text-anchor="middle" font-family="Arial,sans-serif" font-size="10" fill="${asset.variant === 'white' ? c.paper : c.ink}">${xml(asset.id)}</text>`;
});
sheet += '</svg>';
await write('overview.svg', sheet);
await write('overview.png', await sharp(Buffer.from(sheet)).png().toBuffer());
const manifest = { date: '2026-10-23', status: 'rejected_style_mismatch', original_designs: 'all_10_batches_approved', standalone_asset_approval: 'not_inferred_from_concept_approval', scope: 'All standalone icons in the approved ten-batch scope, plus reusable white/base/ability variants. No pet/fish content regeneration, game component changes, runtime integration or deployment.', method: 'Native SVG paths; PNGs rendered from the same SVGs. No concept-image cutouts or embedded raster content.', asset_count: exports.length, png_count: exports.reduce((count, asset) => count + asset.png.length, 0), png_long_edges: [32, 40, 48, 512], colors: c, groups, exports, validation: { native_svg_only: true, all_pngs_have_alpha: true, all_png_perimeters_clear: true, all_white_variants_pure_white: true, references_copied_without_pixel_changes: true, game_integration_tested: false } };
await write('palette.json', JSON.stringify(c, null, 2) + '\n');
await write('manifest.json', JSON.stringify(manifest, null, 2) + '\n');
const template = await fs.readFile(path.join(here, 'preview.template.html'), 'utf8');
await write('preview.html', template.replace('__LIBRARY_DATA__', JSON.stringify(manifest).replaceAll('<', '\\u003c')));
console.log(`Built ${exports.length} SVG icons, ${manifest.png_count} transparent PNGs, sprite and overview. All pixel/edge checks passed.`);
