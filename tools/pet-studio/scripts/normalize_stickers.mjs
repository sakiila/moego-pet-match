#!/usr/bin/env node
/**
 * Package approved transparent pet stickers without repainting them.
 *
 * Usage: node normalize_stickers.mjs --manifest input.json --output NEW_DIRECTORY
 * Manifest: { entries: [{ id, source, name?, shape?: "long-ears", targetSpan?,
 *                        prompt?, provenance? }], defaults?: { ... } }
 *
 * Alpha cleanup is deliberately conservative:
 * 1. Discard alpha < 4/255, then label 8-connected alpha components.
 * 2. Keep the largest component intact, including every connected ear, fur strand,
 *    and whisker. Never erode, trim, redraw, or recolor that component.
 * 3. Remove detached components <= 160 pixels at a 1024-source reference size.
 *    Preserve thin, elongated detached fringe within 24 reference pixels, and
 *    anything within 1 reference pixel of the main component. Preserve larger
 *    detached components and flag them for human review instead of guessing.
 * 4. Isotropically resample the retained bounds to 840 px (900 px for long ears),
 *    centered on a transparent 1024 square. Keep the approved white outline;
 *    eroding a generated white border risks erasing white fur and fine whiskers.
 * 5. Export 1024/512/128 PNGs, byte-for-byte source snapshots, and exact provenance.
 *
 * Pixel-count, alpha-mass, bounding-box, margin, and SHA-256 statistics are saved.
 * New output directories only, except an explicit allowPreviewShell manifest flag
 * permits an existing directory containing only README.md and preview.html. Those
 * files are preserved and every generated asset is copied exclusively. No game
 * files, databases, or review data are read or written by the utility.
 */

import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
let sharp;
try {
  sharp = require('sharp');
} catch {
  const bundled = process.env.PET_STUDIO_NODE_MODULES || path.join(os.homedir(), '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules');
  sharp = require(path.join(bundled, 'sharp'));
}

const DEFAULTS = Object.freeze({
  minAlpha: 4,
  maxDetachedPixels: 160,
  minFringeLength: 12,
  fringeAspectRatio: 3,
  nearFringePx: 24,
  keepTinyNearPx: 1,
  targetSpan: 840,
  longEarSpan: 900,
  canvasSize: 1024,
});

function sha256(bytes) {
  return crypto.createHash('sha256').update(bytes).digest('hex');
}

function neighbors(index, width, height, visit) {
  const x = index % width;
  const y = (index / width) | 0;
  for (let dy = -1; dy <= 1; dy++) {
    const yy = y + dy;
    if (yy < 0 || yy >= height) continue;
    for (let dx = -1; dx <= 1; dx++) {
      const xx = x + dx;
      if ((!dx && !dy) || xx < 0 || xx >= width) continue;
      visit(yy * width + xx);
    }
  }
}

function boundsOf(rgba, width, height) {
  let left = width, top = height, right = -1, bottom = -1, count = 0;
  for (let index = 0; index < width * height; index++) {
    if (!rgba[index * 4 + 3]) continue;
    const x = index % width, y = (index / width) | 0;
    left = Math.min(left, x); top = Math.min(top, y);
    right = Math.max(right, x); bottom = Math.max(bottom, y); count++;
  }
  return count ? { left, top, width: right - left + 1, height: bottom - top + 1, pixels: count } : null;
}

