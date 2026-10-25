# 玩家点赞 · 举爪击掌原稿提取

2026-10-26 用户选定 `design/concepts/player-likes-high-five-v1.png`，明确授权按原图切图为透明 PNG，并实现永久不可取消的点赞功能。未使用重新生成或重绘结果。

- `source.png`：选定图稿的逐字节副本。
- `extract.py`：确定性裁切与去底，仅处理透明度及边缘底色混合；不透明 RGB 保留原值。
- `extraction.json`：源图 SHA256、尺寸、裁切框、输出尺寸及保留原 RGB 的像素数。
- 透明母版位于 `../library-original-png-v2/masters/17-player-likes/`；主举爪为 350 × 334，未赞举爪为 145 × 143。底部截去展示用椭圆阴影和相邻按钮，不增加腕部描边。
- 游戏导出经既有 `export_web.py` 等比缩小进入 `web/src/ui/icons/png/`，界面统一使用 `Icon`。

透明 RGB 清零，低于 8/255 的极淡透明噪点清零；肉垫、高光、毛色、描边与两笔点缀保留。文字、按钮和卡片仍由组件实现。

复现：用已安装 Pillow、NumPy 的 Python 执行本目录 `extract.py`，再执行图标库 `export_web.py`。后者可能重新压缩旧 PNG；提交时只保留新增举爪导出。
