# 火锅搭子全尺寸动效补充验收 · 2026-10-26

final result: passed

- 依据用户后续确认，所有展示尺寸统一完整流光与星芒，取代上一版小图轻闪方案。徽章仍为已选原 PNG，文字、尺寸、间距、蓝紫—青蓝颜色与透明轮廓均保持原样。
- 手机视口 390 × 844，DPR 1；陈列页 22 / 24 / 48 / 56 / 72px 均实测三层 6000ms 动画，实际首页头像旁 22px 角标亦相同。证据 `/tmp/moego-aurora-all-sizes.png`、`/tmp/moego-aurora-home-avatar.png`。
- 新增实际调用组件覆盖：首页头像、榜单、领奖台、名片称号签/徽章、结算收获与新解锁；修复前 5 项失败，修复后 9 项全部通过。
- 临时激活 reduced-motion CSS 分支后，各尺寸光效层隐藏且动画数量为 0。原未解锁占位仍静态。
- 类型与构建通过；控制台出现一次浏览器异步消息通道关闭提示，页面和动效正常。未做真机验证。未发现需修复的 P0/P1/P2 问题。

---

# 镇店之宝极光动效验收 · 2026-10-26

final result: passed

## 基准、状态与对照证据

- 视觉基准：`design/concepts/mythic-aurora-motion-v1.png`，1536 × 1024 的动效分镜。输入原稿为原蓝紫极光徽章和已确认标签，产品仅增加光效，保持原称号列表尺寸与文案。
- 实现：本地 localhost:5180，bsk Agent Window，中文 390 × 844 / 英文 320 × 844，DPR 1；截图与 CSS 像素 1:1。
- 整体及重点区域在同一比较输入中查看：分镜原图 + `/tmp/moego-aurora-shelf-sweep.png` + `/tmp/moego-aurora-shelf-stars.png`。源稿是设计说明板而非手机截图，按其中列表区域比较徽章、标签与原图细节；不将说明板的标题、示意头像或主图尺寸当作待实现页面布局。
- 窄屏证据：`/tmp/moego-aurora-shelf-en-320.png`；名称隐藏：`/tmp/moego-aurora-profile-hidden-en.png`、`/tmp/moego-aurora-profile-hidden-tooltip.png`；实际未解锁身份进入他人名片：`/tmp/moego-aurora-real-locked-viewer.png`；减少动态效果分支：`/tmp/moego-aurora-reduced-motion.png`。

## 五项视觉核验

- 字体：沿用现有字体、字重和 i18n，标签白字保持清楚；隐藏名称使用已有中英文文案。
- 间距布局：原列表 56px 徽章、头像 22px 角标、称号签与佩戴控件位置保留；390px 中文 / 320px 英文无横向溢出。
- 颜色：使用现有蓝紫—青蓝 tokens，新增渐变、阴影与节奏亦集中在 tokens；标签游彩，徽章轮廓内掠光，星芒错峰亮起。
- 素材：现有 canonical PNG 经 Icon / srcSet 使用，未重绘徽章。光效按同一 PNG 透明轮廓遮罩；小图只轻闪。生成分镜的外围粒子没有额外铺到产品上，避免小尺寸杂乱。
- 文案：已解锁玩家看到真实名称和条件；未解锁/读取失败时，名片、称号签、排行榜头像 title/alt/aria 与说明使用 Hidden Title / 隐藏称号及原喵喵喵提示。

## 动态与交互

- 实测徽章掠光、两组星芒、标签游彩和掠光动画时长均为 6000ms；检查 1500ms 与 3000ms 关键帧。原图保持稳定，无位移旋转。
- 佩戴传奇 → 佩戴镇店之宝：选中行与禁用状态正确。
- 未解锁行无动效。临时激活浏览器现有 reduced-motion CSS 分支后，动画数为 0、光效层隐藏；没有更改系统设置，真机偏好切换未测。
- 真实身份路径：未解锁测试玩家登录 → 总榜 → 已佩戴该徽章的同事名片；名称、条件与读屏保持隐藏。完成后恢复原身份与中文。
- 正常路径无新增运行异常；测试头像 404 回退首字母属预期。
- 291 前端 Vitest + 8 版本测试、209 服务端 Vitest、前后端类型检查、前端构建通过；构建保留原有 chunk 体积提示。独立代码审查未发现阻断项。

