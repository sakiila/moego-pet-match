# 镇店之宝统一展示徽章 Implementation Plan

**Goal:** 将已选定的蓝紫极光展示徽章接入这枚称号的所有使用场景，并统一标签配色。

**Architecture:** 沿用当前 Icon 与 PNG 导出流程。火锅搭子的头像、称号签与大图均选择同一 showcase 素材，其他称号沿用当前映射。只更新展示素材和 mythic 令牌。

**Tech Stack:** React、TypeScript、CSS tokens、现有 Pillow PNG 导出脚本、内置浏览器。

- [x] 将唯一透明母版同步至图标库 showcase 组；导出时忽略原图轮廓外 alpha 1–2 的噪点对裁切范围的影响，保留原图可见图案。
- [x] AchievementBadge 和 AchievementAvatar 对 hotpot 统一选择 title-hotpot-showcase；mythic 令牌改为蓝紫青色，保留当前尺寸。
- [x] 在陈列页补充火锅搭子的头像、标准/签/大图和排行榜状态；验证佩戴切换、中英文、隐藏锁定与手机显示。
- [x] 运行 typecheck、build 和导出素材核验；更新素材来源、选稿记录和设计验收记录。

本轮为可逆的素材与显示调整，不新增镜像实现的单元测试；不涉及引擎或服务端规则。
