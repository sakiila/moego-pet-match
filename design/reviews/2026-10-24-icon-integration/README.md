# 图标接入游戏 · 逐阶段记录（2026-10-24）

任务说明：[ICON_INTEGRATION_GOAL.md](../../ICON_INTEGRATION_GOAL.md)。截图由本地 Chrome 无头模式（Playwright，系统 Chrome）对 `localhost:5180` 截取，页面截图为 390 × 844、2 倍像素。

## 第 0 阶段：基础

- `assets/icons/library-original-png-v2/export_web.py`：从 49 枚母版裁到可见边界后等比缩小，输出到 `web/src/ui/icons/png/<name>@<w>.png`（32／48／72／96／144／192／288，不超过母版自身尺寸，不放大），并生成 `web/src/ui/icons/catalog.ts`（图标名类型与可用宽度）。共 321 个文件、5.8 MB；构建时全部进入 dist，但浏览器只按需下载实际用到的尺寸。
- `ui/primitives/Icon.tsx`：`<Icon name size label? />`。`srcset` 按显示尺寸自动选 1x／2x／3x；无 `label` 时 `alt=""` 且读屏跳过，有 `label` 时作为读屏名称。称号框按原比例算宽度。调用处只认 `name`，以后矢量化只改 `Icon` 与 `ui/icons`。
- `Icon.gallery.tsx`：全部 49 枚，浅色、品牌橙、鱼关深蓝三种底色，各 24／32／48 px；另列称号框与只有图标时的读屏名称示例。截图：`00-icon-gallery.png`。
- 文档：AGENTS.md 组件化规则加 PNG 例外（待矢量化）；ICON_REDESIGN_PLAN「接入游戏」、DESIGN_NOTES 补记本轮决定。
- 鱼关深蓝底边缘：用 96 px 导出合到 `#0b2a4d` 后放大核对 close、back、大浪花、海螺、珍珠贝壳、催单小票、完成章、星形、时钟、退出、设置、皇冠，未见浅色毛边；投影呈半透明深灰，属原稿投影。纯炭黑图标（如关闭）在深蓝底上对比度低，鱼关里只在浅色纸面（弹层）上使用。
- 验收：`npm run typecheck`、`npm test`（125 通过）、`npm run build` 均通过。本阶段未改页面。
- 同时期另一会话在仓库中加入了 Clock In／Clock Out（身份文案、PlayerMenu、HomeScreen、App、i18n、规则文档），本任务在其基础上做精确替换，不回退或覆盖那部分改动。

## 第 1 阶段：门店流程

改动：
- `Button` 新增 `iconName`（按钮尺寸决定图标 32／22 px）；图标与文字放在同一行内排版，长文案折行时整体居中，中文只在空格处折行（`word-break: keep-all`），英文 `overflow-wrap: anywhere` 兜底。`icon` 仍可传自定义内容（鱼关单鱼贴纸用）。
- `NavTile`：`icon` 改为图标名，52 px；三列等分，相邻入口之间加细分隔线（按 home-entry-icons-v3 与 mobile-home-v2）；`Screen.module.css` 的 `.navRow` 去掉间距，由入口自身留白。报告页的三个入口因类型变化一起换为 pet-collection／leaderboard／back-to-shop（第 3 阶段再核对版式）。
- 首页「开始营业」、身份确认按钮、图鉴详情卡「开始营业」：白色爪印 open-shop-white。
- 首页店长柜台的 🐾 换为 open-shop（26 px）。
- BrandHeader「回门店」：back-to-shop 22 px + 文字。
- InfoSummary：information；PhotoNotice：choose-photo。

截图：`01-home-zh.png`、`01-home-en.png`、`01-identity-zh.png`、`01-identity-en.png`；陈列页 `01-gallery-navtile.png`、`01-gallery-button.png`、`01-gallery-brandheader.png`、`01-gallery-managercard.png`、`01-gallery-infosummary.png`、`01-gallery-photonotice.png`。