## 对照结论

首轮未发现需修复的 P0/P1/P2 视觉偏差。分镜里夸张的主图光晕在列表/头像尺寸下按设计意图减弱，保留原图与布局；不新增外围粒子或页面控件。真机与跨浏览器为未测边界。

---

# 贴纸册分享图接入验收 · 2026-10-25

final result: passed

## 视觉基准与证据

- 选定图稿：`design/concepts/sticker-album-share-v1.png`，1024 × 1536；用户要求接入真实宠物与数量，并替换底部文案。
- 浏览器：bsk Agent Window，真实本地站点 `http://localhost:5180/`，API 与图片走本地 Node 服务；手机 390 × 844，DPR 1；桌面陈列页 1512 × 772，截图 3024 × 1544（DPR 2）。未使用 Playwright fallback。
- 实际导出：`/tmp/moego-sticker-album-real-zh-v2.png`（1200 × 2016）及 `/tmp/moego-sticker-album-real-en.png`；来自本地开发库当前玩家 Bob 包博的 79 / 80 图鉴，不代表生产数据。手机预览截图：`/tmp/moego-sticker-share-mobile-zh-v2.png`、`/tmp/moego-sticker-share-mobile-en.png`。
- 同框整体对比：`/tmp/moego-sticker-share-comparison.png`；两张图都等比缩至 600px 宽，不拉伸高度。页头和计数的局部同框对比：`/tmp/moego-sticker-share-header-comparison.png`。

## 对比与修复

1. 首轮：`/tmp/moego-sticker-album-real-zh.png` 出现字标下缘被纸张挡住（P1），计数文案重叠（P2），待贴位虚线过重（P2）。原因分别是未为字标及胶带留足高度、Canvas 字体不能直接复用包含行高的 CSS font 简写、纸面放大时描边也被放大。
2. 修复：品牌区与字标尺寸纳入 tokens 并重新留出间距；字体改为明确的字重／字号／字体族；虚线线宽和段长按缩放系数补偿。重新下载中英文 PNG，再做同框整体与局部核对，无遮挡、重叠或末行裁切。
3. 长英文名陈列状态发现原有 grid 最小内容宽度撑至 408px（P2）；为 StickerSheet 的 root、album 和 sheet 设置 min-width: 0 后，重新打开并导出，页面 scrollWidth / clientWidth 均为 390，完整署名仍在导出中显示。证据：`/tmp/moego-sticker-album-long-en-final.png`、`/tmp/moego-sticker-share-long-en-final.png`。

## 五项视觉核验

| 项目 | 结论 |
| --- | --- |
| 字体与层级 | 官方 Logo、已确认的中文／英文游戏字标复用；署名与计数使用现有 MoeGo Rounded，计数橙色强调，长名字完整缩放到可用空间，无重叠。 |
| 布局与节奏 | 品牌、册页、底部文案层次与选定稿一致，保留 8 列；实际格子保持现有正方形比例，因此 80 格导出高于生成稿，81 格完整增加一行，未为固定比例裁掉内容。 |
| 颜色与 tokens | 白底、米白纸、橙色胶带／计数／爪印、灰色剪影沿用 tokens；新增导出尺寸与间距亦在 tokens。 |
| 图片与素材 | 宠物为当前册页的高清原素材，未收集仍用真实剪影；没有把生成稿的示意宠物或整页截图用于产品。品牌素材保持比例。纸边、胶带、细纹理与点缀由现有轮廓和 Canvas 绘制，细节与生成稿的手工纸纹理有所不同，遵循项目组件化约定。 |
| 文案与内容 | 中文「我的毛孩子朋友，都在这里啦」，英文「All my furry friends, right here.」；数量从本次导出的格子统计，署名来自当前玩家；名字保持原文。图稿 38 / 80 不进入代码。 |

## 功能核验

