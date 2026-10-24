"""Extract the two approved preparation gesture icons; retain source pixels."""
from pathlib import Path
import hashlib
import json

from PIL import Image, ImageDraw
import numpy as np

from build import extract

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
ITEMS = [
    ('prep-adjacent-swap', 'prep-adjacent-swap-preview-v1.png', [90, 310, 725, 555]),
    ('prep-sequential-tap', 'prep-sequential-tap-preview-v1.png', [90, 245, 725, 620]),
]
TILE_INTERIORS = {
    'prep-adjacent-swap': [(115, 337, 304, 524), (502, 337, 691, 524)],
    'prep-sequential-tap': [(117, 341, 306, 524), (507, 340, 696, 524)],
}


def main():
    out = HERE / 'masters/12-prep-gestures'
    source_crops = HERE / 'source-crops/12-prep-gestures'
    out.mkdir(parents=True, exist_ok=True)
    source_crops.mkdir(parents=True, exist_ok=True)
    records = []
    for slug, filename, roi in ITEMS:
        source = ROOT / 'design/concepts' / filename
        image, original, checks = extract(Image.open(source), {'roi': roi, 'sample_background': True})
        assert checks['opaque_pixels_unchanged_rgb']
        assert checks['raw_roi_edge_visible_pixels'] == 0
        # Arrow/hand white contours interrupt the tile border in the source.
        # Retain the ivory interiors explicitly so background flood cannot leak in.
        keep = Image.new('L', image.size)
        draw = ImageDraw.Draw(keep)
        for left, top, right, bottom in TILE_INTERIORS[slug]:
            draw.rounded_rectangle((left-roi[0], top-roi[1], right-roi[0], bottom-roi[1]), radius=34, fill=255)
        pixels = np.asarray(image).copy()
        preserved = np.asarray(keep) > 0
        pixels[preserved, :3] = np.asarray(original)[preserved]
        pixels[preserved, 3] = 255
        solid = pixels[:, :, 3] == 255
        assert np.array_equal(pixels[:, :, :3][solid], np.asarray(original)[solid])
        image = Image.fromarray(pixels)
        box = image.getbbox()
        image = image.crop((max(0, box[0]-4), max(0, box[1]-4), min(image.width, box[2]+4), min(image.height, box[3]+4)))
        target = out / (slug + '.png')
        image.save(target, optimize=True)
        original.save(source_crops / (slug + '.png'))
        records.append({'id': slug, 'source': str(source.relative_to(ROOT)), 'roi': roi,
                        'size': list(image.size), 'preserved_tile_interiors': TILE_INTERIORS[slug], 'source_sha256': hashlib.sha256(source.read_bytes()).hexdigest(),
                        'png_sha256': hashlib.sha256(target.read_bytes()).hexdigest(), 'checks': checks})
    (HERE / 'prep-extraction.json').write_text(json.dumps(records, ensure_ascii=False, indent=2)+'\n')
    print(json.dumps(records, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