export function cleanAlphaComponents(input, width, height, options = {}) {
  const settings = { ...DEFAULTS, ...options };
  const rgba = Buffer.from(input);
  const length = width * height;
  const labels = new Int32Array(length);
  const queue = new Int32Array(length);
  const components = [];
  let faintPixelsRemoved = 0, faintAlphaRemoved = 0, originalAlpha = 0;

  for (let i = 0; i < length; i++) {
    const alpha = rgba[i * 4 + 3];
    originalAlpha += alpha;
    if (alpha && alpha < settings.minAlpha) {
      faintPixelsRemoved++; faintAlphaRemoved += alpha;
      rgba[i * 4 + 3] = 0;
    }
  }
  for (let origin = 0; origin < length; origin++) {
    if (labels[origin] || !rgba[origin * 4 + 3]) continue;
    const label = components.length + 1;
    let front = 0, end = 1, pixels = 0, alphaMass = 0;
    let left = width, top = height, right = 0, bottom = 0;
    queue[0] = origin; labels[origin] = label;
    while (front < end) {
      const index = queue[front++], x = index % width, y = (index / width) | 0;
      pixels++; alphaMass += rgba[index * 4 + 3];
      left = Math.min(left, x); top = Math.min(top, y);
      right = Math.max(right, x); bottom = Math.max(bottom, y);
      neighbors(index, width, height, next => {
        if (!labels[next] && rgba[next * 4 + 3]) { labels[next] = label; queue[end++] = next; }
      });
    }
    components.push({ label, pixels, alphaMass, left, top, width: right - left + 1, height: bottom - top + 1 });
  }
  if (!components.length) throw new Error('Image has no visible alpha component');
  const main = components.reduce((best, component) => component.pixels > best.pixels ? component : best);
  const sourceScale = Math.max(width, height) / 1024;
  const maxDistance = Math.ceil(settings.nearFringePx * sourceScale);
  const distances = new Uint16Array(length); distances.fill(65535);
  let front = 0, end = 0;
  for (let index = 0; index < length; index++) {
    if (labels[index] !== main.label) continue;
    distances[index] = 0;
    let boundary = false;
    neighbors(index, width, height, next => { if (labels[next] !== main.label) boundary = true; });
    if (boundary) queue[end++] = index;
  }
  while (front < end) {
    const index = queue[front++], distance = distances[index];
    if (distance >= maxDistance) continue;
    neighbors(index, width, height, next => {
      if (distances[next] > distance + 1) { distances[next] = distance + 1; queue[end++] = next; }
    });
  }
  const nearest = new Uint16Array(components.length + 1); nearest.fill(65535);
  for (let index = 0; index < length; index++) {
    const label = labels[index];
    if (label && label !== main.label) nearest[label] = Math.min(nearest[label], distances[index]);
  }
  const limit = Math.round(settings.maxDetachedPixels * sourceScale ** 2);
  const kept = new Set([main.label]);
  const removed = [], protectedFringe = [], review = [];
  for (const component of components) {
    if (component.label === main.label) continue;
    const distance = nearest[component.label];
    const long = Math.max(component.width, component.height), short = Math.min(component.width, component.height);
    const elongated = long >= settings.minFringeLength * sourceScale && long / short >= settings.fringeAspectRatio;
    if (distance <= Math.ceil(settings.keepTinyNearPx * sourceScale) || (elongated && distance <= maxDistance)) {
      kept.add(component.label); protectedFringe.push({ ...component, distance: distance === 65535 ? null : distance });
    } else if (component.pixels > limit) {
      kept.add(component.label); review.push({ ...component, distance: distance === 65535 ? null : distance, reason: 'Large detached component retained for visual review' });
    } else {
      removed.push(component);
    }
  }
  for (let i = 0; i < length; i++) {
    if (!kept.has(labels[i])) rgba[i * 4 + 3] = 0;
    if (!rgba[i * 4 + 3]) rgba.fill(0, i * 4, i * 4 + 4);
  }
  const detachedPixelsRemoved = removed.reduce((sum, item) => sum + item.pixels, 0);
  const detachedAlphaRemoved = removed.reduce((sum, item) => sum + item.alphaMass, 0);
  return {
    rgba, bounds: boundsOf(rgba, width, height),
    stats: {
      originalComponents: components.length,
      mainComponent: main,
      faintPixelsRemoved, faintAlphaRemoved,
      detachedComponentsRemoved: removed.length, detachedPixelsRemoved, detachedAlphaRemoved,
      totalPixelsRemoved: faintPixelsRemoved + detachedPixelsRemoved,
      removedAlphaFraction: originalAlpha ? (faintAlphaRemoved + detachedAlphaRemoved) / originalAlpha : 0,
      maxDetachedPixelsAtSource: limit,
      protectedFringe,
      retainedDetachedForReview: review,
      removedComponentsLargestFirst: removed.sort((a, b) => b.pixels - a.pixels).slice(0, 32),
    },
  };
}

export async function normalizeRgba(rgba, width, height, options = {}) {
  const settings = { ...DEFAULTS, ...options };
  if (settings.canvasSize !== 1024) throw new Error('Master canvas must be 1024 by 1024');
  const bounds = boundsOf(rgba, width, height);
  if (!bounds) throw new Error('Empty sticker');
  const span = settings.shape === 'long-ears' ? settings.longEarSpan : settings.targetSpan;
  if (!Number.isInteger(span) || span < 512 || span > settings.canvasSize - 64) throw new Error('Target span must leave a transparent safety margin');
  const resized = await sharp(rgba, { raw: { width, height, channels: 4 } })
    .extract({ left: bounds.left, top: bounds.top, width: bounds.width, height: bounds.height })
    .resize({ width: span, height: span, fit: 'inside', kernel: sharp.kernel.lanczos3 })
    .png().toBuffer({ resolveWithObject: true });
  const left = Math.floor((settings.canvasSize - resized.info.width) / 2);
  const top = Math.floor((settings.canvasSize - resized.info.height) / 2);
  const png = await sharp({ create: { width: settings.canvasSize, height: settings.canvasSize, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: resized.data, left, top }]).png({ compressionLevel: 9 }).toBuffer();
  const decoded = await sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const resultBounds = boundsOf(decoded.data, decoded.info.width, decoded.info.height);
  const margins = { left: resultBounds.left, top: resultBounds.top, right: settings.canvasSize - resultBounds.left - resultBounds.width, bottom: settings.canvasSize - resultBounds.top - resultBounds.height };
  const corners = [0, settings.canvasSize - 1, settings.canvasSize * (settings.canvasSize - 1), settings.canvasSize ** 2 - 1].map(index => decoded.data[index * 4 + 3]);
  if (Math.min(...Object.values(margins)) < 24 || corners.some(Boolean)) throw new Error('Transparent safety margin validation failed');
  return { png, stats: { sourceBounds: bounds, targetSpan: span, scale: Math.min(span / bounds.width, span / bounds.height), resultBounds, margins, cornerAlpha: corners, outlinePolicy: 'Preserve approved generated white outline without eroding fur or whiskers' } };
}

