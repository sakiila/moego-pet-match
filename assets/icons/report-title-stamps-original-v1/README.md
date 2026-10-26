# 趣味称号章 · 原稿裁切 PNG v1

来源：`design/concepts/report-title-stamps-bilingual-v1.png`。按用户要求直接从已确认审查稿裁切，不重新生成、不重绘、不放大、不修改文字。

- `original-crops/`：12 个原始矩形区域留档，保留纸色底；像素与原图对应区域完全一致。少数区域带相邻标题的边缘，仅用于来源对照，不作为正式素材。
- `transparent/`：12 枚透明 PNG，仅修改 alpha 去除浅色纸底与中性版面标注；所有 RGB 像素保持原值。章内浅色区域也透明，保留原稿的红色印迹、纹理、表情、文字及装饰。
- `preview.png`：透明棋盘格总览，图章按原尺寸显示。
- `manifest.json`：文件名、文案、来源坐标、尺寸、校验结果与哈希。
- `extract.py`：确定性裁切脚本，依赖 Pillow 与 NumPy。
- `report-title-stamps-original-v1.zip`：完整打包。
- `report-title-stamps-png-v1.zip`：正式使用包，仅含 12 枚透明 PNG 与来源清单。

每款含 `zh` 中文与 `en` 英文：

| 编号与文件前缀 | 中文 | English |
| --- | --- | --- |
| `01-hands-off` | 我手都松开了 | I let go. It kept going. |
| `02-all-gone` | 这下真没了 | Poof. All gone. |
| `03-got-this` | 急什么我会消 | Relax. I got this. |
| `04-tools-work-harder` | 道具比我还忙 | My tools work harder. |
| `05-almost-clocked-out` | 差点准时下班 | Almost clocked out. |
| `06-counts-as-work` | 这班没白上 | That counts as work. |

当前仅交付独立素材，不替换现有游戏图标、不修改游戏代码。去底版不反推或重算边缘颜色，优先保持原图 RGB；原样版作为逐像素原稿留档。

## 接入游戏（2026-10-24）

用户要求接入并对应游戏触发条件。`assets/illustrations/build_web.py` 把 12 枚透明 PNG 缩为 WebP（宽 ≤ 300 px）输出到 `web/src/ui/art/stamps/`；`web/src/game/titleStamps.ts` 维护称号 → 章的对应：

| 称号 key | 触发条件（优先级） | 章 |
| --- | --- | --- |
| `title.cleanup_chief` | 1 发动过吹风机／大浪花 | `02-all-gone` |
| `title.chain_lead` | 2 单次最高连消 ≥ 5 | `01-hands-off` |
| `title.scheduling_pro` | 3 催单成功 | `03-got-this` |
| `title.tool_pro` | 4 实际发动 ≥ 3 个道具 | `04-tools-work-harder` |
| `title.last_second` | 5 最后 3 秒仍有有效操作 | `05-almost-clocked-out` |
| `title.pet_officer` | 6 其他完整对局 | `06-counts-as-work` |

称号文案同步改为章上的中英文；报告页（TitleStamp）与分享卡画布共用同一枚章，随界面语言选择版本，图片缺失时退回文字小章。
