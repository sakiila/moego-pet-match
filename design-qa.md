# 普通准备页候选稿实现验收 · 2026-10-24

final result: passed

## 图标视觉大小校准

- 用户要求两枚操作图标视觉大小一致。移除相同高度容器对第二枚图标的缩小限制，统一显示宽度，保留原图比例：标准状态均为 100px 宽，小高度均为 88px 宽。
- 两枚图标的棋格／猫头主体尺度一致；第二枚的手指与顺序标记自然向上下延展，没有拉伸或裁掉动作细节。已删除不再使用的固定高度令牌。
- 同框前后对照：`/tmp/moego-prep-icon-size-qa/comparison.png`；最终规则区：同目录 `rules-after.png`。DOM 记录：`after-zh-boxes.json`。
- 中英文标准状态均保持 390 × 844，小高度保持 390 × 667，无横向溢出；「也来啦」仍最多一行，底部按钮未修改。控制台无 error/warn，build（含 typecheck）通过。纯尺寸调整未新增或重复单元测试。

## 本轮补充：确认的操作图标与单行提示

- 新视觉基准：`design/concepts/prep-adjacent-swap-preview-v1.png` 与 `prep-sequential-tap-preview-v1.png`（各 1774 × 887）。按已确认原图提取透明图标，经 `Icon` 使用；说明文本为灰色圆润重体，仍由 i18n 渲染。保留第二枚图标的手指及 1／2 顺序标记。
- 图标母版：`assets/icons/library-original-png-v2/masters/12-prep-gestures/`；来源、裁切坐标、浅色棋格保护区与原像素校验见同库 `prep-extraction.json`。所有旧 PNG 导出（356 个）重导出后哈希不变。
- `OwnPetBanner` 最多一个段落、最多一行。只提示传入阵容中的首只自家宠物；长名字末尾省略，后缀不截断，完整名字在 title 与可访问文本中保留；没有自家宠物时不显示。
- 最新同框比较：`/tmp/moego-prep-gestures-qa/comparison-rules.png`。最新手机标准图：同目录 `final-zh-0.png`、`final-en-0.png`；长名字与多个自家宠物：`final-zh-2.png`；小高度：`final-small-zh-0.png`、`final-small-en-0.png`。这些是实际浏览器截图按实测 DOM 坐标裁出的内容区。
- 中英文标准状态：内容区实测均为 390 × 844；小高度均为 390 × 667，无横向溢出。所有陈列状态 bannerCount ≤ 1；加载／失败时开始按钮仍禁用。超长阵容名字本身会使页面纵向展开，但「也来啦」始终一行。
- 迭代：首版标准状态多出约 7px，小高度多出约 4px；分别收紧规则面板内边距和小高度提示条垂直内边距后复测通过。图标、文字、间距、颜色令牌、文案和长名字均已查看。
- 当前工作区 typecheck、151 项测试、build 通过；最终 CSS 调整后重新通过 typecheck／build。刷新后的陈列页无新增 error／warn。底部开始按钮及游戏规则未修改。
- 本节的单行规则取代下文早期版本「可显示多个自家宠物提示」的行为；其余旧检查作为实施过程记录保留。

## 范围与视觉基准

- 用户授权：普通开局准备页参考候选稿调整，最下方「开始这班」按钮保留现有外观与行为。
- 源图：`design/concepts/page-prep-polish-v1.png`，853 × 1844。
- 标准内容视口：390 × 844；源图缩放至同尺寸，仅供比较，未将图稿切成界面背景。
- 实现：`http://localhost:5180/` → 开始营业；陈列页 `http://localhost:5180/dev/gallery?c=PrepScreen`。
- 标准对比状态：Deedee、Maodu、Boluo、Momo、Marley、Koa，Maodu 为自家宠物，中文。这是开发陈列数据，不影响实际随机阵容。
- 浏览器：Codex 内置浏览器，通过 CUA 的浏览器接口验收；没有使用外部 Playwright 进程。

## 截图证据

- 全屏同尺寸对照：`/tmp/moego-prep-qa-20261024/comparison-final.png`。
- 阵容局部对照：`/tmp/moego-prep-qa-20261024/comparison-roster.png`。
- 中文／英文最终图：`/tmp/moego-prep-qa-20261024/final-zh-0.png`、`final-en-0.png`。
- 390 × 667：`/tmp/moego-prep-qa-20261024/final-small-0.png`。
- 加载／失败／长名字／鱼关：同目录 `final-zh-2.png` 至 `final-zh-5.png`，对应全部状态的原浏览器截图和 DOM 尺寸记录为 `final-zh-full.png`、`final-zh-boxes.json`。
- 实际进入准备页与进入棋盘：同目录 `live-final.png`、`started-board.png`。

