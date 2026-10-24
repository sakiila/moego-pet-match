"""Size selection sheet only; does not change badge artwork or application code."""
from pathlib import Path
from math import sqrt
import importlib.util
import base64
from PIL import Image, ImageDraw, ImageFilter

HERE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location('rarity_assets', HERE / 'extract.py')
assets = importlib.util.module_from_spec(spec)
spec.loader.exec_module(assets)
font = assets.font
badge = Image.open(HERE / 'masters/avatar/title-album.png').convert('RGBA')

def avatar(target, x, y, a, b, scale=1):
    a, b = round(a*scale), round(b*scale)
    d = ImageDraw.Draw(target)
    d.ellipse((x,y,x+a,y+a), fill='#8a62d5')
    f = font(round(a*.42))
    box = d.textbbox((0,0),'B',font=f)
    d.text((x+(a-box[2]+box[0])/2-box[0],y+(a-box[3]+box[1])/2-box[1]),'B',font=f,fill='white')
    marker = Image.new('RGBA',(b,b))
    item = badge.copy(); item.thumbnail((b,b),Image.Resampling.LANCZOS)
    marker.alpha_composite(item,((b-item.width)//2,(b-item.height)//2))
    center = (x+a/2+a/2/sqrt(2),y+a/2+a/2/sqrt(2))
    pos = (round(center[0]-b/2),round(center[1]-b/2))
    pad = max(1,round(scale))
    alpha=Image.new('L',(b+2*pad,b+2*pad));alpha.paste(marker.getchannel('A'),(pad,pad))
    alpha=alpha.filter(ImageFilter.MaxFilter(pad*2+1))
    halo=Image.new('RGBA',alpha.size,'white');halo.putalpha(alpha)
    target.alpha_composite(halo,(pos[0]-pad,pos[1]-pad));target.alpha_composite(marker,pos)

sheet=Image.new('RGBA',(1440,1180),'#f6f4fa');d=ImageDraw.Draw(sheet)
d.text((54,38),'头像徽章 · 大小由你定',font=font(38),fill='#262032')
d.text((56,96),'固定 40px 头像与右下圆周位置，只改变徽章尺寸。数值指徽章正方形容器的边长。',font=font(20),fill='#746b80')
sizes=[14,18,22,26,30,34]
for i,b in enumerate(sizes):
    col,row=i%3,i//3;x=40+col*460;y=154+row*440
    d.rounded_rectangle((x,y,x+440,y+418),radius=22,fill='white')
    d.text((x+26,y+22),f'{chr(65+i)}  /  {b}px',font=font(29),fill='#262032')
    d.text((x+26,y+66),f'头像直径的 {round(b/40*100)}%',font=font(18),fill='#746b80')
    avatar(sheet,x+126,y+116,40,b,4)
    d.text((x+26,y+292),'放大 4 倍',font=font(16),fill='#746b80')
    d.line((x+26,y+326,x+414,y+326),fill='#efebf3',width=2)
    avatar(sheet,x+28,y+348,40,b)
    d.text((x+106,y+358),'实际尺寸 · 40px 头像',font=font(18),fill='#746b80')
d.text((56,1074),'请选择 A–F，或直接指定「头像 __ px / 徽章 __ px」。',font=font(24),fill='#262032')
d.text((56,1120),'本图仅用于尺寸选择，不代表最终选定；徽章原稿与应用代码均未修改。',font=font(18),fill='#746b80')
out=HERE/'avatar-badge-sizes-v1.png';sheet.convert('RGB').save(out)
fragment=Path('/Users/bob/.codex/visualizations/2026/10/24/01a16d49-e183-7603-a649-8f1e592e3408/avatar-badge-size.html')
data=base64.b64encode((HERE/'masters/avatar/title-album.png').read_bytes()).decode()
text=fragment.read_text();fragment.write_text(text.replace('__BADGE_DATA__','data:image/png;base64,'+data))
print(f'{out}: {sheet.size}')
print(f'Interactive preview: {fragment.stat().st_size} bytes')
