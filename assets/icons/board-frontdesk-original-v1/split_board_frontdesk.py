"""Deterministic extraction from the three approved v2 layouts, without redrawing.

The source RGB of every fully opaque output pixel is retained exactly. Background
and anti-aliased boundary pixels are the only pixels processed. Master canvases
keep the source crop's native resolution. No existing icon/export is removed.
"""
from __future__ import annotations

from collections import deque
from hashlib import sha256
import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
MASTERS = ROOT / 'assets/icons/library-original-png-v2/masters/16-board-frontdesk'
WEB = ROOT / 'web/src/ui/icons/png'
WIDTHS = [32, 48, 72, 96, 144, 192, 288]
ITEMS = [
    {'id': 'round-clock', 'source': 'mobile-board-frontdesk-v2.png', 'box': [45, 309, 155, 420], 'kind': 'orange', 'seed': [100, 366], 'wide': False},
    {'id': 'round-score', 'source': 'mobile-board-frontdesk-v2.png', 'box': [487, 306, 597, 410], 'kind': 'score', 'wide': False},
    {'id': 'rush-clipboard', 'source': 'mobile-board-frontdesk-v2.png', 'box': [50, 479, 130, 571], 'kind': 'orange', 'clear_holes': [[88, 496]], 'wide': False},
    {'id': 'rush-clip', 'source': 'mobile-board-frontdesk-v2.png', 'box': [355, 421, 497, 504], 'kind': 'clip', 'clear_holes': [[427, 449]], 'wide': True},
    {'id': 'rush-check', 'source': 'rush-frontdesk-states-v2.png', 'box': [64, 656, 161, 803], 'kind': 'green', 'wide': False},
    {'id': 'rush-expired-clipboard', 'source': 'rush-frontdesk-states-v2.png', 'box': [888, 717, 974, 813], 'kind': 'gray', 'clear_holes': [[930, 738]], 'wide': False},
    {'id': 'closing-sign-zh', 'source': 'shift-finish-storyboard-v2.png', 'box': [799, 375, 1069, 578], 'kind': 'sign', 'clear_holes': [[930, 430]], 'wide': True},
    {'id': 'rush-clock', 'source': 'mobile-board-frontdesk-v2.png', 'box': [538, 490, 613, 565], 'kind': 'orange', 'wide': False},
    {'id': 'rush-accent', 'source': 'mobile-board-frontdesk-v2.png', 'box': [372, 505, 410, 554], 'kind': 'orange', 'wide': False},
    {'id': 'time-accent', 'source': 'mobile-board-frontdesk-v2.png', 'box': [405, 349, 446, 403], 'kind': 'orange', 'wide': False},
    {'id': 'farewell-accent-left', 'source': 'shift-finish-storyboard-v2.png', 'box': [794, 704, 826, 745], 'kind': 'orange', 'wide': False},
    {'id': 'farewell-accent-right', 'source': 'shift-finish-storyboard-v2.png', 'box': [1026, 704, 1054, 745], 'kind': 'orange', 'wide': False},
]


def digest(path):
    return sha256(path.read_bytes()).hexdigest()


def morph(mask, radius, expand):
    im = Image.fromarray(mask.astype('uint8') * 255)
    f = ImageFilter.MaxFilter(radius * 2 + 1) if expand else ImageFilter.MinFilter(radius * 2 + 1)
    return np.asarray(im.filter(f)) > 0


def components(mask):
    h, w = mask.shape
    seen = np.zeros_like(mask)
    result = []
    for y, x in zip(*np.nonzero(mask)):
        if seen[y, x]:
            continue
        q = deque([(int(y), int(x))]); seen[y, x] = True; pts = []
        while q:
            a, b = q.popleft(); pts.append((a, b))
            for c, d in ((a-1,b),(a+1,b),(a,b-1),(a,b+1)):
                if 0 <= c < h and 0 <= d < w and mask[c,d] and not seen[c,d]:
                    seen[c,d] = True; q.append((c,d))
        result.append(pts)
    return result


