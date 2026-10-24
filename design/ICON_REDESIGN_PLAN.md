# 图标重设计 · 回归原稿风格

> **当前交付：按原稿直接拆分的透明 PNG v2。** 用户已明确选择本地拆分与去底，47 枚主图标及原稿已有的 2 枚白色版本已完成。此前 SVG 重绘稿样式未通过，已退回；原始选定图稿未改变。

2026-10-23，用户指定查看 `/Users/bob/Documents/Codex/2026-10-21/build-web-apps-plugin-build-web-2/outputs/` 的原始设计，重新设计所有图标，并先提交首页入口效果图。此要求取代此前以高光轻立体贴纸逐批扩展的方向。

## 当前视觉基准

已直接查看原始手机首页、桌面首页、身份页与手机图鉴。以手机首页的实际入口图标为主：炭黑圆角描边、橙白主色、少量柔和层次、两笔橙色短线；辅助蓝色仅少量使用。缩小后先保证轮廓与用途清楚，减少强高光、金属倒角和厚重深蓝外沿。

生成输入使用了用户指定目录内的 `moego-mobile-home-v2.png`、`moego-home-v2.png`、`moego-mobile-identity-v2.png`，原文件副本与哈希保存在 `concepts/sources/home-entry-icons-v3/`。旧桌面图的公共鱼缸、进度与入口仅属历史构图，不恢复其已取消规则。

## 本轮审阅

[首页入口 v3 效果图](concepts/home-entry-icons-v3.png)；[完整提示词](concepts/home-entry-icons-v3-prompt.txt)。2026-10-23 已获用户「可以，继续设计下一批」确认，作为后续图标的视觉基准；全套独立素材现已完成，见下方「独立图标制作」，未接入代码。

四枚对应当前首页已有动作：

- 开始营业：单个爪印，橙底按钮使用同轮廓的白色版本。
- 宠物图鉴：橙色封皮、浅色书页与小书签的打开相册。
- 排行榜：浅色杯形奖杯、中央橙星，完整双把手与底座。
- 我的宠物：前景白色垂耳犬与后方蓝猫的简洁头像组合。

效果图同时演示一个主按钮与下方三个次级入口，保留现有页面结构与文案。此批不含回门店，也不新增首页鱼关入口。

## 后续范围

首页方向确认后，已按已有界面逐批设计并完成审阅。下列保留原分组；用户随后明确要求完成全部独立素材，当前已统一制作交付，未授权接入游戏：

| 顺序 | 图标组 | 状态 |
| --- | --- | --- |
| 1 | 首页四入口 | v3 已确认 |
| 2 | 常用导航与功能：返回、关闭、搜索、设置、选择照片、分享图片、翻面、信息说明 | [通用功能 v1](concepts/common-function-icons-v1.png) 已确认 |
| 3 | 局内操作与状态：相邻交换、点选交换、合体、自动洗牌、时间与分数 | [局内操作 v1](concepts/round-operation-icons-v1.png) 已确认 |
| 4 | 普通／鱼关道具及其方向与能力标识，保留全盘演出的既定用途 | [道具动感版](concepts/tool-family-original-v6.png) 已确认 |
| 5 | 催单：加急、完成、未赶上 | [催单反馈 v1](concepts/rush-feedback-original-v1.png) 已确认 |
| 6 | 结算：MVP、新纪录与称号标记 | [结算标记 v4](concepts/report-marks-original-v4.png) 已确认 |
| 7 | 排行榜前三名徽记与本人行适配 | [名次徽记 v1](concepts/leaderboard-marks-original-v1.png) 已确认 |
| 8 | 图鉴收集标记与必要空态 | [图鉴收集与空态 v1](concepts/collection-marks-original-v1.png) 已确认 |
| 9 | 核对补齐：语言、背景音乐、消除音效、轻震及其现有状态 | [设置与声音触感 v1](concepts/settings-feedback-original-v1.png) 已确认 |
| 10 | 既有通用动作补齐：回门店、退出、换照片、保存图片、重试 | [通用动作 v3](concepts/common-actions-original-v3.png) 已确认，重试箭头右上转折收圆 |