async function inspectOutput(output, allowPreviewShell) {
  try {
    const stat = await fs.lstat(output);
    if (!allowPreviewShell || !stat.isDirectory()) throw new Error(`Refusing to overwrite existing output: ${output}`);
    const entries = await fs.readdir(output, { withFileTypes: true });
    if (entries.some(entry => !entry.isFile() || !['README.md', 'preview.html'].includes(entry.name))) {
      throw new Error(`Refusing existing asset or manifest files in output: ${output}`);
    }
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') return false;
    throw error;
  }
}

async function publishExclusively(staging, output) {
  const created = [];
  async function copyDirectory(source, destination) {
    for (const entry of await fs.readdir(source, { withFileTypes: true })) {
      const from = path.join(source, entry.name), to = path.join(destination, entry.name);
      if (entry.isDirectory()) {
        await fs.mkdir(to); created.push({ path: to, directory: true });
        await copyDirectory(from, to);
      } else {
        const handle = await fs.open(to, 'wx'); created.push({ path: to, directory: false });
        try { await handle.writeFile(await fs.readFile(from)); }
        finally { await handle.close(); }
      }
    }
  }
  try {
    await copyDirectory(staging, output);
  } catch (error) {
    for (const entry of created.reverse()) {
      if (entry.directory) await fs.rmdir(entry.path);
      else await fs.unlink(entry.path);
    }
    throw error;
  }
}

