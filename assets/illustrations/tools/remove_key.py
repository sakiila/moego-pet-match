"""去掉纯色抠图底（默认品红 #FF00FF），用于本身带白边、不能用白底出图的贴纸。不重绘。

与画布边缘连通、接近抠图色的像素变透明；与背景相邻的边缘像素按与抠图色的距离给半透明，
并去掉抠图色混合，避免留下品红毛边。用法：python3 remove_key.py <源> <输出> [R G B]
"""
import sys
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image


def main() -> None:
    src, out = Path(sys.argv[1]), Path(sys.argv[2])
    key = np.array([float(v) for v in sys.argv[3:6]] if len(sys.argv) >= 6 else [255, 0, 255])
    rgb = np.asarray(Image.open(src).convert('RGB')).astype(float)
    dist = np.sqrt(((rgb - key) ** 2).sum(axis=2))
    near = dist < 90
    h, w = near.shape
    bg = np.zeros_like(near)
    q = deque((y, x) for y in range(h) for x in (0, w - 1) if near[y, x])
    q.extend((y, x) for x in range(w) for y in (0, h - 1) if near[y, x])
    for y, x in q:
        bg[y, x] = True
    while q:
        y, x = q.popleft()
        for ny, nx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
            if 0 <= ny < h and 0 <= nx < w and near[ny, nx] and not bg[ny, nx]:
                bg[ny, nx] = True
                q.append((ny, nx))
    alpha = np.where(bg, 0.0, 1.0)
    edge = ~bg & (np.roll(bg, 1, 0) | np.roll(bg, -1, 0) | np.roll(bg, 1, 1) | np.roll(bg, -1, 1))
    soft = np.clip((dist - 40) / 160, 0, 1)
    alpha = np.where(edge, np.maximum(soft, 0.25), alpha)
    a3 = alpha[..., None]
    color = np.where(a3 > 0, (rgb - key * (1 - a3)) / np.maximum(a3, 1e-3), 0)
    img = Image.fromarray(np.dstack([np.clip(color, 0, 255), alpha * 255]).astype(np.uint8), 'RGBA')
    img = img.crop(img.getbbox())
    out.parent.mkdir(parents=True, exist_ok=True)
    img.save(out)
    print(out.name, img.size)


if __name__ == '__main__':
    main()
