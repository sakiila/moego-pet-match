"""把已确认的品牌插画导出给界面用（web/src/ui/art/*.webp）。

只做裁边与等比缩小（约为显示宽度的 3 倍），不重绘。来源见同目录 README.md。
用法：python3 assets/illustrations/build_web.py（需要 Pillow）
"""
from pathlib import Path

from PIL import Image

HERE = Path(__file__).resolve().parent
OUT = HERE.parents[1] / 'web/src/ui/art'
# 源文件 → (输出名, 输出宽度 px)
ITEMS = {
    'ui/title-wordmark-zh.png': ('title-zh', 1080),
    'ui/title-wordmark-en.png': ('title-en', 1080),
    'feature-wordmarks-original-v1/transparent/smart-scheduling.png': ('smart-scheduling', 1080),
    'feature-wordmarks-original-v1/transparent/grooming-report-card.png': ('grooming-report-card', 1080),
    'feature-wordmarks-original-v1/transparent/fish-report-card.png': ('fish-report-card', 1080),
    'feature-wordmarks-original-v1/transparent/pet-collection.png': ('pet-collection', 1080),
    'ui/home-storefront.png': ('storefront', 1080),
    'ui/identity-blue-cat.png': ('blue-cat', 300),
    'brand/moego-logo.png': ('moego-logo', 420),
    # 排行榜「毛孩子光荣榜」（2026-10-24 用户确认；zh v2、en v6、麦穗与两侧贴纸，tools/remove_white.py 去底）
    'ui/hall-title-zh.png': ('hall-title-zh', 1080),
    'ui/hall-title-en.png': ('hall-title-en', 1080),
    'ui/hall-laurel-left.png': ('hall-laurel-left', 72),
    'ui/hall-laurel-right.png': ('hall-laurel-right', 72),
    'ui/hall-cat.png': ('hall-cat', 240),
    # v4 按用户标注仅平滑肚皮两处折角；区域外与 v3 一致。
    'ui/hall-dog-v4.png': ('hall-dog-v4', 240),
    # 皇冠 v2：端正、带白边（品红底出图，tools/remove_key.py 去底）
    'ui/hall-crown-v2.png': ('hall-crown', 144),
}
# 趣味称号章（assets/icons/report-title-stamps-original-v1/transparent，12 枚，中英各 6 款）
STAMPS = HERE.parent / 'icons/report-title-stamps-original-v1/transparent'
for _f in sorted(STAMPS.glob('*.png')):
    ITEMS[f'../icons/report-title-stamps-original-v1/transparent/{_f.name}'] = (f'stamps/{_f.stem}', 300)
# 开发者认证章（assets/icons/report-developer-stamp-original-v1/transparent，中英各 1 款，2026-10-25 彩蛋）
DEV_STAMPS = HERE.parent / 'icons/report-developer-stamp-original-v1/transparent'
for _f in sorted(DEV_STAMPS.glob('*.png')):
    ITEMS[f'../icons/report-developer-stamp-original-v1/transparent/{_f.name}'] = (f'stamps/{_f.stem}', 300)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for src, (name, width) in ITEMS.items():
        im = Image.open(HERE / src).convert('RGBA')
        im = im.crop(im.getbbox())
        if im.width > width:
            im = im.resize((width, round(im.height * width / im.width)), Image.Resampling.LANCZOS)
        target = OUT / f'{name}.webp'
        target.parent.mkdir(parents=True, exist_ok=True)
        im.save(target, 'WEBP', quality=90, method=6)
        print(f'{target.name} {im.width}x{im.height} {target.stat().st_size // 1024} KB')


if __name__ == '__main__':
    main()
