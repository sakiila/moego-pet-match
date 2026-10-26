# 中英稀有度渐变刻度验收 · 2026-10-26

final result: passed

## 对照基准与证据

- 英文基准：`design/concepts/achievement-rarity-guide-en-v5.png`；中文基准：`design/concepts/achievement-rarity-guide-zh-v1.png`。两者均 1536 × 1024，对照时等比缩为 390 × 260。
- 实际截图：`/tmp/moego-rarity-rail-en-final.png`、`/tmp/moego-rarity-rail-zh-final.png`，390 × 844、DPR 1，比较上部 390 × 260；英文窄屏 `/tmp/moego-rarity-rail-en-320-final.png`（320 × 844）。Chrome/bsk Agent Window，localhost:5180 陈列页，示例数据。
- 完整同框：`/tmp/moego-rarity-rail-en-comparison-final.png`、`/tmp/moego-rarity-rail-zh-comparison-final.png`；图例局部同框：对应 `*-focus-final.png`。中英实测并排：`/tmp/moego-rarity-rail-bilingual-final.png`。

## 对比与修正

首轮图例填色、连接杆色和 caption 高度与选定稿有偏差；已在 RarityGuide 专属令牌中按参考取色，校准 caption 高度，不更改共享行内标签样式。后续截图只暂停图例自身的流光相位，不暂停弹层进场；一次误暂停整页产生的空白截图已丢弃并重截。最终同框确认渐变线与末端箭头、上/下交错、各语言标签宽高、顺序和文案一致；页面原标题、说明和计数栏继续沿用既有字体与组件，生成稿字形的细微差异未扩展为无关修改。

## 五项视觉检查

- 字体：原页面 MoeGo Rounded 与字号令牌保留，文案原样；没有为了强塞英文而缩写或分词。
- 布局：图例高 86px，标签高 24px；英文宽 66/92/94/85/90px，中文宽 65/73/65/75/85px。连接点由数据顺序产生，边缘限制让 320px 英文同排最小间隙约 7px，全部文字完整。
- 色值：渐变线九个采样色、连接杆及图例专用填色均在 tokens；保留五档配色和最高档光晕，未更改称号列表的标签。
- 图片：图例为原生 SVG/CSS，渐变 ID 各实例独立；没有把设计图当作图片背景或切片使用。既有图标与徽章原稿不变。
- 内容：中英五档名称与稀有度顺序不变，SVG/连接杆对读屏隐藏，ol 保留语义顺序。隐藏称号仍不泄露名称与条件。

## 交互与边界

- 390px 中英、320px 英文无横向溢出、同排重叠或文字裁切（Range 实测）。10 个并列图例的渐变 ID 均唯一。
- 传奇 → 镇店之宝佩戴切换及禁用状态正确；未解锁状态没有佩戴按钮，图例和稀有度标签均保持 3000ms 流光。
- 临时激活 reduced-motion CSS 后整表动画为 0；系统偏好未变，测试后语言恢复中文。
- 327 项前端测试、8 项版本测试、类型检查、构建与 diff 检查通过，独立代码审查无阻断项。保留原大 chunk 提示。
- 控制台出现浏览器异步消息通道关闭提示，页面与交互正常。未做真机、跨浏览器验证；未改服务端/引擎，未单独运行本地服务端测试。

无尚需修复的 P0/P1/P2 项。

---

# 稀有度常驻图例与 3 秒流光验收 · 2026-10-26

final result: passed

## 基准、状态与对照

- 选定稿：`design/concepts/achievement-rarity-guide-v1.png`，853 × 1844；等比归一化到 390px 逻辑宽度（约 390 × 843），底部补白到 844，仅用于对照。
- 实际截图：`/tmp/moego-rarity-guide-zh-final.png`，390 × 844，DPR 1；320px 英文截图 `/tmp/moego-rarity-guide-locked-en-final.png`。bsk Agent Window，localhost:5180 组件陈列页，复用现有运行环境。
- 同框完整对照：`/tmp/moego-rarity-guide-comparison-final.png`；重要图例区域的同框对照：`/tmp/moego-rarity-guide-focus-final.png`。未将设计图或对照图用作产品素材。

## 对比与修正

首轮标签留白较选定稿紧凑（`/tmp/moego-rarity-guide-zh-first.png`）。390px 下图例标签的水平留白调整为现有 space-3，360px 以下保留紧凑留白。重新截图后，中文单行、图例高 48px；前四档宽 48px，镇店之宝 72px。320px 英文仍完整分两行、高 76.5px，均无横向溢出。图例位置、顺序、圆角、层级与选定稿一致。原 Sheet 高度与滚动区域保留，因此可见条目数与生成稿示意略有不同；未缩小或重画徽章。

