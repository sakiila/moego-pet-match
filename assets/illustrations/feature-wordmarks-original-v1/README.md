# 文字标题 PNG · 原稿裁切 v1

2026-10-24，用户确认三张文字标题预览，并要求裁切成 PNG 素材。

- [透明底与蓝底预览](preview.png)
- [完整下载包](feature-wordmarks-original-v1.zip)
- [来源、尺寸与像素校验](manifest.json)

`transparent/` 包含六枚独立 RGBA PNG：

| 文件 | 标题 |
| --- | --- |
| `smart-scheduling.png` | Smart Scheduling |
| `grooming-report-card.png` | Grooming Report Card |
| `pet-collection.png` | Pet Collection |
| `my-pets.png` | My Pets |
| `leaderboard.png` | Leaderboard |
| `fish-report-card.png` | Fish Report Card |

按已确认原图直接裁切，保持原始分辨率、字形、字距、黑橙配色、错落排版与装饰短线，四周保留约 8 px 透明安全边距；报告标题保留原稿的两行组合。没有重画或缩放母版。

移除原图白底与字母内部白色空洞，边缘做白底反混合，减少放到深色背景时的白边。主体内部的不透明 RGB 与原图一致；边缘 RGB 仅为去除原白底而调整。预览图中的缩小显示不改变透明母版。

`source-crops/` 保存去底前原尺寸裁切；`reference/` 保存三张已确认预览和完整提示词；`extract.py` 为可复现的本地裁切与校验脚本，仅依赖 Pillow 和 NumPy。目录中的 SHA-256、裁切坐标、透明边界与白底回合成误差见 `manifest.json`。

本目录保留独立素材母版。Smart Scheduling 已接入准备与游戏页；2026-10-25 Grooming Report Card 与 Fish Report Card 接入对应结算页，Pet Collection 接入图鉴页，均由 `../build_web.py` 等比导出 WebP，通过 `BrandHeader` 使用。My Pets 与 Leaderboard 字标仍未接入页面。
