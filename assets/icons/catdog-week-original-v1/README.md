# 猫派 vs 狗派周素材（v1，待生成）

活动规则见 [docs/events/CAT_DOG_WEEK.md](../../../docs/events/CAT_DOG_WEEK.md)。代码已用占位图接入，替换下列母版并重新导出后立即生效，无需改代码。

## 需要的 4 个图形 → 8 个母版文件

母版目录：`assets/icons/library-original-png-v2/masters/20-catdog-week/`

| 图形 | 文件名 | 用途 | 显示尺寸 |
| --- | --- | --- | --- |
| 喵派徽记 | `faction-cat.png` | 首页拔河条两端、选边卡、报告标签、结果标题 | 18–72 px |
| 汪派徽记 | `faction-dog.png` | 同上 | 18–72 px |
| 喵派冠军徽章 | `title-meowchamp26.png`、`title-meowchamp26-avatar.png`、`title-meowchamp26-showcase.png`（同一张图存三份即可） | 称号抽屉、头像角标、名片、排行榜、结果卡 | 22–72 px |
| 汪派冠军徽章 | `title-woofchamp26.png`、`title-woofchamp26-avatar.png`、`title-woofchamp26-showcase.png`（同上） | 同上 | 22–72 px |

要求：透明背景 RGBA PNG，正方形画布（建议 1024 × 1024），主体居中、四周留约 6% 透明边，不要文字。导出脚本会按可见边界裁切再等比缩小，所以画布大小不影响布局。

## 提示词（在项目根目录执行）

```sh
codex exec -m gpt-6-sol -s workspace-write -C /Users/bob/WebstormProjects/moego-pet-match \
  "用内置 image_gen 为「猫派 vs 狗派周」活动生成 4 个图形，风格与参考图一致：MoeGo 橙白贴纸风，粗深色描边，圆润扁平，少量高光，不要文字和字母，透明背景。
1) 喵派徽记：圆形徽章，主色橙 #F96B1C，顶部一对猫耳，中央白色猫爪印，可加一撮胡须；在 18px 下也能一眼认出是猫。
2) 汪派徽记：与喵派同构图、同描边粗细，主色蓝 #4A8FE0，两侧垂耳，中央白色狗爪印，可加小骨头点缀；与喵派并排时成对。
3) 喵派冠军徽章：传奇稀有度，沿用参考图「传奇」档的彩虹描边与光泽，底座为喵派徽记元素，顶部金色小皇冠，可加两颗小星；区别于已有的「全员点名成功」徽章。
4) 汪派冠军徽章：与 3 同构图同尺寸，换成汪派元素与蓝色。
先在一张图上并排生成四个图形供对照，保存为 design/concepts/catdog-week-icons-v1.png，并把完整请求写入 design/concepts/catdog-week-icons-v1-prompt.txt。
再把四个图形分别提取为 1024×1024 透明 PNG（只去背景与等比放置，不重绘），写入 assets/icons/library-original-png-v2/masters/20-catdog-week/：faction-cat.png、faction-dog.png；喵派冠军徽章同一张图分别存为 title-meowchamp26.png、title-meowchamp26-avatar.png、title-meowchamp26-showcase.png；汪派冠军徽章存为 title-woofchamp26.png、title-woofchamp26-avatar.png、title-woofchamp26-showcase.png，覆盖现有占位图。
把原图、提取方式与每个文件的 sha256 记到 assets/icons/catdog-week-original-v1/manifest.json。
然后运行 python3 assets/icons/library-original-png-v2/export_web.py --group 20-catdog-week，确认 web/src/ui/icons/catalog.ts 只新增或更新这 8 个条目。" \
  -i design/concepts/collection-title-rarity-v5.png \
  -i assets/icons/library-original-png-v2/masters/13-collection-titles/title-cats.png \
  -i assets/icons/library-original-png-v2/masters/13-collection-titles/title-dogs.png \
  -i assets/icons/library-original-png-v2/masters/13-collection-titles/title-album.png </dev/null
```

## 替换后检查

1. `cd web && npm run dev`，打开 `/dev/gallery?c=FactionCard`、`FactionJoinSheet`、`FactionDetail`、`FactionTag`、`AchievementShelf`，在 390 × 844 下看 18 px 与 72 px 是否清楚。
2. `npm run typecheck && npm test`。
3. 提交 `masters/20-catdog-week/`、`web/src/ui/icons/png/`、`web/src/ui/icons/catalog.ts`、`design/concepts/catdog-week-icons-v1*`、本目录 manifest。
4. 选定后在 `design/DESIGN_NOTES.md`「选定展示文件」补一行。