陈列页浏览器宽度为 656px，使用 full frame 后，DOM 实测每个准备页内容区宽度严格为 390px，标准状态高度为 844px；截图从原浏览器整页截图中按 DOM 坐标裁出，没有重排或补画页面。

## 对比迭代

1. 首版在全屏对照中发现头像偏小、规则区占高、夹子孔被全局 border-box 压没（P2）。修复：阵容使用不带第二层棋格的 portrait 模式、扩大真实贴纸、夹子使用 content-box、收紧规则区。
2. 英文带自家宠物提示时页面高 858px（P2）。修复：英文阵容标题用适合长度的字号，90 秒提示局部减少内边距与数字字号；重新捕获，中文和英文标准状态均为 390 × 844。
3. 390 × 667 带自家宠物提示时高 705px（P2）。修复：仅小高度视口缩小头像和装饰、收紧规则间距及时间提示；重新捕获，标准状态为 390 × 667，按钮完整。
4. 最终查看同框全屏和阵容局部比较，没有剩余需要修复的 P0／P1／P2 问题。长名字与两个自家宠物同时出现的极端状态主动纵向展开，文本完整，无横向溢出；该状态允许滚动，不将完整姓名截成省略号。

## 五项视觉核验

| 项目 | 结论 |
| --- | --- |
| 字体与文案 | 使用已确认 Smart Scheduling 文字 PNG 的 WebP 导出；中文标题使用现有圆润重体；所有功能文案来自 i18n；宠物名字保持原文。英文与长名字单独检查。 |
| 布局与留白 | 三列两行阵容、夹板标识、自家宠物提示、两行操作示意和独立时间提示均已还原；普通标准状态和小高度标准状态按钮均完整。 |
| 颜色与令牌 | 继续用现有品牌色和六种棋盘浅底色；新增的尺寸与投影放在 tokens；没有修改六色映射。原候选图的饱和度和手绘笔触与真实原素材存在轻微差异，为保留现有素材的预期差异。 |
| 图片与图标 | 真实宠物源贴纸复用；仅在准备页使用 portrait 外观，不改变棋盘 PetTile 默认外观。操作图标沿用已确认 Icon 库；没有从整张候选图裁界面素材。 |
| 内容与状态 | 阵容来自 props；只有实际入选的自家宠物显示提示；加载／失败时开始按钮继续禁用，失败保留重试；准备阶段不计时，点击才进入棋盘。 |

## 按钮不变的证据

- `PrepScreen.tsx` 从 `<Button size="lg"...>` 至文件末尾与本轮修改前保存的源码逐字比较一致。
- 标准手机实页 DOM 实测按钮 x=16、y=768、width=358、height=64、bottom=832，与修改前实页一致。
- 未修改 `Button.tsx`、`Button.module.css` 或 `onStart` 流程。

## 功能与运行检查

| 检查 | 结果 |
| --- | --- |
| 页面身份与非空 | 正确显示 MoeGo、Smart Scheduling、六宠阵容与开始按钮，无框架覆盖层 |
| 主路径 | 首页 → 开始营业 → 准备 → 开始这班 → 棋盘，观察到 90 秒起始计时；测试局随后自然结束 |
| 中文／英文 | 标准状态均为 390 × 844，没有横向溢出 |
| 小高度 | 中文和英文标准状态 390 × 667；对照截图保存中文状态 |
| 陈列状态 | 有／无自家宠物、长名字、多个自家宠物、加载、失败与鱼关均查看，加载和失败的开始按钮禁用 |
| 控制台 | 完整刷新后的手机主路径采样无新增 error/warn；修改 i18n 期间开发热更新曾出现 useI18n provider 临时错误，完整刷新后恢复。没有为此修改全局上下文或扩大本轮范围 |
| 类型／单元测试／构建 | typecheck 通过；当前工作区 151 项测试通过；最终 CSS 后 build 再次通过。Vite 原有大 chunk 警告仍在 |

## 保留差异和边界

- 底部按钮按用户要求保留旧版，不追随候选图的大小、位置和装饰短线。
- 使用当前原素材和已确认操作图标，宠物姿态、图标内部细节与生成稿略有差异；不重绘真实宠物。
- 极端长名字／多个自家宠物状态可纵向滚动；不以截断姓名换取强制一屏。
- 宽屏补查受开发热更新导致的页面回到首页影响，保存的 `desktop-final.png` 是错误状态，已拒绝为准备页验收证据；不声称完成宽屏视觉验收。手机与陈列页的明确同尺寸截图是本次交付依据。
- 未做真机、完整读屏、跨浏览器或生产验收；没有提交、推送或部署。

## 实现清单

- 已完成：准备页文字标题、夹板阵容、头像放大、完整名字、自家宠物提示、规则和时间提示、小高度适配、陈列状态登记、底部按钮保留。
- 没有需要继续修复的本轮阻断项；后续若要求严格覆盖所有极端长内容的一屏显示，需要另行选择压缩信息或允许滚动的交互取舍。

