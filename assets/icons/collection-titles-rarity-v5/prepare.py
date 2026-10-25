"""Split the approved seven-badge atlas; preserve source RGB and keep alpha cut-outs."""
from collections import deque
from pathlib import Path
import hashlib
import importlib.util
import json
import shutil
import numpy as np
from PIL import Image, ImageDraw

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
SOURCE = HERE / 'source-atlas.png'
spec = importlib.util.spec_from_file_location('old_assets', HERE.parent / 'collection-titles-rarity-v1/extract.py')
helpers = importlib.util.module_from_spec(spec)
spec.loader.exec_module(helpers)
IDS = ['cats', 'dogs', 'friends', 'species', 'neighbors', 'family', 'album']

def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def main():
    atlas = Image.open(SOURCE).convert('RGBA')
    pixels = np.array(atlas)
    alpha = pixels[:, :, 3]
    foreground = alpha > 16
    labels = np.zeros(foreground.shape, dtype=np.int32)
    height, width = foreground.shape
    pieces = []
    for y, x in zip(*np.where(foreground)):
        if labels[y, x]:
            continue
        number = len(pieces) + 1
        points = []
        queue = deque([(y, x)])
        labels[y, x] = number
        while queue:
            yy, xx = queue.popleft()
            points.append((yy, xx))
            for ny, nx in ((yy-1,xx),(yy+1,xx),(yy,xx-1),(yy,xx+1)):
                if 0 <= ny < height and 0 <= nx < width and foreground[ny,nx] and not labels[ny,nx]:
                    labels[ny,nx] = number
                    queue.append((ny,nx))
        coords = np.array(points)
        ymin, xmin = coords.min(axis=0)
        ymax, xmax = coords.max(axis=0)
        pieces.append({'label':number, 'area':len(points), 'center':((xmin+xmax)/2,(ymin+ymax)/2)})
    major = sorted(sorted(pieces, key=lambda c:c['area'], reverse=True)[:7], key=lambda c:(c['center'][1] > height/2,c['center'][0]))
    assert len(major) == 7 and all(c['area'] > 10000 for c in major)
    for item, aid in zip(major, IDS):
        item['id'] = aid
    preview = Image.new('RGB', (1440,740), '#fbfbfc')
    draw = ImageDraw.Draw(preview)
    records = []
    for i, item in enumerate(major):
        main_mask = labels == item['label']
        accent_labels = []
        if item['id'] in ('species','album'):
            for piece in pieces:
                if piece in major or piece['area'] < 80:
                    continue
                closest = min(major, key=lambda c:sum((a-b)**2 for a,b in zip(c['center'],piece['center'])))
                if closest['id'] == item['id']:
                    accent_labels.append(piece['label'])
        for variant in ('avatar','showcase'):
            keep = main_mask if variant == 'avatar' else np.isin(labels, [item['label'],*accent_labels])
            out = pixels.copy()
            out[~keep] = 0
            image = Image.fromarray(out)
            box = image.getbbox()
            image = image.crop(box)
            directory = HERE/'masters'/variant
            directory.mkdir(parents=True,exist_ok=True)
            path = directory/f"title-{item['id']}.png"
            image.save(path,optimize=True)
            assert image.getextrema()[3][0] == 0
            assert image.getextrema()[3][1] >= 250
            source_pixels = pixels[box[1]:box[3],box[0]:box[2]]
            actual = np.array(image)
            visible = actual[:,:,3] > 16
            assert np.array_equal(source_pixels[visible],actual[visible])
            group = '14-collection-title-avatars' if variant == 'avatar' else '15-collection-title-showcase'
            target = ROOT/'assets/icons/library-original-png-v2/masters'/group/f"title-{item['id']}-{variant}.png"
            shutil.copyfile(path,target)
            records.append({'id':item['id'],'variant':variant,'sourceBox':box,'size':image.size,'sha256':sha(path),'visibleSourcePixelsChanged':0})
            if variant == 'showcase':
                x = 30 + (i%4)*350
                y = 24 + (i//4)*350
                draw.text((x,y),item['id'],font=helpers.font(18),fill='#1f2227')
                thumb = image.copy()
                thumb.thumbnail((270,250),Image.Resampling.LANCZOS)
                preview.paste(thumb,(x,y+30),thumb)
                for j,bg in enumerate(('#ffffff','#142338')):
                    tile=Image.new('RGBA',(96,64),bg)
                    small=helpers.square(image,56)
                    tile.alpha_composite(small,(20,4))
                    preview.paste(tile.convert('RGB'),(x+j*104,y+280))
    preview.save(HERE/'preview.png')
    (HERE/'manifest.json').write_text(json.dumps({'approvedDesign':'design/concepts/collection-title-rarity-v5.png','sourceAtlasSha256':sha(SOURCE),'method':'Connected alpha components from built-in ImageGen atlas; source pixels preserved; detached accent stars omitted from avatar variant','items':records},ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'masters':len(records),'sourceSize':atlas.size,'components':len(pieces),'items':[(r['id'],r['variant'],r['size']) for r in records]}))

if __name__ == '__main__':
    main()
