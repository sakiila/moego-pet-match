"""2026-10-25 开发者彩蛋：从已确认的 title-hotpot-badge-v1 直接切出三枚隐藏称号「火锅搭子」徽章并去除连通白底，不重绘。
做法与 collection-titles-original-v1/extract.py 一致；输出同步到图标库母版 13/14/15 三组，再由 export_web.py 等比导出。"""
from collections import deque
from pathlib import Path
import hashlib
import json
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
SOURCE = ROOT / 'design/concepts/title-hotpot-badge-v1.png'
LIBRARY = ROOT / 'assets/icons/library-original-png-v2/masters'
# 像素包围盒按非白像素计算，外扩 6px；底部文件名标注不在框内。
BOXES = {
    'title-hotpot': ((3, 224, 549, 762), '13-collection-titles'),
    'title-hotpot-avatar': ((562, 327, 926, 694), '14-collection-title-avatars'),
    'title-hotpot-showcase': ((936, 194, 1515, 772), '15-collection-title-showcase'),
}

def cut(crop):
    rgb = np.asarray(crop.convert('RGB')).astype(float)
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
    review = Image.new('RGB', (3*196, 420), '#e5e6eb')
    draw = ImageDraw.Draw(review)
    records = []
    for i, (name, (box, group)) in enumerate(BOXES.items()):
        img = cut(sheet.crop(box))
        target = masters / f'{name}.png'; img.save(target)
        img.save(LIBRARY / group / f'{name}.png')
        for y, bg in [(0,'#ffffff'),(200,'#263447')]:
            tile = Image.new('RGBA',(190,190),bg)
            scaled=img.copy();scaled.thumbnail((180,180),Image.Resampling.LANCZOS)
            tile.alpha_composite(scaled,((190-scaled.width)//2,(190-scaled.height)//2))
            review.paste(tile.convert('RGB'),(i*196,y))
        draw.text((i*196+3,391),name,fill='black')
        records.append({'id':name,'group':group,'sourceBox':list(box),'size':list(img.size),'sha256':hashlib.sha256(target.read_bytes()).hexdigest()})
    review.save(HERE / 'preview.png')
    (HERE/'manifest.json').write_text(json.dumps({'source':str(SOURCE.relative_to(ROOT)),'sourceSha256':hashlib.sha256(SOURCE.read_bytes()).hexdigest(),'method':'Original pixel crop, connected exterior white-background removal, no redraw','items':records},indent=2)+'\n')

if __name__ == '__main__': main()
