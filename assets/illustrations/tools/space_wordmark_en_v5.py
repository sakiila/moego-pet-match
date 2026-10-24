"""光荣榜英文字标 v5 / v6：在 v4 基础上只拉宽单词间距，不重画字形。

做法：按列找出有墨迹的区段，取 v4 中四个单词之间与字标、短线之间最宽的空白列作为切口，
把每个单词（及右上短线）整块平移，三处单词间距统一为 GAP 像素。所有像素原样搬移，不缩放、不重绘。
"""
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[3]
SRC = ROOT / 'design/concepts/hall-of-fame-title-en-v4.png'
import sys

# v5：GAP 64，短线距离保持原样；v6（用户觉得太长、短线太远）：GAP 46，短线贴近到 SPARK_GAP
VERSION = sys.argv[1] if len(sys.argv) > 1 else 'v6'
GAP, SPARK_GAP = {'v5': (64, None), 'v6': (46, 30)}[VERSION]
OUT = ROOT / f'design/concepts/hall-of-fame-title-en-{VERSION}.png'


def main() -> None:
    img = Image.open(SRC).convert('RGB')
    a = np.asarray(img).astype(int)
    ink = a.min(axis=2) < 200  # 非白
    cols = ink.any(axis=0)
    runs, start = [], None
    for x, c in enumerate(cols):
        if c and start is None:
            start = x
        if not c and start is not None:
            runs.append((start, x))
            start = None
    if start is not None:
        runs.append((start, len(cols)))
    # 相邻区段间空白 >= 18 px 视为单词（或短线）边界；字母内部的细缝更窄
    blocks = [list(runs[0])]
    for s, e in runs[1:]:
        if s - blocks[-1][1] >= 18:
            blocks.append([s, e])
        else:
            blocks[-1][1] = e
    print('blocks', blocks)
    assert len(blocks) == 5, '应为 Pet、Hall、of、Fame、短线 五块'
    gaps = [GAP, GAP, GAP, SPARK_GAP or blocks[4][0] - blocks[3][1]]
    margin = blocks[0][0]
    width = margin + sum(e - s for s, e in blocks) + sum(gaps) + (a.shape[1] - blocks[-1][1])
    out = Image.new('RGB', (width, a.shape[0]), (255, 255, 255))
    x = margin
    for i, (s, e) in enumerate(blocks):
        out.paste(img.crop((s, 0, e, a.shape[0])), (x, 0))
        x += e - s + (gaps[i] if i < len(gaps) else 0)
    out.save(OUT)
    print('saved', OUT.name, out.size, 'gaps before', [blocks[i + 1][0] - blocks[i][1] for i in range(4)])


if __name__ == '__main__':
    main()