## 五项核验

- 字体：沿用现有中英文字体与 tokens，图例为次要字号，列表字号和按钮不变。
- 间距：图例置于说明与解锁统计之间，48px 高；手机中文一行，窄屏英文自然换行，原卡片布局保留。
- 颜色：五档沿用原有标签令牌；RarityTag 供图例与列表复用，镇店之宝保持蓝紫青、白字和亮边。
- 素材：徽章继续经 Icon 使用既有 PNG，图例由组件、文本箭头与 CSS 构成，无截图切片或新徽章。
- 文案：顺序为闪耀 → 卓越 → 非凡 → 传奇 → 镇店之宝；英文提示 Rarity: low to high。隐藏名称与条件均未泄露，未解锁时不提供佩戴按钮。

## 行为与证据

- 未解锁标签运行游彩、掠光两条 3000ms 动画；图例与已解锁徽章均为 3000ms。中文未解锁证据 `/tmp/moego-rarity-guide-locked-zh.png`，英文同样核对。
- 传奇 → 镇店之宝佩戴切换正确；临时激活浏览器 reduced-motion CSS 分支后整表动画数为 0，系统设置未变。
- 327 项前端测试、8 项版本测试、类型检查、构建与 diff 检查通过；独立代码审查无阻断项。控制台抽查未发现与本次修改相关的异常。
- 未做真机及跨浏览器验证；未修改服务端或单独运行本地服务端测试。原有大 chunk 提示保留。

未发现尚需修复的 P0/P1/P2 问题。

---

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


---

# 毛孩子动态 · 前端交互预览验收 · 2026-10-26

final result: passed

范围：已选设计的独立前端交互预览。真实 Slack 登录、服务端上传和单向同步尚未接入；本结果不代表这些服务已验收。

## 基准、环境和证据

- 源图稿：design/concepts/pet-social-browse-v2.png、pet-social-publish-v2.png、pet-social-activity-v2.png、pet-social-entry-v2.png、pet-social-states-v2.png、pet-social-icons-v1.png。
- 实现：http://127.0.0.1:5180/dev/social；组件：http://127.0.0.1:5180/dev/gallery?c=SocialWallScreen&state=feed。
- 使用 Codex in-app browser / cua_repl；手机视口 390×844，DPR 1；桌面 1280×720，内容宽度 480px。手机与桌面均实测无横向溢出。
- 来源双画板为 1357×1159 PNG；浏览和详情画板手工框选约 556×1076，以宽度等比缩到 390×755，并在对比画布底部留白至 844，不拉伸图片。生成图并非精确设备截图，像素位置不作严格一比一断言。
- 全图同框：/tmp/moego-social-qa/feed-comparison-final.png、/tmp/moego-social-qa/detail-comparison-final.png。
- 实际画面：/tmp/moego-social-qa/feed-390.jpg、composer-390.jpg、detail-reference-390.jpg、detail-comment-390.jpg、viewer-390.jpg、activity-390.jpg、delete-confirm-390.jpg、mine-long-en-390.jpg、error-en-390.jpg、empty-390.jpg、gate-390.jpg、feed-en-390.jpg、feed-desktop.jpg（均在同目录）。
- 全图按 390px 宽度查看，正文、按钮、表情和计数均可辨认。大图关闭/保存控件另以 viewer-390.jpg 单独检查，因此未再生成放大裁切图。

## 五项视觉检查

1. 字体：复用 MoeGo Rounded / 系统回退字体；动态标题 38px、正文 16px、次要文字 12–14px。英文标题与长英文姓名均无横向溢出。
2. 间距：照片优先、轻分隔，保留可滚动列表与一层评论；主动作与表情触控区域至少 44px。详情较静态图更注重触控行高，长内容可滚动。
3. 颜色：使用现有橙白、炭黑和状态 tokens；原帖链接使用较深蓝色。选中同时使用浅橙底、描边与小勾，不仅靠颜色区分。
4. 图片：使用内置 ImageGen 生成的独立虚构照片，不从整页图稿切取；预览 WebP 为 1200px 等比导出。上传预览用 Canvas 缩放到长边最多 1600，并重新编码 JPEG。大图使用 contain，保持比例。
5. 文案：中英文 key 与 UI_COPY 同步；保留原语言用户内容。始终显示本机演示提示，进入身份页明确“以示例身份进入”，不冒充 Slack 验证。

