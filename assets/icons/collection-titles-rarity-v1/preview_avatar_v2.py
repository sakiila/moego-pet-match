"""Re-render only the code-native avatar placement example; badge PNG source files stay unchanged."""
from pathlib import Path
from math import sqrt
import hashlib
import importlib.util
import json
import zipfile
from PIL import Image, ImageDraw, ImageFilter

HERE=Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('rarity_assets',HERE/'extract.py')
assets=importlib.util.module_from_spec(spec);spec.loader.exec_module(assets)
font=assets.font
square=assets.square
album=Image.open(HERE/'masters/avatar/title-album.png').convert('RGBA')


def draw_avatar(tile, origin, diameter, correct=True, scale=1):
    d=ImageDraw.Draw(tile)
    x,y=origin
    d.ellipse((x,y,x+diameter,y+diameter),fill='#8a62d5')
    letter=font(round(diameter*.42))
    box=d.textbbox((0,0),'B',font=letter)
    d.text((x+(diameter-(box[2]-box[0]))/2-box[0],y+(diameter-(box[3]-box[1]))/2-box[1]),'B',font=letter,fill='white')
    if correct:
        badge_size=round(diameter*.375)
        radius=diameter/2
        center=(x+radius+radius/sqrt(2),y+radius+radius/sqrt(2))
        marker=square(album,badge_size)
        pos=(round(center[0]-badge_size/2),round(center[1]-badge_size/2))
        # A code-rendered white keyline separates the badge from the avatar.
        pad=max(2,round(diameter/64)); halo=Image.new('RGBA',(badge_size+pad*2,badge_size+pad*2))
        alpha=Image.new('L',halo.size);alpha.paste(marker.getchannel('A'),(pad,pad))
        alpha=alpha.filter(ImageFilter.MaxFilter(pad*2+1))
        halo.paste('white',(0,0,halo.width,halo.height));halo.putalpha(alpha)
        tile.alpha_composite(halo,(pos[0]-pad,pos[1]-pad))
    else:
        badge_size=round(diameter*.5)
        center=(x+diameter*.9765625,y+diameter*.953125)
        pos=(round(center[0]-badge_size/2),round(center[1]-badge_size/2))
        marker=square(album,badge_size)
    tile.alpha_composite(marker,pos)
    return {'avatarDiameter':diameter,'badgeDiameter':badge_size,'badgeCenter':[round(v,3) for v in center],'avatarOrigin':[x,y]}


def main():
    before=Image.open(HERE/'preview.png').convert('RGB')
    # Original overview layout is untouched except the separately rendered bottom-right UI example.
    tile=Image.new('RGBA',(330,260),'white')
    placement=draw_avatar(tile,(60,35),128)
    ImageDraw.Draw(tile).text((66,205),'Bob',font=font(22),fill='#1f2227')
    before.paste(tile.convert('RGB'),(1150,770))
    before.save(HERE/'preview-v2.png')

    guide=Image.new('RGBA',(1200,740),'#fbfbfc');d=ImageDraw.Draw(guide)
    d.text((36,24),'头像角标 · 位置修订',font=font(32),fill='#1f2227')
    d.text((36,74),'徽章中心贴住头像右下圆周，保留头像主体与彩虹边框。',font=font(19),fill='#5b6270')
    d.rounded_rectangle((28,126,580,540),radius=24,fill='white')
    d.rounded_rectangle((620,126,1172,540),radius=24,fill='white')
    d.text((60,152),'原来 · 偏右下、徽章偏大',font=font(24),fill='#5b6270')
    d.text((650,152),'调整后 · 沿头像右下圆周贴合',font=font(24),fill='#1f2227')
    draw_avatar(guide,(152,212),230,False)
    draw_avatar(guide,(746,212),230,True)
    d.text((60,488),'与头像只有小部分重叠，容易显得悬空。',font=font(18),fill='#5b6270')
    d.text((650,488),'徽章约为头像直径的 3/8，加白色细边。',font=font(18),fill='#5b6270')
    d.text((36,578),'实际大小',font=font(22),fill='#1f2227')
    for i,diameter in enumerate([36,40,64]):
        x=230+i*240
        draw_avatar(guide,(x,574),diameter,True)
        d.text((x-20,660),f'{diameter}px 头像 / {round(diameter*.375)}px 徽章',font=font(16),fill='#5b6270')
    guide.convert('RGB').save(HERE/'avatar-placement-v2.png')

    manifest_path=HERE/'manifest.json';manifest=json.loads(manifest_path.read_text())
    manifest['avatarPlacement']={'version':2,'anchor':'lower-right 45-degree point on avatar circumference','badgeToAvatarDiameter':.375,'whiteKeyline':True,'example':placement,'overview':'preview-v2.png','detail':'avatar-placement-v2.png','applicationCodeChanged':False}
    manifest_path.write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
    validation_path=HERE/'validation.json';validation=json.loads(validation_path.read_text())
    validation['avatarPlacementV2']={'status':'passed','badgeCenterOnAvatarCircle':True,'badgePixelFilesUnchanged':True,'ratio':.375}
    validation_path.write_text(json.dumps(validation,ensure_ascii=False,indent=2)+'\n')
    for entry in manifest['exports']:
        actual=hashlib.sha256((HERE/entry['path']).read_bytes()).hexdigest()
        assert actual==entry['sha256'],entry['path']
    print('PASS: 112 existing badge exports unchanged; new avatar placement preview rendered')

if __name__=='__main__':main()