实际图标清单在对应批次对照当前界面和规则核对，不增加玩法、入口、奖励或确认步骤。宠物内容素材、品牌角色、页面结构与既定规则保留。本轮不改游戏代码或部署。

第 2 批保持 v3 的炭黑描边与橙白配色，采用简洁功能符号，展示搜索框、选择照片与分享图片的小尺寸应用。照片图标打开原有设备文件选择器；分享由玩家主动触发；返回与关闭不改变已有退出、表单离开或弹层规则。2026-10-23 用户回复「可以，继续」，已确认；[完整提示词](concepts/common-function-icons-v1-prompt.txt)、原始生成输出和输入副本已留档，尚未导出最终独立图标或接入页面。

第 3 批包含相邻交换双棋格、两步点选手势、工具搭档拼图、自动洗牌交叉箭头、时钟和计分星形。下方演示既有时间／分数区域与自动洗牌提示条，数字为 00:48、2,480 的静态示例。点选仍需再点相邻格，洗牌仅为系统状态，不新增手动洗牌、暂停、撤销或工具。图标原始输出及四张参考副本位于 `concepts/sources/round-operation-icons-v1/`，[完整提示词](concepts/round-operation-icons-v1-prompt.txt)已留档；2026-10-23 用户回复「可以，继续」，本批已确认。

第 4 批采用普通／鱼关两行、横扫／竖扫／十字／全盘演出四列。普通局为横梳、竖梳、剪刀及吹风机；鱼关为横向海螺、纵向海螺、珍珠贝壳及大浪花。橙色双向箭头和十字标识与能力一致；海螺开口朝向区分横纵。仅前三列出现在下方棋格示意，第四列不作为独立棋子。此前 [v2](concepts/tool-family-original-v2.png) 收掉亮面并调整角标，用户反馈「需要动感一些，现在看上去太死板了」，本批继续修订，不视为通过；[初始规格](concepts/tool-family-original-v1-prompt.txt)与[v2 提示词](concepts/tool-family-original-v2-prompt.txt)保留溯源。

当前选定为[动感姿态版 v6](concepts/tool-family-original-v6.png)：梳背微弧与倾斜扫动、斜向咔嚓剪刀、海螺朝向明确的流线、贝壳弹开短线，以及更大风势和前扑浪头。能力角标仍固定为橙色横／竖／十字，保留完整指环与小尺寸辨识度。动势来自姿态和轮廓，材质仍维持炭黑描边、橙白／浅蓝哑光配色；生成中多余高光已去除，重复小标题已简化。原始结果、参考图和完整修订链位于 `concepts/sources/tool-family-original-v6/`，请求依次为[v3 动势规格](concepts/tool-family-original-v3-prompt.txt)、[v4 材质与开口修订](concepts/tool-family-original-v4-prompt.txt)、[v5 文字核对](concepts/tool-family-original-v5-prompt.txt)、[v6 标题简化](concepts/tool-family-original-v6-prompt.txt)。2026-10-23 用户回复「可以」，本批已确认；中间未选用生成图已删除，仅保留最终动感版和 v2 参考。本轮未导出独立素材、实现动画或修改代码。

第 5 批[催单反馈 v1](concepts/rush-feedback-original-v1.png)已于 2026-10-23 获用户「可以」确认：加急为完整横向橙夹的小票，完成为闭合圆角框内的绿色勾，未赶上为中性的灰夹收起小票。三枚保持炭黑描边、橙白哑光风格，以入场、落章、轻收起的姿态区分状态，不叠加爪印或奖励装饰。下方普通／鱼关分别演示 active、success、expired 同一位置与相近固定高度的状态条，图标共用；普通局为已服务 7/12，鱼关为已清除 6/12，催单剩余均为 8 秒；仅成功固定 +100 分。文字、倒计时、进度、容器和奖励值都独立于图标，未赶上不扣分，不新增领取动作。完整请求见[提示词](concepts/rush-feedback-original-v1-prompt.txt)，原始结果和三张参考副本位于 `concepts/sources/rush-feedback-original-v1/`；尚未导出独立素材或修改代码。

