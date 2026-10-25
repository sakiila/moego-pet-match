# 隐藏称号「火锅搭子」徽章 · 原稿透明 PNG v1

2026-10-25 开发者彩蛋。来源：`design/concepts/title-hotpot-badge-v1.png`（Codex ImageGen，请求见同目录 `-prompt.txt`，参考已确认的 title-album 三枚母版）。做法与 `collection-titles-original-v1` 相同：按像素包围盒切出，闭合白线细缝后只移除与裁切边缘连通的近白背景，不重绘、不放大。

- `masters/`：三枚原尺寸透明母版 `title-hotpot`（标准）、`title-hotpot-avatar`（头像小章）、`title-hotpot-showcase`（带星与麦穗的展示版）。
- 同步母版：`../library-original-png-v2/masters/13-collection-titles`、`14-collection-title-avatars`、`15-collection-title-showcase`，由统一的 `export_web.py` 等比导出到 `web/src/ui/icons/png/title-hotpot*@{32…288}.png` 并登记 `catalog.ts`；界面经 `ui/primitives/Icon` 使用。
- `preview.png`：深浅背景检查；`manifest.json`：原稿 SHA-256、裁切坐标、母版尺寸及哈希。
- `extract.py`：确定性脚本（Pillow + NumPy），可重建本组。

稀有度为新增最高一档「镇店 / House Special」（`--achievement-mythic-*`）。解锁条件：同一局里 Maodu 毛肚与 Boluo 菠萝都至少服务一次；解锁前不展示。见 GAME_FLOW「永久收集成就与佩戴称号」。
