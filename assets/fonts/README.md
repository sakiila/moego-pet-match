# 界面字体（2026-10-24）

用户要求全站改用圆润加粗的字体。手机系统没有圆润中文字体，因此自带两款开源字体的子集：

| 用途 | 字体 | 许可 | 来源 |
| --- | --- | --- | --- |
| 中文（含界面里的汉字、中文标点） | Resource Han Rounded CN v0.990，Medium / Bold / Heavy | SIL OFL 1.1（[LICENSE-ResourceHanRounded.md](LICENSE-ResourceHanRounded.md)） | github.com/CyanoHao/Resource-Han-Rounded 发布包 RHR-CN-0.990.7z |
| 英文、数字、常用符号 | Nunito（可变字重） | SIL OFL 1.1（[LICENSE-Nunito-OFL.txt](LICENSE-Nunito-OFL.txt)） | github.com/google/fonts `ofl/nunito/Nunito[wght].ttf` |

- 子集脚本：[subset.py](subset.py)。中文只收 `web/src` 与 `UI_COPY.md` 中出现的字符（约 1,070 个），每个字重约 190 KB；Nunito 只收拉丁字符与常用符号，约 37 KB。产物在 `web/src/ui/fonts/`，`chars.txt` 记录收录的字。
- 同事名、宠物名中未收录的字回退到系统字体（苹方等）。文案新增汉字后重新运行脚本。
- 原始字体文件较大（单个约 14 MB），不放进仓库；重建时按上表下载，再运行：`python3 assets/fonts/subset.py <RHR 解压目录> <Nunito[wght].ttf>`（需要 fonttools 与 brotli）。
- 字重对应：500 → Medium，700–800 → Bold，900 → Heavy。
