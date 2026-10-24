import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

// Standalone asset source only. This does not import or modify the game.
const here = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const sharp = process.env.ICON_SHARP_MODULE
  ? require(process.env.ICON_SHARP_MODULE)
  : require('sharp');
const c = JSON.parse(await fs.readFile(path.join(here, 'palette.json'), 'utf8'));
const stroke = 7.6;
const round = 'stroke-linecap="round" stroke-linejoin="round"';
const defs = `
  <linearGradient id="orange" x1="0" y1="0" x2="0.25" y2="1" gradientUnits="objectBoundingBox">
    <stop stop-color="${c.orangeLight}"/><stop offset="1" stop-color="${c.orangeDeep}"/>
  </linearGradient>
  <linearGradient id="paper" x1="0" y1="0" x2="0.7" y2="1" gradientUnits="objectBoundingBox">
    <stop stop-color="${c.paper}"/><stop offset="1" stop-color="${c.ivory}"/>
  </linearGradient>
  <linearGradient id="blue" x1="0" y1="0" x2="0.5" y2="1" gradientUnits="objectBoundingBox">
    <stop stop-color="${c.catBlue}"/><stop offset="1" stop-color="${c.catBlueDeep}"/>
  </linearGradient>`;

const palm = 'M128 123C111 123 102 137 88 151C74 165 60 179 62 194C64 214 80 222 99 218L118 214C125 212 132 212 140 214L158 218C179 223 197 211 198 193C199 178 183 163 169 149C153 133 145 123 128 123Z';
function paw(white = false) {
  return `<g fill="${white ? c.paper : 'url(#orange)'}" stroke="${white ? c.paper : c.ink}" stroke-width="${stroke}" ${round}>
    <ellipse cx="45" cy="119" rx="18.8" ry="25.5" transform="rotate(-27 45 119)"/>
    <ellipse cx="99" cy="78" rx="21.5" ry="29.5" transform="rotate(-12 99 78)"/>
    <ellipse cx="156" cy="78" rx="21.5" ry="29.5" transform="rotate(13 156 78)"/>
    <ellipse cx="207" cy="119" rx="18.8" ry="25.5" transform="rotate(27 207 119)"/>
    <path d="${palm}"/>
  </g>`;
}

const book = `
  <g stroke="${c.ink}" stroke-width="${stroke}" ${round}>
    <path d="M33 94Q17 94 17 111V204Q17 221 35 221L93 218Q111 218 121 229Q128 234 136 229Q149 218 166 218L221 221Q239 221 239 204V111Q239 94 222 94Z" fill="url(#orange)"/>
    <path d="M128 96C105 77 81 75 55 81Q44 83 44 94V202C76 193 104 198 128 216C153 198 180 190 212 201V94Q212 83 202 80C176 74 151 78 128 96Z" fill="url(#paper)"/>
  </g>
  <path d="M48 190C79 182 105 190 126 205L126 213C102 199 76 194 48 200ZM132 205C157 190 182 184 208 192V199C181 191 155 200 132 213Z" fill="${c.cream}"/>
  <path d="M128 99V207" fill="none" stroke="${c.creamLight}" stroke-width="5" stroke-linecap="round"/>
  <path d="M44 96V201C76 192 104 197 128 215C154 198 180 190 212 200V95" fill="none" stroke="${c.ink}" stroke-width="${stroke}" ${round}/>
  <path d="M163 80H190V126L177 118L163 126Z" fill="url(#orange)" stroke="${c.ink}" stroke-width="5.5" ${round}/>
  <path d="M219 49L229 31M234 67L247 59" fill="none" stroke="${c.orange}" stroke-width="9" ${round}/>`;

const handle = 'M70 105C13 87 17 147 80 157';
const trophy = `
  <g fill="none" ${round}>
    <path d="${handle}" stroke="${c.ink}" stroke-width="22"/>
    <path d="${handle}" stroke="${c.ivory}" stroke-width="9"/>
    <path d="${handle}" transform="translate(256 0) scale(-1 1)" stroke="${c.ink}" stroke-width="22"/>
    <path d="${handle}" transform="translate(256 0) scale(-1 1)" stroke="${c.ivory}" stroke-width="9"/>
  </g>
  <path d="M73 75H183Q192 75 191 85L187 128C183 162 169 179 144 188V205H112V188C86 179 71 162 67 128L64 85Q63 75 73 75Z" fill="url(#paper)" stroke="${c.ink}" stroke-width="${stroke}" ${round}/>
  <path d="M116 194H140V204H116Z" fill="${c.baseShade}"/>
  <path d="M101 205H155Q167 205 171 217L173 226H83L85 217Q89 205 101 205Z" fill="url(#paper)" stroke="${c.ink}" stroke-width="${stroke}" ${round}/>
  <path d="M89 219H167L169 223H87Z" fill="${c.baseShade}" opacity=".6"/>
  <path d="M128 101L136 118L155 121L141 134L144 153L128 144L111 153L114 134L100 121L119 118Z" fill="${c.orange}" stroke="${c.orange}" stroke-width="5.5" ${round}/>
  <path d="M207 62L217 45M225 80L240 71" fill="none" stroke="${c.orange}" stroke-width="9" ${round}/>`;