与图稿（mobile-home-v2、home-entry-icons-v3、mobile-identity-v2）对比：
- 一致：主按钮白爪印＋文字居中；三入口为书本、奖杯、猫狗头像，图标在上、粗体文字在下，入口之间细竖线；照片提示左侧相机。
- 差异：图稿的「我的宠物」是单只狗，已确认的 home v3 改为猫狗组合，按 v3；猫狗图标横向较宽，同为 52 px 高度框时看上去略小。店长柜台、页头字标等非图标部分保持现状，属后续逐页还原范围。
- 身份页按钮中文「以 Bob 身份 Clock In」在 390 px 下折为两行（Clock In 文案由另一会话加入，此前同样折行）；现在图标跟在首行前，两行均衡居中。
- 选中同事卡片的 ✓ 与搜索框的放大镜／清除仍为原样：✓ 为文字符号状态标记，搜索与清除在第 4 阶段处理。

验收：typecheck、test（125 通过）、build 通过。

## 第 2 阶段：开局与局内

改动：
- 新增 `components/ModeMark`：普通局爪印（橙底按钮上用白色版），鱼关天蓝色单鱼贴纸 `/img/fish/fish_color_blue/128`；贴纸画布留白多，CSS 视觉放大 1.4 倍，不改占位；图片失败时不显示。陈列页 `ModeMark.gallery.tsx`。
- PrepScreen「开始这班」、LineupPanel「本局来客」标题：ModeMark。
- RulesCard：adjacent-swap、tap-swap、time-left。
- StatusPanel：time-left、score（36 px），删除手画 SVG。
- TipBar：梳子 comb-horizontal、剪刀 scissors、吹风机合成与发动 hair-dryer、海螺 conch-horizontal、珍珠贝壳 pearl-shell、大浪花合成与发动 big-wave、合体 tool-combo、卡住提示 tap-swap、洗牌 automatic-shuffle、最后 10 秒与收尾 time-left；其他无专属图标的提示用 information。宠物事件提示仍显示宠物头像。
- ToolPiece：8 枚道具 PNG（普通局梳子横／竖、剪刀、吹风机；鱼关海螺横／竖、珍珠贝壳、大浪花），图标占棋格 90%；删除手画 SVG 与单独叠加的方向角标。读屏名称改为海螺／珍珠贝壳。
- RushBar：左侧 rush-ticket／completed-mark／expired-ticket（42 px），文字在右，按 rush-feedback-original-v1 排布；标题 16 px、单行；窄屏时先省略目标说明，槽位允许收缩，固定高度不变。
- BoardScreen 底栏：settings + 设置、退出 + exit。
- SettingsDialog：标题齿轮 settings，语言 language、背景音乐 music、消除音效 sound-effects、轻震 haptics；设备不支持轻震时图标淡化（0.45）。
- 鱼关改名：i18n `fish.conch`／`fish.pearl_shell`（含 `_hint`）、`tutorial.conch`／`tutorial.pearl_shell`、`tutorial.big_wave_merge`；`game/tips.ts`、`game-layer.test.ts`、Board 注释、TipBar 陈列页与 UI_COPY 同步（UI_COPY 第 8 节补记 2026-10-24 改名说明）。

截图：`02-prep-zh.png`、`02-board-zh.png`、`02-fish-prep-zh.png`、`02-fish-prep-en.png`、`02-fish-board-zh.png`、`02-toolpiece-44-dpr3.png`（3 倍像素）、`02-rushbar-358.png`（鱼关催单 358 px 实宽）；陈列页 `02-gallery-*.png`（toolpiece、rushbar、tipbar、statuspanel、settingsdialog、rulescard、lineuppanel、modemark、board）。

与图稿对比：
- 催单（rush-feedback-original-v1）：左图标右文字、三态同位置同高度，普通／鱼关一致；鱼关 358 px 宽下标题、剩余秒数与目标完整显示。
- 设置（settings-feedback-original-v1、mobile-settings-v1）：四枚图标与禁用淡化一致。
- 棋盘（mobile-board-v3、mobile-fish-board-v1）：计时／分数图标与底栏设置、退出到位；道具棋子在真实对局中需匹配后才出现，本次以陈列页 Board／ToolPiece 状态核对，未在真实对局截到道具。
- 道具角标：44 px 棋格、3 倍屏下，竖向 ↕ 与十字 ＋ 清楚；横向梳子／海螺原图偏宽，等比放进方形后横向角标约 8 CSS px，箭头仍可辨认，且梳子／海螺的横向姿态本身区分方向。判断为可辨认，未触发停止条件；若试玩觉得偏小，可只放大横向两枚的显示比例（不改原图）。
- 鱼关深蓝底上的退出门图标描边对比度较低，但白色门板与橙色箭头清楚。
- 局内宠物事件提示里的占位宠物 emoji 属陈列页占位数据，不在替换范围。

