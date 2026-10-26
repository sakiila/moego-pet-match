/**
 * 把成片要用的素材复制到 public/assets/（不进 git）：选定宠物贴纸、品牌 Logo、游戏字体、自录喝彩、原创节拍与音效。
 * 宠物贴纸目录本身不进 git，需要本机有 assets/pets/stickers-b-head-active-v1。
 * 用法：npm run sync
 */
import { copyFileSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PETS } from '../src/pets.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const repo = join(root, '../..');
const out = join(root, 'public/assets');
rmSync(out, { recursive: true, force: true });

const copy = (from, to) => {
  mkdirSync(dirname(join(out, to)), { recursive: true });
  copyFileSync(join(repo, from), join(out, to));
};

for (const id of PETS) copy(`assets/pets/stickers-b-head-active-v1/512/${id}.png`, `pets/${id}.png`);
copy('assets/illustrations/brand/moego-logo.png', 'moego-logo.png');
for (const f of ['nunito-latin', 'rounded-cjk-medium', 'rounded-cjk-bold', 'rounded-cjk-heavy']) copy(`web/src/ui/fonts/${f}.woff2`, `fonts/${f}.woff2`);
for (const w of ['nice', 'great', 'amazing', 'wow']) copy(`assets/audio/cheers-bob-v1/previews/${w}.mp3`, `cheers/${w}.mp3`);
copy('assets/audio/promo-beat-v2/promo-beat-v2.mp3', 'beat.mp3');
for (const s of ['pop', 'slam', 'whoosh', 'ding', 'crash']) copy(`assets/audio/promo-beat-v2/sfx/${s}.wav`, `sfx/${s}.wav`);
console.log(`素材已同步到 ${out}`);
