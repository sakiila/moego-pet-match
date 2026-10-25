"""2026-10-25 开发者彩蛋：从已确认的 report-developer-stamp-v1 裁出「开发者家的认证」章中英两版。
与 report-title-stamps-original-v1/extract.py 同法：原样裁切留档，去底版只改 alpha（按红色色度），RGB 保持原值。"""
from pathlib import Path
import hashlib
import json
import numpy as np
from PIL import Image

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
SOURCE = ROOT / 'design/concepts/report-developer-stamp-v1.png'
image = Image.open(SOURCE).convert('RGB')
source = np.asarray(image)
# 两个半幅窗口；底部文件名标注（y > 860）不在窗口内。
WINDOWS = {'developer-zh': (0, 60, 760, 860), 'developer-en': (770, 60, 1536, 860)}
TEXT = {'developer-zh': '开发者家的 · 认证', 'developer-en': "DEVELOPER'S PETS · CERTIFIED"}
for folder in ('original-crops', 'transparent'):
    (HERE / folder).mkdir(parents=True, exist_ok=True)

records = []
for name, (xl, yt, xr, yb) in WINDOWS.items():
    region = source[yt:yb, xl:xr].astype(np.int16)
    chroma = np.minimum(region[:, :, 0] - region[:, :, 1], region[:, :, 0] - region[:, :, 2])
    ink = (chroma > 12) & (region[:, :, 0] > 120)
    yy, xx = np.where(ink)
    box = (max(xl, int(xx.min()) + xl - 3), max(yt, int(yy.min()) + yt - 3), min(xr, int(xx.max()) + xl + 4), min(yb, int(yy.max()) + yt + 4))
    crop = image.crop(box)
    pixels = np.asarray(crop)
    original_path = HERE / 'original-crops' / f'{name}.png'
    crop.save(original_path)
    native = pixels.astype(np.int16)
    red_chroma = np.minimum(native[:, :, 0] - native[:, :, 1], native[:, :, 0] - native[:, :, 2])
    alpha = np.clip((red_chroma - 12) / 12, 0, 1)
    alpha[native[:, :, 0] <= 120] = 0
    alpha = np.rint(alpha * 255).astype(np.uint8)
    transparent = Image.fromarray(np.dstack((pixels, alpha)))
    transparent_path = HERE / 'transparent' / f'{name}.png'
    transparent.save(transparent_path)
    assert np.array_equal(np.asarray(Image.open(original_path)), source[box[1]:box[3], box[0]:box[2]])
    assert np.array_equal(np.asarray(Image.open(transparent_path))[:, :, :3], pixels)
    edge = np.concatenate((alpha[0], alpha[-1], alpha[:, 0], alpha[:, -1]))
    assert not np.any(edge), (name, 'ink touches crop edge')
    records.append({'id': name, 'text': TEXT[name], 'source_box': list(box), 'size': list(crop.size),
                    'transparent_sha256': hashlib.sha256(transparent_path.read_bytes()).hexdigest()})

preview = Image.new('RGBA', (2 * 380, 400), (229, 230, 235, 255))
for i, name in enumerate(WINDOWS):
    im = Image.open(HERE / 'transparent' / f'{name}.png'); im.thumbnail((360, 360))
    preview.alpha_composite(im, (i * 380 + 10 + (360 - im.width) // 2, 20 + (360 - im.height) // 2))
preview.save(HERE / 'preview.png')
(HERE / 'manifest.json').write_text(json.dumps({'source': str(SOURCE.relative_to(ROOT)), 'source_sha256': hashlib.sha256(SOURCE.read_bytes()).hexdigest(),
    'method': 'Original pixel crop; transparent version changes alpha only (red chroma), RGB untouched', 'items': records}, ensure_ascii=False, indent=2) + '\n')
print(json.dumps(records, ensure_ascii=False))
