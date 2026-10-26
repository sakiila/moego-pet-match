# 游戏页确认稿组件化实施计划

> **For agentic workers:** 使用 superpowers:subagent-driven-development，按职责实现并独立复核。用户于本轮确认设计稿并要求拆分全部改动为组件元素、不得随意调整图案；连续执行，不重复询问已确认方向。

**Goal:** 将 mobile-board-frontdesk-v2、rush-frontdesk-states-v2、shift-finish-storyboard-v2 组件化接入游戏，保留确认图案及规则。

**Architecture:** 原图案拆为独立透明素材，由 Icon 统一调用；布局、数值、文案和进度用组件。复用 BrandHeader、StatusPanel、RushBar、TimeUpBanner，新增有职责边界的 RushTicket、ClosingSign 与 RoundFarewell。BoardScreen 仅组合并传 props，不写细节样式。结束仍由引擎 finished 驱动，1.2 秒收工后接原报告出纸。

**Tech Stack:** React 19、TypeScript、Vite、CSS tokens、既有 PNG 图标库、vitest。

## 确认的视觉目标

- 最新 Smart Scheduling 透明字标，时间浅橙／分数浅蓝，粗圆等宽数字。
- 原图橙色厚圈钟、橙轮廓星、夹单图案、绿色勾与灰小票；不替换成旧图标或另画近似图案。
- 加单「临时加单！」／剩余秒数／已服务 n/12／进度；删除最右侧「20 秒内服务 12 格」。
- 递入约300ms，成功/过期原位1.5秒，固定槽位不推棋盘。
- 最后连消完成后才挂收工牌，至多三只本局已服务头像轻弹；零服务只挂牌。收工1.2秒、减少动效300ms；不提前宣称保存成功。
- 390×844一屏完整，横屏及鱼关适配；不改规则、得分或后端。

## Task 1 — 源素材拆分

- [x] 对照确认稿列出并量取图案边界，使用用户本轮指定的拆分工作流保持图案原样；保存透明母版、原图坐标与处理记录。
- [x] 独立素材进入 assets/icons/library-original-png-v2/masters/16-board-frontdesk；仅等比导出到 ui/icons/png；避免重跑会删除全部 PNG 的既有导出流程。
- [x] 检查透明边缘和主体像素、输出放大预览，记录任何真实约束；无重新创作或风格变更。

## Task 2 — 标题和数据区

- [x] BrandHeader 增加明确的棋盘字标变体，复用已确认 smart-scheduling.webp，保留准备页行为。
- [x] StatusPanel 使用新拆分时钟/星标，数字用现有 Nunito variable 1000 字重、等宽，按确认稿尺寸；所有新尺寸与颜色放 tokens。
- [x] 补充陈列页中英文、长分数、倒计时、鱼关状态。

## Task 3 — 加单组件

- [x] RushBar 保留 RushView 接口与固定槽位，内部组合 RushTicket、Icon、进度条。
- [x] 分离入场、active、success、expired；成功+100只展示真实既有奖励，过期不扣分；移除目标冗余文案。
- [x] 新增 i18n 所需拆分 key，保留旧 key 兼容使用方，同步 UI_COPY。
- [x] 中英文和鱼关、隐藏/0/7/11/12进度均在陈列页验证；短屏不推棋盘。

## Task 4 — 收工分镜

- [x] ClosingSign 展示确认挂牌图案；RoundFarewell 仅展示传入的本局已服务头像，最多3只，零服务为空。
- [x] TimeUpBanner 组合挂牌和谢幕，动画完成按 MOTION 1200ms/300ms；正确处理 reduced-motion。
- [x] BoardScreen 从冻结 summary 选择头像传入；未结束连消时无覆盖，禁止新交换保持既有规则。
- [x] 对头像选择/数量/零服务与结束回调时序等真实边界加有意义的单元测试；不为纯CSS逐项写镜像测试。

## Task 5 — 集成与验收

- [x] web npm test、npm run typecheck、npm run build。
- [x] 浏览器390×844对照同一active样例与确认稿；验证设置/退出、时间到、成功/过期、英文与鱼关。最后连消由既有engine/game-layer测试覆盖；减少动效已复核静态CSS与300ms路径，未实际切换系统设置。
- [x] 陈列页逐个状态截图；源图与渲染结果并排比较，修复P0/P1/P2差异。
- [x] 更新 design-qa.md、DESIGN_NOTES、设计审查记录，保存素材来源和实施验收；不提交、推送或部署。

