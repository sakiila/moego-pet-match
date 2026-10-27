"""Extract the four generated illustrations without redrawing or recoloring."""
from pathlib import Path
import hashlib
import json

from PIL import Image

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
SOURCE = ROOT / 'design/concepts/catdog-week-icons-v1.png'
MASTERS = ROOT / 'assets/icons/library-original-png-v2/masters/20-catdog-week'
REGIONS = [
    ('faction-cat', (0, 0, 530, 724), ['faction-cat']),
    ('faction-dog', (530, 0, 1090, 724), ['faction-dog']),
    ('meowchamp26', (1090, 0, 1622, 724), ['title-meowchamp26', 'title-meowchamp26-avatar', 'title-meowchamp26-showcase']),
    ('woofchamp26', (1622, 0, 2172, 724), ['title-woofchamp26', 'title-woofchamp26-avatar', 'title-woofchamp26-showcase']),
]


def sha256(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    source = Image.open(SOURCE).convert('RGBA')
    assert source.size == (2172, 724)
    records = []
    for name, region, filenames in REGIONS:
        cell = source.crop(region)
        # Bound the actual sticker rather than near-transparent background specks.
        bounds = cell.getchannel('A').point(lambda a: 255 if a > 32 else 0).getbbox()
        assert bounds
        bounds = (max(0, bounds[0] - 3), max(0, bounds[1] - 3),
                  min(cell.width, bounds[2] + 3), min(cell.height, bounds[3] + 3))
        art = cell.crop(bounds)
        art.putalpha(art.getchannel('A').point(lambda a: 0 if a <= 8 else a))
        scale = 902 / max(art.size)
        size = tuple(round(value * scale) for value in art.size)
        scaled = art.resize(size, Image.Resampling.LANCZOS)
        canvas = Image.new('RGBA', (1024, 1024))
        position = ((1024 - size[0]) // 2, (1024 - size[1]) // 2)
        canvas.alpha_composite(scaled, position)
        for filename in filenames:
            target = MASTERS / f'{filename}.png'
            canvas.save(target, optimize=True)
            records.append({
                'file': str(target.relative_to(ROOT)), 'graphic': name,
                'source_region': region,
                'source_crop': [region[0] + bounds[0], bounds[1], region[0] + bounds[2], bounds[3]],
                'output_size': [1024, 1024], 'art_size': size, 'position': position,
                'sha256': sha256(target),
            })
    manifest = {
        'status': 'selected by Bob on 2026-10-27',
        'generator': 'Codex built-in image_gen; transparent_background=true',
        'source': str(SOURCE.relative_to(ROOT)), 'source_size': list(source.size),
        'source_sha256': sha256(SOURCE),
        'prompt': 'design/concepts/catdog-week-icons-v1-prompt.txt',
        'method': 'Split into four regions. Find alpha > 32 bounds with 3px padding; remove alpha <= 8 background specks. Preserve remaining RGB and alpha, resize proportionally with LANCZOS, center on 1024px transparent canvas with approximately 6% margin. No redraw or recoloring. Champion variants use identical PNG bytes.',
        'extraction_script': str(Path(__file__).resolve().relative_to(ROOT)),
        'export_command': 'python3 assets/icons/library-original-png-v2/export_web.py --group 20-catdog-week',
        'files': records,
    }
    (HERE / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({'source': manifest['source'], 'masters': len(records)}))


if __name__ == '__main__':
    main()
