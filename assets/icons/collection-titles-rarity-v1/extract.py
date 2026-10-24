"""Extract approved rarity PNG components without redrawing; never modifies application assets."""
from collections import deque
from pathlib import Path
import hashlib
import json
import shutil
import zipfile
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
SOURCE = ROOT / 'design/concepts/collection-title-rarity-v1.png'
SIZES = [32, 48, 64, 96, 128, 192, 256, 512]
ITEMS = [
    ('cats', '猫猫亲友团', 'common', '普通', (28, 72, 369, 396)),
    ('dogs', '汪汪好朋友', 'common', '普通', (374, 72, 712, 396)),
    ('friends', '毛孩子熟人', 'common', '普通', (725, 72, 1068, 396)),
    ('species', '跨物种交友家', 'epic', '史诗', (1071, 61, 1430, 396)),
    ('neighbors', '串门小能手', 'rare', '稀有', (168, 541, 510, 830)),
    ('family', '一家都熟', 'rare', '稀有', (550, 541, 898, 830)),
    ('album', '全员点名成功', 'legendary', '传说', (904, 538, 1320, 832)),
]


def exterior(mask):
    h, w = mask.shape
    seen = np.zeros_like(mask)
    q = deque()
    for y, x in [(y,x) for y in range(h) for x in (0,w-1)] + [(y,x) for x in range(w) for y in (0,h-1)]:
        if mask[y,x] and not seen[y,x]:
            seen[y,x] = True; q.append((y,x))
    while q:
        y, x = q.popleft()
        for yy,xx in ((y-1,x),(y+1,x),(y,x-1),(y,x+1)):
            if 0<=yy<h and 0<=xx<w and mask[yy,xx] and not seen[yy,xx]:
                seen[yy,xx] = True; q.append((yy,xx))
    return seen


def cut(crop, close_size):
    rgb = np.asarray(crop.convert('RGB')).astype(float)
    ink = Image.fromarray((rgb.min(axis=2) <= 225).astype('uint8')*255)
    # Close fine white channels only for the extraction mask, preserving RGB from source.
    pad = 32
    padded = Image.new('L',(ink.width+pad*2,ink.height+pad*2)); padded.paste(ink,(pad,pad))
    mask = padded.filter(ImageFilter.MaxFilter(close_size)).filter(ImageFilter.MinFilter(close_size))
    mask = mask.crop((pad,pad,pad+ink.width,pad+ink.height))
    bg = exterior(np.asarray(mask)==0)
    alpha = np.where(bg,0.,1.)
    near=np.zeros_like(bg); near[1:]|=bg[:-1];near[:-1]|=bg[1:];near[:,1:]|=bg[:,:-1];near[:,:-1]|=bg[:,1:]
    edge = near & ~bg
    alpha[edge] = np.clip((255-rgb.min(axis=2)[edge])/180,.12,1)
    color = np.where(alpha[...,None]>0,(rgb-255*(1-alpha[...,None]))/np.maximum(alpha[...,None],.001),0)
    rgba = np.dstack([np.clip(color,0,255),alpha*255]).astype('uint8')
    # Remove partial neighbors from the design-sheet rows above/below this crop.
    # Genuine badge art and its complete accent stars are separated from crop edges.
    rgba[exterior(rgba[:,:,3]>0)] = 0
    result = Image.fromarray(rgba)
    return result.crop(result.getbbox()), result.getbbox()


def compact(img):
    """Keep the connected main seal; only detached stars disappear, never the animal/album art."""
    rgba=np.array(img)
    fg=rgba[:,:,3]>16; h,w=fg.shape
    seen=np.zeros_like(fg); components=[]
    for y in range(h):
        for x in range(w):
            if not fg[y,x] or seen[y,x]: continue
            points=[]; q=deque([(y,x)]); seen[y,x]=True
            while q:
                yy,xx=q.popleft(); points.append((yy,xx))
                for ny,nx in ((yy-1,xx),(yy+1,xx),(yy,xx-1),(yy,xx+1)):
                    if 0<=ny<h and 0<=nx<w and fg[ny,nx] and not seen[ny,nx]:
                        seen[ny,nx]=True;q.append((ny,nx))
            components.append(points)
    largest=max(components,key=len)
    keep=np.zeros_like(fg)
    for y,x in largest:keep[y,x]=True
    # Include anti-aliased perimeter pixels adjacent to the retained seal.
    expanded=np.asarray(Image.fromarray(keep.astype('uint8')*255).filter(ImageFilter.MaxFilter(3)))>0
    rgba[~expanded]=0
    out=Image.fromarray(rgba)
    return out.crop(out.getbbox()),len(components)-1,out.getbbox()


