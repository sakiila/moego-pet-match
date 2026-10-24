"""Extract approved wordmarks at native resolution, without redrawing."""
from pathlib import Path
import hashlib
import json
import shutil
import zipfile

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
GROUPS = [
    ('feature-wordmarks-scheduling-report-v1', [('smart-scheduling', 'Smart Scheduling'), ('grooming-report-card', 'Grooming Report Card')]),
    ('feature-wordmarks-collection-pets-v1', [('pet-collection', 'Pet Collection'), ('my-pets', 'My Pets')]),
    ('feature-wordmarks-ranking-fish-v1', [('leaderboard', 'Leaderboard'), ('fish-report-card', 'Fish Report Card')]),
]


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def remove_white(rgb):
    # The approved artwork contains charcoal/orange ink only. White includes
    # both the surrounding sheet and the counters enclosed by the letters.
    pixels = np.asarray(rgb).astype(np.float32)
    ink = pixels.min(axis=2) < 245
    core = np.asarray(Image.fromarray((ink * 255).astype('uint8')).filter(ImageFilter.MinFilter(5))) == 255
    foreground = pixels.copy()
    unresolved = ~core
    # Estimate the local solid ink color at antialiased edges. Unmix white
    # there so the transparent PNG does not acquire a white fringe.
    for radius in (2, 4, 8, 16):
        # BoxBlur supports L, and weighted RGB avoids a SciPy dependency.
        coverage = np.asarray(Image.fromarray((core * 255).astype('uint8')).filter(ImageFilter.BoxBlur(radius))).astype(float) / 255
        available = unresolved & (coverage > 0.02)
        for channel in range(3):
            weighted = Image.fromarray((pixels[:, :, channel] * core).astype('uint8')).filter(ImageFilter.BoxBlur(radius))
            average = np.asarray(weighted).astype(float) / np.maximum(coverage, 1e-6)
            foreground[:, :, channel][available] = average[available]
        unresolved[available] = False
    foreground = np.clip(foreground, 0, 255)
    delta = 255 - foreground
    alpha = np.sum((255 - pixels) * delta, axis=2) / np.maximum(np.sum(delta * delta, axis=2), 1)
    alpha = np.clip(alpha, 0, 1)
    alpha[core] = 1
    alpha[pixels.min(axis=2) >= 250] = 0
    clean = 255 - (255 - pixels) / np.maximum(alpha[:, :, None], 1e-6)
    clean = np.clip(np.rint(clean), 0, 255).astype('uint8')
    clean[core] = pixels[core].astype('uint8')
    alpha8 = np.rint(alpha * 255).astype('uint8')
    clean[alpha8 == 0] = 0
    rgba = np.dstack((clean, alpha8))
    assert np.array_equal(rgba[:, :, :3][core], pixels.astype('uint8')[core])
    return Image.fromarray(rgba), core


def main():
    for folder in ('transparent', 'source-crops', 'reference'):
        (HERE / folder).mkdir(parents=True, exist_ok=True)
    records, artworks = [], []
    for source_name, subjects in GROUPS:
        source = ROOT / 'design/concepts' / (source_name + '.png')
        image = Image.open(source).convert('RGB')
        shutil.copy2(source, HERE / 'reference' / source.name)
        prompt = source.with_name(source_name + '-prompt.txt')
        shutil.copy2(prompt, HERE / 'reference' / prompt.name)
        for (slug, title), (top, bottom) in zip(subjects, ((0, 460), (460, image.height))):
            region = np.asarray(image)[top:bottom]
            ys, xs = np.where(region.min(axis=2) < 220)
            box = (max(0, int(xs.min()) - 8), max(top, int(ys.min()) + top - 8),
                   min(image.width, int(xs.max()) + 9), min(bottom, int(ys.max()) + top + 9))
            crop = image.crop(box)
            crop_path = HERE / 'source-crops' / (slug + '.png')
            crop.save(crop_path)
            rgba, core = remove_white(crop)
            output = HERE / 'transparent' / (slug + '.png')
            rgba.save(output, optimize=True)
            saved = np.asarray(Image.open(output))
            a = saved[:, :, 3]
            border = np.concatenate((a[0], a[-1], a[:, 0], a[:, -1]))
            assert not border.any(), (slug, 'artwork touches outer border')
            assert a.max() == 255 and a.min() == 0
            assert np.array_equal(np.asarray(crop), np.asarray(image)[box[1]:box[3], box[0]:box[2]])
            original = np.asarray(crop).astype(float)
            rebuilt = saved[:, :, :3] * (a[:, :, None] / 255) + 255 * (1 - a[:, :, None] / 255)
            error = np.abs(rebuilt - original)
            records.append({
                'id': slug, 'text': title, 'file': str(output.relative_to(HERE)),
                'size': list(rgba.size), 'source': str(source.relative_to(ROOT)),
                'source_sha256': sha(source), 'source_box': list(box),
                'png_sha256': sha(output), 'source_crop_pixel_match': True,
                'opaque_core_pixel_match': True, 'opaque_core_pixels': int(core.sum()),
                'outer_border_transparent': True,
                'white_recomposite_mean_error_255': round(float(error.mean()), 4),
                'white_recomposite_p99_error_255': round(float(np.percentile(error, 99)), 4),
                'transparent_pixels': int((a == 0).sum()), 'partial_alpha_pixels': int(((a > 0) & (a < 255)).sum()),
            })
            artworks.append((title, rgba))
    manifest = {'date': '2026-10-24', 'count': len(records), 'method': 'Native crops; no redraw, resize, recolor, or lettering changes. White background and enclosed counters removed; boundary RGB unmatted against white. Opaque core RGB preserved exactly.', 'assets': records}
    (HERE / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
    # Preview only: masters above always retain the original source pixels.
    width, row_height = 1400, 230
    preview = Image.new('RGB', (width, row_height * len(artworks)), 'white')
    draw = ImageDraw.Draw(preview)
    font = ImageFont.load_default(size=22)
    for index, (title, artwork) in enumerate(artworks):
        y = index * row_height
        draw.text((24, y + 12), title, fill='#24282e', font=font)
        for x0, dark in ((0, False), (700, True)):
            if dark:
                draw.rectangle((x0, y + 45, x0 + 699, y + row_height - 1), fill='#536b87')
            else:
                for yy in range(y + 45, y + row_height, 16):
                    for xx in range(x0, x0 + 700, 16):
                        fill = '#ffffff' if ((xx-x0)//16 + (yy-y-45)//16) % 2 else '#e1e5e9'
                        draw.rectangle((xx, yy, min(xx+15,x0+699), min(yy+15,y+row_height-1)), fill=fill)
            display = artwork.copy()
            display.thumbnail((650, 160), Image.Resampling.LANCZOS)
            preview.paste(display, (x0 + (700-display.width)//2, y + 45 + (185-display.height)//2), display)
    preview.save(HERE / 'preview.png', optimize=True)
    archive = HERE / 'feature-wordmarks-original-v1.zip'
    with zipfile.ZipFile(archive, 'w', zipfile.ZIP_DEFLATED) as bundle:
        for path in sorted(HERE.rglob('*')):
            if path.is_file() and path != archive:
                bundle.write(path, path.relative_to(HERE))
    print(json.dumps({'output': str(HERE), 'count': len(records), 'assets': [{k:r[k] for k in ('id','size','white_recomposite_mean_error_255')} for r in records]}, indent=2))


if __name__ == '__main__':
    main()
