# 图标接入任务说明 · 2026-10-24

目标：把已确认的 49 枚原稿 PNG 图标接入 MoeGo 毛孩子全明星游戏，替换界面中所有系统 emoji 和手画 SVG 图标，并调整图标所在区域的版式，使整个流程与已选定图稿的风格一致。不做逐页完整视觉还原，也不新增动效。

## 背景与依据
- 先读 AGENTS.md，按其中的文档权威顺序办事：V1_RULES > GAME_FLOW > TECH_PLAN/IMPLEMENTATION_PLAN > UI_COPY > design/DESIGN_NOTES。
- 图标来源：assets/icons/library-original-png-v2/，包括 masters/ 下 10 组 49 枚母版、README.md、manifest.json、build.py。总览图是 overview.png。
- 对应图稿：design/DESIGN_NOTES.md「选定展示文件」中的十批图标图稿，以及各页面手机图稿（mobile-*.png）。
- 现状参考：design/reviews/2026-10-23-components/ 下的截图与 README。

## 已确认的决定（不要再问）
1. 范围：方案 A，即接入图标并调整图标所在区域；逐页完整还原以后再单独做。
2. 接入方式：先用 PNG。用 build.py 从母版等比导出需要的 1x、2x、3x 尺寸到 web/src/ui/icons/，由 Vite 打包。新增 web/src/ui/primitives/Icon.tsx：图标名用类型约束，放到 2 倍、3 倍屏上也要清晰；图标旁已有文字时读屏跳过它，只有图标的按钮必须传读屏名称。组件内部只负责找到图片地址，以后换成 SVG 时调用处不用改。在 AGENTS.md 的组件化规则里加一条例外：「已确认图标库可用 PNG，待矢量化」。不要重绘，也不要矢量化任何图标。
3. 鱼关道具改用 V1_RULES 已定的名字。i18n 的 key 一并改名，UI_COPY 同步更新：
   - fish.conch：海螺 | Conch
   - fish.conch_hint：和邻格交换，螺口喷出水流，清一行或一列。| Swap with a neighbor to sweep a row or column.
   - fish.pearl_shell：珍珠贝壳 | Pearl Shell
   - fish.pearl_shell_hint：和邻格交换，贝壳一开，清出一个十字。| Swap with a neighbor. It pops open and clears a row and column.
   - tutorial.conch：海螺：和邻格交换，螺口喷出水流，清一行或一列。| Conch: swap with a neighbor to sweep a row or column.
   - tutorial.pearl_shell：珍珠贝壳：和邻格交换，贝壳一开，清出一个十字。| Pearl Shell: swap with a neighbor to clear a row and column.
   - tutorial.big_wave_merge：两个珍珠贝壳相邻交换，合成大浪花！| Swap two neighboring pearl shells to merge them into a big wave!
   - UI_COPY 称号条件说明里的「气泡机双合体」改为「珍珠贝壳双合体」。
   - 以下不变：fish.big_wave、tutorial.big_wave，以及评语中的「水流」「水花」。
4. 鱼关图标：图标库里没有鱼。鱼关的按钮、排行榜鱼关页签、准备页客人标题、鱼关邀请，统一用天蓝色单鱼贴纸 fish_color_blue，走现有的 /img/fish 代理（128 px）。
5. 称号框（06-report/title-stamp.png）：整图不拉伸，保持原稿比例；文字跟着框一起倾斜约 8°。中文一行；英文放不下时最多折两行并略缩字号，字号设下限。必须用最长的称号「Whole-Shop Cleanup Chief」在 390 px 宽度下实测。
6. 只接静态图标，不新增动效；已有动画保持不变。
7. 吹风机和大浪花按 V1_RULES 是真正的棋子，棋盘上也要用它们的 PNG。道具 PNG 自带方向角标，接入时删掉 ToolPiece 里手画的 SVG 和单独叠加的方向角标。

