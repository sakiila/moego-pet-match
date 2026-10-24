# 按确认原稿拆分的透明 PNG · v2

2026-10-24 大箭头试用：按用户「箭头大一点试试」的要求，ImageGen 以 v2 母版为参考生成 [flip-card-vertical-v3](../../../design/concepts/flip-card-vertical-v3.png)，加粗橙色弧带并放大箭头尖。完整原稿留在 `source-crops/11-supplement/flip-card-vertical-v3.png`，母版位于 `masters/11-supplement/flip-card-vertical-v3.png`；通过现有导出脚本生成多尺寸 PNG，详情卡改用 `Icon name="flip-card-vertical-v3"`，仍显示为 28px。来源、裁切与像素保真记录见 [flip-card-vertical-v3.json](flip-card-vertical-v3.json)。

2026-10-24 详情卡翻面图标更新：用户确认采用 [单竖卡与绕卡箭头 v2](../../../design/concepts/flip-card-vertical-v2.png)。完整原稿留在 `source-crops/11-supplement/flip-card-vertical-v2.png`；裁除外围透明留白与极低透明度噪点（alpha ≤ 8）后，保存到 `masters/11-supplement/flip-card-vertical-v2.png`，裁切区内 RGBA 像素不变。由 `export_web.py` 等比导出 32／48／72／96／144／192／288px，通过 `Icon name="flip-card-vertical-v2"` 在详情卡正反面右下角使用。显示高度保持 28px，透明无圆底；原横向图标作为历史稿保留。裁切范围、来源哈希与像素保真记录见 [flip-card-vertical-v2.json](flip-card-vertical-v2.json)。

2026-10-24 准备页操作示意补充：用户确认 `prep-adjacent-swap-preview-v1` 与 `prep-sequential-tap-preview-v1`。`split_prep.py` 从原图提取 `masters/12-prep-gestures/prep-adjacent-swap.png` 和 `prep-sequential-tap.png`，保留橙框、灰猫、双向箭头、手指及 1／2 顺序标记；浅色棋格和白色手指内部保持不透明。出处、裁切范围、保护区域与校验见 `prep-extraction.json`。`export_web.py` 按宽图比例导出并通过 `Icon` 在普通准备页使用；说明文字仍由 i18n 渲染。原下载包为历史批次，本次没有重打包。

2026-10-23。上一套手工 SVG 重绘稿因轮廓、比例和材质偏离已确认图稿，被用户退回。本版依据用户明确选择的「**按原图拆分透明 PNG（推荐）**」，采用本地确定性拆分与去底，保留原稿，不再重绘。

[打开原稿／透明稿对照](preview.html) · [查看全套总览](overview.png) · [下载完整包](moego-original-png-v2.zip) · [来源与校验](manifest.json)

## 交付范围

已确认 10 批中的 **47 枚主图标**全部拆分；另提取原稿已有的 **白色爪印和白色保存图片**，共 **49 枚透明 PNG 母版**。每枚另提供 32／40／48／512 px 导出，共 196 张尺寸版。

| 分组 | 枚数 | 来源 |
| --- | --- | --- |
| 首页入口 | 5 | `home-entry-icons-v3.png`；含白色爪印 |
| 通用功能 | 8 | `common-function-icons-v1.png` |
| 局内操作与状态 | 6 | `round-operation-icons-v1.png` |
| 普通局／鱼关道具 | 8 | `tool-family-original-v6.png` |
| 催单反馈 | 3 | `rush-feedback-original-v1.png` |
| 结算标记 | 3 | `report-marks-original-v4.png` |
| 排行榜名次 | 3 | `leaderboard-marks-original-v1.png` |
| 图鉴收集与空态 | 3 | `collection-marks-original-v1.png` |
| 设置与声音触感 | 4 | `settings-feedback-original-v1.png` |
| 通用动作 | 6 | `common-actions-original-v3.png`；含白色保存图片 |

本版不沿用前一套 SVG 重绘，不新增无角标道具、能力角标或白色分享等原稿没有单独确认的衍生图形。所有主图标的曲线、姿态、细节和明暗直接来自上述已确认原图。

## 文件

- `masters/<group>/<id>.png`：原尺寸透明母版，与来源区域保持同一像素坐标与分辨率。
- `png/32/`、`png/40/`、`png/48/`、`png/512/`：等比尺寸导出；通常使用透明正方形画布，称号框保持长条比例。
- `source-crops/<group>/<id>.png`：去底前的原图区域，仅用于对照，不作为透明素材。
- `reference/`：十张已确认完整图稿的未修改副本。
- `extraction-plan.json`：每枚的来源区域、需排除的邻近文字、镂空种子和浅投影区域，以及本次用户授权。
- `build.py`：本地拆分、背景连通分析、边缘去底和尺寸导出流程，只依赖 Pillow 与 NumPy。
- `manifest.json`：来源哈希、文件尺寸、导出哈希、透明边界和原像素保留检查。
- `validation.json`：最终验证与浏览器对照记录。

512 px 版本仅做等比尺寸导出；原图分辨率固定，原尺寸母版保留。源像素和构图没有因放大而补画或重新生成。

## 保真与透明处理

主体不透明区域 RGB 与原图完全一致。只移除版面背景、邻近文字，并处理透明边缘的原底色；没有重新设计线条、换配色、加高光或改变姿态。浅投影转为半透明，合回原底色时保持其原有颜色。透明边缘的颜色调整只用于消除原白底／橙底，不是风格重绘。

书页、杯身、珍珠、泡沫及人物白色部位保留；杯柄和剪刀指环的空洞单独去底。小旗保留原投影，没有额外回折线；称号框保留角花且无圆戳；重试使用最后确认的圆滑版本。

原稿对照模式使用去底前区域与原尺寸透明母版，显示比例一致，便于核对轮廓和质感。独立素材模式可检查 32／40／48 px 实际导出，以及深色／橙色背景上的边缘。

## 范围与实现

用户已明确允许**本次独立素材整理直接按原图拆分 PNG**，此授权记录在计划与清单中；没有修改项目的通用工作约定，也不等于授权接入游戏。本轮未改游戏代码、玩法、宠物或单鱼源素材，未部署。

重建：在仓库根目录执行 `python3 assets/icons/library-original-png-v2/build.py`，需要 Pillow 与 NumPy，并可访问 `design/concepts/` 中的选定原稿。无需图片生成服务。
