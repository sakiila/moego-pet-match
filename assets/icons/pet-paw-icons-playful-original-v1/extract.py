"""Extract selected option 2 directly from its original pixels; never redraw.

All foreground interiors retain source RGB. Only the local background and its
anti-aliased mixing at the silhouette boundary are removed.
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
OUT = ROOT / 'assets/icons/library-original-png-v2/masters/18-pet-paw-book'
ITEMS = [
    ('paw-cute', (72, 155, 376, 425)),
    ('paw-pets', (445, 171, 732, 427)),
    ('paw-play', (825, 177, 1100, 421)),
    ('paw-love', (1180, 190, 1478, 423)),
    ('paw-print', (92, 563, 234, 684)),
    ('paw-replied', (315, 559, 465, 686)),
    ('paw-print-muted', (538, 562, 692, 689)),
    ('paw-selected', (836, 576, 953, 692)),
    ('paw-expand', (1016, 596, 1125, 668)),
    ('paw-entry-arrow', (1210, 581, 1283, 687)),
    ('paw-close', (1365, 582, 1462, 688)),
]


def morph(mask, expand):
    operation = ImageFilter.MaxFilter(3) if expand else ImageFilter.MinFilter(3)
    return np.asarray(Image.fromarray(mask.astype('uint8') * 255).filter(operation)) > 0


def fill_holes(mask):
    h, w = mask.shape
    exterior = np.zeros_like(mask)
    queue = deque((y, x) for y in range(h) for x in (0, w-1) if not mask[y, x])
    queue.extend((y, x) for x in range(w) for y in (0, h-1) if not mask[y, x])
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
    h, w, _ = rgb.shape
    yy, xx = np.mgrid[-1:1:complex(h), -1:1:complex(w)]
    design = np.stack([np.ones((h, w)), xx, yy, xx*yy], axis=-1)
    edge = np.zeros((h, w), dtype=bool)
    edge[:2] = edge[-2:] = True
    edge[:, :2] = edge[:, -2:] = True
    eligible = edge & (rgb.min(axis=2) > 235)
    for _ in range(3):
        fit = np.linalg.lstsq(design[eligible], rgb[eligible], rcond=None)[0]
        background = np.clip(design @ fit, 0, 255)
        eligible &= np.abs(rgb-background).max(axis=2) < 5
    return background


def nearest_core(values, core, y, x):
    h, w = core.shape
    radius = 2
    while True:
        top, left = max(0, y-radius), max(0, x-radius)
        bottom, right = min(h, y+radius+1), min(w, x+radius+1)
        yy, xx = np.nonzero(core[top:bottom, left:right])
        if len(yy):
            distance = (yy+top-y)**2 + (xx+left-x)**2
            index = int(np.argmin(distance))
            if distance[index] <= radius**2 or radius >= max(h, w):
                return values[yy[index]+top, xx[index]+left]
        radius *= 2


def extract(rgb):
    values = rgb.astype(float)
    background = background_plane(values)
    # Colour difference includes blue fur, orange, charcoal and the pale wrist
    # edge. Closed white highlights and ivory interiors remain opaque.
    seed = np.abs(values-background).max(axis=2) > 12
    mask = fill_holes(seed)
    core = morph(mask, False)
    support = morph(mask, True)
    alpha = core.astype(float)
    colors = values.copy()
    assert core.any()
    for y, x in zip(*np.nonzero(support & ~core)):
        foreground = nearest_core(values, core, y, x)
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
    for name, box in ITEMS:
        crop = source.crop(box)
        crop.save(crops / (name + '.png'))
        output, bounds, preserved = extract(np.asarray(crop))
        output.save(OUT / (name + '.png'), optimize=True)
        records.append({'id': name, 'crop': box, 'visible_bounds_in_crop': bounds,
            'size': output.size, 'opaque_rgb_identical_pixels': preserved,
            'master_sha256': sha256((OUT / (name + '.png')).read_bytes()).hexdigest()})
        print(name, output.size, 'opaque RGB preserved:', preserved)
    (HERE / 'extraction.json').write_text(json.dumps({
        'selected_option': 2, 'source': 'design/concepts/pet-paw-icons-playful-v1.png',
        'source_sha256': sha256(SOURCE.read_bytes()).hexdigest(),
        'source_dimensions': source.size, 'assets': records}, indent=2) + '\n')


if __name__ == '__main__':
    main()