## 阶段（按顺序执行，每个阶段完成并验证后再进下一个）
0. 基础：导出图标、写 Icon 组件及其陈列页条目（Icon.gallery.tsx 列出全部 49 枚，放在浅色、橙色、鱼关深蓝三种底色上，各显示 24、32、48 px）；更新 AGENTS.md 例外条款，在 ICON_REDESIGN_PLAN.md 和 DESIGN_NOTES.md 补记本轮决定与「待矢量化」。本阶段不改任何页面。
1. 门店流程：
   - 首页：开始营业按钮用白色爪印（open-shop-white）；三个入口换成图鉴书（pet-collection）、奖杯（leaderboard）、猫狗头像（my-pets），入口卡按 home-entry-icons-v3.png 调整。
   - BrandHeader 的回门店用小店图标（back-to-shop）。
   - 身份确认按钮、InfoSummary（information）、PhotoNotice（choose-photo）的 emoji 换掉。
2. 开局与局内：
   - RulesCard 用相邻交换（adjacent-swap）、两步点选（tap-swap）、时钟（time-left）。
   - LineupPanel 客人标题：普通局用爪印，鱼关用单鱼。
   - StatusPanel 用 time-left 和 score。
   - TipBar：道具提示用道具缩略图，合体用 tool-combo，洗牌用 automatic-shuffle，操作提示用 tap-swap。
   - ToolPiece 换成 8 枚 PNG。
   - RushBar 三种状态：加急 rush-ticket、完成 completed-mark、未赶上 expired-ticket。
   - BoardScreen 的设置（settings）和退出（exit）。
   - SettingsDialog 四个开关：语言 language、背景音乐 music、消除音效 sound-effects、轻震 haptics。
   - 鱼关改名：i18n、UI_COPY、相关测试和陈列页一起改。
3. 结算：
   - ScoreCard：MVP 奖章（mvp-medal）、新纪录小旗（new-record-flag）、称号框（title-stamp）、已保存提示。
   - ReportScreen 底部入口（图鉴、排行、回门店）和再来一局：普通局用爪印，鱼关用单鱼。
   - ShareSheet：保存（save-image / save-image-white）和分享（share-image）；重试按钮用 retry；FishInvitation 用单鱼。
4. 局外页：
   - 排行榜：前三名用 rank-1、rank-2、rank-3，并列时按实际名次；本人行保持原有高亮；模式页签换成爪印和单鱼。
   - 图鉴：卡片入册书签（collected-bookmark），零收集空态（empty-collection），搜索无结果（empty-search）。
   - MyPetCard、PetDetailCard 的翻面（flip-card）和关闭（close）。
   - 上传与 PhotoPicker：选择照片（choose-photo）、换一张（change-photo）。
   - Sheet、Dialog、SearchInput 的关闭和搜索图标。
5. 收尾：
   - 走完整流程截图：普通局和鱼关都要走，报告页用 ?report=greedy 和 &mode=fish 直接进。
   - 检查陈列页全部状态：中英文、长英文名、鱼关主题。
   - 写交付说明。

## 约束
- 遵守 AGENTS.md 组件化规则：页面只组合组件；样式只引用 tokens；数据全部来自 props；文案经 i18n 读取；每个改动的组件都更新对应的 .gallery.tsx。
- 只改与本目标相关的代码，不做无关重构。不改 tools/pet-studio、engine 规则、服务端结算或数据库；不改宠物和单鱼源素材，也不改图标母版的像素。
- 不提交 git，不部署，不碰 .env、Supabase 或 DMIT 服务器。
- 本地开发服务已有 .claude/launch.json（web 端口 5180，server 端口 8787），用 preview 工具启动，不要用 Bash 起服务。

## 每个阶段的验收
- 在 web/ 下跑通 npm run typecheck、npm test、npm run build；改动涉及 server 时也跑 server 的测试。
- 在浏览器 390×844 下截图，与对应的已选定图稿对比，写明差异；检查陈列页里相关组件的全部状态。
- 截图和每阶段说明保存到 design/reviews/2026-10-24-icon-integration/。
- 全局搜索确认没有残留的界面 emoji 或旧手画图标。排除项：宠物占位数据里的 emoji，以及「中 / EN」切换等纯文字。

## 遇到以下情况先停下来报告，不要自行决定
- 有界面位置在图标库里找不到合适的图标。
- 道具图标在真实棋格（约 44 px）上方向角标看不清。
- 图标在鱼关深蓝底上出现明显的浅色毛边。
- 英文称号在字号下限下仍放不进称号框。
- 发现规则文档之间有冲突，或者需要改动玩法和流程。

## 完成标准
五个阶段全部完成，每个阶段都有验收记录和截图；交付说明列出改动的文件、与图稿的差异、未实际运行验证的内容，以及遗留问题。