验收：typecheck、test（125 通过）、build 通过。

## 第 3 阶段：结算

改动：
- 新增 `components/TitleStamp`：称号框 title-stamp 整图不拉伸（默认宽 156 px），文字放在测得的白色内框中部（原图宽 8%–86%、中线高 55%），随框身旋转 −5.5°。字号分档：中文 ≤6 字 16 px、7 字 14 px、8 字 12 px，保证一行；英文 14 px，超过 14 个字符降到 12 px（下限），最多两行。陈列页列出全部 6 个称号的中英文、最长英文 156／180 宽与鱼关纸面。
- ScoreCard：称号印章改用 TitleStamp（原图已倾斜，入场动画只保留缩放落章，扩散环改为贴合框身并同角度倾斜）；MVP 名牌前加 mvp-medal（普通／鱼关共用）；新纪录改为 new-record-flag + 橙色「个人新纪录！」（按 report-marks-original-v4，去掉黄色胶囊底）；已保存标记 completed-mark + 文字；MVP 下架时的通用爪印由手画 SVG 改为 open-shop。
- ReportScreen：再来一局用 ModeMark（普通爪印／鱼关单鱼），分享成绩用 share-image；底部入口第 1 阶段已换。
- ShareSheet：保存图片 save-image-white（橙底主按钮）、分享图片 share-image；生成失败时的重试按钮用 retry，并改为白底次按钮——retry 的橙色箭头在橙底上会融进底色。
- 重试统一：StatusMessage 新增 `actionIcon`，报告保存重试、准备页、身份页、排行榜读取失败传 retry；图鉴、我的宠物、详情卡的重试按钮用 `iconName="retry"`（第 4 阶段的页面在这里一并完成）。
- FishInvitation：🐠 换为天蓝色单鱼贴纸（ModeMark）。
- Button：整宽大按钮按自身宽度缩放文字（`min(--text-xl, 13cqi)`，容器查询）、左右内边距 16 px。并排的两个大按钮（报告页、分享弹层）带图标后不再被挤成三行；整宽单按钮在 390 px 下仍为 28 px。

截图：`03-report-zh.png`（普通局，中文）、`03-report-fish-en.png`（鱼关，英文）、`03-report-share-zh.png`（分享弹层）；陈列页 `03-gallery-scorecard-en.png`（含新纪录、最长英文、零服务、MVP 下架、鱼关）、`03-gallery-titlestamp.png`（2 倍像素）、`03-gallery-sharesheet.png`、`03-gallery-fishinvitation.png`。

与图稿对比（mobile-report-top-v2、mobile-fish-report-v1、report-marks-original-v4）：
- 一致：分数右上已保存标记；称号印章在 MVP 贴纸右上方压角；MVP 名牌前奖章；新纪录小旗 + 橙字；底部「再开一局 / 分享成绩」并排，分享带向上箭头。
- 差异：图稿 v2 的称号为带爪印的缎带章，已按后来确认的 v4 圆角称号框实现；名牌为椭圆胶囊（图稿为骨头形），统计区为列表（图稿为三列带图标），小票、骨头名牌、统计图标属逐页还原范围。英文「Share Results」在半宽按钮里折两行，图标跟在首行前。
- 最长英文称号「Whole-Shop Cleanup Chief」在 156 px 框、12 px、两行下完整显示，未触发停止条件。
- 整页截图里固定底栏与水下背景位置是截图方式（fullPage）造成，不代表页面布局。

验收：typecheck、test（125 通过）、build 通过。

## 第 4 阶段：局外页