def fill_holes(mask):
    h, w = mask.shape
    bg = ~mask
    q = deque()
    seen = np.zeros_like(mask)
    for y in range(h):
        for x in (0, w-1):
            if bg[y,x] and not seen[y,x]: seen[y,x] = True; q.append((y,x))
    for x in range(w):
        for y in (0, h-1):
            if bg[y,x] and not seen[y,x]: seen[y,x] = True; q.append((y,x))
    while q:
        y, x = q.popleft()
        for a,b in ((y-1,x),(y+1,x),(y,x-1),(y,x+1)):
            if 0 <= a < h and 0 <= b < w and bg[a,b] and not seen[a,b]:
                seen[a,b] = True; q.append((a,b))
    return ~seen


def hole_at(mask, x, y):
    for pts in components(~mask):
        if (y,x) in pts:
            out = np.zeros_like(mask)
            yy,xx = zip(*pts); out[yy,xx] = True
            return out
    raise ValueError(f'hole seed not in a background component: {x}, {y}')


def source_mask(rgb, item):
    a = rgb.astype(float)
    r,g,b = [a[:,:,i] for i in range(3)]
    orange = (r-b > 35) & (r-g > 18)
    green = (g-r > 22) & (g-b > 15)
    gray = (np.max(a, axis=2) < 218) & (b-r > 1)
    kind = item['kind']
    if kind == 'orange':
        m = orange
    elif kind == 'score':
        # Preserve the approved broad white keyline, star interior, and rays.
        star_pts = max(components(orange), key=len)
        star = np.zeros_like(orange); yy,xx = zip(*star_pts); star[yy,xx] = True
        white = (r > 248) & (g > 249) & (b > 248)
        m = orange | (white & morph(star, 7, True))
        # Join only one-pixel colour-transition gaps between the orange line
        # and its opaque white keyline; this does not redraw their source RGB.
        m = morph(morph(m, 1, True), 1, False)
    elif kind == 'clip':
        m = orange.copy()
        # The card's horizontal border joins the orange clip at source y=463..468.
        # Remove only that adjacent line; the source body boundary is continuous
        # at x=369..484 immediately above/below it. Alpha is restricted there.
        yy,xx = np.indices(m.shape)
        gx = xx + item['box'][0]
        m &= (gx >= 369) & (gx <= 484)
    elif kind == 'green':
        m = green
    elif kind == 'gray':
        m = gray
    elif kind == 'sign':
        dark = np.max(a, axis=2) < 180
        raw = orange | dark
        pts = max(components(raw), key=len)
        m = np.zeros_like(raw); yy,xx = zip(*pts); m[yy,xx] = True
    else:
        raise ValueError(kind)
    # Ignore tiny disconnected source speckles. Separate approved rays remain.
    clean = np.zeros_like(m)
    for pts in components(m):
        if len(pts) >= 9:
            yy,xx = zip(*pts); clean[yy,xx] = True
    filled = fill_holes(clean)
    holes = np.zeros_like(m)
    for sx,sy in item.get('clear_holes', []):
        holes |= hole_at(clean, sx-item['box'][0], sy-item['box'][1])
    filled &= ~holes
    # Background candidates exclude all other source art, e.g. motion marks,
    # orange card borders and board shapes; they are never retained as assets.
    foreign = orange | green | gray
    if kind == 'score': foreign |= (r > 248) & (g > 249) & (b > 248) & morph(orange,7,True)
    return filled, foreign, holes


def nearest_samples(rgb, candidate, y, x, n=1, radius=12):
    h,w = candidate.shape
    y0,y1 = max(0,y-radius), min(h,y+radius+1)
    x0,x1 = max(0,x-radius), min(w,x+radius+1)
    yy,xx = np.nonzero(candidate[y0:y1,x0:x1]); yy += y0; xx += x0
    if len(yy) == 0:
        yy,xx = np.nonzero(candidate)
    dist = (yy-y)**2+(xx-x)**2
    use = np.argsort(dist, kind='stable')[:n]
    return np.median(rgb[yy[use],xx[use]], axis=0).astype(float)


