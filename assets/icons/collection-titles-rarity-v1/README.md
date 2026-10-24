# 收集称号 · 稀有度 PNG 组件 v1

2026-10-24。基于用户最后确认的 `design/concepts/collection-title-rarity-v1.png` 直接提取，保留图案、表情、颜色与稀有度边框，不重绘。头像版与「我的称号」抽屉已在本地接入，具体范围见末尾记录。

## 文件与用途

- `masters/showcase/`：7 枚原尺寸、透明 RGBA PNG。保留紫色与彩虹款完整外围星芒，适合名片、成就揭晓与大图展示。
- `masters/avatar/`：7 枚原尺寸、透明 RGBA PNG。只移除与主体分离的星芒，边框与主体不变，适合头像角标和小徽章。
- `png/showcase/`、`png/avatar/`：两类各 7 枚 × 8 尺寸，共 112 张透明正方形 PNG。
- 导出尺寸：32、48、64、96、128、192、256、512 px，均等比缩放与居中。512 px 为原稿的等比放大，不新增绘画细节；原尺寸母版不放大。
- `preview-v2.png`：最新全套预览，头像角标位置已修订；`preview.png` 保留初版对照。
- `avatar-placement-v2.png`：头像角标位置修订对比，以及 36/40/64px 头像的实际大小示例。
- `manifest.json`：来源 SHA-256、逐枚裁切坐标、可见区域、尺寸、稀有度与文件哈希。
- `validation.json`：PNG 解码、尺寸、透明四角、原稿不透明 RGB 保真检查及目视验收记录。
- `reference/`：已确认的原稿与原始生成请求；`source-crops/`：去底前裁切区域，供溯源使用。
- `extract.py`：可复现的本地提取脚本，仅在本包目录输出，不修改应用与旧素材。

## 七枚映射

| 文件 id | 称号 | 稀有度 | 边框 |
| --- | --- | --- | --- |
| title-cats | 猫猫亲友团 | 普通 common | 橙色 |
| title-dogs | 汪汪好朋友 | 普通 common | 橙色 |
| title-friends | 毛孩子熟人 | 普通 common | 橙色 |
| title-neighbors | 串门小能手 | 稀有 rare | 蓝色 |
| title-family | 一家都熟 | 稀有 rare | 蓝色 |
| title-species | 跨物种交友家 | 史诗 epic | 紫色双线 |
| title-album | 全员点名成功 | 传说 legendary | 彩虹色 |

稀有度表示先前确认的解锁难度设计，不表示实际拥有比例，不改变成就门槛。称号文字和进度不烘焙进 PNG，保持中英文可排版；横向称号签的边框、底色与文字继续由界面实现。未解锁状态继续使用同一 PNG 的灰显，避免另存一套不一致的图案。

## 处理与验证

移除与裁切框边缘连通的近白版面背景，保留角色白脸、象牙底和镂空。普通款仅对提取蒙版闭合细白通道；清除跨越裁切框的邻近标题签碎片。边缘去白底，主体不透明 RGB 与来源最大差异不超过 1/255。头像版仅保留主体的连通区域，不重画、不改形、不删内层图案。

建议选择：28px 头像角标使用 `avatar` 96px 文件（覆盖约 3 倍密度）；48px 图案使用 144px 或 192px；72px 展示使用 `showcase` 256px。保持原比例，避免非等比拉伸。

已逐枚检查浅底与深底预览，确认角色白色部位、紫色双线、彩虹边框与透明外缘。小尺寸预览来自实际 PNG 缩放，不是重新生成的尺寸示意。

## 头像角标位置修订 v2

角标中心锚定在头像右下 45° 的圆周上，而非贴在外接方框的最右下角。徽章直径约为头像直径的 3/8，并加白色细描边，使其和头像清楚分离。原有 112 张徽章导出像素未改变；本次只重排组合示例，不修改应用代码。

重建素材后运行 `preview_avatar_v2.py`，生成最新预览和位置对照。最新版下载包为 `collection-titles-rarity-v2-png.zip`，初版包保留。

## 已选定的头像尺寸 C（2026-10-24）

用户从 `avatar-badge-sizes-v1.png` 中选择 C：头像 40px，徽章正方形容器 22px（55%）。此选择替代上文位置修订 v2 的临时 3/8 比例；右下 45° 圆周锚点保留。

头像版母版原样同步至 `../library-original-png-v2/masters/14-collection-title-avatars/`，通过同库 `export_web.py` 导出到 `web/src/ui/icons/`，使用独立的 `title-<id>-avatar` 名称。游戏的右上角身份头像、排行榜列表和领奖台现通过 `AchievementAvatar` 与 `Icon` 使用这七张稀有度图片，姓名下不再重复展示称号。解锁规则未改；仅本地实现，未部署。

## 我的称号抽屉与菜单图标（2026-10-24）

展示版原样同步至 `../library-original-png-v2/masters/15-collection-title-showcase/`，以 `title-<id>-showcase` 名称通过 `Icon` 使用；抽屉的徽章保留完整星芒。`AchievementBadge` 的 `rarity` 外观只在抽屉启用，报告与既有大图展示保留原素材。

普通、稀有、史诗分别使用橙、蓝、紫色标签与卡片边框；传说为彩虹边框。佩戴中与佩戴按钮固定同列，未解锁沿用灰显图案与进度。`game/achievementRarity.ts` 只描述展示级别，不改变服务端解锁门槛。

菜单图标初版被用户否决。v2 使用 [Lucide award](https://lucide.dev/icons/award) 与 [log-out](https://lucide.dev/icons/log-out) 的原始 SVG 几何；24×24 画布、统一 2px 描边、圆角端点、无填色，菜单显示 20px，抽屉标题为 24px。通过统一 `Icon` 使用，源文件为 `web/src/ui/icons/MenuGlyph.tsx`，保留 `web/src/ui/icons/LUCIDE_LICENSE`。设计依据为 [Atlassian iconography](https://atlassian.design/guidelines/product/foundations/iconography) 的简洁、通用隐喻和避免透视原则，以及 [Lucide specification](https://lucide.dev/contribute/icons/specification) 的线宽、留白和视觉重量规范。

## 菜单图标最终选择（2026-10-24）

用户选择第 2 稿 `design/concepts/menu-icons-medal-closing-sign-v1.png`。菜单使用星星奖章和月亮挂牌，均显示 24px；`MenuGlyph.tsx` 以原生 SVG 实现圆形奖章、缎带、挂牌和月亮，颜色引用 tokens，渐变 ID 用 React useId 隔离。SVG 实现遵循 AGENTS.md 的界面元素规则，未将整张或局部效果图作为组件图片。菜单回调与称号解锁规则未改。上文 Lucide 单色方案已经被否决。
