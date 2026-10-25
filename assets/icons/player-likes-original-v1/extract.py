"""Extract the user-approved high-five paw pixels; no redraw or recolouring.

Only alpha and anti-aliased boundary decontamination are computed. Opaque RGB
stays identical to the source. Crops exclude the UI labels and ground shadow.
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
OUT = ROOT / 'assets/icons/library-original-png-v2/masters/17-player-likes'
ITEMS = [
    ('player-like-high-five', (490, 105, 854, 443), 'dark'),
    ('player-like-high-five-outline', (840, 240, 994, 385), 'orange'),
]


def components(mask):
    seen = np.zeros_like(mask)
    result = []
    h, w = mask.shape
    for y, x in zip(*np.nonzero(mask)):
        if seen[y, x]:
            continue
        seen[y, x] = True
        queue = deque([(int(y), int(x))])
        pixels = []
        while queue:
            a, b = queue.popleft()
            pixels.append((a, b))
            for c, d in ((a-1,b), (a+1,b), (a,b-1), (a,b+1)):
                if 0 <= c < h and 0 <= d < w and mask[c,d] and not seen[c,d]:
                    seen[c,d] = True
                    queue.append((c,d))
        result.append(pixels)
    return result


def morph(mask, expand):
    operation = ImageFilter.MaxFilter(3) if expand else ImageFilter.MinFilter(3)
    return np.asarray(Image.fromarray(mask.astype('uint8') * 255).filter(operation)) > 0


def filled(mask):
    out = mask.copy()
    h, w = mask.shape
    for pixels in components(~mask):
        if all(0 < y < h-1 and 0 < x < w-1 for y,x in pixels):
            yy, xx = zip(*pixels)
            out[yy,xx] = True
    return out


def extract(rgb, kind):
    values = rgb.astype(float)
    r, g, b = (values[:,:,i] for i in range(3))
    orange = (r-b > 45) & (r-g > 25)
    line = values.max(axis=2) < 145 if kind == 'dark' else orange
    pixels = max(components(line), key=len)
    body = np.zeros_like(line)
    yy, xx = zip(*pixels)
    body[yy,xx] = True
    # The source wrist deliberately has no horizontal ink outline. Close only
    # the alpha mask at the crop boundary; do not invent a visible bottom line.
    for y in range(body.shape[0]-1, body.shape[0]-9, -1):
        columns = np.flatnonzero(body[y])
        if len(columns) > 1 and columns[-1]-columns[0] > body.shape[1] * .35:
            body[y,columns[0]:columns[-1]+1] = True
            body[y+1:] = False
            break
    mask = filled(body)
    # Keep only the two source accent rays at the upper right of this paw.
    for pixels in components(orange):
        cy = sum(y for y,x in pixels) / len(pixels)
        cx = sum(x for y,x in pixels) / len(pixels)
        if len(pixels) > 8 and cx > rgb.shape[1] * .72 and cy < rgb.shape[0] * .36:
            yy, xx = zip(*pixels)
            mask[yy,xx] = True
    core = morph(mask, False)
    support = morph(mask, True)
    clear = ~morph(support, True)
    alpha = core.astype(float)
    colors = values.copy()
    core_y, core_x = np.nonzero(core)
    clear_y, clear_x = np.nonzero(clear)
    for y,x in zip(*np.nonzero(support & ~core)):
        near = np.argmin((core_y-y)**2+(core_x-x)**2)
        foreground = values[core_y[near], core_x[near]]
        near_bg = np.argmin((clear_y-y)**2+(clear_x-x)**2)
        background = values[clear_y[near_bg], clear_x[near_bg]]
        vector = foreground-background
        opacity = np.clip(np.dot(values[y,x]-background, vector) / max(np.dot(vector,vector), 1), 0, 1)
        alpha[y,x] = opacity
        if opacity > .01:
            colors[y,x] = (values[y,x]-(1-opacity)*background) / opacity
    opacity8 = (alpha*255).round().astype('uint8')
    opacity8[opacity8 < 8] = 0
    colors[opacity8 == 255] = rgb[opacity8 == 255]
    colors[opacity8 == 0] = 0
    rgba = np.dstack([np.clip(colors,0,255).round().astype('uint8'), opacity8])
    opaque = rgba[:,:,3] == 255
    assert np.array_equal(rgba[:,:,:3][opaque], rgb[opaque])
    im = Image.fromarray(rgba)
    return im.crop(im.getbbox()), int(opaque.sum())


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    sheet = Image.open(SOURCE).convert('RGB')
    records = []
    for name, box, kind in ITEMS:
        output, preserved = extract(np.asarray(sheet.crop(box)), kind)
        output.save(OUT / (name + '.png'), optimize=True)
        records.append({'id': name, 'crop': box, 'size': output.size, 'opaque_rgb_identical_pixels': preserved})
        print(name, output.size, 'opaque RGB preserved:', preserved)
    (HERE / 'extraction.json').write_text(json.dumps({'source_sha256': sha256(SOURCE.read_bytes()).hexdigest(), 'source_dimensions': sheet.size, 'assets': records}, indent=2) + '\n')


if __name__ == '__main__':
    main()
