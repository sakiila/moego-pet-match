# 开发者认证章 · 原稿裁切 PNG v1

2026-10-25 开发者彩蛋。来源：`design/concepts/report-developer-stamp-v1.png`（Codex ImageGen，请求见同目录 `-prompt.txt`，参考趣味称号章 `01-hands-off-zh`）。与 `report-title-stamps-original-v1` 同法：

- `original-crops/`：两个原始矩形区域留档，像素与原图一致。
- `transparent/`：`developer-zh.png`「开发者家的 · 认证」、`developer-en.png`「DEVELOPER'S PETS · CERTIFIED」。只改 alpha（按红色色度）去除白底，RGB 保持原值；章内浅色区域同样透明。
- `preview.png`、`manifest.json`、`extract.py`（Pillow + NumPy，可重建）。

接入：`assets/illustrations/build_web.py` 缩为宽 ≤ 300 px 的 WebP 输出到 `web/src/ui/art/stamps/developer-{zh,en}.webp`；`web/src/game/titleStamps.ts` 的 `developerStampUrl` 随界面语言选择。普通局 MVP 是 Maodu 毛肚或 Boluo 菠萝且仍上架时，小票（ScoreCard）在评语框右下、分享卡在主角图左下各盖一枚；图片缺失时不盖。只是装饰，不改称号、评语与分数。
