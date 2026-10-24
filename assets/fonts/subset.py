"""把开源圆体抽成只含界面用字的 woff2，输出到 web/src/ui/fonts/。

用法（需要 fonttools 与 brotli）：
  python3 assets/fonts/subset.py <ResourceHanRoundedCN 目录> <Nunito[wght].ttf>

中文字集 = web/src 与 UI_COPY.md 里出现的全部非 ASCII 字符（界面文案、示例数据）+ 常用中文标点。
同事名、宠物名里没有收录的字由浏览器回退到系统字体。文案新增汉字后重新运行本脚本。
"""
from __future__ import annotations

import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'web/src/ui/fonts'
PUNCT = '，。、；：？！…—～·「」『』（）《》“”‘’【】〔〕％＋－×÷￥0123456789'
CJK_WEIGHTS = {'Medium': 'medium', 'Bold': 'bold', 'Heavy': 'heavy'}
# Nunito 只负责拉丁字母、数字与常用符号，其余交给中文圆体
LATIN_RANGE = 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+2000-200F,U+2030-206F,U+20AC,U+2122,U+2190-2199,U+2212,U+2215'


def ui_chars() -> str:
    files = [p for p in (ROOT / 'web/src').rglob('*') if p.suffix in {'.ts', '.tsx'} and 'ui/icons' not in str(p)]
    files.append(ROOT / 'UI_COPY.md')
    text = ''.join(p.read_text(encoding='utf-8') for p in files) + PUNCT
    return ''.join(sorted({c for c in text if ord(c) > 0x7F and not re.match(r'\s', c)}))


def run(args: list[str]) -> None:
    subprocess.run([sys.executable, '-m', 'fontTools.subset', *args], check=True)


def main() -> None:
    cjk_dir, nunito = Path(sys.argv[1]), Path(sys.argv[2])
    OUT.mkdir(parents=True, exist_ok=True)
    chars = ui_chars()
    (OUT / 'chars.txt').write_text(chars + '\n', encoding='utf-8')
    for weight, slug in CJK_WEIGHTS.items():
        run([str(cjk_dir / f'ResourceHanRoundedCN-{weight}.ttf'), f'--text={chars}', '--unicodes=U+0020-007E',
             '--layout-features=*', '--flavor=woff2', f'--output-file={OUT / f"rounded-cjk-{slug}.woff2"}'])
    run([str(nunito), f'--unicodes={LATIN_RANGE}', '--layout-features=*', '--flavor=woff2',
         f'--output-file={OUT / "nunito-latin.woff2"}'])
    for f in sorted(OUT.glob('*.woff2')):
        print(f.name, f.stat().st_size // 1024, 'KB')
    print('chars', len(chars))


if __name__ == '__main__':
    main()