- 主路径：首页 → 宠物图鉴 → 贴纸册 → 分享预览 → 保存 PNG，中英文均实际下载成功；导出 1200px 宽，全部 80 格完整，79 张贴纸和 1 个剪影与页面状态一致。
- 手机预览：页面身份正确、非空、无框架覆盖层，预览与保存／分享按钮完整；生成中保存禁用，成功后可保存。
- 陈列页：9 个状态均已登记和查看；部分收集 9 / 21、英文说明 7 / 21、零收集 0 / 21、全收集 21 / 21、空目录 0 / 0、长英文名 7 / 21 均成功生成。81 格 27 / 81 成功下载为 1200 × 2150，最后一行只有一格且完整保留。
- 故障：image error 状态导出失败，显示失败文案与重试，不显示可保存的残缺图片；重试后仍如实显示失败。截图 `/tmp/moego-sticker-share-error-en.png`。
- 控制台：正常生成、切换语言与保存路径无新增 error/warn。i18n 修改期间开发 HMR 曾短暂出现 provider 错误，完整导航后恢复；错误素材状态有预期的 404，不视为正常路径错误。
- 类型、构建与测试：typecheck 通过；build 通过（沿用大 chunk 警告）；22 个 Vitest 文件共 245 项通过，版本脚本 8 项通过；git diff --check 通过。

未做 Safari／真机、系统分享面板发送或生产验收；没有提交、推送或部署。无待修复 P0/P1/P2。

---

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

## 2026-10-25 · 结算页报告字标与副标题

- 采用已确认的 `feature-wordmarks-scheduling-report-v1.png` 中独立 Grooming Report Card 母版；经 `assets/illustrations/build_web.py` 裁边、等比导出为 1080 × 307 WebP，由 `BrandHeader` 的 report 变体显示，保留两行组合、黑橙配色、字形与装饰短线。没有重新生成或改变图案。
- 「这班辛苦啦，看看毛孩子怎么说。」与游戏页共用同一副标题样式：MoeGo Rounded、16px、1000 字重、1.1 行高、居中。报告页可滚动，短屏仍显示副标题；英文自然换行。零服务保留中性文案，鱼关保留原文字标题与主题。
- 浏览器使用 browser-skill / bsk Agent Window。实测路径为 `/dev/gallery?c=Screens` 的报告独立状态与 `/dev/gallery?c=BrandHeader`，覆盖 390 × 844 中文/英文、320 × 568 英文和零服务、1440 × 900 桌面、鱼关；标题图案加载成功，无横向溢出或框架错误层。语言按钮切换后副标题和页面文案正确更新，切回中文后结束会话。
- 对照差异：用户截图与 mobile-report-slim-v1 原来是一行普通文字标题；本次按用户要求换为已确认的两行字标。陈列页使用既有样例数据，未作为真实宠物素材或真实结算验收。页头组件截图：`/Users/bob/.codex/visualizations/2026/10/25/01a17098-f9e8-7ff2-b0bc-bf4edeb09986/report-header/header-component-zh.png`；完整手机、英文、短屏、桌面与鱼关截图在 `/tmp/moego-report-header-*.png`、`/tmp/moego-report-zero-320.png`。
- 验证：`npm --prefix web run typecheck`、`npm --prefix web run build`、`git diff --check` 通过。构建保留已有大包提示。最终页头刷新与语言操作无新增 error/warn；此前整页陈列过程中有浏览器阻止未交互振动及 favicon 404，与本轮页头无关。
- 本轮仅修改界面展示，未改引擎、服务端或结算规则；未新跑单元测试、真实对局保存、真机或跨浏览器测试。未提交、推送或部署。

## 2026-10-25 · 鱼关报告字标接入

- 使用已确认的 `feature-wordmarks-ranking-fish-v1.png` 对应 Fish Report Card 独立透明母版，沿现有导出流程生成 1080 × 393 WebP；字形、两行组合、黑橙配色及装饰短线保留。`BrandHeader` 的 report / fish-report 共用外壳，仅选择各自图片、alt 和实际尺寸。
- 鱼关黑色字形需要浅色承托：鱼主题下 reportTitle 使用与小票相同的 `--receipt-paper`、现有圆角与间距令牌，无额外描边或阴影。副标题仍在深蓝底上显示白字，与游戏页同为 MoeGo Rounded、16px、1000 字重、1.1 行高；短屏保留。
- bsk Agent Window 实测 `/dev/gallery?c=Screens` 鱼关已保存报告：390 × 844 中文/英文、320 × 568 英文及零服务、1440 × 900 桌面；字标加载、语言切换、主题颜色和无横向溢出均通过。陈列页 BrandHeader 的 fish report artwork 已登记，切换 fish 主题验证浅底和白字；普通报告在默认主题仍使用 Grooming 字标及透明底，副标题规格与游戏页一致。
- 对照差异：原 Fish Report Card 图案用于深蓝页面时增加代码浅底板，原图没有改色或重绘。完整中文截图：`/Users/bob/.codex/visualizations/2026/10/25/01a17098-f9e8-7ff2-b0bc-bf4edeb09986/report-header/fish-report-zh-390.png`；其它状态为 `/tmp/moego-fish-report-header-*.png`。224px 高度截图被固定操作条覆盖，已拒绝作为验收或展示证据。
- `npm --prefix web run typecheck`、`npm --prefix web run build`、`git diff --check` 通过；保留既有大包提示。最终导航后的日志只有既有 favicon 404；较早的未交互振动拦截及浏览器消息通道错误不归因于本轮报告。未出现图案加载失败或框架错误层。
- 本轮未修改引擎、服务端或结算规则；未新跑单元测试、真实保存、真机或跨浏览器测试。未提交、推送或部署。