def square(img,size):
    factor=(size-2)/max(img.size)
    scaled=img.resize((max(1,round(img.width*factor)),max(1,round(img.height*factor))),Image.Resampling.LANCZOS)
    canvas=Image.new('RGBA',(size,size))
    canvas.alpha_composite(scaled,((size-scaled.width)//2,(size-scaled.height)//2))
    return canvas


def font(size):
    for p in ['/System/Library/Fonts/STHeiti Light.ttc','/System/Library/Fonts/PingFang.ttc','/System/Library/Fonts/Supplemental/Arial Unicode.ttf']:
        if Path(p).exists():
            try:return ImageFont.truetype(p,size)
            except OSError:pass
    return ImageFont.load_default()


def sha(path):return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    for directory in ['reference','source-crops','masters/showcase','masters/avatar','png/showcase','png/avatar']:
        (HERE/directory).mkdir(parents=True,exist_ok=True)
    shutil.copyfile(SOURCE,HERE/'reference'/SOURCE.name)
    shutil.copyfile(SOURCE.with_name(SOURCE.stem+'-prompt.txt'),HERE/'reference'/'source-prompt.txt')
    sheet=Image.open(SOURCE).convert('RGB')
    overview=Image.new('RGB',(1520,1270),'#fbfbfc');d=ImageDraw.Draw(overview)
    d.text((28,20),'称号徽章 · 透明 PNG 组件',font=font(30),fill='#1f2227')
    d.text((28,64),'上：浅底完整展示版　中：深底透明检查　下：头像版与小尺寸预览',font=font(17),fill='#5b6270')
    records=[];validations=[]
    for i,(aid,title,tier,tier_zh,box) in enumerate(ITEMS):
        crop=sheet.crop(box);crop.save(HERE/'source-crops'/f'title-{aid}.png')
        art,trim=cut(crop,17 if tier=='common' else 3)
        avatar,removed,avatar_trim=compact(art)
        source_art=sheet.crop((box[0]+trim[0],box[1]+trim[1],box[0]+trim[2],box[1]+trim[3]))
        solid=np.asarray(art)[:,:,3]==255
        assert np.abs(np.asarray(art)[:,:,:3].astype(int)[solid]-np.asarray(source_art).astype(int)[solid]).max() <= 1
        for variant,img in [('showcase',art),('avatar',avatar)]:
            img.save(HERE/'masters'/variant/f'title-{aid}.png')
            for size in SIZES:
                target=HERE/'png'/variant/f'title-{aid}@{size}.png';square(img,size).save(target,optimize=True)
                decoded=Image.open(target)
                assert decoded.mode=='RGBA' and decoded.size==(size,size)
                assert decoded.getextrema()[3]==(0,255)
                assert all(decoded.getpixel(p)[3]==0 for p in [(0,0),(size-1,0),(0,size-1),(size-1,size-1)])
        col=i%4;row=i//4;x=28+col*374;y=110+row*568
        d.text((x+8,y),title,font=font(22),fill='#1f2227')
        d.text((x+8,y+31),tier_zh+' · '+aid,font=font(15),fill='#5b6270')
        for offset,bg in [(62,'#ffffff'),(240,'#253447')]:
            tile=Image.new('RGBA',(330,170),bg)
            scaled=art.copy();scaled.thumbnail((296,158),Image.Resampling.LANCZOS)
            tile.alpha_composite(scaled,((330-scaled.width)//2,(170-scaled.height)//2))
            overview.paste(tile.convert('RGB'),(x,y+offset))
        for j,size in enumerate([32,48,64,96]):
            small=square(avatar,size)
            overview.paste(small,(x+j*82,y+430+(96-size)//2),small)
            d.text((x+j*82+3,y+530),str(size)+' px',font=font(13),fill='#5b6270')
        records.append({'id':aid,'titleZh':title,'rarity':tier,'sourceBox':box,'sourceVisibleBox':[box[0]+trim[0],box[1]+trim[1],box[0]+trim[2],box[1]+trim[3]],'avatarTrimInShowcase':avatar_trim,'showcaseSize':art.size,'avatarSize':avatar.size,'detachedAccentsRemoved':removed,'showcaseSha256':sha(HERE/'masters/showcase'/f'title-{aid}.png'),'avatarSha256':sha(HERE/'masters/avatar'/f'title-{aid}.png')})
    # Last unused cell communicates the single highest rarity without introducing a new badge.
    x=28+3*374;y=110+568
    d.text((x+8,y+30),'传说边框 · 头像角标',font=font(22),fill='#1f2227')
    album=Image.open(HERE/'masters/avatar/title-album.png')
    tile=Image.new('RGBA',(330,260),'#ffffff');td=ImageDraw.Draw(tile)
    td.ellipse((60,35,188,163),fill='#8a62d5');td.text((102,64),'B',font=font(54),fill='white')
    marker=square(album,64);tile.alpha_composite(marker,(153,125));td.text((66,205),'Bob',font=font(22),fill='#1f2227')
    overview.paste(tile.convert('RGB'),(x,y+92))
    d.text((x+8,y+380),'彩虹只在徽章外框，文字独立排版。',font=font(15),fill='#5b6270')
    d.text((x+8,y+410),'512 px 为原稿等比放大，不新增细节。',font=font(15),fill='#5b6270')
    overview.save(HERE/'preview.png')
    png_files=sorted((HERE/'png').rglob('*.png'))
    manifest={'source':str(SOURCE.relative_to(ROOT)),'sourceSha256':sha(SOURCE),'method':'Approved source pixels; external white-background removal with protected ivory faces; compact variants remove detached stars only; no redraw','sizes':SIZES,'upsampledExports':[512],'items':records,'exports':[{ 'path':str(p.relative_to(HERE)),'sha256':sha(p)} for p in png_files]}
    (HERE/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
    (HERE/'validation.json').write_text(json.dumps({'status':'passed','masters':14,'responsivePngs':len(png_files),'rgba':True,'transparentCorners':True,'opaqueSourceRgbMaximumDifference':1,'checkedSizes':SIZES,'note':'Visual inspection of preview.png required in addition to structural validation'},indent=2)+'\n')
    print(json.dumps({'masters':14,'responsivePngs':len(png_files),'items':[(r['id'],r['showcaseSize'],r['detachedAccentsRemoved']) for r in records]},ensure_ascii=False))


if __name__=='__main__':main()