## 2026-10-24 · 菜单图标第 2 稿接入

- source visual truth: `design/concepts/menu-icons-medal-closing-sign-v1.png`（1448 × 1086）；用户选择展示顺序第 2 张。
- implementation: `web/src/ui/icons/MenuGlyph.tsx`，统一通过 Icon；星星奖章与月亮挂牌均为 24px。菜单、称号解锁与佩戴回调不变。
- 实现约束：按 AGENTS.md 的界面元素规则使用原生 SVG，保留选定轮廓、橙白色块与炭黑描边，未把设计稿截图切成组件。原图的大幅展示光泽与微小材质细节不作为 24px 图标的逐像素目标。
- 实现截图：`/Users/bob/.codex/visualizations/2026/10/24/01a16d49-e183-7603-a649-8f1e592e3408/menu-option-2-qa/menu-component-zh.png`（390px 组件）；同目录 `menu-component-en-320.png`（320px 组件）。在同次图像输入中同时查看已选图与中文组件截图，按菜单区域与图标轮廓对照，不比较展示板整体尺寸。
- 字体与文案：沿用游戏原字体与 i18n；中文、英文菜单均可读，无新增文字。
- 布局与颜色：菜单固定图标列宽 24px；橙色、奶白、描边和浅色渐变均引用 tokens，中文与英文未遮挡。
- 素材清晰度：SVG 不依赖位图缩放；多实例使用 useId 隔离渐变，保留透明外缘。
- 交互验证：在 `/dev/gallery?c=PlayerMenu` 的 noop 预览中验证「我的称号」点击收起菜单与头像按钮重新打开。未调用 Clock Out 或修改真实身份。
- 自动审批边界：真实首页的 Clock In as Bob 被自动审批拒绝，理由为可能保存身份状态。本轮改用无身份切换的组件陈列页完成视觉验证，不声称验证了登录后首页与真实账号操作。
- 编译验证：`npm --prefix web run build` 退出码 0（含 TypeScript 构建）；保留既有的大包体积提示。浏览器控制台无相关错误。
- Findings：没有本次图标范围内需要修复的 P0/P1/P2。P3：源稿的大幅材质高光与原生 SVG 的细节存在预期差异。
- final result: passed

## 2026-10-25 · 排行榜玩家名片补接

- 根因：`player-profile-card-v4.png` 先前仅为设计稿。LeaderboardRow 是没有点击回调的 div，LeaderboardScreen 没有名片状态与资料加载，Podium 仅能打开称号详情；不存在玩家名片接口。
- Source visual truth: `design/concepts/player-profile-card-v4.png`，1189 × 1323 双栏稿。采用右侧头像/姓名/称号、三项统计、已解锁徽章和最近五局的结构；徽章沿用最终 v5。
- 实现：新增 PlayerProfileCard、PlayerProfileOverlay 与只读 `GET /api/players/:id/profile?mode=normal|fish`。列表整行变为原生按钮，领奖台有不嵌套交互元素的透明点击入口。关闭恢复原按钮焦点，旧异步请求通过 AbortSignal 丢弃。
- 真实数据证据：`/Users/bob/.codex/visualizations/2026/10/24/01a16d49-e183-7603-a649-8f1e592e3408/player-profile-qa/alice-live-profile.png`（388 × 701 CSS px 名片裁图）。从 `/dev/gallery?c=LeaderboardScreen` 的 `local API · click player` 场景点击 Alice 列表行及领奖台，均请求真实本地接口，显示最高分 13,770、收集 13/80、已完成 2 局、5/7 徽章及两条真实结算记录。此预览使用明确的测试身份 props 作为榜单查看上下文，不保存或切换浏览器身份。
- 视觉：原图双栏板只对照名片区域，实际数据与设计稿示例数值不同；未用假记录补齐五行。圆体、颜色、间距和阴影沿用 tokens。姓名下仅在名片详情保留称号签，榜单列表不重复显示。
- 状态：空记录、加载、失败重试、离册身份、全部徽章、鱼关、长英文名与大分数均登记到陈列页。英文窄屏 320px 场景中名片内容区 254px，scrollWidth 254、无横向溢出；鱼关表格不显示宠物新增列。
- 交互：列表行打开、关闭后切换总榜、领奖台打开、Escape 关闭均已验证；关闭后 activeElement 的 aria-label 回到对应玩家入口。名片只读，不触发对方佩戴、身份登记或成就补发。
- 后端：6 项新接口测试覆盖模式隔离、未结算排除、最近五局顺序、只读与离册校验、下架过滤；与既有排行、身份、成就测试合计 24 项通过。前端 167 项测试、两端类型检查、前端构建通过（保留既有包体积提示）。
- 本轮未新跑游戏结算、没有提交、推送或部署。
- 开发热更新语言模块期间曾出现 useI18n Provider 错误；完整重新加载后排行榜与真实 Alice 名片恢复。刷新后再次点击的新增 error/warn 为 0，历史日志未当作当前持续错误。
- final result: passed