def matte(rgb, mask, foreign, holes, item):
    a = rgb.astype(float)
    core = morph(mask, 1 if item['kind'] == 'score' else 2, False)
    support = morph(mask, 2, True)
    outside = ~morph(mask | foreign, 2, True)
    # White holes are background by their source outline, not opaque paper.
    outside |= morph(holes, 1, False)
    alpha = np.zeros(mask.shape, dtype=float); alpha[core] = 1
    colors = a.copy()
    score_white_support = np.zeros_like(mask)
    if item['kind'] == 'score':
        pts = max(components(mask), key=len)
        yy,xx = zip(*pts); score_white_support[yy,xx] = True
        score_white_support = morph(score_white_support, 2, True)
    for y,x in zip(*np.nonzero(support & ~core)):
        f = nearest_samples(a, core, y,x)
        if item['kind'] == 'score' and score_white_support[y,x] and np.min(a[y,x]) > 230 and np.max(a[y,x])-np.min(a[y,x]) < 14:
            # The broad white keyline is real opaque artwork, including at
            # narrow tips where erosion leaves no white sample nearby.
            f = np.array([255.,255.,255.])
        bg = nearest_samples(a, outside, y,x,n=5)
        v = f-bg
        denom = float(np.dot(v,v))
        if denom < 10:
            value = 1.0 if mask[y,x] else 0.0
        else:
            value = float(np.clip(np.dot(a[y,x]-bg,v)/denom,0,1))
        # Only anti-alias pixels change RGB. Fully opaque source stays exact.
        if value >= .985:
            value = 1.0
        elif value <= .025:
            value = 0.0
        if 0 < value < 1:
            colors[y,x] = np.clip((a[y,x]-(1-value)*bg)/value,0,255)
        alpha[y,x] = value
    if item['kind'] == 'clip':
        # Recover only the obscured anti-aliased silhouette boundary from the
        # immediately adjacent unobstructed rows, without altering source RGB.
        y0 = 463-item['box'][1]; y1 = 468-item['box'][1]
        for y in range(y0,y1+1):
            t = (y-y0+1)/(y1-y0+2)
            for x in list(range(0, 371-item['box'][0])) + list(range(483-item['box'][0], mask.shape[1])):
                alpha[y,x] = (1-t)*alpha[y0-1,x] + t*alpha[y1+1,x]
                colors[y,x] = a[y,x]
                if alpha[y,x] < .025: alpha[y,x] = 0
    # Never keep the connected card border's pale glow beside the clip.
    if item['kind'] == 'clip':
        alpha[~mask] = 0
        yy,xx = np.indices(mask.shape); gx = xx + item['box'][0]
        alpha[((yy+item['box'][1]>=457)&(yy+item['box'][1]<=478)) & ((gx<370)|(gx>483))] = 0
    if item['kind'] == 'sign':
        alpha[(~mask) & (alpha < .15)] = 0
        alpha[(~mask) & (np.max(a,axis=2)>220)] = 0
    # Never keep source panel halos far from the selected silhouette.
    alpha[~support] = 0
    # Remove isolated matte specks introduced by textured page backgrounds.
    for pts in components(alpha > 0):
        yy,xx = zip(*pts)
        if len(pts) < 9 or np.max(alpha[yy,xx]) < .13:
            alpha[yy,xx] = 0
    rgba = np.dstack([np.rint(colors).astype('uint8'),np.rint(alpha*255).astype('uint8')])
    rgba[rgba[:,:,3] == 0,:3] = 0
    return Image.fromarray(rgba), core