第 6 批此前 [v1](concepts/report-marks-original-v1.png) 为 MVP 双尾缎带奖章、燕尾小旗与厚圆角空白印章；用户反馈「新纪录小旗 干净一点，称号印章 重新设计」，本批继续修订，不视为整体通过。v1 [提示词](concepts/report-marks-original-v1-prompt.txt)与原始结果保留溯源。

此前 [v2](concepts/report-marks-original-v2.png) 尝试简洁单角旗与朱橙色切角双线盖印，用户回复「不太好」，要求恢复最初版本的造型，仅去掉小旗最下方的横线，并给原称号框加花纹或戳记；v2 不再作为当前候选，留作修订过程记录，见[v2 提示词](concepts/report-marks-original-v2-prompt.txt)。

此前 [v3](concepts/report-marks-original-v3.png) 恢复原燕尾旗面和圆角厚印章框，并加角花与小圆戳，但把用户所说的下方横线误作投影去掉。用户随后提供坐标标注，明确要求去掉旗面下方的回折线、把投影加回来，并去掉圆戳；v3 仅保留为过程稿，见[v3 提示词](concepts/report-marks-original-v3-prompt.txt)。

当前选定为[结算标记 v4](concepts/report-marks-original-v4.png)：小旗删除多余的下方回折线及其浅色折面，保留橙色燕尾旗面的真实下轮廓、圆头旗杆和上方两笔装饰，恢复原浅米色椭圆投影；大图和缩小示例同步处理。三枚称号印章右下角的圆形戳记全部移除，补齐原圆角边框，保留左侧角花；空白主框、中英文称号示例和 MVP 沿用当前稿。用户标注为 x=51.3%、y=29.6%「这个线去掉，投影加回来」，x=95.6%、y=30.4%「这个图标去掉」。完整请求见[v4 提示词](concepts/report-marks-original-v4-prompt.txt)，最终原始图、用户标注的目标图与原始投影参考副本位于 `concepts/sources/report-marks-original-v4/`。2026-10-23 用户回复「可以，继续」，本批已确认。

结算标记仍普通／鱼关共用，示例不表示一局获得多个称号；MVP／称号／新纪录不额外加分，新纪录仍须保存成功并严格超过当前模式已有最好，首个成绩与同分不算突破。尚未导出独立素材、修改代码或实现动效。

第 7 批[排行榜名次徽记 v1](concepts/leaderboard-marks-original-v1.png)已于 2026-10-23 获用户「可以，继续」确认：第 1 名为橙金皇冠，第 2 名为银灰盾牌，第 3 名为暖铜六角章，以大号数字配合不同轮廓。普通／鱼关共用，保持浅色排行榜语境；本人行以原有橙色描边、浅橙底与橙色分数突出，不增加专属奖章。下方分别演示常规 1、2、3、4 与并列 1、2、2、4，两个第 2 名共用同一种 2 号盾牌，后续名次为普通数字 4；示例数据不是真实公司排名。完整请求见[提示词](concepts/leaderboard-marks-original-v1-prompt.txt)，原始输出与四张参考副本位于 `concepts/sources/leaderboard-marks-original-v1/`。本批只做静态效果图，未导出独立素材或改代码。

第 8 批[图鉴收集与空态 v1](concepts/collection-marks-original-v1.png)已于 2026-10-23 获用户「可以，继续」确认，包含三类：卡片角落的橙色入册书签与白勾、尚无收集的空白图鉴册、搜索无结果的索引卡与放大镜。下方展示已收集卡片、零收集提示加未收集列表、非空查询的无结果提示。卡片示例沿用 Deedee 名字与现有贴纸参考，主人 Emma 已由当前素材 manifest 核对；图中宠物为生成效果图的参考复现，正式接入仍直接使用既有 PNG，未改源贴纸。Momo／Marley 只展示名字与剪影，不露出主人。0/80 与查询内容仅为示例，不写入运行数据。零收集时保留未收集列表，搜索无结果只表达当前范围无匹配；不新增领取、未读、稀有度或全收集奖励。仅用于普通宠物图鉴，不新增鱼类收集。完整请求见[提示词](concepts/collection-marks-original-v1-prompt.txt)，原始输出与四张输入副本位于 `concepts/sources/collection-marks-original-v1/`。本批仍为静态图，未导出独立素材、改动宠物文件或修改游戏代码。