## 2026-10-25 · 首页游戏版本号

- 首页新增 HomeFooter，复用原信息说明／删除申请／设置链接，在其下居中展示 12px 灰色版本文字；中文为「版本 {version}」，英文为「Version {version}」。已登记组件陈列页默认与两位发布序号状态。
- 唯一来源为 `web/src/app/version.ts` 的 `GAME_VERSION`，本次为 `20261025.1`；按北京时间 `YYYYMMDD.N` 维护，同日发布递增序号，随构建固定。App → HomeScreen → HomeFooter 通过 props 传入，与结算规则版本独立。
- 对照 `design/concepts/mobile-home-v2.png` 及本轮改动前截图：延续当前店面与入口，新增页尾小字；首页区块间距从 12px 收紧为已有 8px token，未改插画与按钮尺寸。字体加载完成后 390 × 844 中文文档高度为 844px，版本底边为 832px，无横向溢出。
- bsk Agent Window 验证首页中英文切换、设置弹窗打开／关闭、HomeFooter 默认及两位发布序号陈列；检查 390 × 844、320 × 568 英文、1440 × 900 桌面。英文长说明与窄屏允许自然纵向滚动，所有页尾内容可达；桌面中文文档高度为 913px，同样允许纵向滚动。
- 截图：`/Users/bob/.codex/visualizations/2026/10/25/01a170ac-31a1-7fc0-8b25-a189c6f5245d/home-version/home-version-zh-390.png`、同目录 `home-version-en-320.png`；组件中英文为 `/tmp/moego-home-version-gallery-{zh,en}.png`。
- `npm --prefix web run typecheck`、`npm --prefix web run build`、`git diff --check` 通过，保留现有大包提示。完整导航后未出现本轮新增运行错误或框架错误层；陈列 U_TEST_BOB 头像仍有原有 404，回退文字头像。开发中 i18n Fast Refresh 错误在完整导航后消失。
- 本轮只改展示，未新写或运行单元测试，未验证真实对局、真机或跨浏览器；未改规则、数据库或部署，未提交、推送。

### 同日跟进 · 版号随 Git 自动更新

- 用 `web/scripts/game-version.mjs` 替代手动版号：取 HEAD 提交的北京时间日期，统计 first-parent 历史同日提交数；当前为 `20261025.5`。同提交重建稳定，未提交修改不递增，开发服务启动时读取；运行中提交后重启即可更新。上述手动维护方式已被本条取代。
- Vite 注入构建常量；GitHub CI 与镜像构建获取完整历史，镜像构建自动计算并传入 `GAME_VERSION`。Docker 不携带 Git 历史，缺少 Git 又未提供版本、浅克隆以及非法版本格式均明确报错。UI_COPY、部署说明和本地镜像构建命令已同步。
- 8 项真实临时 Git 仓库测试通过，覆盖同日递增、重复读取、北京时间跨日、first-parent 合并、环境与显式参数、浅克隆及无 Git；测试未修改本项目 Git 历史。类型检查、web 构建、两个 workflow YAML 语法检查及 linux/amd64 Docker 前端构建通过；既有大包提示保留。
- 浏览器 390 × 844 实测首页为「版本 20261025.5」，无横向溢出或新增运行错误。截图为同目录 `home-git-version-390.png`。未改变视觉布局，未运行完整引擎／服务端测试、真实 GitHub Actions 或线上部署；未提交、推送。