有意差异：演示模式额外有提示和状态工具栏；Avatar 复用现有稳定配色；照片为虚构示例；新图标遵循用户项目约定用 SVG 实现并经 Icon 使用，未把图标稿切图。实际 HTML 触控行高与响应式排版优先于生成图的近似像素。

## 修正与复查历史

- 首轮：[P2] 标题偏小、列表照片偏高、来源链接留白偏多。已将标题调到 38px，发布按钮加宽，照片比例 2.25:1，并收紧页头、来源区间距；重新保存同框对照。
- 首轮：[P1] 发布页通用图片规则把“添加照片”图标拉满了格子。改成仅命中直接照片子节点；后续真实两张照片选择、发布和详情均通过。
- 首轮：[P1] 深色大图中黑色关闭图标对比不足。改为白色，保存使用既有白色图标，重新打开、切换、关闭并保存截图。
- 首轮：[P2] 详情内重复“更多”入口。仅保留页头入口；重拍详情与删除确认。
- 交互：[P1] 开发过程中移动素材与并行修改语言模块导致热更新页面失去上下文。整页冷加载恢复，稳定资源路径后完整路径可用。此后冷加载和切页无该错误。
- 交互：[P2] 列表与详情切换触发 React 重复 key 警告。为路由片段和帖子视图分配独立键；冷加载后重复列表→详情→返回→消息→返回，检查点之后没有 error/warn。
- 解码按顺序处理，及时关闭位图，避免九张高分辨率照片同时占用内存；已通过类型检查和构建。

## 交互验证

- 点赞 4→5→4，选中和取消状态正确。
- 选择两张 WebP、输入中文文字、选择 Demo Cat、发布后进入详情。
- 添加文字留言；整页刷新后，新动态、两张照片和留言从 IndexedDB 恢复。
- 大图切到 2/2，前后切换、缩略图与关闭可用。
- 删除确认弹层、保留动态操作可用；权限、删除级联、同步隐藏墓碑由纯状态规则测试覆盖。未从浏览器删除真实用户资料。
- 消息按今天/昨天分组，全部已读后去掉未读状态。
- 未发布草稿取消会确认，继续编辑保留输入。
- 空态、失败和重试可用；示例身份入口可进入预览。
- 英文标题、英文长姓名和 390px / 1280px 布局均无水平溢出。

## 工程检查

- npm run typecheck：通过。
- npm test：38 个文件、353 项 Vitest 测试通过；另有 8 项版号检查通过。包含新增 9 项社交状态规则测试。
- npm run build：通过。仍有项目已有的较大主包提示，不影响本阶段产物。
- 后续真实身份、权限、持久化服务、Slack 事件幂等/修改/删除、正式素材与通知仍需单独验收。
- 未进行真实 iPhone 软键盘、横屏真机、浏览器配额耗尽或跨设备同步测试。

## 实施状态

页面、SVG 图标、陈列页和本机存储预览已完成。生产首页不开放社交入口，不连接 Slack，不回写频道；没有推送或部署。后续真实服务接入见 design/reviews/2026-10-26-pet-social-wall/IMPLEMENTATION.md。


# 2026-10-26 · 四位密码 A「独立圆角格」接入验收

final result: passed

## 视觉目标与比较证据

- 选定来源：`design/concepts/four-digit-pin-options-v1.png` 的 A 栏；只替换密码输入，不重做页面、头像、蓝猫、按钮或身份规则。
- 同状态并排比较：`/tmp/pin-a-reference-left-implementation-right.png`（左为 A 栏原图，右为实际组件；两格已填、第三格焦点、确认组空白）。参考截图按 360px 控件宽度等比归一，实际采集为 390 × 844、device scale 1。
- 真实页面：`/tmp/pin-a-live-login-zh-390.png`、`/tmp/pin-a-live-login-en-390.png`。
- 状态证据：`/tmp/pin-a-setup-component-zh.png`、`/tmp/pin-a-confirm-error-zh.png`、`/tmp/pin-a-wrong-login-zh.png`、`/tmp/pin-a-long-name-en-390.png`。
- 窄屏、横屏与桌面：320 × 700、844 × 390、1280 × 900 均无横向溢出；横屏和桌面截图为 `/tmp/pin-a-live-landscape.png`、`/tmp/pin-a-live-desktop.png`。

## 视觉检查

