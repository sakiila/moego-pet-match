# 收集称号徽章 · 已确认原稿透明 PNG

2026-10-24 用户确认 `design/concepts/collection-title-badges-v3.png`，并明确授权从该图直接切成 PNG 后集成。本组作为既有图标库的新增批次，界面统一通过 `Icon` 使用。

- `masters/`：7 枚原尺寸透明母版。保留颜色、角色、表情与比例，不重新绘制。
- 同步母版：`../library-original-png-v2/masters/13-collection-titles/`，已登记到统一 `export_web.py` 的额外分组，重新导出旧图标库不会丢失本组。
- 游戏导出：`web/src/ui/icons/png/title-{cats,dogs,friends,species,neighbors,family,album}@{32,48,72,96,144,192,288}.png`。等比缩放、透明正方形画布，不包含原稿中文字；称号文字由 i18n 排版。
- `preview.png`：深浅背景检查；`manifest.json`：原稿 SHA-256、裁切坐标、母版尺寸及哈希。
- 未解锁状态由同一图片灰显；已佩戴标记由组件单独显示，不改变徽章原图。

`extract.py` 先按明确坐标切出徽章，闭合分隔白线与外框的细小通道以保留白脸和米白纸面，再仅移除与裁切边缘连通的近白背景；边缘作去白底处理。主体不透明 RGB 保留原稿，未使用 ImageGen 重绘或 SVG 替代。

使用项目可用的 Pillow + NumPy 运行 `extract.py` 可重建本组。288px 等尺寸为原稿的等比导出，不代表新增绘画细节。
