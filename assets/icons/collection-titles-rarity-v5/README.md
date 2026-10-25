# 收集称号稀有度 v5 · 已接入

选定稿：`design/concepts/collection-title-rarity-v5.png`。仅更新展示，不改变成就 ID、门槛、收集进度或服务器逻辑。

| 分组 id | 中文 | English | 配色 |
| --- | --- | --- | --- |
| common | 闪耀 | Radiant | 蜜桃橙到珊瑚红 |
| rare | 卓越 | Outstanding | 薰衣草紫到电紫 |
| epic | 非凡 | Extraordinary | 香槟金到玫瑰金 |
| legendary | 传奇 | Legendary | 彩虹 |

猫、狗和爪印属于闪耀；串门和多宠家庭属于卓越；跨物种属于非凡；全图鉴属于传奇。

## 素材来源与处理

- 内置 ImageGen 以已确认 v5 配色稿、v1 七枚完整图案为参考，生成一个透明七徽章图集 `source-atlas.png`，实际尺寸 1536 × 1024。完整请求在 `source-prompt.txt`，没有直接把页面或 UI 卡片截图用作组件。
- `prepare.py` 按 alpha 连通区域切出七个主体，避免跨格裁切。头像版移除分离的小星芒，展示版保留非凡和传奇的小装饰；不改变该透明图集可见像素的 RGBA。图集根据参考图生成，并非对旧 PNG 逐像素原样换色。
- 原始的 v1 素材与旧下载包保留。此目录提供 `masters/avatar/`、`masters/showcase/` 共 14 张母版，以及 `preview.png` 和逐文件 SHA-256 的 `manifest.json`。
- 同步到原图标库 `masters/14-collection-title-avatars/` 和 `masters/15-collection-title-showcase/`。运行同库 `export_web.py` 等比导出到 `web/src/ui/icons/`，界面统一通过 Icon 使用。
- 七枚各两种外观，每种导出 32、48、72、96、144、192、288px，共 98 张。源图主体宽约 350px，常用显示尺寸无额外放大。

## 界面范围

头像角标保持 40px 头像 / 22px 徽章与既定右下圆周锚点。抽屉徽章显示 56px，中文等级标签位于独立列；英文和窄屏将等级标签放在姓名上方，留出长文本空间。2026-10-25 用户确认将传奇标签更新为与外框呼应的彩虹渐变底与深色字，选定稿为 `design/concepts/legendary-rainbow-label-v1.png`；标签仍由 CSS tokens 实现，徽章 PNG 保持原样。

AchievementBadge 默认采用新版展示素材，因此原有排行榜称号详情和新解锁徽章也同步使用本套图片。旧版素材仍可由 `rarity={false}` 显式查看。锁定继续灰显，进度与佩戴回调沿用现有实现。

## 重建

在仓库根目录使用包含 Pillow / numpy 的 Python 执行：

```sh
python3 assets/icons/collection-titles-rarity-v5/prepare.py
python3 assets/icons/library-original-png-v2/export_web.py
```

本地验证使用 `/dev/gallery?c=AchievementShelf`、`AchievementAvatar` 和 `LeaderboardScreen` 陈列项。未部署。