- 字体：沿用项目中英圆体与正文、标签字号；保持真实产品文案，未把对比稿的评审标题、推荐标记或演示说明放进页面。
- 布局：四格等宽、12px 间距、72px 高、14px 圆角，窄屏自动收缩；390 × 844 真实登录页主按钮在首屏可见。首次设置与确认各一组，已有密码的登录仅一组。
- 颜色：沿用 tokens，实际焦点描边计算色为 `rgb(249, 107, 28)`；输入只显示圆点，错误组采用既有 danger / error-bg。没有为生成稿的细微色差另改品牌色。
- 素材：全部复用现有头像、蓝猫和 Icon；四格由 CSS 绘制，没有切图或把整张设计稿嵌入页面。
- 文案：保留现有双语提示及错误键值，只补充输入交互约定。图稿与实现的字号和间距细差遵循已有 tokens，列为有意取舍，无 P0/P1/P2 视觉问题。

## 浏览器交互

使用 Codex 内置浏览器（IAB）实测。真实登录页只做只读观察；以下输入、错误与提交状态使用陈列页的模拟数据，不设置或更改实际账号密码。

- 连续输入、前导零、最多四位、忽略非数字：通过。
- 粘贴带分隔的四位数字（`01 23`）：显示四个圆点；粘贴后可继续键盘编辑。
- 退格、方向键、全选清除：通过；原生密码输入保持一个 Tab 焦点。
- 点击已填格：选择该位，输入可替换而不增加位数；修改后焦点前进。
- 两次不一致：仅确认输入 `aria-invalid=true` 并显示既有错误；修改后清除错误。
- 错误登录：密码组标红；提交中两个输入、提交和返回按钮均禁用。
- PinInput 陈列页 6 个状态（空、部分输入、填满、错误、禁用、长标签）均恰好四格，无溢出；PinLogin 中英、长姓名均检查。
- 页面标题、内容、框架错误覆盖与控制台检查通过；最终实际页面 warn/error 日志为空。

## 工程验证与边界

- `npm run typecheck`：通过。
- `npm test`：38 个文件、359 项 Vitest 测试通过，另有既有版号测试通过。
- `npm run build`：通过，保留项目已有主包体积提示。
- `git diff --check`：通过。
- 本轮未改登录服务端、未执行生产操作、未提交或推送。真实 iPhone 软键盘和第三方密码管理器自动填充尚未实机验证。


## 2026-10-26 追加：四格输入铺满内容区

final result: passed

移除 PinInput 的 360px 宽度上限及对应未使用令牌，四格继续等分，左右与主按钮对齐。实际设置页在 602 × 849 浏览器中，两组输入及按钮均为 448px，左界 77px、右界 525px；独立登录态陈列页和 390 × 844 手机尺寸也验证左右一致、无横向溢出。证据：`/tmp/pin-a-full-width-setup.png`、`/tmp/pin-a-full-width-login.png`。构建及 `git diff --check` 通过；本轮仅调整宽度，不重复执行无关规则测试，未提交或上线。


## 2026-10-26 追加：四格适度收窄并居中

final result: passed

按最新反馈将整组限制为最多 400px，并在可用宽度内居中、两侧至少各留 12px。宽窗口中从 448px 收至 400px，两侧各 24px，每格 91 × 72px；390 × 844 下整组 334px、两侧各 12px，每格 74.5 × 72px，无横向溢出。证据：`/tmp/pin-a-balanced-width.png`、`/tmp/pin-a-balanced-width-mobile.png`。构建与 `git diff --check` 通过，未改输入行为或服务端，未提交或上线。


---

# 毛孩子动态 · 真实服务联调验收 · 2026-10-26

final result: passed

范围：真实前端/API/数据库/私有存储，以及指定 Slack 频道的只读导入。仅在隔离本地环境验收，本任务未执行推送、部署、生产迁移或 Slack 写入。

## 源设计与运行环境

- 源稿：design/concepts/pet-social-{browse,publish,activity,entry,states}-v2.png，pet-social-icons-v1.png。
- 真实服务：http://localhost:5181/moments；联调入口：http://localhost:5181/__social_qa。
- 服务器：127.0.0.1:8811，数据库：本机 54329 / pet_match_social_dev。测试：pet_match_social_test，与现有开发库隔离。
- 使用临时本地联调会话；其创建入口仅在 /tmp/moego-social-live-qa/server.mts，不进入仓库，不设置任何人的 PIN。正式实现复用现有 PIN/HttpOnly 会话，PIN 验证和撤销等由既有鉴权回归覆盖。
- Codex in-app browser / cua_repl，390×844 手机视口和默认 1280×720 桌面。最终手机无横向溢出，冷加载和核心操作后无新 console error/warn。

## 视觉验证

沿用前端阶段同一组组件、设计令牌和 SVG 图标，没有把设计图用作背景或组件图片。前端阶段已做等比同框比较（源双画板 1357×1159，单画板约 556×1076 等比到 390×755，底部留白到 844，不拉伸）。真实阶段只替换数据和持久化 action，保留该层级与布局。