### 同日跟进 · 版本号下方的 GitHub 链接

- 核对 `git remote` 后，在版本号下方新增 `github.com/sakiila/moego-pet-match`，使用 12px 灰色下划线链接，地址统一在 `app/project.ts` 维护并经 App → HomeScreen → HomeFooter props 传入。中英文可访问名称均提示新标签页行为，已补陈列页长地址状态。
- 原生链接使用 `target="_blank"` 与 `rel="noopener noreferrer"`。bsk 实际点击后确认新标签页 URL 为 `https://github.com/sakiila/moego-pet-match`，原游戏标签页保留，新页 `window.opener` 为 null。Tab 键可聚焦，浏览器原生焦点轮廓清楚。
- 390 × 844 中文、320 × 568 英文及 1440 × 900 组件陈列检查通过；默认、两位版号、长地址状态均无横向裁切，长地址自然换行。对照此前首页，本轮只增加链接行，未继续压缩主体；中文文档高度 864px，页尾可自然纵向滚动。
- 首页截图：`/Users/bob/.codex/visualizations/2026/10/25/01a170ac-31a1-7fc0-8b25-a189c6f5245d/home-version/home-github-link-390.png`，同目录 `home-github-link-en-320.png`；组件截图在 `/tmp/moego-home-github-gallery-{zh,en}.png`。
- 类型检查、生产构建、`git diff --check` 通过，保留既有大包提示。浏览器只有陈列 U_TEST_BOB 头像的原有 404，无新增框架错误。未新写或运行单元测试，未测真机或跨浏览器；未提交、推送或部署。


## 棋盘放大反馈 · 2026-10-25

final result: passed

用户反馈棋盘过小后，重新分配周边空间，保留图案原样；完整尺寸与状态验证见 [BOARD_SIZE.md](design/reviews/2026-10-25-board-frontdesk/BOARD_SIZE.md)。当前438×780窗口外框306→425.16px、格区286→413.16px；390×667格区248.44→315.56px；1024×800格区298.22→628px。前后同框 `/tmp/moego-board-enlarged-comparison.png`，最新中文 `/tmp/moego-board-enlarged-final.png`。中英文、鱼关、催单四态、窄横屏长分数均无文字越界，棋盘不随任务状态移动；全部所测视口无整页溢出。实机模拟点击已受理并计分0→300。大盘改选同源512贴纸，并将两档图片纳入开局就绪检查，2项回归红→绿；最新181项测试与typecheck/build通过。旧章节的较小尺寸保留为历史记录，不作为恢复目标。


## 收工牌中文高清增强 · 2026-10-25

final result: passed

中文牌原可见母版256×187，在网页300px宽及高分屏中欠采样。现已用内置ImageGen制作同造型高清稿，并以独立ID closing-sign-zh-hd-v2接入组件与开局预载，旧母版/导出哈希保持不变。新原图1448×1086，最大网页资源960×685。390×844的DPR2/3均实测牌宽300px、currentSrc命中新@960并解码；鱼关横屏实测220px宽，无溢出或失效图片。英文资源保持原960×700。造型/文字与原稿对照查看，中文清晰度明显改善。typecheck/build与相关diff check通过；未改计时或收工时序。完整提示词、来源、哈希和步骤见 [高清制作记录](assets/icons/closing-sign-zh-hd-v2/README.md)。实际网页 `/tmp/moego-closing-hd-web-zh.png`，同宽对照 `/tmp/moego-closing-web-hd-comparison.png`。本段取代早期验收中“中文牌受低分镜原稿限制”的现状描述，早期记录保留为历史。


## 自录英文喝彩与弹跳字效 · 2026-10-25

final result: passed

用户确认的 Nice / Great / Amazing / Wow 四条原声已本地接入，每次操作全部补落后只播最高档，配 800ms 橙白弹跳字；音效开关、弹层抑制、到时与离开清理生效。215 项 web 测试和 8 项版号测试、typecheck/build 通过；四档真实引擎触发、静音文字、鱼关、中英文、320×568／390×844／844×390／1280×800 布局均通过。后台路径为 visibilitychange 事件模拟，尚未做真机听感／iOS Safari。完整证据、差异与限制见 [QA.md](design/reviews/2026-10-25-game-cheers/QA.md)。未提交、推送或部署。

