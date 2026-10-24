"""Crop the approved sheet at native resolution; never redraw or resample."""
from pathlib import Path
import hashlib
import json
import zipfile

import numpy as np
from PIL import Image, ImageDraw, ImageFont

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
SOURCE = ROOT / 'design/concepts/report-title-stamps-bilingual-v1.png'
image = Image.open(SOURCE).convert('RGB')
source = np.asarray(image)
rows = [(135, 438), (475, 795), (820, 1141)]
columns = [(12, 348), (350, 682), (685, 1011), (1014, 1341)]
titles = [
    ('hands-off', '我手都松开了', 'I let go. It kept going.'),
    ('all-gone', '这下真没了', 'Poof. All gone.'),
    ('got-this', '急什么我会消', 'Relax. I got this.'),
    ('tools-work-harder', '道具比我还忙', 'My tools work harder.'),
    ('almost-clocked-out', '差点准时下班', 'Almost clocked out.'),
    ('counts-as-work', '这班没白上', 'That counts as work.'),
]
for folder in ('original-crops', 'transparent'):
    (HERE / folder).mkdir(parents=True, exist_ok=True)

records = []
previews = []
for row, (yt, yb) in enumerate(rows):
    for col, (xl, xr) in enumerate(columns):
        number = row * 2 + col // 2
        lang = 'zh' if col % 2 == 0 else 'en'
        slug, zh, en = titles[number]
        filename = f'{number + 1:02d}-{slug}-{lang}.png'
        region = source[yt:yb, xl:xr].astype(np.int16)
        # Warm paper and black captions are neutral; all stamp ink is red.
        chroma = np.minimum(region[:, :, 0] - region[:, :, 1],
                            region[:, :, 0] - region[:, :, 2])
        ink = (chroma > 12) & (region[:, :, 0] > 120)
        yy, xx = np.where(ink)
        # A small safety margin is copied from the source, without resampling.
        box = (max(xl, int(xx.min()) + xl - 3),
               max(yt, int(yy.min()) + yt - 3),
               min(xr, int(xx.max()) + xl + 4),
               min(yb, int(yy.max()) + yt + 4))
        crop = image.crop(box)
        pixels = np.asarray(crop)
        original_path = HERE / 'original-crops' / filename
        crop.save(original_path)
        native = pixels.astype(np.int16)
        red_chroma = np.minimum(native[:, :, 0] - native[:, :, 1],
                                native[:, :, 0] - native[:, :, 2])
        # Only alpha changes. All RGB values, including edge pixels, stay intact.
        alpha = np.clip((red_chroma - 12) / 12, 0, 1)
        alpha[native[:, :, 0] <= 120] = 0
        alpha = np.rint(alpha * 255).astype(np.uint8)
        rgba = np.dstack((pixels, alpha))
        transparent = Image.fromarray(rgba)
        transparent_path = HERE / 'transparent' / filename
        transparent.save(transparent_path)
        restored = np.asarray(Image.open(original_path))
        assert np.array_equal(restored, source[box[1]:box[3], box[0]:box[2]])
        saved_rgba = np.asarray(Image.open(transparent_path))
        assert np.array_equal(saved_rgba[:, :, :3], pixels)
        assert np.count_nonzero(alpha == 0) > 0
        assert np.count_nonzero(alpha == 255) > 0
        edge = np.concatenate((alpha[0], alpha[-1], alpha[:, 0], alpha[:, -1]))
        assert not np.any(edge), (filename, 'ink touches crop edge')
        record = {
            'id': number + 1, 'language': lang, 'title': zh if lang == 'zh' else en,
            'filename': filename, 'source_box': list(box), 'size': list(crop.size),
            'original_crop': str(original_path.relative_to(HERE)),
            'transparent': str(transparent_path.relative_to(HERE)),
            'crop_pixels_equal_source': True, 'transparent_rgb_equal_source': True,
            'alpha_extrema': [int(alpha.min()), int(alpha.max())],
            'transparent_sha256': hashlib.sha256(transparent_path.read_bytes()).hexdigest(),
        }
        records.append(record)
        previews.append((filename, transparent))

# Review contact sheet only: artwork stays at its native size.
cell_w, cell_h = 364, 354
preview = Image.new('RGB', (cell_w * 4, cell_h * 3), '#eeeae4')
draw = ImageDraw.Draw(preview)
font = ImageFont.load_default(size=15)
for index, (filename, artwork) in enumerate(previews):
    cx, cy = index % 4 * cell_w, index // 4 * cell_h
    for ty in range(cy, cy + 320, 16):
        for tx in range(cx, cx + cell_w, 16):
            color = '#ffffff' if ((tx-cx)//16 + (ty-cy)//16) % 2 else '#ddd9d3'
            draw.rectangle((tx, ty, min(tx+15, cx+cell_w-1), min(ty+15, cy+319)), fill=color)
    position = (cx + (cell_w-artwork.width)//2, cy + (320-artwork.height)//2)
    preview.paste(artwork, position, artwork)
    draw.text((cx+8, cy+328), filename, fill='#262626', font=font)
preview.save(HERE / 'preview.png')
manifest = {
    'source': str(SOURCE.relative_to(ROOT)),
    'source_size': list(image.size),
    'source_sha256': hashlib.sha256(SOURCE.read_bytes()).hexdigest(),
    'method': 'Native-resolution source crops; alpha-only paper removal; no redraw, recolor, resampling or text changes.',
    'asset_count_per_set': len(records), 'assets': records,
}
(HERE / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
archive = HERE / 'report-title-stamps-original-v1.zip'
with zipfile.ZipFile(archive, 'w', zipfile.ZIP_DEFLATED) as bundle:
    for file in sorted(HERE.rglob('*')):
        if file.is_file() and file != archive:
            bundle.write(file, file.relative_to(HERE))
print(json.dumps({'count_per_set': len(records), 'pixel_checks_passed': True,
                  'output': str(HERE), 'archive': str(archive)}, ensure_ascii=False))
