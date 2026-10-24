"""把 Codex 白底出图去底成透明 PNG（不重绘）。

从画布四边出发、连通的近白像素视为背景并透明；与背景相邻的抗锯齿像素按离白色的程度给半透明，
并去掉白色混合。主体内部的白色（眼白、毛色、肚皮）因不与外框连通而保留。
用法：python3 remove_white.py <源 png> <输出 png> [--split]   --split：按中间空白列拆成左右两张（麦穗）
"""
import sys
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image


def background(rgb: np.ndarray) -> np.ndarray:
    light = rgb.min(axis=2) > 232
    h, w = light.shape
    seen = np.zeros_like(light)
    q = deque()
    for y in range(h):
        for x in (0, w - 1):
            if light[y, x]:
                seen[y, x] = True
                q.append((y, x))
    for x in range(w):
        for y in (0, h - 1):
            if light[y, x] and not seen[y, x]:
                seen[y, x] = True
                q.append((y, x))
    while q:
        y, x = q.popleft()
        for ny, nx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
            if 0 <= ny < h and 0 <= nx < w and light[ny, nx] and not seen[ny, nx]:
                seen[ny, nx] = True
                q.append((ny, nx))
    return seen


def cut(rgb: np.ndarray) -> Image.Image:
    rgb = rgb.astype(float)
    bg = background(rgb)
    alpha = np.where(bg, 0.0, 1.0)
    edge = ~bg & (np.roll(bg, 1, 0) | np.roll(bg, -1, 0) | np.roll(bg, 1, 1) | np.roll(bg, -1, 1))
    soft = np.clip((255 - rgb.min(axis=2)) / 110, 0, 1)
    alpha = np.where(edge, np.maximum(soft, 0.3), alpha)
    color = np.where(alpha[..., None] > 0, (rgb - 255 * (1 - alpha[..., None])) / np.maximum(alpha[..., None], 1e-3), 0)
    img = Image.fromarray(np.dstack([np.clip(color, 0, 255), alpha * 255]).astype(np.uint8), 'RGBA')
    return img.crop(img.getbbox())


def main() -> None:
    src, out = Path(sys.argv[1]), Path(sys.argv[2])
    rgb = np.asarray(Image.open(src).convert('RGB'))
    out.parent.mkdir(parents=True, exist_ok=True)
    if '--split' in sys.argv:
        ink = (rgb.min(axis=2) < 232).any(axis=0)
        xs = np.nonzero(ink)[0]
        empty = [x for x in range(xs.min(), xs.max()) if not ink[x]]
        mid = empty[len(empty) // 2]
        for side, part in (('left', rgb[:, :mid]), ('right', rgb[:, mid:])):
            img = cut(part)
            img.save(out.with_name(f'{out.stem}-{side}{out.suffix}'))
            print(side, img.size)
    else:
        img = cut(rgb)
        img.save(out)
        print(out.name, img.size)


if __name__ == '__main__':
    main()
