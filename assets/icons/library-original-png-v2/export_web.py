"""Export the approved PNG masters for the game UI (web/src/ui/icons/).

Only proportional downscaling of masters/: crop to the visible bounds, fit into a square
canvas (title-stamp keeps its wide ratio), LANCZOS resample. No redraw, no upscaling.
Widths cover 1x/2x/3x of the display sizes used in the game; the browser picks via srcset.
"""
from __future__ import annotations

import json
import argparse
import re
from pathlib import Path

from PIL import Image

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
OUT = ROOT / 'web/src/ui/icons'
WIDTHS = [32, 48, 72, 96, 144, 192, 288]
PLAN = json.loads((HERE / 'extraction-plan.json').read_text())
EXTRA_GROUPS = ['11-supplement', '12-prep-gestures', '13-collection-titles', '14-collection-title-avatars', '15-collection-title-showcase', '16-board-frontdesk', '17-player-likes', '18-pet-paw-book']
WIDE_GROUPS = {'12-prep-gestures'}
WIDE_ASSETS = {'rush-clip', 'closing-sign-zh', 'closing-sign-en', 'closing-sign-zh-hd-v2', 'paw-expand', 'paw-entry-arrow'}


def fit(art: Image.Image, width: int, wide: bool) -> Image.Image:
    height = round(width * art.height / art.width) if wide else width
    canvas = Image.new('RGBA', (width, height))
    factor = min(width / art.width, height / art.height)
    scaled = art.resize((max(1, round(art.width * factor)), max(1, round(art.height * factor))), Image.Resampling.LANCZOS)
    canvas.alpha_composite(scaled, ((width - scaled.width) // 2, (height - scaled.height) // 2))
    return canvas


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--group', help='Export only this group, preserving other PNG files and catalog entries')
    selected = parser.parse_args().group
    png = OUT / 'png'
    png.mkdir(parents=True, exist_ok=True)
    catalog: dict[str, dict] = {}
    # 原 10 批来自 extraction-plan.json；补充批（split_supplement.py 拆出）直接读 masters 目录
    groups = [(g['id'], g['assets']) for g in PLAN['groups']]
    groups += [(g, [{'id': p.stem, 'wide': g in WIDE_GROUPS or p.stem in WIDE_ASSETS} for p in sorted((HERE / 'masters' / g).glob('*.png'))]) for g in EXTRA_GROUPS]
    if selected:
        if selected not in {group_id for group_id, _ in groups}:
            parser.error(f'Unknown group: {selected}')
        existing = (OUT / 'catalog.ts').read_text()
        for name, widths, aspect in re.findall(r"  '([^']+)': \{ widths: (\[[^]]+\]), aspect: ([\d.]+) \}", existing):
            catalog[name] = {'widths': json.loads(widths), 'aspect': json.loads(aspect)}
        if not catalog:
            raise ValueError('Existing generated catalog could not be read')
        groups = [(group_id, assets) for group_id, assets in groups if group_id == selected]
    else:
        for old in png.glob('*.png'):
            old.unlink()
    for group_id, assets in groups:
        for asset in assets:
            if selected:
                for old in png.glob(f"{asset['id']}@*.png"):
                    old.unlink()
            master = Image.open(HERE / 'masters' / group_id / f"{asset['id']}.png").convert('RGBA')
            bbox = master.getbbox()
            if asset['id'] in {'closing-sign-zh-hd-v2', 'title-hotpot-showcase'}:
                # 透明生成稿只忽略轮廓外极淡的孤立噪点，保留抗锯齿边缘。
                bbox = master.getchannel('A').point(lambda a: 255 if a > 8 else 0).getbbox()
                bbox = (max(0, bbox[0] - 2), max(0, bbox[1] - 2), min(master.width, bbox[2] + 2), min(master.height, bbox[3] + 2))
            art = master.crop(bbox)
            wide = asset.get('wide', False)
            limit = art.width if wide else max(art.size)
            requested_widths = WIDTHS + [576, 960] if asset['id'] in {'closing-sign-en', 'closing-sign-zh-hd-v2'} else WIDTHS
            widths = [w for w in requested_widths if w <= limit]
            if not widths or (widths[-1] < limit and widths[-1] < WIDTHS[-1]):
                widths.append(min(limit, WIDTHS[-1]))
            for w in widths:
                fit(art, w, wide).save(png / f"{asset['id']}@{w}.png", optimize=True)
            catalog[asset['id']] = {'widths': widths, 'aspect': round(art.width / art.height, 4) if wide else 1}
    names = sorted(catalog)
    lines = [
        '// 由 assets/icons/library-original-png-v2/export_web.py 生成，勿手改。',
        '// 来源：已确认的原稿透明 PNG 母版，仅等比缩小；后续矢量化时替换此目录与 Icon 内部即可。',
        '',
        'export const ICON_CATALOG = {',
        *[f"  '{n}': {{ widths: {json.dumps(catalog[n]['widths'])}, aspect: {catalog[n]['aspect']} }}," for n in names],
        '} as const;',
        '',
        'export type IconName = keyof typeof ICON_CATALOG;',
        '',
    ]
    (OUT / 'catalog.ts').write_text('\n'.join(lines))
    print(json.dumps({'icons': len(names), 'files': sum(len(v['widths']) for v in catalog.values())}))


if __name__ == '__main__':
    main()