改动：
- 新增 `components/RankMark`：第 1／2／3 名为 rank-1 皇冠、rank-2 盾牌、rank-3 六角章（读屏读名次数字），按实际名次显示，并列共用同一徽记，其后为数字。Podium（52／44 px，替换 👑）与 LeaderboardRow（36 px）使用；本人行原有橙色高亮不变。陈列页列出 1·2·3·4·12、并列 1·2·2·4、领奖台尺寸与鱼关主题。
- Tabs 选项新增可选 `icon`；排行榜模式页签用 ModeMark（选中的橙底页签用白色爪印），「再挑战一次」按钮用 ModeMark。
- 新增 `components/EmptyState`：零收集用 empty-collection（图标在左、文字在右，下方仍列出未收集），搜索无结果用 empty-search（图标在上）。
- PetdexScreen：零收集提示改为「没有任何已收集宠物、且未在搜索」时显示（UI_COPY 第 6 节「`collection.empty` 仅在没有任何已收集宠物时显示」，此前只在列表为空时显示，与规则不符，借此对齐）；搜索无结果单独显示 EmptyState。「添加我家毛孩子」次按钮用 open-shop。
- PetCard：已收集卡片右上角入册书签 collected-bookmark（collection-marks-original-v1）。
- MyPetCard：已收集状态用 collected-bookmark；未收集只保留文字胶囊（原手画横线圆标删除，第 8 批没有「未收集」专属图标）。
- PetDetailCard：关闭按钮 close；可翻面时卡片右上角显示 flip-card（装饰提示，整张卡仍是翻面按钮，读屏用原 aria-label）。
- Sheet 关闭 close；SearchInput 放大镜 search、清除 close（14 px）。
- PhotoPicker：空态 choose-photo（56 px）、换一张 change-photo；UploadReceived：完成 completed-mark（72 px）、继续营业 open-shop-white、回门店 back-to-shop；我的宠物「添加我家毛孩子」主按钮 open-shop-white；上传提交 open-shop-white（提交中不显示图标）。

截图：`04-leaderboard-zh.png`、`04-leaderboard-fish-en.png`、`04-petdex-zh.png`、`04-petdex-search-empty-zh.png`、`04-pet-detail-zh.png`、`04-my-pets-zh.png`、`04-upload-zh.png`；陈列页 `04-gallery-*.png`（mypetcard、petcard、petdexscreen、leaderboardrow、podium、rankmark、emptystate、searchinput、sheet、photopicker、uploadreceived、petdetailcard、statusmessage、tabs、mypetsscreen、leaderboardscreen）。

与图稿对比：
- 排行榜（leaderboard-marks-original-v1、mobile-leaderboard-v1）：前三徽记、并列共用、本人行橙色高亮一致；领奖台布局沿用现有 2·1·3 卡片。
- 图鉴（collection-marks-original-v1、mobile-petdex-v1）：书签位置、零收集「空白图鉴册＋文案」与未收集剪影列表、搜索无结果索引卡一致；图稿零收集文案分两行写，现为单段自动换行。
- 详情卡（mobile-pet-detail-v2）：关闭在右上；图稿以文字入口提示翻面，现以角上 flip-card 图标提示，未新增按钮。
- 选中同事卡片的 ✓ 保留（橙色圆底文字勾，属状态样式，图标库无同类小勾）；「去看看 ›」「查看资料 ›」的 › 为文字箭头，图标库无向前箭头，保留。

验收：typecheck、test（125 通过）、build 通过。

## 第 5 阶段：全流程核对

- 普通局：身份页（中／英）→ 首页（中／英）→ 准备页 → 棋盘 → 报告页（`?report=greedy`）→ 分享弹层（`?report=casual`）→ 排行榜 → 图鉴（含搜索无结果）→ 详情卡 → 我的宠物 → 上传页；门店设置与局内设置弹层。
- 鱼关：排行榜鱼关页签（英）→ 准备页（中／英）→ 棋盘 → 报告页（`?report=greedy&mode=fish`，英）。
- 陈列页鱼关主题（英文）：`05-gallery-fish-*.png`（icon、navtile、button、tipbar、statuspanel、rushbar、lineuppanel、rulescard、scorecard、tabs）。截图另见 `05-settings-shop-zh.png`、`05-board-settings-zh.png`。
- 全局搜索 `web/src` 的 components／screens／ui／app（排除陈列页与注释）：界面上的 emoji 与手画图标 SVG 已清空。保留项：选中同事卡片的 ✓（文字状态标记）、道具读屏名称里的 ↔↕、「去看看 ›」等文字箭头；PetDetailCard 的闪光、底纹、火花与 UnderwaterBackdrop 的气泡、海底为装饰效果，不是图标；占位宠物数据里的 emoji 按约定排除。
- 验收：typecheck、test（125 通过）、build 通过。