## 镇店之宝蓝紫统一展示徽章 · 2026-10-25

final result: passed

- 已选第 2 稿蓝紫极光色，使用唯一透明 showcase 母版。头像角标、称号签、列表、玩家名片和解锁展示共用同一图案，保留 22 / 24 / 48 / 56 / 72px 显示尺寸；mythic 标签与边框同步蓝紫青色。[来源与导出记录](assets/icons/hotpot-title-aurora-v2/README.md)。
- 用 Codex 内置浏览器验收 `/dev/gallery` 的 AchievementShelf、AchievementAvatar、AchievementBadge、LeaderboardRow 与 PlayerProfileCard。390 × 844 中英文称号列表均无横向溢出；切换到全图鉴称号再切回火锅搭子后，佩戴按钮 aria-pressed 为 true。锁定状态只暴露 Hidden Title / 问号，不泄露称号名；全部受测图案解码成功、无框架错误层或相关 error/warn。桌面名片 1024 × 900 同样通过。
- 与选定参考的差异：将三种形态收敛为右侧带星芒、麦穗的展示造型，各场景只缩放；独立透明母版由 ImageGen 根据参考整理，并非参考图的逐像素裁切。22px 主要识别轮廓与配色，猫和火锅的细节在列表、大图中查看。
- 实际手机截图：`/Users/bob/.codex/visualizations/2026/10/25/01a17154-fd7b-77d1-ab58-96a28b1af4e9/hotpot-shelf-zh.png` 与同目录 `hotpot-shelf-en.png`、`hotpot-avatar-22px.png`、`hotpot-unified-sizes.png`、`hotpot-hidden-locked.png`、`hotpot-leaderboard-row.png`；桌面为 `hotpot-profile-desktop.png`。
- `npm --prefix web run typecheck`、`npm --prefix web run build` 通过，构建有现有大包提示。仅改变本枚徽章的显示与资源，无引擎或服务端规则改动；本轮未新增或运行单元测试、真实结算/保存、真机或跨浏览器测试。未提交、推送或部署。


## 传奇标签彩虹配色 · 2026-10-25

final result: passed

- 按用户确认的 `design/concepts/legendary-rainbow-label-v1.png`，仅将传奇稀有度标签改为桃橙、金黄、薄荷绿、天蓝、紫、粉的横向彩虹底，文字使用深梅紫；通过现有 tokens 与标签 CSS 实现。标签尺寸和位置沿用当前组件，徽章与行边框保留当前素材，佩戴按钮使用原有配色。
- Codex 内置浏览器实测 `/dev/gallery?c=AchievementShelf`：390 × 844 中文、320 × 568 英文。标签分别为 40 × 26px 和 78.3 × 25.5px，文字完整、无横向溢出；切到全图鉴称号再切回火锅搭子，佩戴状态正确更新。未出现框架错误层或相关 console error/warn。
- 与选定稿对照：实现相同的彩虹标签与深色文字，其他生成稿细节不作为页面改动来源。实际截图在 `/Users/bob/.codex/visualizations/2026/10/25/01a17154-fd7b-77d1-ab58-96a28b1af4e9/legendary-rainbow-label-zh-390.png`、同目录 `legendary-rainbow-label-en-320.png` 与 `legendary-rainbow-label-equipped.png`。
- `npm --prefix web run typecheck`、`npm --prefix web run build` 通过，构建保留大包提示。本轮为 CSS 展示调整，未新增或运行单元测试，未做真机、跨浏览器或真实保存验证；未提交、推送或部署。


## 直线五连直接生成吹风机 · 2026-10-25

final result: passed

规则版本5：任一横纵直线五连及以上优先生成一枚吹风机，鱼关对应大浪花；其余交叉形仍出剪刀、四消仍出梳子，双剪合成保留。新增道具不因生成自动发动。236项web测试、8项版号测试、15项服务端登记结算测试、前后端typecheck及web构建通过；本地实际登记返回版本5。IAB验证手动500分留盘、补落1300分生成、再交换清全盘并出现Wow，鱼关五连留大浪花。完整记录见 [QA.md](design/reviews/2026-10-25-five-match-dryer/QA.md)。未提交、推送或部署。


## 镇店之宝极光标签 · 2026-10-25

final result: passed

