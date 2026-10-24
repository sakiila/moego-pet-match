"""2026-10-24 用户授权：从已确认 v3 原稿直接切图、去除连通白底，不重绘。"""
from collections import deque
from pathlib import Path
import hashlib
import json
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
SOURCE = ROOT / 'design/concepts/collection-title-badges-v3.png'
BOXES = {
    'title-cats': (30, 77, 368, 396),
    'title-dogs': (375, 70, 713, 397),
    'title-friends': (727, 70, 1068, 395),
    'title-species': (1087, 73, 1427, 397),
    'title-neighbors': (168, 529, 511, 832),
    'title-family': (552, 528, 903, 831),
    'title-album': (936, 527, 1285, 832),
}
SIZES = [32, 48, 72, 96, 144, 192, 288]

def cut(crop):
    rgb = np.asarray(crop.convert('RGB')).astype(float)
    # 只闭合白色分隔线与外框的细缝，防止外部白底连进角色白脸；不改主体 RGB。
    ink = Image.fromarray((rgb.min(axis=2) <= 225).astype('uint8') * 255)
    padded = Image.new('L', (ink.width+64, ink.height+64)); padded.paste(ink,(32,32))
    closed = padded.filter(ImageFilter.MaxFilter(17)).filter(ImageFilter.MinFilter(17)).crop((32,32,32+ink.width,32+ink.height))
    light = np.asarray(closed) == 0
    h, w = light.shape
    bg = np.zeros((h, w), bool)
    q = deque()
    for y, x in [(y, x) for y in range(h) for x in (0, w-1)] + [(y, x) for x in range(w) for y in (0, h-1)]:
        if light[y, x] and not bg[y, x]:
            bg[y, x] = True; q.append((y, x))
    while q:
        y, x = q.popleft()
        for ny, nx in ((y-1,x),(y+1,x),(y,x-1),(y,x+1)):
            if 0 <= ny < h and 0 <= nx < w and light[ny,nx] and not bg[ny,nx]:
                bg[ny,nx] = True; q.append((ny,nx))
    alpha = np.where(bg, 0., 1.)
    near = np.zeros_like(bg)
    near[1:] |= bg[:-1]; near[:-1] |= bg[1:]
    near[:,1:] |= bg[:,:-1]; near[:,:-1] |= bg[:,1:]
    edge = near & ~bg
    alpha[edge] = np.clip((255-rgb.min(axis=2)[edge])/180, .2, 1)
    color = np.where(alpha[...,None] > 0, (rgb-255*(1-alpha[...,None]))/np.maximum(alpha[...,None],.001), 0)
    out = Image.fromarray(np.dstack([np.clip(color,0,255),alpha*255]).astype('uint8'))
    return out.crop(out.getbbox())

def main():
    sheet = Image.open(SOURCE)
    masters = HERE / 'masters'; masters.mkdir(exist_ok=True)
    web = ROOT / 'web/src/ui/icons/png'; web.mkdir(exist_ok=True)
    review = Image.new('RGB', (7*196, 420), '#e5e6eb')
    draw = ImageDraw.Draw(review)
    records = []
    for i, (name, box) in enumerate(BOXES.items()):
        crop = sheet.crop(box)
        img = cut(crop)
        target = masters / f'{name}.png'; img.save(target)
        library = ROOT / 'assets/icons/library-original-png-v2/masters/13-collection-titles'
        library.mkdir(parents=True, exist_ok=True)
        img.save(library / f'{name}.png')
        for size in SIZES:
            scaled = img.copy(); scaled.thumbnail((size-2, size-2), Image.Resampling.LANCZOS)
            out = Image.new('RGBA',(size,size));out.alpha_composite(scaled,((size-scaled.width)//2,(size-scaled.height)//2))
            out.save(web / f'{name}@{size}.png')
        for y, bg in [(0,'#ffffff'),(200,'#263447')]:
            tile = Image.new('RGBA',(190,190),bg)
            scaled=img.copy();scaled.thumbnail((180,180),Image.Resampling.LANCZOS)
            tile.alpha_composite(scaled,((190-scaled.width)//2,(190-scaled.height)//2))
            review.paste(tile.convert('RGB'),(i*196,y))
        draw.text((i*196+3,391),name,fill='black')
        records.append({'id':name,'sourceBox':box,'size':img.size,'sha256':hashlib.sha256(target.read_bytes()).hexdigest()})
    review.save(HERE / 'preview.png')
    (HERE/'manifest.json').write_text(json.dumps({'source':str(SOURCE.relative_to(ROOT)),'sourceSha256':hashlib.sha256(SOURCE.read_bytes()).hexdigest(),'method':'Original pixel crop, connected exterior white-background removal, no redraw','sizes':SIZES,'items':records},indent=2)+'\n')

if __name__ == '__main__': main()
