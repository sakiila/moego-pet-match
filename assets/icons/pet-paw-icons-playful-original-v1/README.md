# 爪印簿 · 宠物小动作原稿提取

2026-10-26 用户选择本轮实际显示的第 2 套“宠物小动作”。沿用其之前明确的原图裁切、不要手绘的要求，直接从 [选定原稿](../../../design/concepts/pet-paw-icons-playful-v1.png)提取 11 枚透明 PNG，不重新生成或重绘。

## 来源与文件

- `source.png`：选定图稿的逐字节副本，1536 × 1024，SHA256 见 `extraction.json`。
- `source-crops/`：未去底的原始裁切区域。
- `extract.py`：确定性提取程序，仅处理背景透明度与边缘混色，保留蓝猫、手爪、球纹、心形及高光。
- `extraction.json`：选择编号、原图坐标、母版尺寸、每枚 SHA256 与原 RGB 保留像素数。
- `validation.json`：实际像素与导出校验。
- `preview.png`：白底 / 深色底透明检查及小尺寸预览，不作为页面素材。
- 运行母版：`../library-original-png-v2/masters/18-pet-paw-book/`；经统一 `Icon` 接入，组件名称不变。

| 图形 | 原生母版 |
| --- | --- |
| paw-cute · 蓝猫与爱心 | 280 × 253 |
| paw-pets · 摸摸蓝猫 | 261 × 240 |
| paw-play · 猫爪推球 | 254 × 237 |
| paw-love · 猫爪抱心 | 275 × 206 |
| paw-print · 实心爪印 | 132 × 112 |
| paw-replied · 回爪 | 138 × 117 |
| paw-print-muted · 次要爪印 | 137 × 114 |
| paw-selected · 选中圆勾 | 103 × 101 |
| paw-expand · 展开 | 90 × 56 |
| paw-entry-arrow · 进入 | 54 × 88 |
| paw-close · 关闭 | 77 × 77 |

共 11 枚透明母版、59 份等比网页导出，197,829 个 alpha=255 的像素 RGB 与原稿对应位置一致。白色和奶油色的前景内部保留，不将其误当背景删除；边缘去除原白底混色。网页导出只缩小、不放大，提供适合高清屏的多尺寸 srcset。

历史小切图与旧母版保存在 `../pet-paw-book-original-v1/`，没有覆盖或删除。当前只更新本组导出，其他批次原图保持不变。文字、按钮底色和布局仍为组件，不从整页切图。

## 复现

使用已安装 Pillow 与 NumPy 的 Python：

```sh
python3 assets/icons/pet-paw-icons-playful-original-v1/extract.py
python3 assets/icons/library-original-png-v2/export_web.py --group 18-pet-paw-book
```