第 1–8 批审阅后，对照当前设置、照片选择与分享等组件继续核对覆盖范围，补齐第 9／10 批的既有功能表达，不增加页面、选项或交互。MyPetCard 的圆勾／横线实际表示收集状态，可复用第 8 批，不另设计「我家」徽记；已确认的齿轮、关闭和分享符号继续复用。

第 9 批[设置与声音触感 v1](concepts/settings-feedback-original-v1.png)已于 2026-10-23 获用户「可以，继续」确认，包含地球语言、双音符背景音乐、喇叭消除音效、设备轻震四枚。图标表达功能类别；开／关由现有文字、轨道颜色与滑块位置表达，禁用态淡化。门店示例为中文界面、音乐关、音效关、支持设备轻震开；中文只是示例语言，不改首次跟随浏览器规则。局内开启示例仅三个声音／触感开关，无语言选项；另展示 haptics=false 且设备不可用的禁用样例与既定说明，不代表重置实际偏好。局内设置不暂停计时，不新增自动播放、试震或确认动作。已对照当前 SettingsDialog、Toggle 与陈列页源码；本轮没有运行浏览器验证或改动这些实现。完整请求见[提示词](concepts/settings-feedback-original-v1-prompt.txt)，原始输出与三张参考副本位于 `concepts/sources/settings-feedback-original-v1/`。

第 10 批[通用动作 v1](concepts/common-actions-original-v1.png)包含回门店的橙白遮阳棚小店、退出的门与向右外出箭头、换一张的双循环箭头与照片、保存图片的向下箭头与托盘，以及重试的单回环。与第 2 批分享向上箭头配合，保留实际动作差异。下方演示导航按钮、照片预览头、成绩卡保存／分享与重试，照片操作与成绩卡操作分开呈现，不增加上传页下载原图动作；退出与未提交表单离开仍沿用原有确认，保存仍下载 PNG，分享仍以浏览器能力为条件，重试仍作用于当前请求。初稿请求见[v1 提示词](concepts/common-actions-original-v1-prompt.txt)，原始输出与四张参考副本位于 `concepts/sources/common-actions-original-v1/`。

用户反馈「重试 这个图标不是很清晰，箭头有些不协调」，v1 继续修订，不视为通过。[通用动作 v2](concepts/common-actions-original-v2.png)把重试的橙色箭头与炭黑圆弧连成一体，沿顺时针弧线切向衔接，统一粗细并保留头尾开口；大图与按钮小图同步修正。完整请求见[v2 提示词](concepts/common-actions-original-v2-prompt.txt)，原始结果与编辑目标副本位于 `concepts/sources/common-actions-original-v2/`。

用户在 v2 标注 x=95.2%、y=19.8%「这里再圆滑一点」，当前选定为[通用动作 v3](concepts/common-actions-original-v3.png)：把重试右上橙色外轮廓的折角修为连续圆弧，箭头肩部收圆，保持清晰边缘与头尾开口，按钮小图同步。其他四枚动作图、分享符号、文案与排版沿用。完整请求见[v3 提示词](concepts/common-actions-original-v3-prompt.txt)，原始结果与用户标注所用编辑目标副本位于 `concepts/sources/common-actions-original-v3/`。2026-10-23 用户回复「可以，继续」，本批已确认；尚未导出独立素材、修改代码或改变现有流程。

## 已确认设计总览