- 字体：现有 MoeGo Rounded/系统回退，38px 动态标题、16px 正文，中英文与长姓名行为保留。
- 间距：真实页面不显示演示标记/调试工具栏；在 390px 下检查列表、编辑器、详情、大图和确认弹层，无遮挡主操作。
- 颜色：继续使用橙白/炭黑 tokens；原帖链接深蓝，选中状态有底色、描边、小勾。深色大图关闭/保存保持白色。
- 图片：Slack 内容使用真实文件，经服务端转正、缩放、去元数据后保存 WebP；没有生成图冒充真实导入。自己上传的联调图是已留档的虚构猫照片。头像来自当前名册/既有头像代理，缺失时使用现有回退。
- 文案：正式页显示真实保存成功、反馈等文案；仅演示入口标注本机演示。保留源语言，转义与常用标准表情按纯文本处理。
- 有意变更：原图中的独立 Slack 验证建议由现有游戏 PIN 登录替代，不要求第二次登录。
- 无新的 P0/P1/P2 视觉问题。此前标题、照片比例、发布图标、深色关闭图标和重复 key 修正沿用；修改数据层后复查没有回归。

## 真实只读同步

- 现有 Bot 已在 #the-pet-corner，具备 channels:history、channels:read、files:read。
- 实际首次本地读取近 30 天：8 条动态、11 张照片；最后检查队列 pending=0、failed=0。
- 原作者、原时间、原帖链接正确；你提供的 Erika 推车照片已实际显示。
- 不导入原反应和回复，未发帖、留言、点赞、删除或编辑任何真实 Slack 消息。
- 修改、删除、乱序、文件删除、重启恢复、短暂 404 与重试由隔离模拟接口测试覆盖，未对真实同事帖子做破坏性测试。
- 队列仅保存定位信息，完成后清空 event 内容；没有保存 Bot 令牌、正文或私有下载地址。
- 真实下载的图片只在忽略 Git 的 server/.store/social-live-qa，确认不进入版本控制。

## 真实写入联调

在独立本地会话“本地联调 QA”中：

1. 从选择器上传虚构猫照片，真实 multipart API 成功，数据库媒体 ready、对象写入本地私有存储。
2. 发布照片和文字，直接进入详情，作者由服务端会话产生。
3. 添加一条留言，页面计数为 1。
4. 小骨头选中 0→1、取消 1→0，服务端计数正确。
5. 整页刷新后，动态、私有照片和留言由服务器恢复；没有使用演示 IndexedDB。
6. 查看私有照片大图、关闭和保存格式正确，文件名为 pet-moment-1.webp。
7. 删除确认/保留动态可用；没有从 UI 删除真实用户数据。删除级联、撤销图片访问和物理清理由服务端测试验证。
8. 无 Cookie 请求真实照片 URL 返回 401，cache-control 为 private, no-store。

最后数据库核对：8 条导入动态、11 张导入照片、1 条本地原生动态、1 条本地留言，队列 0 积压/失败。所有站内写入都在隔离本地库。

## 工程验证

- server npm run typecheck：通过。
- web npm run typecheck：通过。
- server npm test：306 项测试通过（包含 27 项新增社交/同步测试）。
- web npm test：367 项测试通过；另有现有版号检查通过。
- web npm run build、server npm run bundle：通过。
- git diff --check：通过。
- 迁移 019 在隔离本地测试和联调库实际执行；未连接生产。
- 未进行真实 iPhone 软键盘、跨设备、真实 R2 故障和生产部署验证。

## 证据

截图均在 /tmp/moego-social-live-qa/：
- feed-390.jpg：真实频道照片与原作者。
- feed-final-390.jpg：最终联调列表。
- composer-390.jpg：真实媒体上传后的编辑状态。
- detail-390.jpg、detail-final-390.jpg：真实保存的照片和留言。
- viewer-390.jpg：鉴权照片大图。
- delete-confirm-390.jpg：删除确认。
- detail-desktop.jpg：桌面检查。

前端同框：/tmp/moego-social-qa/feed-comparison-final.png 和 detail-comparison-final.png；真实阶段沿用同一组件，截图中的人物/计数由真实数据代替演示，不能把数据差异当作视觉错误。对照源原画板本身非精确设备比例，未声称像素一比一还原。

当前可交付本地联调。正式开关默认关闭，后续部署必须包含 018/019 和已有登录模块，见 deploy/SOCIAL_WALL.md。