# 交付说明

## 改动的文件

新增：
- `assets/icons/library-original-png-v2/export_web.py`；`web/src/ui/icons/`（`catalog.ts` 与 `png/` 321 个尺寸文件）
- `web/src/ui/primitives/Icon.tsx`、`Icon.module.css`、`Icon.gallery.tsx`
- `web/src/components/ModeMark/`、`TitleStamp/`、`RankMark/`、`EmptyState/`（各含 tsx、css、gallery）
- `design/ICON_INTEGRATION_GOAL.md`、本目录记录与截图

修改（本任务）：
- 基础组件：`ui/primitives/Button`（iconName、行内图标、整宽大按钮随宽度缩放文字）、`Tabs`（选项 icon）、`Sheet`、`SearchInput`
- 领域组件：NavTile、BrandHeader、ManagerCard、InfoSummary、PhotoNotice、RulesCard、LineupPanel、StatusPanel、TipBar、ToolPiece、RushBar、SettingsDialog、ScoreCard、ShareSheet、StatusMessage、SaveStatus、FishInvitation、Podium、LeaderboardRow、PetCard、MyPetCard、PetDetailCard、PhotoPicker、UploadReceived、Board（注释），以及相关 `.gallery.tsx`
- 页面：HomeScreen、IdentityScreen、PrepScreen、BoardScreen、ReportScreen、LeaderboardScreen、PetdexScreen、MyPetsScreen、UploadScreen、`Screen.module.css`（`.navRow` 去间距）
- 文案与逻辑：`i18n/zh.ts`、`i18n/en.ts`（鱼关改名）、`game/tips.ts`、`game/__tests__/game-layer.test.ts`
- 文档：AGENTS.md（PNG 例外）、UI_COPY.md（鱼关改名）、design/DESIGN_NOTES.md、design/ICON_REDESIGN_PLAN.md

不属于本任务、同时期由另一会话加入的改动（未回退、未覆盖）：Clock In／Clock Out（`components/PlayerMenu/`、`app/App.tsx`、`HomeScreen.tsx` 的身份菜单部分、`HomeScreen.gallery.tsx`、i18n 的 `identity.*`／`action.clock_out`、V1_RULES、GAME_FLOW、UI_COPY 的相应段落）。

## 与图稿的主要差异

- 只接入图标并调整所在区域，页面其余部分未做逐页还原：店长柜台、骨头名牌、小票纸边、统计三列图标、页头字标等仍为现状。
- 首页「我的宠物」按 home v3 用猫狗组合（mobile-home-v2 为单狗）。
- 报告页称号按 v4 圆角称号框实现（mobile-report-top-v2 为旧缎带章）。
- 详情卡用角上 flip-card 提示翻面，没有加文字入口。
- 分享弹层生成失败的重试按钮改为白底次按钮，避免橙色箭头融进橙底。
- 并排大按钮文字随宽度缩小（390 px 下约 22 px）；英文「Share Results」在半宽按钮里折两行。
- 图鉴零收集提示按 UI_COPY 改为「没有任何已收集宠物」时显示（此前仅在列表为空时显示）。

## 未实际运行验证的内容

- 真实对局中的道具棋子、催单三种状态、局内带教／洗牌提示：只在陈列页（Board、ToolPiece、RushBar、TipBar 各状态）核对，没有在真实对局里触发并截图。
- 报告页新纪录小旗：真实结算未刷新个人最好，只在陈列页 ScoreCard 状态核对；零服务与 MVP 下架同样只在陈列页核对。
- 上传提交成功页（UploadReceived）、删除申请、我的宠物有已上架宠物的情况：只看陈列页，未实际提交。
- 只用 Chrome 无头模式在 390 × 844、2 倍像素下核对；没有在真机 Safari／3 倍屏、横屏、桌面宽屏下检查，也没有做键盘与读屏实测。
- 生产构建只确认 `npm run build` 通过，未运行生产镜像。

## 遗留问题与建议