- 按用户确认的 `design/concepts/mythic-aurora-label-v1.png` 替换原浅紫等级标签。通过 tokens 与 AchievementShelf 标签样式实现蓝紫—青蓝渐变底、白字、紫青亮边、顶部高光和柔和辉光；补偿描边占用的 padding，保留标签原尺寸和位置，不使用设计截图作为界面素材。
- Codex 内置浏览器实测 `/dev/gallery?c=AchievementShelf`：390 × 844 中文标签为 64 × 26px，320 × 568 英文 House Special 为约 98.9 × 25.5px；文字完整、无横向溢出，切到全图鉴称号再切回火锅搭子后，佩戴状态正确。未解锁时仅显示 Hidden Title、问号、保密条件提示与稀有度；图片 alt 不暴露称号名。未出现相关 console error/warn。
- 对照选定稿：实现极光胶囊、白字、亮边和高光，辉光保持柔和以适配小尺寸标签；其他徽章、传奇标签、按钮与页面布局沿用原组件。实际截图：`/Users/bob/.codex/visualizations/2026/10/25/01a17154-fd7b-77d1-ab58-96a28b1af4e9/mythic-aurora-label-zh-390.png` 与同目录 `mythic-aurora-label-en-320.png`。
- `npm --prefix web run typecheck`、`npm --prefix web run build` 通过，构建保留大包提示。本轮为 CSS 展示调整，未新增或运行单元测试，未做真机、跨浏览器或真实保存验证；未提交、推送或部署。


## 玩法文案与跨文档复核 · 2026-10-25

本轮按当前引擎、结算与报告代码复核 V1_RULES、GAME_FLOW、TECH_PLAN、IMPLEMENTATION_PLAN、README、UI_COPY 及设计说明。报告「店长说」提示池为五条：梳子、剪刀、吹风机、梳＋梳、梳＋剪；已移除双剪刀报告提示。局内双剪刀／双珍珠贝壳合成与对应带教仍保留，未改引擎规则。

修正遗漏：每格及道具格均为 100 分，催单与猜主人答对各加 1000 分；直线五连及以上优先生成吹风机，无五连直线的 L／T／＋ 形才生成剪刀；鱼关对应海螺、珍珠贝壳、大浪花。剪刀中英文提示补上五连优先条件，文案表补齐吹风机／大浪花带教；同步五条提示数量、自家宠物主人搜索、收集保存条件、评语变体及部分已接入功能的旧状态说明。早期图稿与阶段 1 验收保留历史内容，并注明不能作为现行规则。

验证：
- 对照中英文全部 417 个 i18n key；UI_COPY 中登记的 393 个表格 key 均存在且中英文与代码一致，无遗留草稿 key。中英文占位参数一致；日期的 month／monthName 为有意本地化，分享生成代码同时提供两者。
- `npx vitest run src/game/__tests__/nextUp.test.ts src/game/__tests__/collection.test.ts src/engine/__tests__/match.test.ts src/engine/__tests__/tools.test.ts`：41 项通过；`npm run build`（含 TypeScript 检查）通过，保留现有的大包体积提示。
- 浏览器 `http://localhost:5180/dev/gallery?c=NextUp`：中文与英文 14 个陈列状态均渲染，切换语言生效，无框架错误页或相关控制台报错；390 × 844 下单独检查剪刀提示，中文两行、英文四行，无横向裁切。对照 mobile-report-slim-v1 的尾声气泡，头像、边框、布局与原组件一致，文案按长度自然换行。

本轮未验证生产环境、完整真实对局或真机；未提交、推送或部署。

## 本地修改统一发布前验证 · 2026-10-25

用户确认 Slack 海报 v2（「90 秒消消乐」「游戏入口：star.baobo.me」），并授权提交、推送和部署本地全部修改。本次同时整合既有蓝猫 favicon、报告玩法提示精简与跨文档校读，保留最新远端的分享预览提交；Cloudflare 两条专用防护按用户决定保持禁用，本次未修改。

合并后前端 277 项、版本脚本 8 项、服务端 198 项和部署脚本 9 项测试通过；前后端类型检查、前端构建、服务端打包通过。1200×630 海报与 favicon 均已进入构建产物，独立复核未发现阻断问题。此为发布前本地验证记录，生产部署与线上实际响应需另行确认。
