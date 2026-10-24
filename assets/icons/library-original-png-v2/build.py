"""Authorized source-PNG extraction. No generative redraw or SVG approximation."""
from __future__ import annotations

import hashlib
import json
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
PLAN = json.loads((HERE / 'extraction-plan.json').read_text())


def digest(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def save(image: Image.Image, relative: str) -> dict:
    target = HERE / relative
    target.parent.mkdir(parents=True, exist_ok=True)
    image.save(target)
    return {'file': relative, 'width': image.width, 'height': image.height,
            'sha256': digest(target.read_bytes())}


def flood(eligible: np.ndarray, seeds: list[tuple[int, int]]) -> np.ndarray:
    height, width = eligible.shape
    flags = eligible.astype(np.uint8).tobytes()
    visited = bytearray(width * height)
    queue = deque()
    for x, y in seeds:
        if 0 <= x < width and 0 <= y < height:
            index = y * width + x
            if flags[index] and not visited[index]:
                visited[index] = 1
                queue.append(index)
    while queue:
        index = queue.popleft()
        x = index % width
        for neighbor in (index - width if index >= width else -1,
                         index + width if index < width * (height - 1) else -1,
                         index - 1 if x else -1,
                         index + 1 if x < width - 1 else -1):
            if neighbor >= 0 and flags[neighbor] and not visited[neighbor]:
                visited[neighbor] = 1
                queue.append(neighbor)
    return np.frombuffer(visited, dtype=np.uint8).reshape(height, width).astype(bool)


def retain_art_components(mask: np.ndarray, contrast: np.ndarray) -> np.ndarray:
    height, width = mask.shape
    flags = mask.astype(np.uint8).tobytes()
    visited = bytearray(width * height)
    output = bytearray(width * height)
    strengths = contrast.ravel()
    for start, present in enumerate(flags):
        if not present or visited[start]:
            continue
        queue = deque([start])
        visited[start] = 1
        component = []
        strongest = 0.0
        while queue:
            index = queue.popleft()
            component.append(index)
            strongest = max(strongest, strengths[index])
            x = index % width
            for neighbor in (index - width if index >= width else -1,
                             index + width if index < width * (height - 1) else -1,
                             index - 1 if x else -1,
                             index + 1 if x < width - 1 else -1):
                if neighbor >= 0 and flags[neighbor] and not visited[neighbor]:
                    visited[neighbor] = 1
                    queue.append(neighbor)
        if strongest >= 60 and len(component) >= 4:
            for index in component:
                output[index] = 1
    return np.frombuffer(output, dtype=np.uint8).reshape(height, width).astype(bool)


def shift(array: np.ndarray, dy: int, dx: int, fill=0) -> np.ndarray:
    result = np.full_like(array, fill)
    height, width = array.shape[:2]
    ya, yb = max(0, -dy), min(height, height - dy)
    xa, xb = max(0, -dx), min(width, width - dx)
    result[ya:yb, xa:xb] = array[ya + dy:yb + dy, xa + dx:xb + dx]
    return result


def extract(source: Image.Image, asset: dict) -> tuple[Image.Image, Image.Image, dict]:
    x0, y0, x1, y1 = asset['roi']
    original = source.crop((x0, y0, x1, y1)).convert('RGB')
    rgb = np.asarray(original, dtype=np.float32)
    height, width = rgb.shape[:2]
    orange = asset.get('background') == 'orange'
    frame = np.concatenate((rgb[:3].reshape(-1, 3), rgb[-3:].reshape(-1, 3),
                            rgb[:, :3].reshape(-1, 3), rgb[:, -3:].reshape(-1, 3)))
    background = np.median(frame, axis=0) if orange or asset.get('sample_background') else np.array([255, 255, 255], dtype=np.float32)
    contrast = np.max(np.abs(rgb - background), axis=2)
    eligible = contrast <= (50 if orange else 48)
    excluded = np.zeros((height, width), dtype=bool)
    for left, top, right, bottom in asset.get('exclude', []):
        excluded[max(0, top-y0):min(height, bottom-y0), max(0, left-x0):min(width, right-x0)] = True
    eligible |= excluded
    borders = [(x, y) for x in range(width) for y in (0, height-1)] + [(x, y) for y in range(height) for x in (0, width-1)]
    cleared = flood(eligible, borders)
    hole_checks = []
    hole_regions = np.zeros((height, width), dtype=bool)
    for sx, sy in asset.get('holes', []):
        x, y = sx-x0, sy-y0
        valid = 0 <= x < width and 0 <= y < height and bool(eligible[y, x])
        hole_checks.append({'source_xy': [sx, sy], 'eligible': valid})
        if valid:
            hole = flood(eligible, [(x, y)])
            cleared |= hole
            hole_regions |= hole
    foreground = retain_art_components(~cleared & ~excluded, contrast)
    mask_image = Image.fromarray(foreground.astype(np.uint8)*255)
    eroded = np.asarray(mask_image.filter(ImageFilter.MinFilter(3))) > 0
    opaque = eroded | (foreground & (contrast > 180))
    expanded = np.asarray(mask_image.filter(ImageFilter.MaxFilter(5))) > 0
    band = expanded & ~eroded

    # Edge colors are un-matted algebraically against the original backdrop.
    # Interior source RGB is left untouched; no new curves, paint or texture.
    nearest = rgb.copy()
    found = np.zeros((height, width), dtype=bool)
    offsets = sorted(((dy, dx) for dy in range(-4, 5) for dx in range(-4, 5)),
                     key=lambda pair: pair[0]**2 + pair[1]**2)
    for dy, dx in offsets:
        take = band & ~found & shift(opaque, dy, dx, False)
        if np.any(take):
            nearest[take] = shift(rgb, dy, dx)[take]
            found[take] = True
    direction = background - nearest
    denominator = np.sum(direction**2, axis=2)
    alpha_fit = np.divide(np.sum((background-rgb)*direction, axis=2), denominator,
                          out=np.zeros_like(denominator), where=denominator > 1)
    alpha = foreground.astype(np.float32)
    alpha[band & found] = np.clip(alpha_fit[band & found], 0, 1)
    alpha[~foreground & (contrast < 5)] = 0
    if orange:
        white_edge = ((rgb[:, :, 1]-background[1]) > 8) & ((rgb[:, :, 2]-background[2]) > 12)
        alpha[~foreground & ~white_edge] = 0
    alpha[excluded] = 0
    hole_interiors = np.asarray(Image.fromarray(hole_regions.astype(np.uint8)*255).filter(ImageFilter.MinFilter(3))) > 0
    alpha[hole_interiors] = 0

    for left, top, right, bottom in asset.get('shadows', []):
        region = np.zeros_like(foreground)
        region[max(0, top-y0):min(height, bottom-y0), max(0, left-x0):min(width, right-x0)] = True
        region &= ~expanded & ~excluded & (contrast > 5) & (contrast < 90)
        alpha[region] = np.maximum(alpha[region], np.clip(contrast[region]/120, 0, .55))

    # Keep edge values physically representable when removing a white/orange matte.
    lower = np.max(np.maximum(np.divide(background-rgb, np.maximum(background, 1)),
                              np.divide(rgb-background, np.maximum(255-background, 1))), axis=2)
    visible = alpha > .005
    alpha[visible] = np.maximum(alpha[visible], np.clip(lower[visible], 0, 1))
    alpha[~visible] = 0
    color = rgb.copy()
    translucent = (alpha > 0) & (alpha < 1)
    color[translucent] = (rgb[translucent] - (1-alpha[translucent, None])*background) / alpha[translucent, None]
    edge_pixels = translucent & band & found
    color[edge_pixels] = nearest[edge_pixels]
    color = np.clip(np.round(color), 0, 255).astype(np.uint8)
    alpha_u8 = np.round(alpha*255).astype(np.uint8)
    color[alpha_u8 == 255] = rgb[alpha_u8 == 255].astype(np.uint8)
    color[alpha_u8 == 0] = 0
    rgba = np.dstack((color, alpha_u8))
    edge = np.concatenate((alpha_u8[0], alpha_u8[-1], alpha_u8[:, 0], alpha_u8[:, -1]))
    solid = alpha_u8 == 255
    max_delta = int(np.max(np.abs(color[solid].astype(int)-rgb[solid].astype(int)))) if np.any(solid) else 0
    composite = color.astype(float)*(alpha_u8[..., None]/255) + background*(1-alpha_u8[..., None]/255)
    kept = alpha_u8 > 0
    mae = float(np.mean(np.abs(composite[kept]-rgb[kept]))) if np.any(kept) else 0
    checks = {'source_crop_size': [width, height], 'raw_roi_edge_visible_pixels': int(np.count_nonzero(edge)),
              'opaque_pixels_unchanged_rgb': max_delta == 0, 'opaque_rgb_max_delta': max_delta,
              'composite_on_source_background_mae': round(mae, 4), 'hole_seeds': hole_checks,
              'visible_pixels': int(np.count_nonzero(kept)), 'transparent_pixels': int(np.count_nonzero(alpha_u8 == 0))}
    return Image.fromarray(rgba), original, checks


def sized(master: Image.Image, size: int, wide: bool) -> Image.Image:
    bounds = master.getbbox()
    artwork = master.crop(bounds)
    if wide:
        canvas = Image.new('RGBA', (size, max(1, round(size*artwork.height/artwork.width))))
    else:
        canvas = Image.new('RGBA', (size, size))
    limit = (max(1, round(canvas.width*.90)), max(1, round(canvas.height*.90)))
    artwork.thumbnail(limit, Image.Resampling.LANCZOS) if artwork.width > limit[0] or artwork.height > limit[1] else None
    factor = min(limit[0]/artwork.width, limit[1]/artwork.height)
    artwork = artwork.resize((max(1, round(artwork.width*factor)), max(1, round(artwork.height*factor))), Image.Resampling.LANCZOS)
    canvas.alpha_composite(artwork, ((canvas.width-artwork.width)//2, (canvas.height-artwork.height)//2))
    return canvas


def main() -> None:
    manifest = {'date': '2026-10-23', 'status': 'extracting_source_pngs', 'authorization': PLAN['authorization'],
                'method': 'Authorized deterministic source splitting and alpha/background removal; no redraw, no generated detail, no SVG reinterpretation.',
                'groups': [], 'exports': [], 'game_integration': False}
    problems = []
    for group in PLAN['groups']:
        source_path = ROOT / 'design/concepts' / (group['source']+'.png')
        if not source_path.exists():
            source_path = HERE/'reference'/(group['source']+'.png')
        data = source_path.read_bytes()
        source = Image.open(source_path).convert('RGB')
        reference_file = f"reference/{group['source']}.png"
        (HERE/'reference').mkdir(exist_ok=True)
        (HERE/reference_file).write_bytes(data)
        manifest['groups'].append({k: v for k, v in group.items() if k != 'assets'} | {'reference_file': reference_file, 'source_sha256': digest(data), 'asset_count': len(group['assets'])})
        for asset in group['assets']:
            master, original, checks = extract(source, asset)
            if checks['raw_roi_edge_visible_pixels'] or not all(h['eligible'] for h in checks['hole_seeds']):
                problems.append({'id': asset['id'], 'edge': checks['raw_roi_edge_visible_pixels'], 'holes': checks['hole_seeds']})
            prefix = f"{group['id']}/{asset['id']}.png"
            master_record = save(master, 'masters/'+prefix)
            original_record = save(original, 'source-crops/'+prefix)
            exports = [save(sized(master, size, asset.get('wide', False)), f'png/{size}/'+prefix) for size in [32, 40, 48, 512]]
            manifest['exports'].append(asset | {'group': group['id'], 'source': 'design/concepts/'+group['source']+'.png',
                                                'source_sha256': digest(data), 'master': master_record, 'source_crop': original_record,
                                                'png': exports, 'checks': checks})
    manifest['asset_count'] = len(manifest['exports'])
    manifest['png_size_export_count'] = manifest['asset_count']*4
    manifest['pending_checks'] = problems
    manifest['status'] = 'complete' if not problems else 'extracting_source_pngs'
    manifest['pixel_fidelity'] = 'Opaque interior RGB is retained from the approved source exactly; only background alpha and antialias matte are processed.'
    (HERE/'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2)+'\n')
    columns, cell_w, cell_h = 7, 190, 190
    sheet = Image.new('RGB', (columns*cell_w+32, ((len(manifest['exports'])+columns-1)//columns)*cell_h+96), '#f8f6f1')
    draw = ImageDraw.Draw(sheet)
    try:
        font = ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial.ttf', 12)
        title_font = ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial.ttf', 24)
    except OSError:
        font = title_font = ImageFont.load_default()
    draw.text((22, 18), 'MoeGo / original-style PNG assets', fill='#24282e', font=title_font)
    draw.text((22, 55), 'Directly split from approved artwork. No redrawing.', fill='#676a73', font=font)
    for index, asset in enumerate(manifest['exports']):
        x, y = 16+(index % columns)*cell_w, 88+(index//columns)*cell_h
        bg = '#f96b1c' if asset.get('variant') == 'white' else 'white'
        draw.rounded_rectangle((x+3, y, x+cell_w-10, y+174), 14, fill=bg)
        art = Image.open(HERE/asset['master']['file']).convert('RGBA')
        art.thumbnail((158, 138), Image.Resampling.LANCZOS)
        sheet.paste(art, (x+(cell_w-8-art.width)//2, y+6+(138-art.height)//2), art)
        draw.text((x+(cell_w-8)/2, y+153), asset['id'], font=font, fill='white' if asset.get('variant') == 'white' else '#24282e', anchor='mt')
    sheet.save(HERE/'overview.png')
    template = HERE/'preview.template.html'
    if template.exists():
        (HERE/'preview.html').write_text(template.read_text().replace('__LIBRARY_DATA__', json.dumps(manifest, ensure_ascii=False).replace('<', '\\u003c')))
    print(json.dumps({'assets': manifest['asset_count'], 'exports': manifest['png_size_export_count'], 'checks_to_review': problems}, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
