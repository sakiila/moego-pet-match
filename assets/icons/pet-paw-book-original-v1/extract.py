"""Crop the user's supplied paw-book artwork; preserve opaque source RGB.

Only foreground alpha and anti-aliased background mixing are resolved. The
painted shapes, highlights and shading are never redrawn or recoloured.
"""
from collections import deque
from hashlib import sha256
import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
SOURCE = HERE / 'source.png'
OUT = HERE / 'masters'
ITEMS = [
    ('paw-print', (1044, 500, 1087, 538), 'orange', False),
    ('paw-cute', (594, 525, 628, 560), 'ink', True),
    ('paw-pets', (796, 524, 832, 560), 'ink', False),
    ('paw-play', (592, 592, 631, 629), 'orange', True),
    ('paw-love', (796, 592, 832, 629), 'ink', False),
    ('paw-replied', (1377, 716, 1412, 748), 'orange', False),
    ('paw-print-muted', (1122, 942, 1150, 967), 'gray', False),
    ('paw-selected', (721, 592, 756, 627), 'orange', True),
    ('paw-expand', (796, 965, 815, 981), 'orange', False),
    ('paw-entry-arrow', (453, 868, 472, 895), 'ink', False),
    ('paw-close', (928, 367, 951, 391), 'ink', False),
]


def morph(mask, expand):
    operation = ImageFilter.MaxFilter(3) if expand else ImageFilter.MinFilter(3)
    return np.asarray(Image.fromarray(mask.astype('uint8') * 255).filter(operation)) > 0


def fill_holes(mask):
    h, w = mask.shape
    exterior = np.zeros_like(mask)
    queue = deque((y, x) for y in range(h) for x in (0, w - 1) if not mask[y, x])
    queue.extend((y, x) for x in range(w) for y in (0, h - 1) if not mask[y, x])
    for y, x in queue:
        exterior[y, x] = True
    while queue:
        y, x = queue.popleft()
        for a, b in ((y-1, x), (y+1, x), (y, x-1), (y, x+1)):
            if 0 <= a < h and 0 <= b < w and not mask[a, b] and not exterior[a, b]:
                exterior[a, b] = True
                queue.append((a, b))
    return ~exterior


def background_plane(rgb):
    """Estimate the local white/peach matte from the crop perimeter."""
    h, w, _ = rgb.shape
    yy, xx = np.mgrid[-1:1:complex(h), -1:1:complex(w)]
    design = np.stack([np.ones((h, w)), xx, yy, xx*yy], axis=-1)
    perimeter = np.zeros((h, w), dtype=bool)
    perimeter[:2] = perimeter[-2:] = True
    perimeter[:, :2] = perimeter[:, -2:] = True
    eligible = perimeter & (rgb.min(axis=2) > 215) & (np.ptp(rgb, axis=2) < 45)
    for _ in range(3):
        fit = np.linalg.lstsq(design[eligible], rgb[eligible], rcond=None)[0]
        background = np.clip(design @ fit, 0, 255)
        eligible = eligible & (np.abs(rgb-background).max(axis=2) < 5)
    return background


def extract(rgb, kind, solid):
    values = rgb.astype(float)
    background = background_plane(values)
    r, g, b = (values[:, :, i] for i in range(3))
    if kind == 'orange':
        seed = (r-g > 35) & (r-b > 50)
        strong = (r-g > 100) & (r-b > 170)
    elif kind == 'ink':
        seed = values.max(axis=2) < 200
        strong = values.max(axis=2) < 100
    else:
        seed = (background-values).max(axis=2) > 28
        strong = morph(seed, False)
    mask = fill_holes(seed) if solid else seed
    core = morph(mask, False) if solid else strong
    assert core.any(), 'Missing opaque source pixels'
    support = morph(mask, True)
    alpha = core.astype(float)
    colors = values.copy()
    cy, cx = np.nonzero(core)
    for y, x in zip(*np.nonzero(support & ~core)):
        nearest = np.argmin((cy-y)**2 + (cx-x)**2)
        foreground = values[cy[nearest], cx[nearest]]
        vector = foreground-background[y, x]
        opacity = np.clip(np.dot(values[y, x]-background[y, x], vector) / max(np.dot(vector, vector), 1), 0, 1)
        alpha[y, x] = opacity
        if opacity > .01:
            colors[y, x] = (values[y, x]-(1-opacity)*background[y, x]) / opacity
    opacity8 = (alpha*255).round().astype('uint8')
    opacity8[opacity8 < 8] = 0
    colors[opacity8 == 255] = rgb[opacity8 == 255]
    colors[opacity8 == 0] = 0
    rgba = np.dstack([np.clip(colors, 0, 255).round().astype('uint8'), opacity8])
    opaque = rgba[:, :, 3] == 255
    assert np.array_equal(rgba[:, :, :3][opaque], rgb[opaque])
    image = Image.fromarray(rgba)
    bounds = image.getbbox()
    assert bounds is not None
    return image.crop(bounds), bounds, int(opaque.sum())


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    crops = HERE / 'source-crops'
    crops.mkdir(exist_ok=True)
    source = Image.open(SOURCE).convert('RGB')
    records = []
    for name, box, kind, solid in ITEMS:
        crop = source.crop(box)
        crop.save(crops / (name + '.png'))
        output, bounds, preserved = extract(np.asarray(crop), kind, solid)
        output.save(OUT / (name + '.png'), optimize=True)
        records.append({'id': name, 'crop': box, 'visible_bounds_in_crop': bounds,
            'size': output.size, 'preserve_enclosed_source_fill': solid,
            'opaque_rgb_identical_pixels': preserved,
            'master_sha256': sha256((OUT / (name + '.png')).read_bytes()).hexdigest()})
        print(name, output.size, 'opaque RGB preserved:', preserved)
    (HERE / 'extraction.json').write_text(json.dumps({'source_sha256': sha256(SOURCE.read_bytes()).hexdigest(),
        'source_dimensions': source.size, 'source': 'User attachment codex-clipboard-96adea34-e635-4e8c-94f6-4dfab9e3f304.png',
        'assets': records}, indent=2) + '\n')


if __name__ == '__main__':
    main()