当前清单的第 1–10 批均已确认，已整理为[可放大设计总览](reviews/2026-10-23-icon-library-v1/index.html)。总览直接展示十张已确认完整原图，点击后可放大、切换批次或查看原尺寸，文件路径与 SHA-256 见[清单](reviews/2026-10-23-icon-library-v1/manifest.json)。没有重新生成或裁切原稿；图稿继续作为视觉参考，正式界面图标按项目约定使用 SVG／CSS／Canvas。本次只整理设计审阅资料，未改游戏代码或自动进入接入阶段。

## 独立图标制作与修正

用户要求全部制作后，先交付了手工重绘的 SVG／PNG；用户反馈「不对，你这个素材和之前讨论的样式不一致」。该重绘改变了比例、曲线和材质层次，整套已标记为样式不通过并撤回推荐；文件和透明度检查通过不能代表样式保真通过。

随后用户明确选择「按原图拆分透明 PNG（推荐）」，允许本次以已确认原图为来源，进行本地拆分与去底，不重绘。当前已完成[原稿 PNG v2](../assets/icons/library-original-png-v2/preview.html)：47 枚主图标＋原稿已有的白色爪印、白色保存，共 49 枚原尺寸母版，另有 32／40／48／512 px 导出 196 份。保留每枚的原稿位置与哈希，主体不透明区域 RGB 与原稿一致，边缘只处理背景与透明度；白色材质、杯柄与指环空洞、浅投影已核对。

完整交付见[下载包](../assets/icons/library-original-png-v2/moego-original-png-v2.zip)、[说明](../assets/icons/library-original-png-v2/README.md)、[来源及校验](../assets/icons/library-original-png-v2/manifest.json)。前一套额外生成的无角标主体、独立能力标识和白色分享并非单独确认原稿，本版不额外重画。原始 10 批图稿的确认结果保留；用户授权仅针对本次素材制作，没有修改游戏组件、玩法或接入页面。

## 旧高光素材已删除

用户随后明确要求「把之前设计的高光类型都删掉」。已删除旧首页及其导出／试稿、普通与鱼关道具、奖励标记、催单、名次徽记、鱼缸插画和操作提示对应的图稿、透明 PNG、预览、ZIP、提示词与原始留档，共 251 个项目文件；另删除 39 份哈希相同或已知未完成提取的生成原图副本。已核对所有删除目标不存在，并验证原始页面参考图、宠物素材及首页 v3 保留。清理范围及文件哈希见[清理记录](reviews/2026-10-23-icon-style-cleanup/manifest.json)。旧素材没有游戏代码引用，本轮未修改游戏实现。

## 接入游戏（2026-10-24）

用户确认接入方案 A：把已确认图标接入游戏，替换系统 emoji 与手画 SVG，并调整图标所在区域；逐页完整还原另行安排。任务说明见 [ICON_INTEGRATION_GOAL.md](ICON_INTEGRATION_GOAL.md)，逐阶段记录见 [reviews/2026-10-24-icon-integration](reviews/2026-10-24-icon-integration/README.md)。

- 先用原稿 PNG，**待矢量化**：`library-original-png-v2/export_web.py` 从母版等比导出 32–288 px 到 `web/src/ui/icons/`，界面统一用 `Icon` 组件按显示尺寸选 1x／2x／3x；AGENTS.md 已加例外条款。
- 鱼关道具文案改为海螺、珍珠贝壳（V1_RULES 已定），i18n key 一并改名，UI_COPY 同步。
- 图标库没有鱼：鱼关按钮、页签、客人标题与邀请用天蓝色单鱼贴纸 `fish_color_blue`。
- 称号框整图不拉伸，文字随框倾斜，英文最多两行。
- 只接静态图标，不新增动效。吹风机与大浪花按 V1_RULES 为真正棋子，棋盘使用其 PNG。

2026-10-24 第 0–5 阶段已完成：界面中的系统 emoji 与手画图标 SVG 已替换为已确认图标，逐阶段截图、与图稿的差异及未验证项见上面的记录。

2026-10-24 补充批：接入时发现选中小勾、向前箭头、未收集标记在库中缺失，用户选择补设计；[补充批效果图](concepts/supplement-marks-original-v1.png)确认后拆为 `masters/11-supplement/` 三枚并接入，图标库共 52 枚。