- 横向梳子／海螺的方向角标在 44 px 棋格上约 8 CSS px，可辨认但比竖向小；若试玩觉得偏小，可只放大这两枚的显示比例（不改原图）。
- 鱼关深蓝底上，纯炭黑描边的图标（退出门、关闭）对比度偏低；目前关闭只出现在浅色纸面上，退出门板为白色仍可辨认。
- PNG 图标共 5.8 MB（全部进入构建产物，浏览器按需下载），待矢量化时整体替换 `ui/icons` 与 `Icon` 内部。
- 天蓝色单鱼贴纸走 `/img` 代理，读取失败时鱼关标识不显示（按钮文字照常）。
- 本任务未提交 git、未部署。

## 停止条件逐条核对（重读 ICON_INTEGRATION_GOAL.md 后补记）

| 停止条件 | 核对结果 |
| --- | --- |
| 有界面位置在图标库里找不到合适的图标 | **触发，需用户决定**：① 选中同事卡片的圆形 ✓（库里只有带框的完成章与书签，没有单独小勾）；② 「去看看 ›」「查看资料 ›」的向前箭头（库里只有向左的返回箭头）；③ 「我的宠物」未收集状态原有的横线圆标（第 8 批没有未收集图标）。执行时我自行决定 ①② 保留原文字符号、③ 只留文字胶囊，没有先停下来报告，现补报。鱼关无鱼图标一项已由用户事先决定用天蓝色单鱼贴纸，不属于此条。 |
| 道具图标在 44 px 棋格上方向角标看不清 | 未触发：3 倍屏下竖向与十字清楚，横向约 8 CSS px 仍可辨认（截图 `02-toolpiece-44-dpr3.png`）；属主观判断，列入遗留问题。 |
| 图标在鱼关深蓝底上出现明显浅色毛边 | 未触发：96 px 导出合到 `#0b2a4d` 放大核对 12 枚，无浅色毛边。 |
| 英文称号在字号下限下仍放不进称号框 | 未触发：「Whole-Shop Cleanup Chief」在 156 px 框、12 px、两行完整显示（`03-gallery-titlestamp.png`）。 |
| 规则文档冲突，或需要改动玩法和流程 | 未触发冲突：图标计划写「吹风机与大浪花仅全盘演出」与 V1_RULES「真正的棋子」不一致，按权威顺序以 V1_RULES 为准（任务说明第 7 条已事先确认）；图鉴零收集提示原代码与 UI_COPY 不符，改代码对齐 UI_COPY，未改文档或玩法。 |

## 交付后的后续改动（用户另行要求，记录在 2026-10-24-page-polish）

图标接入交付后，用户又提出页面美化要求，以下改动覆盖了本任务的部分结果，详见 [../2026-10-24-page-polish/README.md](../2026-10-24-page-polish/README.md)：

- 图鉴卡片的入册书签、详情卡的翻面图标按用户要求去掉（第 4 阶段新增的这两处不再显示）。
- 按钮图标的垂直对齐改为按首行行高居中（修正第 1 阶段起图标偏低约 4 px）。
- 排行榜徽记改为第 1 名最大、依次递减，领奖台按位置做台阶高度，「再挑战一次」吸底。
- 全站改用圆润字体；登录页、首页改用官方 Logo、标题字标、店面插画与选中蓝猫。

## 补充批：三处缺失图标（用户选择「补设计图标」后完成）

- Codex image_gen 按原稿风格生成 [补充批效果图](../../concepts/supplement-marks-original-v1.png)（请求见同名 `-prompt.txt`），用户确认「三枚图标可以」。
- `assets/icons/library-original-png-v2/split_supplement.py` 本地拆图去白底（不重绘），母版在 `masters/11-supplement/`：`selected-check`、`forward-arrow`、`uncollected-bookmark`；`export_web.py` 纳入补充批，图标库现为 52 枚。
- 接入：ColleagueCard 选中 ✓ → selected-check（32 px）；FishInvitation「去看看」与 MyPetCard「查看资料」末尾 › → forward-arrow（16 px）；MyPetCard 未收集状态 → uncollected-bookmark（22 px），与已收集书签成对。
- 截图：`06-identity-selected-check.png`、`06-gallery-mypetcard.png`、`06-gallery-fishinvitation.png`。全局搜索界面代码已无 ✓、› 文字符号。
- 验收：typecheck、test（125 通过）、build 通过。上文停止条件第一条（找不到合适图标）至此已由用户决定并处理完毕。
