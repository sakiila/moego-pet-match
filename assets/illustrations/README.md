# 品牌插画与界面图案

| 文件 | 用途 | 来源 |
| --- | --- | --- |
| `ui/title-wordmark-zh.png` | 登录页、首页中文标题「毛孩子全明星」 | Codex image_gen，`design/concepts/title-wordmark-zh-v1.png`（2026-10-24 用户确认） |
| `ui/title-wordmark-en.png` | 英文标题「Pet All-Stars」 | `design/concepts/title-wordmark-en-v1.png`（同上） |
| `feature-wordmarks-original-v1/transparent/smart-scheduling.png` | 普通准备页英文文字标题 | 已确认文字标题原图裁切，`build_web.py` 输出 `smart-scheduling.webp`；棋盘页不使用此新外观 |
| `feature-wordmarks-original-v1/transparent/grooming-report-card.png` | 普通结算页标题 | 已确认文字标题原图裁切，`build_web.py` 等比导出 `grooming-report-card.webp`，通过 `BrandHeader` 使用 |
| `feature-wordmarks-original-v1/transparent/fish-report-card.png` | 鱼关结算页标题 | 已确认文字标题原图裁切，`build_web.py` 等比导出 `fish-report-card.webp`，通过 `BrandHeader` 使用；深蓝主题以报告纸色底板承托黑橙原图 |
| `feature-wordmarks-original-v1/transparent/pet-collection.png` | 图鉴页标题 | 已确认文字标题原图裁切，`build_web.py` 等比导出 `pet-collection.webp`（1080 × 208），通过 `BrandHeader` 的 collection 外观使用 |
| `ui/home-storefront.png` | 首页店面框，橱窗留空由代码叠加店长、气泡与名牌 | `design/concepts/home-storefront-v1.png`（同上） |
| `ui/identity-blue-cat.png` | 登录页选中同事时探头的蓝猫 | `design/concepts/identity-blue-cat-v1.png`（同上） |
| `ui/hall-dog-v2.png` | 排行榜右侧小狗，恢复额头、口鼻、左爪与胸腹白毛 | 2026-10-26 内置 ImageGen 修复透明区域；以 `ui/hall-dog.png` 为编辑目标、已确认的 `design/concepts/hall-of-fame-dog-v1.png` 为白毛参考；[完整请求](ui/hall-dog-v2-prompt.txt)。保留 v1 源文件，新版等比导出为 `hall-dog-v2.webp`，外部背景透明，不再对其执行白底去除 |
| `brand/moego-logo.png` | 页头官方 Logo | `design/references/moego-logo.jpg` 本地去白底，未重绘 |

`build_web.py` 裁边并缩小为界面用 WebP，输出到 `web/src/ui/art/`。
