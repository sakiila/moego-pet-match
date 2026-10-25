# 镇店之宝「火锅搭子」· 蓝紫极光统一展示徽章 v2

2026-10-25 用户选定配色探索第 2 稿，并要求三种形态统一为展示徽章。

- 选定参考：`design/concepts/title-hotpot-electric-aurora-v1.png` 右侧展示徽章。
- 唯一透明母版：`masters/title-hotpot-showcase.png`。保留完整星芒、麦穗、两只猫与鸳鸯锅；头像、称号列表、排行榜与解锁展示统一缩放同一图案，不再分别制作标准版和头像版。
- 内置 ImageGen 根据参考整理成独立透明图，完整请求在 `source-prompt.txt`。这是参考图的透明整理结果，不是逐像素原样裁切；图稿同步留档为 `design/concepts/title-hotpot-aurora-showcase-v2.png`。
- `manifest.json` 记录尺寸、透明边界与 SHA-256；原有 v1 素材和三套配色探索均保留。
- 已在本地接入：唯一母版同步至 `../library-original-png-v2/masters/15-collection-title-showcase/title-hotpot-showcase.png`，由同库 `export_web.py` 等比导出为 32 / 48 / 72 / 96 / 144 / 192 / 288px。透明生成稿的裁切范围以 alpha > 8 的轮廓外扩 2px 计算，避免原图 alpha 1–2 噪点挤占有效图案；保留母版不变。
- `AchievementBadge` 的标准、称号签、列表与大图，以及 `AchievementAvatar` 的 22px 头像角标，对 hotpot 均经 `Icon` 引用 `title-hotpot-showcase`。旧标准 / 头像图案保留作历史来源，当前称号组件不再使用它们。mythic 标签、边框与佩戴状态统一使用蓝紫青色令牌。
- 390 × 844 中文 / 英文列表、佩戴切换、隐藏锁定、22px 头像、排行榜及 1024 × 900 玩家名片验证通过；typecheck / build 通过，构建保留大包提示。22px 主要辨认整体轮廓与配色，细节由列表和大图承载。尚未做真机、跨浏览器或真实保存验证。

重新导出时，先将本目录唯一母版复制到上述图标库路径，再在仓库根目录运行 `python3 assets/icons/library-original-png-v2/export_web.py`；旧 `hotpot-title-original-v1/extract.py` 是历史原稿提取脚本，不用于重建当前蓝紫版本。