## 2026-10-24 · 稀有度最终 v5 实现

- Source visual truth: `design/concepts/collection-title-rarity-v5.png`（1536 × 1024）。映射为闪耀/Radiant（珊瑚红）、卓越/Outstanding（电紫）、非凡/Extraordinary（香槟玫瑰金）、传奇/Legendary（彩虹）。
- 素材：`assets/icons/collection-titles-rarity-v5/preview.png`、`source-atlas.png` 与 `manifest.json`。内置 ImageGen 将七枚原始构图和 v5 配色整理为单一透明图集，再按 alpha 连通区域切为 14 个母版；Avatar 去分离星芒，Showcase 保留非凡/传奇装饰。没有将页面截图作为卡片或背景。
- 生成图集与旧 PNG 并非逐像素相同；采用新版母版的界面保持七枚 motif 与橙白画风。图集切出之后的有效像素没有再改色；透明边缘已在浅色、深色底目视检查。
- 实现截图：`/Users/bob/.codex/visualizations/2026/10/24/01a16d49-e183-7603-a649-8f1e592e3408/rarity-v5-qa/drawer-zh-390.png`、`drawer-en-320.png`、`avatar-badges.png`。预览入口 `/dev/gallery?c=AchievementShelf`、`AchievementAvatar`、`LeaderboardScreen`。
- 字体与文案：使用当前圆体与 i18n；等级名四档均已更新，英语缩窄时标签独占姓名上方一行。内部 common/rare/epic/legendary ID 只用于稳定映射，不是可见名称。
- 布局与颜色：中文独立等级列；英文/窄屏为三列与两行内容。常规卡片为各自双色渐变边框，传奇保留彩虹边框与浅色标签；所有样式引用 tokens。
- 交互：在陈列页选择已解锁的狗狗/猫猫徽章，佩戴状态同步更新。锁定保持灰显与进度条，保存时按钮禁用，加载/失败状态保留。排行榜徽章可打开新材质的大图，确认 `title-dogs-showcase@144.png` 已加载。
- 图像与尺寸：七枚头像图标均实测 22 × 22 CSS px、加载成功；40px 头像及右下圆周锚点未改。英文 320px 组件七行子元素均无横向溢出。
- 验证：前端 14 个测试文件、167 项测试通过；生产构建包含 TypeScript 检查，通过（保留既有包体积提示）；相关预览控制台无 error/warn。服务端规则未修改，未新跑真实对局结算或账号佩戴 API。
- 差异：保留产品既有提示、解锁数、不佩戴与加载/错误入口；源设计板只是视觉参考，不强求整体画布尺寸一致。中文版 390px、英文 320px 的同一组件作为局部验收依据，PNG 图案与边框已和 v5 方向比较。
- 本地修改，未提交、推送或部署。
- final result: passed


## 游戏页前台加单与收工组件化 · 2026-10-25

final result: passed

- 当前范围：用户确认的游戏页v2、加单状态v2、收工分镜v2，已组件化接入；未改engine或server。完整验收：[本轮QA](design/reviews/2026-10-25-board-frontdesk/QA.md)。
- 视觉真值：`design/concepts/mobile-board-frontdesk-v2.png`、`rush-frontdesk-states-v2.png`、`shift-finish-storyboard-v2.png`。
- 实际浏览器：390×844 / DPR2（780×1688），全页归一化并排比较 `/tmp/moego-board-frontdesk-comparison-final.png`，局部 `/tmp/moego-board-frontdesk-focus.png`。源素材放大对照在 `assets/icons/board-frontdesk-original-v1/preview.html`。
- 12件源图案不透明主体60,510像素RGB保留，经Icon使用；另有仅换字的英文挂牌。字标、数值、夹单、挂牌、头像谢幕均是独立组件，不贴整页或整卡截图。
- 手机中英、鱼关、任务四态、零服务、320×568与844×390检查通过；设置/退出交互正常，任务变化时格区x20/y339.109/350×350不变。动态演示到90秒关闭设置，再约1.28秒交出结果；无POST。
- 初次窄屏读数越界、设置遮住收工和小高度装饰挤占棋盘已修复、复测；最新刷新无新增应用error。其余已有字标、宠物、道具和通用图标保持原资产比例，概念图生成近似不作为替换来源。
- 最新179项测试通过，typecheck/build通过（保留既有>500kB主包提示）。减少动效路径有代码复核，未实际切换操作系统；未测真实iOS设备。