def fit(art, width, wide):
    height = round(width*art.height/art.width) if wide else width
    canvas = Image.new('RGBA',(width,height))
    f = min(width/art.width,height/art.height)
    scaled = art.resize((max(1,round(art.width*f)),max(1,round(art.height*f))),Image.Resampling.LANCZOS)
    canvas.alpha_composite(scaled,((width-scaled.width)//2,(height-scaled.height)//2))
    return canvas


def main(ids=None):
    for p in [MASTERS,WEB,HERE/'source-crops',HERE/'previews']:
        p.mkdir(parents=True,exist_ok=True)
    manifest = {'scope':'Exact source-pixel extraction only; no generated/redrawn shapes; no UI implementation changes.',
                'authorization':'用户已确认全部图稿，原话为「可以，把刚才设计的所有改动都拆分成组件元素，不许随意调整图案」。本轮将其实现为列明图案的原稿拆分，文字、数据和布局仍由独立组件渲染。',
                'method':'Foreground colour selection and connected components; protected opaque white interiors; explicit clip/rope holes; local background/foreground colour-line matting only in a two-pixel boundary band.',
                'native_resolution':True,'sources':{},'assets':[]}
    catalog={}
    if ids:
        known = {item['id'] for item in ITEMS}
        if set(ids) - known:
            raise ValueError('Unknown asset IDs: ' + ', '.join(set(ids) - known))
        manifest = json.loads((HERE/'manifest.json').read_text())
        manifest['assets'] = [a for a in manifest['assets'] if a['id'] not in ids]
        catalog = json.loads((HERE/'catalog-fragment.json').read_text())
    for item in ITEMS:
        if ids and item['id'] not in ids:
            continue
        source = ROOT/'design/concepts'/item['source']
        full = Image.open(source).convert('RGB')
        crop = full.crop(item['box']); rgb=np.asarray(crop)
        crop_path = HERE/'source-crops'/(item['id']+'.png'); crop.save(crop_path)
        mask,foreign,holes = source_mask(rgb,item)
        art,core = matte(rgb,mask,foreign,holes,item)
        master=MASTERS/(item['id']+'.png'); art.save(master,optimize=True)
        bbox=art.getbbox(); visible=art.crop(bbox)
        limit=visible.width if item['wide'] else max(visible.size)
        widths=[w for w in WIDTHS if w <= limit]
        if not widths or (widths[-1] < limit and widths[-1] < WIDTHS[-1]): widths.append(min(limit,WIDTHS[-1]))
        exports=[]
        for width in widths:
            path=WEB/f"{item['id']}@{width}.png"; export=fit(visible,width,item['wide']); export.save(path,optimize=True)
            exports.append({'path':str(path.relative_to(ROOT)),'size':list(export.size),'sha256':digest(path)})
        catalog[item['id']]={'widths':widths,'aspect':round(visible.width/visible.height,4) if item['wide'] else 1}
        enlarged=art.resize((art.width*4,art.height*4),Image.Resampling.NEAREST)
        enlarged.save(HERE/'previews'/f"{item['id']}-transparent-4x.png")
        blue=Image.new('RGBA',enlarged.size,(28,75,119,255)); blue.alpha_composite(enlarged); blue.convert('RGB').save(HERE/'previews'/f"{item['id']}-blue-4x.png")
        out=np.asarray(art); opaque=out[:,:,3]==255
        unchanged=np.array_equal(out[opaque,:3],rgb[opaque])
        if not unchanged: raise AssertionError(item['id']+' opaque RGB changed')
        info={'id':item['id'],'source':str(source.relative_to(ROOT)),'source_box_xyxy':item['box'],
              'master':str(master.relative_to(ROOT)),'master_size':list(art.size),'visible_bbox_xyxy':list(bbox),'visible_size':list(visible.size),
              'wide':item['wide'],'sha256':digest(master),'source_crop_sha256':digest(crop_path),
              'opaque_pixels':int(opaque.sum()),'opaque_rgb_unchanged':unchanged,
              'partial_alpha_pixels':int(((out[:,:,3]>0)&(out[:,:,3]<255)).sum()),
              'transparent_pixels':int((out[:,:,3]==0).sum()),'clear_holes_source_xy':item.get('clear_holes',[]),'exports':exports}
        if item['id']=='rush-clip': info['adjacent_line_exclusion']='Source card border at y=463..468 removed outside the clip body. Only ambiguous boundary alpha interpolates from adjacent unobstructed source rows; source opaque RGB retained.'
        if item['id']=='closing-sign-zh': info['excluded']='Third storyboard panel: orange motion arc, header annotation, dimmed board/pet tiles; triangle between ropes is transparent.'
        manifest['assets'].append(info)
        manifest['sources'][item['source']]={'path':str(source.relative_to(ROOT)),'size':list(full.size),'sha256':digest(source)}
    (HERE/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
    (HERE/'catalog-fragment.json').write_text(json.dumps(catalog,indent=2)+'\n')
    print(json.dumps({'assets':len(manifest['assets']),'exports':sum(len(x['exports']) for x in manifest['assets']),'catalog':catalog},ensure_ascii=False,indent=2))

if __name__=='__main__':
    import sys
    main(sys.argv[1:] or None)
