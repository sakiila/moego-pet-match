"""把补充批效果图（supplement-marks-original-v1、collection-state-badges-v1，2026-10-24 用户确认）拆成透明母版。

与 build.py 同一原则：只去掉白色版面背景（从裁切框边缘连通的白底），不重绘；
边缘半透明像素按与白底的混合比例还原颜色。输出到 masters/11-supplement/。
"""
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image

HERE = Path(__file__).resolve().parent
CONCEPTS = HERE.parents[2] / 'design/concepts'
# 原图 → 图标 id → 裁切框（左、上、右、下），避开下方中文标签
SHEETS = {
    'supplement-marks-original-v1.png': {
        'selected-check': (270, 140, 640, 505),
        'forward-arrow': (975, 170, 1205, 480),
        'uncollected-bookmark': (1570, 150, 1895, 490),
    },
    # 我的宠物卡收集状态：绿底白勾、灰底白横杠
    'collection-state-badges-v1.png': {
        'collected-badge': (350, 166, 808, 616),
        'uncollected-badge': (966, 166, 1422, 616),
    },
}


def background(rgb: np.ndarray) -> np.ndarray:
    """从裁切框四边出发、连通的近白像素即背景。"""
    light = rgb.min(axis=2) > 225
    h, w = light.shape
    seen = np.zeros_like(light)
    q = deque((y, x) for y in range(h) for x in (0, w - 1) if light[y, x])
    q.extend((y, x) for x in range(w) for y in (0, h - 1) if light[y, x])
    for y, x in q:
        seen[y, x] = True
    while q:
        y, x = q.popleft()
        for ny, nx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
            if 0 <= ny < h and 0 <= nx < w and light[ny, nx] and not seen[ny, nx]:
                seen[ny, nx] = True
                q.append((ny, nx))
    return seen


def main() -> None:
    out = HERE / 'masters/11-supplement'
    out.mkdir(parents=True, exist_ok=True)
    for src, rois in SHEETS.items():
        sheet = np.asarray(Image.open(CONCEPTS / src).convert('RGB')).astype(float)
        for name, box in rois.items():
            split(sheet, name, box, out)


def split(sheet: np.ndarray, name: str, box: tuple[int, int, int, int], out: Path) -> None:
    l, t, r, b = box
    rgb = sheet[t:b, l:r]
    bg = background(rgb)
    # 背景透明；与背景相邻的抗锯齿像素按「离白色多远」给半透明并去掉白色混合
    alpha = np.where(bg, 0.0, 1.0)
    edge = ~bg & (np.roll(bg, 1, 0) | np.roll(bg, -1, 0) | np.roll(bg, 1, 1) | np.roll(bg, -1, 1))
    soft = np.clip((255 - rgb.min(axis=2)) / 120, 0, 1)
    alpha = np.where(edge, np.maximum(soft, 0.35), alpha)
    color = np.where(alpha[..., None] > 0, (rgb - 255 * (1 - alpha[..., None])) / np.maximum(alpha[..., None], 1e-3), 0)
    img = Image.fromarray(np.dstack([np.clip(color, 0, 255), alpha * 255]).astype(np.uint8), 'RGBA')
    img = img.crop(img.getbbox())
    img.save(out / f'{name}.png')
    print(name, img.size)


if __name__ == '__main__':
    main()
