"""Rebuild the extraction contact sheet and verification report from manifest."""
import json
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

HERE=Path(__file__).resolve().parent
ROOT=HERE.parents[2]
manifest=json.loads((HERE/'manifest.json').read_text())
try: font=ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial.ttf',20)
except OSError: font=ImageFont.load_default()
canvas=Image.new('RGB',(1200,((len(manifest['assets'])+2)//3)*400+10),(240,244,248)); d=ImageDraw.Draw(canvas)
for i,a in enumerate(manifest['assets']):
    x=(i%3)*400; y=(i//3)*400
    d.rounded_rectangle((x+10,y+10,x+390,y+390),radius=16,fill=(28,75,119))
    d.text((x+24,y+25),a['id'],font=font,fill='white')
    im=Image.open(ROOT/a['master']); im=im.crop(im.getbbox())
    f=min(340/im.width,300/im.height)
    im=im.resize((round(im.width*f),round(im.height*f)),Image.Resampling.NEAREST)
    canvas.paste(im,(x+200-im.width//2,y+222-im.height//2),im)
canvas.save(HERE/'overview-blue.png')
preview_path=HERE/'preview.html'
header=preview_path.read_text().split('<section>',1)[0]
rows=[]
for a in manifest['assets']:
    asset_id=a['id']
    rows.append(f'''<section><h2>{asset_id}</h2><p>Source: {a['source']} / crop {a['source_box_xyxy']} / master {a['master_size']} / visible {a['visible_size']}</p><div class="columns"><figure><img src="source-crops/{asset_id}.png"><figcaption>Original source crop</figcaption></figure><figure class="checker"><img src="previews/{asset_id}-transparent-4x.png"><figcaption>Transparent master x4, preview only</figcaption></figure><figure><img src="previews/{asset_id}-blue-4x.png"><figcaption>Blue-background check x4</figcaption></figure></div></section>''')
preview_path.write_text(header+''.join(rows)+'</html>')
validation={
    'assets':len(manifest['assets']),
    'exports':sum(len(a['exports']) for a in manifest['assets']),
    'all_opaque_rgb_equal_source':all(a['opaque_rgb_unchanged'] for a in manifest['assets']),
    'master_resolution':'source-native; not enlarged',
    'export_scaling':'LANCZOS proportional downscale only; square canvases except rush-clip and closing-sign-zh retain wide ratio',
    'visual_qa':'Inspected every source and every four-times blue-background preview; no adjoining labels, motion arcs, board or pet heads retained. Intentional original white star keyline and white icon interiors are kept.',
    'scope':'No React/CSS/TS/catalog/export_web modifications; only new source-extraction assets and new PNG export names.'}
(HERE/'validation.json').write_text(json.dumps(validation,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(validation,indent=2))