export async function normalizeBatch(manifestPath, outputPath) {
  const rawManifest = await fs.readFile(manifestPath);
  const manifest = JSON.parse(rawManifest);
  if (!Array.isArray(manifest.entries) || !manifest.entries.length) throw new Error('Manifest entries are required');
  const ids = new Set();
  for (const entry of manifest.entries) {
    if (!/^[a-z][a-z0-9_-]{0,63}$/.test(entry.id) || ids.has(entry.id)) throw new Error('Sticker IDs must be unique safe filenames');
    ids.add(entry.id);
  }
  const output = path.resolve(outputPath);
  await inspectOutput(output, manifest.allowPreviewShell === true);
  await fs.mkdir(path.dirname(output), { recursive: true });
  const staging = output + '.preparing-' + crypto.randomUUID();
  await fs.mkdir(staging);
  const records = [];
  try {
    for (const folder of ['1024', '512', '128', 'source']) await fs.mkdir(path.join(staging, folder));
    for (const entry of manifest.entries) {
      const source = path.resolve(path.dirname(manifestPath), entry.source);
      const input = await fs.readFile(source);
      const metadata = await sharp(input).metadata();
      if (metadata.format !== 'png' || !metadata.hasAlpha) throw new Error(`${entry.id}: expected a transparent source PNG`);
      const decoded = await sharp(input).rotate().toColourspace('srgb').ensureAlpha().raw().toBuffer({ resolveWithObject: true });
      const options = { ...DEFAULTS, ...manifest.defaults, ...entry };
      const pixelCount = decoded.info.width * decoded.info.height;
      let transparentPixels = 0;
      for (let index = 0; index < pixelCount; index++) if (decoded.data[index * 4 + 3] < options.minAlpha) transparentPixels++;
      const sourceCorners = [0, decoded.info.width - 1, decoded.info.width * (decoded.info.height - 1), pixelCount - 1].map(index => decoded.data[index * 4 + 3]);
      if (transparentPixels < pixelCount * 0.02 || sourceCorners.some(alpha => alpha >= options.minAlpha)) {
        throw new Error(`${entry.id}: source lacks a clear transparent background; packaging never removes a painted background`);
      }
      const cleaned = cleanAlphaComponents(decoded.data, decoded.info.width, decoded.info.height, options);
      const normalized = await normalizeRgba(cleaned.rgba, decoded.info.width, decoded.info.height, options);
      const files = {};
      for (const size of [1024, 512, 128]) {
        const png = size === 1024 ? normalized.png : await sharp(normalized.png).resize(size, size, { kernel: sharp.kernel.lanczos3 }).png({ compressionLevel: 9 }).toBuffer();
        await fs.writeFile(path.join(staging, String(size), entry.id + '.png'), png, { flag: 'wx' });
        files[size] = { path: `${size}/${entry.id}.png`, sha256: sha256(png), width: size, height: size };
      }
      await fs.writeFile(path.join(staging, 'source', entry.id + '.png'), input, { flag: 'wx' });
      if (sha256(await fs.readFile(source)) !== sha256(input)) throw new Error(`${entry.id}: source changed during packaging`);
      const record = { id: entry.id, name: entry.name || entry.id, source, sourceSnapshot: `source/${entry.id}.png`, sourceSha256: sha256(input), sourceSize: { width: metadata.width, height: metadata.height }, sourceTransparency: { transparentPixels, transparentFraction: transparentPixels / pixelCount, cornerAlpha: sourceCorners }, options, cleanup: cleaned.stats, normalization: normalized.stats, files, reviewRequired: cleaned.stats.retainedDetachedForReview.length > 0 };
      records.push(record);
      process.stdout.write(JSON.stringify({ id: entry.id, removedPixels: cleaned.stats.totalPixelsRemoved, removedAlphaFraction: cleaned.stats.removedAlphaFraction, reviewRequired: record.reviewRequired, margins: normalized.stats.margins }) + '\n');
    }
    const processing = { version: 1, createdAt: new Date().toISOString(), tool: 'tools/pet-studio/scripts/normalize_stickers.mjs', runtime: { node: process.version, sharp: sharp.versions.sharp, vips: sharp.versions.vips }, algorithm: { alpha: '8-connected foreground; main component unmodified; conservative detached-component cleanup', resampling: 'isotropic Lanczos3; centered transparent canvas', outline: 'retain existing approved white border; no erosion or repainting', defaults: DEFAULTS }, inputManifestSha256: sha256(rawManifest), entries: records };
    const catalog = { version: 1, created_at: processing.createdAt, style: 'B head-only', sizes: [1024, 512, 128], processing: 'processing.json', prompts: 'source/prompts.json', items: records.map(record => ({
      id: record.id, name: record.name, owner: record.options.provenance?.owner || '',
      pet_id: record.options.provenance?.pet_id || null, region_id: record.options.provenance?.region_id || null,
      number: record.options.provenance?.number || null, attachment_id: record.options.provenance?.attachment_id || null,
      source_record_id: record.options.provenance?.source_record_id || null,
      original_photo_sha256: record.options.provenance?.original_photo_sha256 || null,
      generated_source_sha256: record.sourceSha256, source_snapshot: record.sourceSnapshot,
      files: Object.fromEntries(Object.entries(record.files).map(([size, file]) => [size, file.path])),
      review_required: record.reviewRequired,
      outline_note: 'Approved generated white edge preserved; visual thickness is approximate after isotropic resampling, not rebuilt to a pixel-exact width',
    })) };
    await fs.writeFile(path.join(staging, 'processing.json'), JSON.stringify(processing, null, 2) + '\n', { flag: 'wx' });
    await fs.writeFile(path.join(staging, 'manifest.json'), JSON.stringify(catalog, null, 2) + '\n', { flag: 'wx' });
    await fs.writeFile(path.join(staging, 'source', 'input-manifest.json'), rawManifest, { flag: 'wx' });
    await fs.writeFile(path.join(staging, 'source', 'prompts.json'), JSON.stringify(manifest.entries.map(({ id, name, prompt, provenance }) => ({ id, name, prompt: prompt || null, provenance: provenance || null })), null, 2) + '\n', { flag: 'wx' });
    const existingShell = await inspectOutput(output, manifest.allowPreviewShell === true);
    if (existingShell) {
      await publishExclusively(staging, output);
      await fs.rm(staging, { recursive: true });
    } else {
      await fs.rename(staging, output);
    }
    return processing;
  } catch (error) {
    await fs.rm(staging, { recursive: true, force: true });
    throw error;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const args = process.argv.slice(2);
  const manifest = args[args.indexOf('--manifest') + 1];
  const output = args[args.indexOf('--output') + 1];
  if (!args.includes('--manifest') || !manifest || !args.includes('--output') || !output) {
    process.stderr.write('Usage: node normalize_stickers.mjs --manifest INPUT.json --output NEW_DIRECTORY\n');
    process.exitCode = 1;
  } else {
    normalizeBatch(path.resolve(manifest), output).then(result => {
      process.stdout.write(JSON.stringify({ output: path.resolve(output), count: result.entries.length, reviewRequired: result.entries.filter(entry => entry.reviewRequired).map(entry => entry.id) }) + '\n');
    }).catch(error => { process.stderr.write(error.message + '\n'); process.exitCode = 1; });
  }
}