const pets = `
  <path d="M135 90L143 55Q147 41 155 50L176 75Q189 75 201 82L224 68Q237 60 236 79L232 116Q240 143 219 159L202 175Q181 185 161 173L140 147Q128 124 135 90Z" fill="url(#blue)" stroke="${c.ink}" stroke-width="${stroke}" ${round}/>
  <g fill="${c.feature}">
    <ellipse cx="166" cy="112" rx="6.7" ry="7.4"/>
    <ellipse cx="207" cy="121" rx="6.7" ry="7.4"/>
    <path d="M179 126Q184 124 189 129Q190 132 184 135Q179 132 179 126Z"/>
  </g>
  <path d="M183 135Q178 141 173 135M184 135Q188 143 193 138M228 134L243 138M228 145L241 152" fill="none" stroke="${c.ink}" stroke-width="4.4" ${round}/>
  <path d="M66 121C52 121 42 136 31 150L17 171C10 183 20 194 29 201L40 214Q48 225 57 213L69 192C75 170 73 143 66 121Z" fill="url(#paper)" stroke="${c.ink}" stroke-width="${stroke}" ${round}/>
  <path d="M139 123C155 121 164 136 177 151L193 172Q204 185 191 198L179 211Q172 224 163 214L153 199C147 182 144 155 139 123Z" fill="url(#paper)" stroke="${c.ink}" stroke-width="${stroke}" ${round}/>
  <path d="M36 197Q45 210 48 213L57 199L60 177Q54 191 47 198Q42 202 36 197ZM170 204L177 200L187 190Q178 202 172 191L161 169L164 196Z" fill="${c.creamLight}"/>
  <path d="M73 112C90 101 116 103 133 112C150 123 158 143 158 170V195C156 220 137 232 110 233C82 234 59 220 58 197V167C58 143 61 124 73 112Z" fill="url(#paper)" stroke="${c.ink}" stroke-width="${stroke}" ${round}/>
  <g fill="${c.feature}">
    <ellipse cx="83" cy="159" rx="7.1" ry="8"/>
    <ellipse cx="131" cy="160" rx="7.1" ry="8"/>
    <path d="M97 179C99 172 119 173 122 180C124 187 115 192 109 192C103 191 95 186 97 179Z"/>
  </g>
  <path d="M102 198H118V211C118 225 102 225 102 211Z" fill="${c.tongue}"/>
  <path d="M94 198Q100 206 109 199Q118 207 125 198" fill="none" stroke="${c.ink}" stroke-width="4.5" ${round}/>
  <path d="M110 202V216" fill="none" stroke="${c.orangeDeep}" stroke-width="2" stroke-linecap="round"/>
  <path d="M220 43L230 27M235 63L246 57" fill="none" stroke="${c.orange}" stroke-width="8.5" ${round}/>`;

const definitions = [
  ['open-shop', '开始营业', paw()],
  ['pet-collection', '宠物图鉴', book],
  ['leaderboard', '排行榜', trophy],
  ['my-pets', '我的宠物', pets],
  ['open-shop-white', '开始营业白色版', paw(true)],
];
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
const exports = [];
for (const [name, title, artwork] of definitions) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256" role="img" aria-labelledby="title"><title id="title">${title}</title><defs>${defs}</defs><g transform="translate(8 8) scale(.94)">${artwork}</g></svg>\n`;
  await fs.mkdir(path.join(here, 'svg'), { recursive: true });
  const svgFile = 'svg/' + name + '.svg';
  await fs.writeFile(path.join(here, svgFile), svg);
  const entry = { name, title, svg: svgFile, svg_sha256: hash(svg), png: [] };
  for (const size of [32, 40, 48, 512]) {
    const pngFile = size === 512 ? 'png/' + name + '.png' : 'png/' + size + '/' + name + '.png';
    await fs.mkdir(path.dirname(path.join(here, pngFile)), { recursive: true });
    const png = await sharp(Buffer.from(svg), { density: size / 256 * 72 }).resize(size, size).png().toBuffer();
    await fs.writeFile(path.join(here, pngFile), png);
    const { data, info } = await sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    let visible = 0;
    let transparent = 0;
    let edgeVisible = 0;
    let box = { left: size, top: size, right: -1, bottom: -1 };
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const alpha = data[(y * size + x) * info.channels + info.channels - 1];
      if (alpha === 0) transparent++;
      if (alpha > 0) {
        visible++;
        box = { left: Math.min(box.left, x), top: Math.min(box.top, y), right: Math.max(box.right, x), bottom: Math.max(box.bottom, y) };
        if (x === 0 || y === 0 || x === size - 1 || y === size - 1) edgeVisible++;
      }
    }
    if (!visible || !transparent || edgeVisible) throw new Error('Empty, opaque or clipped export: ' + pngFile);
    entry.png.push({ file: pngFile, size, sha256: hash(png), alpha: true, painted_bounds: box, edge_visible_pixels: edgeVisible });
  }
  exports.push(entry);
}
const projectReference = path.resolve(here, '../../../design/concepts/home-entry-icons-v3.png');
const localReference = path.join(here, 'reference/home-entry-icons-v3.png');
const reference = await fs.access(projectReference).then(() => projectReference, () => localReference);
await fs.mkdir(path.join(here, 'reference'), { recursive: true });
if (reference !== localReference) await fs.copyFile(reference, localReference);
const manifest = {
  date: '2026-10-23', batch: 1, status: 'pending_asset_review',
  direction: 'Approved home-entry v3; charcoal outlines, orange/ivory and restrained matte depth',
  source_reference: 'design/concepts/home-entry-icons-v3.png', source_sha256: hash(await fs.readFile(reference)),
  method: 'Native SVG paths rebuilt for standalone use; PNGs rendered from these same SVGs with sharp, no concept-image crop or raster embedding.',
  scope: 'Four home entries plus white primary-action paw; no game-component changes or integration.',
  viewBox: '0 0 256 256', png_sizes: [32, 40, 48, 512],
  palette: 'palette.json', review_reference: 'reference/home-entry-icons-v3.png', exports,
};
await fs.writeFile(path.join(here, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(`Built ${exports.length} SVGs and ${exports.reduce((count, icon) => count + icon.png.length, 0)} transparent PNGs; all exports have empty perimeter pixels.`);
