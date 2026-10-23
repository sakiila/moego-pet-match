# MoeGo 宠物消消乐视觉效果图

日期：2026-10-22  
状态：当前选定的手机页面、弹层及普通／鱼关成绩分享卡均已确认。活动口令及相关功能已取消。洗护动效时长已确认为可调试玩初值，分镜图仍为讨论草稿。仅效果图，未编写游戏代码；正式信息说明仍待完善。

## 视觉方向

2026-10-23 独立素材修正：2026-10-23：用户反馈「不对，你这个素材和之前讨论的样式不一致」。本套手工 SVG 重绘稿样式未通过，已撤回作为当前交付的推荐。文件格式、透明通道和压缩包校验通过，不代表视觉一致性通过。以已确认原稿为基准的修正进行中。 此前 59 枚 SVG／236 张 PNG 的重绘交付已退回，不能作为已确认样式的最终素材。原始 10 批选定图稿仍是视觉基准，修正稿另存版本；游戏代码未改动。

2026-10-23 图标方向更新：第 1–10 批已确认，见下方选定展示文件及[可放大设计总览](reviews/2026-10-23-icon-library-v1/index.html)；图标以原稿炭黑圆角描边、橙白主色与轻量层次为基准。第 10 批[通用动作 v3](concepts/common-actions-original-v3.png)补齐回门店、退出、换一张、保存图片和重试；按标注收圆重试箭头的右上转折，保持大小图一致。旧高光系列及其原始图、导出和留档已按用户明确要求删除；原始页面、宠物素材及新方向图稿保留。当前范围、批次与清理记录见 [ICON_REDESIGN_PLAN.md](ICON_REDESIGN_PLAN.md)。本轮未修改游戏代码。

参考用户提供的 [MoeGo 素材库](https://mengshikeji.feishu.cn/wiki/Mmt2wf5JQiEsSqkcquscbpVdnV7)，已在登录浏览器中查看品牌标志、猫狗角色及洗护插画，并将实际品牌图片作为 ImageGen 输入参考。

以 MoeGo 橙、炭黑与白色为主，辅以蓝猫、黄犬、红犬等角色色；采用贴纸感角色、圆润粗体、轻量描边与偏移阴影。整体是一间明亮有趣的宠物小店，保留清楚的按钮与阅读层级。

用户已确认 Peter 隐藏鱼关采用深蓝水下氛围：深蓝环境、白色文字、浅冰蓝棋格和水流痕迹，保留 MoeGo 橙作为重要强调色。此为鱼关的主题例外，普通宠物局继续采用已确认的橙白方向。

原六张为 1536 × 1024 桌面版中文界面效果图，保留中英文切换入口，使用品牌角色与示例资料。目前选定展示的手机页面图稿均为 853 × 1844，比例接近 390 × 844，参考已整理的宠物与鱼色素材；数字为示意状态。英文完整页面及其余移动端页面尚未设计。

首次显示语言已确认：无手动偏好时跟随浏览器的受支持语言，中文或英文均无法匹配时默认英文；玩家手动切换后记住并优先沿用。切换只改变界面，宠物与同事姓名保持原文，保留填写内容、记录和进度。现有中文图稿继续作为视觉参考，不代表首次访问统一显示中文；本轮未重绘。

文案已按用户确认的友好、俏皮、轻吐槽方向整理为 [首版中英文案草稿](../UI_COPY.md)，首轮逐页关键文案校读已完成，历史图中的示意文案不作为最新字面要求。英文按钮长度及手机换行仍待实际页面验证；本轮手机图使用已校读的棋盘文案，未编写游戏代码。

手机布局现已确认竖屏优先、一屏游玩：状态在上方，棋盘占主要空间并偏向中下部，催单预留固定位置，设置和退出远离棋格；小屏优先压缩装饰，提示出现不推动棋盘。横屏兼容，旋转不重置棋盘或影响计时，桌面继续宽屏布局。拖拽与点选相邻棋子交换同时支持，选中描边清楚但不遮挡头像；单点不发动工具，两种输入的消除与预览规则以 GAME_FLOW.md 为准。下方新增手机图用于校验信息层级与完整一屏构图，触控和计时行为尚未实现。

真实宠物素材现已选定 B 类 AI 插画贴纸，并要求只保留头部与完整耳朵、去掉颈部；后续替换示意角色时遵循 [宠物素材画风规范](PET_ASSET_STYLE.md)。

## 选定展示文件

| 页面 | 文件 | 设计重点 |
| --- | --- | --- |
| 首页入口图标 | [home-entry-icons-v3.png](concepts/home-entry-icons-v3.png) | 2026-10-23 效果图已确认；开始营业爪印、图鉴书本、杯形奖杯、猫狗头像；炭黑描边与橙白配色；[独立重绘稿样式未通过](../assets/icons/library-original-v1/preview.html)，未接入代码 |
| 通用功能图标 | [common-function-icons-v1.png](concepts/common-function-icons-v1.png) | 2026-10-23 已确认；返回、关闭、搜索、设置、选择照片、分享、翻面、信息说明；与首页 v3 同风格；[独立重绘稿样式未通过](../assets/icons/library-original-v1/preview.html)，未接入代码 |
| 局内操作与状态图标 | [round-operation-icons-v1.png](concepts/round-operation-icons-v1.png) | 2026-10-23 已确认；相邻交换、两步点选、拼图合体、系统洗牌、时钟、计分星形；[独立重绘稿样式未通过](../assets/icons/library-original-v1/preview.html)，未接入代码 |
| 普通／鱼关道具图标 | [tool-family-original-v6.png](concepts/tool-family-original-v6.png) | 2026-10-23 已确认动感版；弧形扫梳、斜向剪刀、海螺与贝壳、风势与浪花；橙色能力标识；吹风机与大浪花仅全盘演出；[独立重绘稿样式未通过](../assets/icons/library-original-v1/preview.html)，未接入代码 |
| 催单反馈图标 | [rush-feedback-original-v1.png](concepts/rush-feedback-original-v1.png) | 2026-10-23 已确认；完整横夹小票、闭合绿色勾印记、灰夹收起小票；普通／鱼关共用；[独立重绘稿样式未通过](../assets/icons/library-original-v1/preview.html)，未接入代码 |
| 结算标记 | [report-marks-original-v4.png](concepts/report-marks-original-v4.png) | 2026-10-23 已确认；MVP 奖章、去回折线并恢复投影的燕尾小旗、保留左侧角花的圆角称号框；圆戳移除；[独立重绘稿样式未通过](../assets/icons/library-original-v1/preview.html)，未接入代码 |
| 排行榜名次徽记 | [leaderboard-marks-original-v1.png](concepts/leaderboard-marks-original-v1.png) | 2026-10-23 已确认；数字 1 皇冠、2 盾牌、3 六角章；并列使用实际名次，本人行橙色高亮；[独立重绘稿样式未通过](../assets/icons/library-original-v1/preview.html)，未接入代码 |
| 图鉴收集与空态 | [collection-marks-original-v1.png](concepts/collection-marks-original-v1.png) | 2026-10-23 已确认；入册书签、零收集空册、搜索无结果索引卡；保留未收集名字＋剪影列表；宠物源素材未改，尚未导出独立素材或接入代码 ；[独立重绘稿样式未通过](../assets/icons/library-original-v1/preview.html)，未接入代码 |
| 设置与声音触感图标 | [settings-feedback-original-v1.png](concepts/settings-feedback-original-v1.png) | 2026-10-23 已确认；语言、背景音乐、消除音效、轻震；门店默认、局内开启与设备不可用样例；[独立重绘稿样式未通过](../assets/icons/library-original-v1/preview.html)，未接入代码 |
| 通用动作图标 | [common-actions-original-v3.png](concepts/common-actions-original-v3.png) | 2026-10-23 已确认；回门店、退出、换照片、保存图片、重试；重试为连续回环，右上转折收圆，大小图一致；[独立重绘稿样式未通过](../assets/icons/library-original-v1/preview.html)，未接入代码 |
| 手机首次入口与身份确认 | [mobile-identity-v2.png](concepts/mobile-identity-v2.png) | 已确认；游戏名与 90 秒介绍、直接搜索与选中 Bob、默认头像、带名字的按钮与信息摘要，同页完成 |
| 门店首页 | [home-v2.png](concepts/home-v2.png) | 开始营业按钮、今日店长、个人纪录、上传与图鉴入口；图中鱼缸区已取消，后续加入人工处理提示 |
| 手机门店首页 | [mobile-home-v2.png](concepts/mobile-home-v2.png) | 已确认；Deedee 店长与既定宣言、唯一主动作开始营业、普通局个人最好、三个次级入口和完整人工处理提示 |
| 手机开局准备 | [mobile-prep-v1.png](concepts/mobile-prep-v1.png) | 已确认；六宠头像／底色／名字、交换方式、90 秒未计时说明与开始这班 |
| 三消棋盘 | [board-v1.png](concepts/board-v1.png) | 7 × 7 棋盘，Smart Scheduling 拖拽反馈，计时与分数，棋盘外的催单提醒 |
| 手机竖屏棋盘（催单中） | [mobile-board-v3.png](concepts/mobile-board-v3.png) | 布局与密度已确认；7 × 7 一屏、六宠固定辅助底色、主时钟与催单区分、梳子横向预览及剪刀十字标识 |
| Report Card | [report-v2.png](concepts/report-v2.png) | 纸质报告、MVP、称号、宠物评语、新图鉴与可跳过的主人竞猜；图中鱼缸贡献区已取消 |
| 手机 Report Card 首屏 | [mobile-report-top-v2.png](concepts/mobile-report-top-v2.png) | 信息层级与趣味方向已确认；已保存结果、Maodu MVP、评语与称号、两只新收集；卡片规格以本图为准 |
| 手机 Report Card 下半部示意 | [mobile-report-details-v3.png](concepts/mobile-report-details-v3.png) | 邀请区排布已确认；符合条件的 Peter 邀请、店长签名与次级入口；底部操作保持原位 |
| 普通宠物局成绩分享卡 | [share-card-pets-v1.png](concepts/share-card-pets-v1.png) | 已确认；独立图片，Maodu 与评语为主、分数醒目、小称号与玩家署名 |
| 鱼关成绩分享卡 | [share-card-fish-v2.png](concepts/share-card-fish-v2.png) | 已确认；独立图片，深蓝水下与白色收据、天蓝色鱼、气泡名牌、评语与玩家署名 |
| 店长小海报 | [manager-poster-v1.png](concepts/manager-poster-v1.png) | 2026-10-23 已确认；橱窗遮阳篷、店长大头像、宣言气泡、「今日店长 · 名字」骨头名牌与北京日期；实现时收紧柜台与日期间留白 |
| Peter 鱼关手机实战 | [mobile-fish-board-v1.png](concepts/mobile-fish-board-v1.png) | 已确认；深蓝水下、六色小鱼、统一浅棋格、水流喷头与气泡机、独立催单状态 |
| Peter 鱼关手机准备 | [mobile-fish-prep-v1.png](concepts/mobile-fish-prep-v1.png) | 已确认；六个鱼色类别、同色匹配与相邻交换、90 秒未计时说明、开始这班 |
| 手机 Fish Report Card | [mobile-fish-report-v1.png](concepts/mobile-fish-report-v1.png) | 已确认；深蓝背景与浅色报告单、按鱼色选 MVP、鱼关排行、固定再开／分享 |
| 洗护动效分镜草稿 | [motion-storyboard-v3.png](concepts/motion-storyboard-v3.png) | 材质与起势→清除→补落示意；存在格数偏差，准确范围见动效章节，不作为规则验收图 |
| 宠物图鉴 | [petdex-v1.png](concepts/petdex-v1.png) | 入职卡收集、已解锁与未遇见状态、主人关系、选中卡片详情和翻面入口 |
| 手机宠物图鉴 | [mobile-petdex-v1.png](concepts/mobile-petdex-v1.png) | 已确认；两列卡片、已收集与新收集优先、名字＋剪影、轻量搜索与新增入口 |
| 手机已收集宠物详情 | [mobile-pet-detail-v2.png](concepts/mobile-pet-detail-v2.png) | 已确认；Maodu 详情弹层、主人 Bob、原图翻面与删除申请入口 |
| 手机我的宠物 | [mobile-my-pets-v1.png](concepts/mobile-my-pets-v1.png) | 已确认；仅列自家已上架宠物，完整头像、两种收集状态、查看资料／添加／删除申请 |
| 手机删除申请 | [mobile-delete-request-v1.png](concepts/mobile-delete-request-v1.png) | 已确认；我的宠物页上的提交前弹层，关联 Maodu、人工处理说明、选填补充及提交申请 |
| 手机局外设置 | [mobile-settings-v1.png](concepts/mobile-settings-v1.png) | 已确认；门店上的设置弹层，中文选中、音乐与音效关、支持设备轻震开 |
| 排行榜 | [leaderboard-v1.png](concepts/leaderboard-v1.png) | 领先玩家、头像、最好成绩及自己附近；图中鱼缸满后解锁提示已取消，鱼榜遵守个人隐藏关触发条件 |
| 手机排行榜 | [mobile-leaderboard-v1.png](concepts/mobile-leaderboard-v1.png) | 已确认；领先三人、我的名次与附近同事、同分并列和当前模式再挑战 |
| 上传宠物 | [upload-v1.png](concepts/upload-v1.png) | 照片裁切、基本资料、棋盘与图鉴构图预览、统一画风和审核后上架的说明 |
| 手机上传宠物 | [mobile-upload-v1.png](concepts/mobile-upload-v1.png) | 已确认；原图预览、名字、主人核对、展示说明与提交，遵循简化首版流程 |

原六页均已检查品牌与配色、文字层级、按钮、留白、角色连续性与视口完整性；棋盘为 7 行 7 列。首页补入个人最好成绩，报告卡进度条按 68% 做定向校准。

### 2026-10-23 更新：首页与常用入口图标

用户重新指定原始 `outputs/` 目录作为视觉基准，已确认[首页入口 v3](concepts/home-entry-icons-v3.png)。新图标采用炭黑圆角描边、橙白主色与轻量层次，首页保留一个主动作和三个次级入口；开始营业用单个爪印，图鉴用打开的书本，排行榜用中央橙星的杯形奖杯，我的宠物用白犬与蓝猫头像组合。完整请求见[v3 提示词](concepts/home-entry-icons-v3-prompt.txt)。

用户随后要求继续下一批，并删除之前的高光类型。旧首页、道具、奖励、催单、鱼缸、名次徽记和操作提示的高光图稿、独立素材、预览、下载包、提示词及原始输出已清理，不再提供或选用旧文件。原始页面设计、宠物／单鱼内容素材及 v3 保留；清理范围与核验见[记录](reviews/2026-10-23-icon-style-cleanup/manifest.json)。新方向第 1–10 批已确认，文件见上方选定展示表及[设计总览](reviews/2026-10-23-icon-library-v1/index.html)；第 10 批选定[通用动作 v3](concepts/common-actions-original-v3.png)，v1／v2 作为重试箭头的过程稿留档。全套独立重绘稿因样式不符已退回，留档见[退回稿](../assets/icons/library-original-v1/preview.html)；尚未接入页面，原宠物 PNG 和卡片实现未改动。

### 2026-10-23 更新：鱼关道具统一为海底元素

用户确认用海螺、珍珠贝壳和大浪花替代水流喷头、气泡机与涡流泵。海螺通过螺壳开口、水流朝向与橙色箭头区分横扫／竖扫；珍珠贝壳以扇形轮廓、中央珍珠和橙色十字标识承接十字清除；两个珍珠贝壳的全盘合体以大浪花演出，不新增独立棋子。生成条件、三种合体范围、计分和统计沿用原能力规则。

此前海底元素方案对应的高光 PNG、图稿与下载包已按用户要求删除，外观改按[原稿风格计划](ICON_REDESIGN_PLAN.md)重新设计。普通局保留梳子、剪刀与吹风机演出题材，鱼关保留海螺、珍珠贝壳与大浪花题材；生成、发动、方向、合体范围、计分与统计规则不变。历史完整页面图仍用于布局参考，不能据此恢复旧设备外观。本轮未改游戏代码。

### 2026-10-22 更新：首次入口直接选择同事身份

- 用户已确认取消活动口令及相关功能。首次打开直接搜索并选择自己的同事身份，点「以 {playerName} 身份继续」进入门店；回访沿用有效的已选身份。没有前置欢迎页或额外验证步骤，游戏名称与玩法介绍可在同一入口呈现。
- 身份 v2 将游戏名「毛孩子全明星」与既定 90 秒三消副标题放到同一页顶部，「你是哪位同事？」改为较小的表单区标题，其后为搜索、选中卡片、信息摘要和确认按钮。图中展示搜索 Bob 并选中的示例状态，不自动把 Bob 分配给首次访问者。结果卡、当前选择与「以 Bob 身份继续」按钮一致；B 是默认字母头像，蓝猫是品牌装饰，不代表 Bob 的宠物或头像。选择勾号只表示卡片选中，不声明已验证 Slack 账号本人，也不表示已经读取人员表。
- 确认身份后进入门店，再由开始营业进入准备；不会在确认身份时计时，不增加第二次确认或新建账户步骤。有效身份缺头像时仍可正常游戏，名册未找到与读取失败继续使用各自的既定反馈，本图不混放这些状态。
- 按钮附近的短摘要仍为草稿：「游戏会记录所选身份、成绩和图鉴进度，并在同事排行榜展示名字、头像与最好成绩。」并提供信息使用说明与资料删除申请入口。详细说明正文与实际字段、用途和处理范围仍待核对；本图只确认排布，不把摘要当作完整说明或已生效条款。
- 身份 v2 为 853 × 1844，延续白橙配色、官方角色、圆润标题与主按钮。已目视核对游戏介绍、搜索内容、姓名一致性、信息摘要、链接和完整底部空间，用户已确认本图。本轮未读取真实同事名单、连接 Supabase 或实现身份记忆，也未验证键盘、搜索、导航或浏览器布局。

原 [口令页 v1](concepts/mobile-access-v1.png) 及其 [生成提示词](concepts/mobile-access-v1-prompt.txt) 已取消选用，仅保留历史存档，不作为实现要求。[身份确认 v1 原始提示词](concepts/mobile-identity-v1-prompt.txt) 中关于通过口令的前提也已撤销，最新交互以本节及 GAME_FLOW、TECH_PLAN 为准。本轮使用内置 ImageGen 生成合并入口 v2，完整请求留档为 [身份入口 v2 提示词](concepts/mobile-identity-v2-prompt.txt)；未编写游戏代码。

### 2026-10-22 新增：手机首页与开局准备

- 首页 v2 展示回访玩家的示例状态：头像 B、普通宠物店个人最好 2,480、今日店长 Deedee。它沿用已确认的「你负责排班，我负责可爱」，没有声称已验证 Slack 本人或已连接真实线上成绩。
- 「开始营业」是唯一主动作，先进入普通局准备；下方轻量展示图鉴、排行榜与我的宠物。首页完整保留人工处理与 Slack 联系 @Bob 的原文提示，页尾提供信息说明、删除申请和设置。没有鱼关入口、锁定预告、公共进度或新增奖励。
- 准备 v1 为棋盘页的计时前阵容面板，集中显示 Deedee、Maodu、Boluo、Momo、Marley、Koa 六宠，头像、名字与已确认棋盘底色一致：蓝、绿、桃、紫、粉、黄分别对应上述顺序。Maodu 已在本例阵容中，才显示「Maodu 也来啦」。配色只是本局识别辅助，普通局仍按宠物身份匹配。
- 本图不展示完整 49 格棋盘；进入游玩后仍切换到已确认的 7 × 7 布局，实际初盘须无现成匹配且有可行步。灰猫小图只是交换输入的示意，不是第七种宠物，也不是局内可行步提示。不增加独立经营页面、切换阵容按钮或开局道具。
- 准备态明确写出三消、拖拽和相邻点选规则，以及「本局 90 秒。准备和读说明不计时，点下方按钮后开始。」；按钮为「开始这班」。没有运行中的倒计时、分数、催单或四消五消工具教学。
- 两图均为 853 × 1844，已目视检查完整画幅、主次层级、关键文字、六宠名字与配色、计时状态和底部安全空间。用户已确认两图，手机视觉主线衔接为首页 → 准备 → 棋盘 → 报告；当前仅为静态视觉规范，尚未验证真实跳转、触控或加载失败状态。

使用内置 ImageGen，未使用 CLI；头像为现有素材的生成近似，后续直接复用正式透明 PNG。提示词留档：首页 [v1 初稿](concepts/mobile-home-v1-prompt.txt)、[v2 竖屏修订](concepts/mobile-home-v2-prompt.txt)，以及 [准备态 v1](concepts/mobile-prep-v1-prompt.txt)。没有编写游戏代码。

### 2026-10-22 新增：手机竖屏实战棋盘

- 场景为普通宠物局催单进行中：本局剩余 48 秒、催单剩余 8 秒、已服务 7 / 12 格、分数 2,480。催单尚未完成，不展示成功奖励；两个时钟与第 30 秒触发、20 秒窗口相符。
- 棋盘恰好 7 × 7、49 格，其中 47 格为六种宠物、2 格为梳子与剪刀；同一宠物保持相同头像与辅助底色，不在棋格内放名字。参考 Deedee、Momo、Maodu、Boluo、Marley、Koa 的现有六宠预览，对应宠物仍在当前有效素材清单中。
- 梳子在第 4 行第 3 列，带横向箭头；向右邻格的短箭头表示拖拽，整行淡橙框表示触发前的直接清除范围。剪刀在第 5 行第 6 列，附十字能力标记。工具直接占棋格，不设库存或单击发动按钮。
- 催单占固定上方区域；棋盘下方只放一条梳子轻提示，设置和退出远离棋格。没有暂停、鱼关预告、货币或额外奖励模块。
- 使用内置 ImageGen，未使用 CLI；v1 建立布局，v2 补工具能力标识，v3 调整催单进度条至接近六成。已目视检查完整棋盘、关键文字、六宠重复一致性、工具预览与操作区距离；这是静态设计校验，尚未做真机触控与浏览器验证。
- 图稿对原贴纸作近似复现；后续界面直接复用现有透明 PNG，不从概念图中裁取正式棋子。用户已确认本版手机棋盘的布局与密度，作为后续实现的视觉参考；真实素材、动态计时和触控仍须按已确认规则实现及验证。

提示词依次保存在 [初始完整提示词](concepts/mobile-board-v1-prompt.txt)、[工具标识微调](concepts/mobile-board-v2-prompt.txt)、[进度条微调](concepts/mobile-board-v3-prompt.txt)。其余章节的「本轮未重绘」是之前逐项讨论的历史记录，不影响本节新增图稿。

### 已确认：手机 Report Card 操作位置

报告正文可纵向滚动，底部固定「再开一局」与「分享成绩」，保持明确的主次层级；正文末尾也应完整可见，不被操作区遮挡。首屏优先呈现分数、保存状态、MVP 与评语，收集卡、符合条件的主人竞猜和鱼关邀请在同页继续展开。既定分层揭晓、可跳过竞猜、当前模式重玩与主动分享规则不变。

用户已确认底部固定操作，以及本轮两张图的信息层级与趣味方向。首屏 v2 统一结果与卡片规格，下半部 v3 确认邀请区排布；仅做静态设计，不编写游戏代码。

### 2026-10-22 新增：手机 Report Card 概念图

成绩保存的简化口径已确认：失败仅在当前报告里提供重试，离开或刷新后不找回未保存结果；首页不增加待同步提示或返回入口，也不新增队列或历史页。已发出的请求若实际保存成功，真实记录保留。本轮只同步规则，现有报告和首页图不重绘。

- 两图使用同一份示例报告：个人第三个有效完整普通局，结果已保存；2,480 分、服务 120 格、最高 4 连锁、工具发动 3 次、催单成功，MVP 为 Maodu，新收集 Deedee 与 Koa 两只。服务格数不表示独立宠物数量；本例没有剪刀双合体或新纪录标记，「精准排班大师」及催单成功评语与示意条件相符。
- 首屏 v2 延续白色收据与橙色印章，使用已校读的报告副标题、保存状态、统计标签和宠物角色评语。Maodu 保留眨眼、狸白毛色和完整耳朵；两只收获卡均完整显示名字，不被固定操作区遮住。
- 下半部 v3 展示同一报告可继续浏览的内容。Peter 邀请只在本例第三局已保存后出现，按钮「去看看」主动进入准备；没有公共鱼缸贡献、注水目标或自动开局。此例省略不适用的主人竞猜，不改变首版竞猜功能和资格规则。
- 「再开一局」与「分享成绩」在两图中保持同一底部位置、主次和标签。正文仍须留足末尾空间，分享预览与导出图不包含这条操作栏。
- 已目视核对品牌配色、关键文字、宠物身份、保存与收集状态、统计及称号、底部操作区和邀请入口；两图均为 853 × 1844。没有执行浏览器滚动或真机触控验证。
- 已知概念图偏差：两图的新收集卡片宽度与插画缩放存在生成差异。用户已确认后续统一复用首屏 v2 的卡片规格与正式透明 PNG；下半部 v3 用于邀请区、签名与入口的构图参考，不视为精确滚动截图。两图的信息层级与趣味方向已确认，真实滚动、触控和状态更新仍待实现验证。

使用内置 ImageGen，未使用 CLI。提示词留档：首屏 [v1 初稿](concepts/mobile-report-top-v1-prompt.txt) 与 [v2 竖屏修订](concepts/mobile-report-top-v2-prompt.txt)；下半部 [v1 初稿](concepts/mobile-report-details-v1-prompt.txt)、[v2 卡片修订尝试](concepts/mobile-report-details-v2-prompt.txt) 与 [v3 构图参考](concepts/mobile-report-details-v3-prompt.txt)。历史版本保留于项目，当前已确认的视觉方向见上表两张及其适用范围。

第二组页面延续已认可的首页与报告卡视觉。图鉴用 4 张完整卡片和 2 张未遇见剪影对应 4 / 6 的示例收集进度；排行榜保持分数降序并突出 Bob 的第 7 名与 2,480 分。上传页展示尚未提交的照片裁切与填写状态，预览使用照片裁切，统一画风与审核发生在提交后。店长 Mochi 的主人在示例中为 Mia；新增宠物使用 Oreo、主人 Bob，避免示例混淆。

2026-10-22 首版范围已简化：上传页保留原图预览、宠物名字、主人确认及展示处理说明，预览后可直接提交；不做在线裁切或棋盘／图鉴双预览。后续裁切、统一风格、核对与上架由项目发起人人工完成。效果图和下方原始提示词中的裁切控件、双预览及「提交 → 统一画风 → 审核 → 上架」保留为历史设计记录，不作为首版在线制作、进度跟踪或审核管理的实现要求。具体交互以项目内 GAME_FLOW.md 与 TECH_PLAN.md 的最新方案为准。本次未重绘图片。

2026-10-22 鱼主题方案更新：首页移除 Peter 鱼缸入口、水位与共同进度，Report Card 移除注水贡献区，不再做全员公共活动。改为每位玩家游玩三局后触发的隐藏关，基础棋子全为不同颜色小鱼、仅同色可三消；首次已确认在第三局 Report Card 出现彩蛋邀请，玩家点击才进入鱼关准备页，不自动跳转或计时。邀请沿用「Peter 悄悄递来一个鱼缸：这批客人不用吹干」，与报告收获同页呈现，常规报告操作保持可用。发现后本次活动保持个人解锁，仅向已发现玩家显示排行榜「鱼关卡」标签，供查看成绩并重玩；未发现前不显示锁定鱼榜，首页始终不加入口。旧图中的「鱼缸满后解锁」、共同进度和贡献数，以及下方对应原始生成提示词，均只保留作历史记录，不能据此实现旧机制。本轮未重绘图片。

首页新增用户指定原文：「宠物照片由人工核对和处理，难免有误，如有纰漏，请 Slack 联系 @Bob」。安排在首页底部清楚可读的轻量常驻位置，不用弹窗打断开始营业；英文对应：「Pet photos are manually reviewed and processed, so mistakes may happen. If you spot an error, please contact @Bob on Slack.」目前 @Bob 为文字提示，实际 Slack 用户链接后续核对，现有效果图尚未包含该文案。

隐藏关的三局累计口径已确认：同一 Slack 身份下，正常到时、至少一次有效操作且保存成功的普通局计一次；可跨天跨设备，退出不计且不清零，原局重试不重复计数。鱼关道具外观已确认：四消用「水流喷头」对应清行／列，五连以上或符合条件的 L / T 形用「气泡机」对应十字清除，合体和操作规则不变；普通宠物局继续用梳子、剪刀。喷头保留横／竖方向，气泡机保留十字能力标识，范围预览与实际清除一致；仅换主题外观，不改变报告统计或称号的能力判定。本轮不重绘。

下架后报告呈现已确认：保留旧报告与新生成分享入口，移除整张报告中涉及已下架宠物的资料；如果原 MVP 下架，原位置改用通用 MoeGo 图案和中性文案，不换另一只宠物当 MVP，也不创建图鉴占位卡。分数、服务统计与称号保留，当前图鉴与可展开卡片按上架目录。其他可展示内容保留，原始效果图尚未重绘此状态。

成绩分享卡已确认不放二维码，保留纯成绩图；不采用此前提出的扫码挑战入口。现有宠物与评语主导构图、分数与称号层级及主动预览保存流程不变，本轮不重绘。

分享卡语言已确认跟随当前界面、单张单语，不在同一张图中英并列；切换语言后可重新预览同一局的对应版本，成绩、MVP、称号和评语含义不变，姓名保持原文，仍过滤下架资料。本轮只记录排版要求，未生成英文分享图。

图鉴默认顺序已确认：已收集优先、新收集靠前，承接报告页的解锁收获；未收集筛选入口保持显眼，未收集卡仍为名字＋剪影。尚未收集任何宠物时展示未收集列表，重复服务或查看不把旧卡排成新收集。原图保留视觉参考，本轮不重绘。

图鉴轻量搜索已确认：提供单个搜索框，宠物名可搜全部上架项，主人名仅匹配已收集宠物，沿用当前筛选和排序；输入说明明确搜索范围，无结果不暗示该同事没有宠物，也不提前露出未收集主人关系。原图作为视觉参考，本轮不重绘新增搜索状态。

后续交互需要延续的细节：同一只正式宠物固定复用同一份头像；成功反馈不阻挡棋子操作；服务次数与独立宠物收集数量分别计数。当前棋盘插画中部分围巾与表情仍有生成差异，作为效果示意保留。

### 2026-10-22 手机宠物图鉴与已收集详情

- 列表 v1 使用 4 / 81 的设计示例。81 仅参照当时开发素材池的 81 条单宠档案（后续确认 Erika Intfen 的两条重复来源 `Banjo` 归并为 1 只独立宠物，线上普通宠物图鉴实际基数为 80 只独立宠物），不代表线上已发布数量或真实玩家记录；实际进度按玩家记录与当前上架普通宠物目录计算，鱼关类别与集体鱼素材不计入。
- 可见顺序为最新收集的 Deedee、Koa，其后为已收集的 Maodu、Boluo，再显示未收集的 Momo、Marley；其余条目继续滚动。它与先前普通报告中 Deedee／Koa 新收集的示例相接，鱼局不额外增加普通图鉴进度。
- 列表保留明显的全部／已收集／未收集筛选和单个搜索框；宠物名可搜所有上架项，主人名仅搜已收集项。Momo 与 Marley 只有名字、无脸部细节的剪影和未收集状态，不出现主人姓名、头像或原图；搜索、查看均不改变收集或阵容抽样。
- 已收集主人展示名来自当前素材清单：Deedee—Emma、Koa—Sam Pineda、Maodu／Boluo—Bob。图中使用默认人形头像，只演示资料布局，不表示已经读取 Slack 头像或完成身份对应。图鉴卡面采用统一中性底色，不把局内六色辅助底色变成永久身份。
- 详情 v2 是图鉴上的已收集 Maodu 弹层，展示完整头像、名字与主人 Bob，关闭后回原列表、筛选、搜索和滚动状态。缺少的性格、趣味头衔和主人名言直接省略，不编造内容或新增必填项；查看本身不增加收集数。
- 保留「翻面看原图」与低强调的「资料删除申请」。本图只展示正面，不伪造原照片；删除入口仍进入既定人工申请流程，不直接下架或删除。没有新增编辑、卡片分享、领取奖励或二维码。
- 两图均为 853 × 1844，已目视核对六个可见宠物名、四组主人绑定、剪影不泄露资料、长姓名、详情关闭与操作入口，以及底部内容完整性。详情背景为生成近似，实际列表布局与字面文案分别以列表 v1 和 UI_COPY 为准；后续直接复用正式透明 PNG，不从截图裁取头像。用户已确认两图，当前没有验证真实搜索、翻面、弹层状态保持或删除请求。

使用内置 ImageGen，未使用 CLI。提示词留档为 [图鉴列表 v1](concepts/mobile-petdex-v1-prompt.txt)、[详情初稿 v1](concepts/mobile-pet-detail-v1-prompt.txt) 和 [详情竖屏修订 v2](concepts/mobile-pet-detail-v2-prompt.txt)，未编写游戏代码。

### 2026-10-22 新增：手机我的宠物

- v1 展示当前身份 Bob 的两只已上架宠物 Maodu 与 Boluo，主人关系已按当前素材清单核对。默认人形头像只演示当前身份位置，未读取实际 Slack 头像或建立线上归属映射。
- 本图为独立设计示例：Maodu 已收集，Boluo 尚未收集；不把它与之前两只均已收集的 4 / 81 图鉴图当作同一时刻的玩家状态。两只均显示完整正式形象，因为当前玩家可查看自家已上架资料；「未收集」不是待上架或资料缺失，不改为剪影或锁定卡。
- 页面上方提供明显的「添加我家毛孩子」入口，以及既定「新提交的宠物，人工处理并上架后可在这里查看。」说明。该句为静态展示范围，不代表有投稿已收到或正在处理；本页不列提交队列、制作进度或审核状态。
- 每卡提供「查看资料」与低强调的「资料删除申请」。查看复用已有宠物详情，显示实际收集状态，不因查看或翻面而收集；申请仍由 Bob 人工核实，不直接删除或立即隐藏。只有未收集的 Boluo 卡展示既定完整收工、保存后收进图鉴的说明。
- 两张卡共用中性浅底，宠物保留完整耳朵与头部、无颈部，不把局内辅助颜色当作固定身份。图稿参考现有透明 PNG，仍为生成近似，后续直接复用正式资源。
- 图稿为 853 × 1844，已目视核对当前身份、两只宠物名与形象、两种收集状态、上架说明、查看／添加／删除申请和底部完整空间；用户已确认本图。本轮未实现资料查询、详情切换、上传或申请，也未测试触控与浏览器布局。

使用内置 ImageGen，未使用 CLI；完整请求留档为 [手机我的宠物 v1 提示词](concepts/mobile-my-pets-v1-prompt.txt)。未编写游戏代码、改变收集记录或处理真实删除申请。

### 2026-10-22 新增：手机删除申请弹层

- v1 从已确认的「我的宠物」页中 Maodu 的资料删除申请入口打开，背景仍是 Bob 的两只自家宠物示例，Maodu 保持已收集与正常展示。前景为白色底部弹层，自动关联 Maodu，显示头像、名字与只读主人 Bob，关闭后回原列表。
- 标题、人工处理说明、选填标签与提交按钮均使用 UI_COPY 9.2 已确认文案。关键说明清楚显示：「提交后，由 Bob 人工核实和处理；申请不会立即隐藏或删除资料。」不承诺处理时限，不把申请当作立即删除。
- 本图是尚未提交的空白表单，只有补充说明这一项选填输入，留空仍可提交；不增加原因必填、范围勾选、身份更改、验证步骤或第二次确认。关闭入口为 X，主按钮为正常可用的「提交申请」。
- 只有申请成功保存后才使用「申请已收到，等待人工处理。」回执；失败使用既定重试提示。待处理和已处理仍按既定规则区分，当前图不混放这些状态，也不使背景宠物下架、图鉴减数或成绩作废。请求、核实和清理流程以 GAME_FLOW、TECH_PLAN 为准。
- 图稿为 853 × 1844，已目视核对申请对象、关键说明、补充说明选填、空表单可提交、关闭与底部安全空间；用户已确认本图。背景与头像为生成近似，正式界面沿用已确认列表与真实透明素材，不以此图作为精确背景截图。
- 本轮只补静态弹层，尚未实现提交、重试、关闭后状态保持或处理结果读取，也未发起真实删除请求。

使用内置 ImageGen，未使用 CLI；完整请求留档为 [手机删除申请 v1 提示词](concepts/mobile-delete-request-v1-prompt.txt)。未编写游戏代码或改动宠物资料。

### 2026-10-22 新增：手机局外设置弹层

- v1 从已确认的门店首页打开，深色遮罩后保留 Deedee 店长和门店视觉，前景白色底部弹层仅包含语言、背景音乐、消除音效与轻震。关闭 X 返回门店，没有独立保存或恢复默认按钮。
- 本例当前偏好为中文、背景音乐关、消除音效关、轻震开，且假定设备支持轻震。首次默认声音关闭、支持设备轻震开启的既定规则保持不变；以后沿用玩家已记住的偏好，不能因重新打开设置或开局而重置成本图状态。
- 开关同时用文字与位置标识：关闭为「关」及左侧圆点、灰色轨道；开启为「开」及右侧圆点、橙色轨道。关闭的声音行仍为可操作状态，不以灰化文字表示不可用。本例不同时显示震动不支持提示；不支持时仍按既定文案说明并保持正常游玩。
- 语言使用「中文／English」，本图中文选中。切换只改变界面语言，姓名、已填内容和记录保留；语言入口仍位于首次进入页与局外设置。局内轻量设置只保留三项声音／触感开关，打开时两个计时器继续，本图不展示局内情境或暂停功能。
- 底部「会记住你的选择。」说明偏好沿用，关闭无需另存。图稿为 853 × 1844，已目视核对语言选中、三项开关文字与方向、关闭入口和底部安全空间；用户已确认本图。
- 本轮未实现语言切换、音频播放、设备震动支持检测或偏好存储，尚未测试真机触感和浏览器布局。背景为生成近似，正式页面沿用已确认首页与正式素材。

使用内置 ImageGen，未使用 CLI；完整请求留档为 [手机局外设置 v1 提示词](concepts/mobile-settings-v1-prompt.txt)。未编写游戏代码或改变真实设备设置。

### 2026-10-22 新增：手机排行榜

- v1 展示已发现鱼关的 Bob 查看普通宠物店榜单，所以顶部可见「宠物店／鱼关卡」，当前选中宠物店。尚未发现鱼关的玩家不显示鱼标签或锁定预告；首页仍无鱼关入口。
- 默认视图为「领先玩家＋自己附近」。上方三个领奖台按左二、中一、右三排列；下方「我的名次／全榜」切换中，当前选中我的名次，展示附近四位同事而不是只有自己。姓名、最好成绩、头像和排名构成主要层级，Bob 行单独用浅橙底与「你」标记突出。
- 所有成绩和位次均为图稿示例，不是真实公司排行榜：Emma 4,980（第 1）、Sam Pineda 4,260（第 2）、Yoo 3,920（第 3）；附近为 Fiona 2,640（第 6）、Bob 2,480（第 7）、Luz 2,480（并列第 7）、Rachel Shaw 2,360（第 9）。同分不另设先后，后续名次按竞赛排名跳号，不把 Luz 改排第 8。字母头像演示默认占位，并未读取实际 Slack 头像。
- 底部「再挑战一次」进入当前所选模式的开局准备页，准备阶段不计时；不表示向某位同事发出挑战，也不新增邀请、奖励、赛季或每日榜。全榜浏览后的「回到我的名次」仍按既定流程提供，本图在本人附近状态不重复显示。
- 图稿为 853 × 1844，关键文字、长姓名、三人领先区、四行附近列表、同分跳号与底部操作均完整可见。无成绩与读取失败状态仍使用 UI_COPY 中各自说明，不用此示例伪造名次；用户已确认本图，当前未验证实际榜单查询、切换、滚动定位或跳转。

使用内置 ImageGen，未使用 CLI；完整请求留档为 [手机排行榜 v1 提示词](concepts/mobile-leaderboard-v1-prompt.txt)。仅补静态效果图，未编写游戏代码或连接在线成绩。

### 2026-10-22 新增：手机上传宠物

- v1 展示选择照片并填写名字后的提交前状态，沿用已定的「添加我家毛孩子」标题与中文文案。Oreo 伯恩山犬照片为历史桌面设计中的虚构示例，本轮作生成近似；主人 Bob 与字母头像用于演示当前玩家信息带出，不表示 Bob 实际拥有这只宠物，也未向素材目录新增记录。
- 单张生活照作为原图预览，保留「换一张」和宠物名字输入。主人面板展示「主人：Bob」与核对提示，沿用当前所选同事身份，不增加任意填写他人归属的输入框。页面不增加性格、名言、品种或联系方式等资料门槛。
- 照片下方说明人工处理与核对后上架；提交前完整展示处理头像、原图、宠物名字和主人信息的用途摘要，以及「查看照片展示与处理说明」入口。此图不展示说明正文；具体处理服务与原图使用范围仍需按实际方案补齐，摘要不替代详细说明，也不新增默认勾选或独立确认步骤。
- 底部主操作为「提交」。照片与资料均保存成功后才使用既定「资料收到啦！核对处理好，就让毛孩子来上班。」回执，并提供继续游玩或回门店；本图不混放成功状态。提交失败保留填写内容并重试，首版不提供后续进度、退回修改或自动上架通知。
- 图稿为 853 × 1844，原图、名字、主人核对、展示摘要、说明入口和提交按钮均在一屏完整可见。没有裁切工具、缩放、画风选择、成品双预览、审核管理、提交即收集或立即上架的反馈。后续由项目发起人人工处理，正式上架后才进入公共素材池，且不改变正在进行的棋盘。
- 已目视核对关键文案、预览的正常照片形态、表单信息层级与底部安全空间；用户已确认本图，当前未验证系统选图、键盘展开、实际上传保存、失败恢复或说明链接。

使用内置 ImageGen，未使用 CLI；完整请求留档为 [手机上传页 v1 提示词](concepts/mobile-upload-v1-prompt.txt)。仅补静态效果图，未编写游戏代码、提交真实照片或改动宠物素材。

上传成功后的操作已确认：主按钮「继续游玩」进入普通宠物局准备页，次按钮「回门店」返回首页；点「开始这班」才开始计时。成功只表示照片与资料已收到，新宠物仍待人工处理与上架。提交中保留照片与名字并防止重复点击，失败留在原页保留内容供重试；本轮仅补交互说明，未新增成功或失败效果图。

上传页未提交内容的站内离开确认已确认：有照片或名字时，回门店／站内返回先提示「照片和名字还没提交，要离开吗？」；主按钮「继续填写」保留表单，次按钮「放弃并离开」清除本页未提交内容并前往原目标。空白表单直接返回，成功页不显示此提醒。照片使用说明在当前页展开并保留输入；首版不增加草稿箱。本轮仅记录交互与双语文案，未重绘效果图。

主人归属已确认固定使用当前游戏身份，只读展示，不增加上传页修改主人或重新选择身份的入口。当前 `upload.owner_hint` 改为「将以当前游戏身份提交。 / This submission will use your current game profile.」。手机上传图中的原核对提示保留为历史字面文案，后续以 UI_COPY 为准；本轮未重绘图片。

### 2026-10-22 新增：普通宠物局成绩分享卡

- 玩家轻量署名已确认：「本局玩家：{playerName} / Played by: {playerName}」，取该局记录对应的玩家，不能换成当前查看者或 MVP 主人姓名。与 MVP 标签分开显示，保持次级层级，不因此增加玩家头像或联系方式。
- v1 是可独立保存、发送的成绩图片设计，不是手机报告页截图或分享弹层。采用约 4:5 的竖幅、白色报告单、橙黑品牌与收据边缘；实际生成图为 1122 × 1402，图稿不锁定未来导出分辨率。
- 与已确认的普通报告示例一致：本局玩家 Bob、MVP Maodu、2,480 分、催单成功，评语「临时加单？安排得明明白白。」，称号「精准排班大师」。姓名和成绩为示意，不代表线上对局或真实排名；此卡不新增个人新纪录、名次或奖励。
- 顶部保留 MoeGo、游戏名与普通宠物店模式；Maodu 头像和评语为主角，分数保持醒目，称号缩为旁侧小章，玩家署名在底部。头像参考现有透明头部素材，保留眨眼、绿色眼睛、狸白花纹和完整耳朵；图中仍为生成近似，后续直接使用正式 PNG。
- 分享卡沿用当前界面语言单张单语、同一局事实不变及下架资料过滤规则。本图为中文版本，名字保留原文；没有语言开关、操作按钮、二维码、新宠收获、竞猜或鱼关邀请。玩家仍先预览，再主动保存或调用分享入口。
- 已目视核对品牌、宠物身份、评语、分数、称号、玩家署名与安全边距；用户已确认本图。当前尚未实现图片合成、下载、系统分享或缩略图展示验证。

使用内置 ImageGen，未使用 CLI；完整请求留档为 [普通成绩分享卡 v1 提示词](concepts/share-card-pets-v1-prompt.txt)。本轮仅保存设计图与玩家署名规则，未编写游戏代码或发送图片到 Slack。

### 2026-10-22 新增：鱼关成绩分享卡

- 普通分享卡 v1 的信息主次与视觉已获用户确认，本轮沿用同一套独立分享图片结构，为鱼关补水族主题图。v2 采用深蓝水下外景、浅色收据、白橙品牌、鱼色大图和气泡名牌，保持角色与评语优先、分数醒目、小称号及底部署名的层级。
- 内容沿用已确认的 Fish Report 示例：本局玩家 Bob、MVP 鱼色类别天蓝色、3,260 分、最高 5 连锁对应「连锁反应负责人」，评语「这波水流，鱼都跟上节奏了。」。天蓝色对应现有 Sky Blue 类别，不为个体鱼编造姓名或主人；小鱼参考当前 fish_color_blue.png 的横向浅色带、蓝鳍与叉尾。图片与成绩为设计示例，不是线上记录。
- 分享图仅保留 MoeGo、游戏名、鱼关卡模式、MVP、评语、分数、称号与玩家署名。原局玩家 Bob 与 MVP 类别分别标识；没有主人资料、猫狗元素、普通图鉴收获、竞猜、公共鱼缸进度、榜单名次或新纪录。保留真实品牌标志，其他名牌使用气泡形状。
- 本图展示鱼主题成绩，不写解锁条件或加入邀请入口；个人累计三局触发、解锁后从鱼榜返场的规则保持不变。图片仍单张单语、先预览后由玩家主动保存或调用分享入口，画面不含语言开关、操作按钮或二维码。
- v1 为初稿，v2 调整竖幅比例与气泡名牌。v2 实际为 1121 × 1403，与普通分享卡均接近 4:5；当前是构图参考，不锁定未来统一导出的像素规格。后续直接使用正式透明小鱼 PNG，不从截图裁取头像。
- 已目视核对鱼色、品牌、评语、3,260 分、称号、玩家署名与完整边距；用户已确认本图。尚未实现图片合成、保存、系统分享或聊天缩略图验证。

使用内置 ImageGen，未使用 CLI；提示词留档为 [鱼关分享卡 v1](concepts/share-card-fish-v1-prompt.txt) 与 [比例和气泡名牌修订 v2](concepts/share-card-fish-v2-prompt.txt)。未编写游戏代码、改变素材或向 Slack 发送图片。

### 2026-10-22 Peter 鱼关：深蓝水下实战图

- 用户选择深蓝水下氛围。本图保留普通棋盘的信息层级与手机一屏操作，使用深蓝环境、柔和水面光束和少量气泡，MoeGo 标志适配为白／橙，主时钟仍用橙色强调；背景鱼影、水草与石头只作装饰，不参与匹配。
- 稳定示例状态为本局剩余 48 秒、分数 2,480、催单剩余 8 秒、进度 6 / 12。催单尚未成功，不显示 +100；喷头当前只有直接范围预览，尚未发生清除，因此没有本批次加分飘字。
- 7 × 7 共 49 格，47 格为小鱼，另 2 格分别是水流喷头与气泡机。图稿沿用现有六鱼色作示例：红白斑、金黄、绿条纹、蓝横纹、紫深尾、黑白鞍斑；全部鱼格使用统一浅冰蓝底，类别由小鱼本身区分，不能把背景光或棋格底色当成匹配键。六色色数仍按原建议留待试玩调节。
- 水流喷头位于第 4 行第 3 列，带横向箭头，向右拖动的薄亮行框表示整行预览。气泡机位于第 5 行第 6 列，带十字能力标记。两者只是梳子／剪刀的鱼关外观，能力、生成、合体与计分不变。
- 页头复用已校读的「小鱼也来排班啦」与同色匹配说明，底部只保留单条喷头说明、设置与退出。没有宠物图鉴收获、主人竞猜、家庭团聚、公共进度或首页入口，也不改变个人三局触发与从鱼榜重玩的流程。
- 已目视检查 49 格、六鱼色辨识、两工具标识、稳定局面无现成三连、两个倒计时、未完成催单状态与底部控件距离；图像副本一致，尺寸为 853 × 1844。用户已确认此版鱼关棋盘；当前没有运行游戏、测试触控或连接真实成绩。

使用内置 ImageGen，未使用 CLI，完整请求见 [鱼关图稿提示词](concepts/mobile-fish-board-v1-prompt.txt)。图稿小鱼为现有透明 PNG 的生成近似；后续界面直接使用正式单鱼素材和稳定颜色类别，不从截图裁切棋子，不改动原素材。

### 2026-10-22 补齐：鱼关准备与 Fish Report Card

- 准备 v1 延续深蓝水下环境与浅冰蓝鱼格，按素材清单的当前展示名呈现六类：珊瑚红、金黄色、翡翠绿、天蓝色、紫罗兰、黑白色。名称对应颜色类别，不是六只独立真实宠物；匹配仍使用稳定的鱼色类别。
- 准备态展示同色匹配和拖拽／相邻点选方式，明确「本局 90 秒。准备和读说明不计时，点下方按钮后开始。」，点击「开始这班」才进入计时。没有运行中倒计时、分数、催单、自家宠物提示或提前道具教学；背景鱼影只作装饰。
- 报告 v1 采用深蓝环境衬浅色纸面，保留收据、MVP、称号、评语和统计的家族样式。示例为首次鱼局完整结束且保存成功：3,260 分、清除 140 格、最高 5 连锁、工具发动 4 次；催单成功且没有气泡机双合体，主称号为「连锁反应负责人」，评语为「这波水流，鱼都跟上节奏了。」。清除得分 3,160 与催单奖励 100 可构成示例总分，140 格不表示独立鱼的数量。
- 本局 MVP「天蓝色」来自当前鱼色清单的 name_zh，对应英文 Sky Blue；它表示本局服务最多的颜色类别，不给个体鱼编造名字。首次鱼成绩只建立本模式基准，不显示刷新已有个人纪录的庆祝。
- 报告提供鱼关排行榜入口，底部固定「再开一局」与「分享成绩」；再开继续鱼模式，分享沿用主动预览、当前语言单张单语和无二维码规则。不出现普通宠物新图鉴、主人竞猜、家庭团聚、店长狗署名或再次鱼关邀请。
- 两图均为 853 × 1844，已目视检查六类名称与鱼色、未计时说明、统计口径与称号、MVP 类别、保存状态、正文与底部操作距离；图片副本一致，用户已确认这两张图。当前只完成静态图稿，尚未验证点击、滚动、实际计分或联网保存。

使用内置 ImageGen，未使用 CLI；提示词留档为 [鱼关准备 v1](concepts/mobile-fish-prep-v1-prompt.txt) 和 [Fish Report Card v1](concepts/mobile-fish-report-v1-prompt.txt)。后续使用正式透明鱼素材，图稿不替代素材清单或真实运行验证。

## 洗护动效：已确认的试玩初值与分镜草稿

目标是「手忙脚乱但很爽」：普通三消轻弹出泡泡，梳子摇一下再扫线，剪刀咔嚓带出十字，合体通过更大的实际范围加强反馈。以下时长已确认为首版初始试玩基准，用户明确后续可以调整，不作为固定产品参数；当前没有实现动画。

| 场景 | 动作顺序与准确范围 | 单批次回稳参考 |
| --- | --- | --- |
| 普通三消 | 匹配棋子轻弹 → 少量泡泡飞散 → 补落 | 约 440 ms |
| 梳子发动 | 工具短摇 → 按方向扫整行或整列 → 补落 | 约 500 ms |
| 剪刀发动 | 开合一次 → 所在行与列同时清除 → 补落 | 约 540 ms |
| 梳＋梳 | 两工具合体提示 → 十字清除 → 补落 | 约 540 ms |
| 梳＋剪 | 两工具合体提示 → 三行三列清除 → 补落 | 约 580 ms |
| 两剪刀合成 | 两把剪刀合拢 → 变为吹风机 → 补落 | 约 460 ms |
| 吹风机发动 | 吹风机鼓风 → 全盘短波纹与泡泡 → 补落 | 约 620 ms |

参考时间包含一次交换、一个清除批次与补落，假设没有后续连锁。普通三消的分段参考为：视觉交换约 100 ms、轻弹约 60 ms、泡泡清除约 80 ms、下落约 160 ms、落位缓动约 40 ms；分段可随手感调整。交换达到既定阈值即生效，100 ms 不是新增确认步骤；后续连锁不重复交换阶段，也不承诺整段连锁都在表内时间结束。

### 保留的规则与反馈边界

- 新生成道具只短促显现，按既定时机留在棋盘上；摇晃与咔嚓对应实际发动，不能因为生成就自动触发。
- 同批次多工具的反馈可重叠或短暂错峰，视觉错峰不拆成多轮，不重复计算交集。得分与催单进度按同批次统一的逻辑清除结算时点更新，不能等待粒子尾迹，也不能用画面错峰改变催单截止判定。
- 连锁处理完成、棋盘稳定后即可接下一步，纯装饰尾迹不额外锁输入。下落期间仍按既定规则不接新交换，不新增操作排队。
- 本节交换、消除、道具与下落期间计时继续；系统死局洗牌仍保留同时暂停两个时钟的例外。时间归零后只完成最后有效操作的连锁。
- 连锁通过泡泡密度、短音和短触感递进，强度在较高连锁后封顶；实际连锁数字继续递增，计分倍率仍按既定最高 ×5。棋盘与控件位置保持稳定，简化动效时减少粒子和摇晃，范围与结果不变。

声音仍首次默认静音，并沿用已保存偏好；开启后普通消除用短「啵」、梳子用「刷」、剪刀用「咔嚓」，合体保留一个主音，同批次不逐格叠音。支持轻震的设备仍首次默认开并记住选择；推荐普通批次一次短点，强合体使用一个短双点模式，不逐格叠震。卡关提示、载入页面与未成功消除不额外试震，后台停止声音和触感。具体音量与真机触感留待试玩。

### 分镜的适用范围

[分镜 v3](concepts/motion-storyboard-v3.png) 只用于讨论材质、动作和起势→清除→补落顺序，不是精确棋盘快照或物理重放。已知偏差：梳子起势镜头为 3 × 6，后续为 3 × 7；梳剪清除图仍为 2 行＋3 列，共 29 格。三次生成均留档，不把这些绘制误差升级为规则变更。

正确的梳剪直接范围仍是 3 行＋3 列。在完整 7 × 7 棋盘、落点居中且不计后续工具连锁时为 33 格；「清」表示直接清除，「留」表示不在直接范围，靠边仍按已定规则裁边：

| 行／列 | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 留 | 留 | 清 | 清 | 清 | 留 | 留 |
| 2 | 留 | 留 | 清 | 清 | 清 | 留 | 留 |
| 3 | 清 | 清 | 清 | 清 | 清 | 清 | 清 |
| 4 | 清 | 清 | 清 | 清 | 清 | 清 | 清 |
| 5 | 清 | 清 | 清 | 清 | 清 | 清 | 清 |
| 6 | 留 | 留 | 清 | 清 | 清 | 留 | 留 |
| 7 | 留 | 留 | 清 | 清 | 清 | 留 | 留 |

单剪刀与梳＋梳仍为一行＋一列的十字，完整居中时为 13 格；剪＋剪清全盘 49 格。覆盖、连锁和同轮去重继续以既定规则为准，不从图稿反推。

### 已确认：局内加分飘字

已确认每个逻辑清除批次合并一条「+本批次得分」，同次操作中补落形成的后续消除再合并显示下一条。同批次多组匹配或工具命中去重后聚合，不按格子或工具实例分别飘分；同批工具连锁不增加轮次。普通局与鱼关沿用同一表现。

清除飘字含本批次的既定连锁倍率，不含催单 +100；催单奖励只用原任务条反馈，总分仍按实际结算实时更新，各奖励只计一次。飘字粒度已确认，表中的动效时长现已确认为可调试玩初值；分镜绘制偏差的适用范围说明继续保留。

本轮使用内置 ImageGen，未使用 CLI；[初始分镜提示词](concepts/motion-storyboard-v1-prompt.txt)、[范围修订提示词](concepts/motion-storyboard-v2-prompt.txt)、[横带修订提示词](concepts/motion-storyboard-v3-prompt.txt) 均留档。当前只有静态分镜和节奏建议，没有动画、音乐或触感的实际运行结果，未编写游戏代码。


## 生成方式与提示词

使用内置 ImageGen 生成和定向编辑，未使用 CLI 或编写应用代码。首页先建立视觉系统，棋盘参考首页，报告卡参考首页与棋盘，随后对首页和报告卡做局部修订。原始品牌参考保存在 references/，早期图稿保留在 concepts/，选定展示版本见上表。

### 首页初稿

Use case: ui-mockup. Create ONE polished, production-quality desktop web-game HOME SCREEN concept, 1536 x 1024 landscape. This is a visual design image only, no code, no device frame, no browser chrome, no collage. It is screen one of a cohesive three-screen MoeGo company pet match-three game. Chinese-first interface with a small 中 / EN switch. Current mock date anchor is October 21 2026 if any date appears; do not add dates unnecessarily.
INPUT REFERENCES: image 1 is the genuine MoeGo logo; preserve its dog/check symbol and black/orange wordmark. Images 2-5 are genuine MoeGo character sheets: floppy-eared black-and-white dog with tan markings, cobalt-blue cat, coral-red pointed-ear dog, mustard-yellow dog with scarf. Use these recognizable flat expressive characters, silhouettes, wide eyes, markings and brand visual language, not generic new mascots or photoreal pets. These characters are temporary sample pets, not actual employee portraits.
ART DIRECTION: lovable, witty, high-taste 'MoeGo 毛孩子全明星' employee pet shop. Crisp white base, MoeGo vivid orange #F47721, charcoal #292A2F, cobalt blue #365BB4 and restrained mustard/coral accents. Charming flat vector-like illustrations with crisp edges, sticker cutouts with white rims and a tiny charcoal offset shadow, cheerful hand-drawn moments, rounded bold Chinese typography and exceptionally legible controls. Predominantly white open space. No beige paper wash, no gradients, no purple, no clay/3D, no glassmorphism. UI has practical HTML-reproducible layout, generous margins, 24-ish px rounding, select 2px charcoal outlines and 4px offset shadows. Avoid a dashboard card grid and nested cards. This should be a polished playful playable web game homepage, not a SaaS landing page.
HEADER: 92px tall, logo at left around 180px wide. Slim nav labels '门店' active, '宠物图鉴', '排行榜', '我的宠物'. At right small '中 / EN' and a round initial-avatar B. Thin light divider under header. Do not fill it with other menus.
MAIN COMPOSITION: airy two-column upper area. Left, very readable large headline '毛孩子全明星', smaller warm sentence '今天，和毛孩子一起上班。' and supporting line '给同事家的毛孩子，安排明明白白。'. ONE very prominent vivid orange rounded button with black offset shadow, label '开始营业' and a small paw icon. Under it quiet text '一局 90 秒，快乐营业'. Small understated text action '带我家毛孩子入职 +' is secondary. No eyebrow badge or pretitle above the heading.
Right focal point: a large charming flat illustration of a tiny white/orange striped-awning grooming counter with the genuine black-and-white floppy-eared brand dog as shop manager, mustard scarf and a little nameplate '今日店长 · Mochi'. Blue cat and yellow dog peek around the counter as supporting characters, not a crowded scene. Tiny speech bubble attached to manager says '今天的罐头，我来赚！'. Preserve all characters' anatomy and official style.
LOWER AREA: two light, asymmetric supporting zones on the same white page, separated with spacing rather than a grid of large cards. Left 2/3: 'Peter 的鱼缸' with a compact lovely cobalt blue water fishbowl, a few colored fish, orange/blue progress rail labeled '68%', plus small sentence '大家一起营业，解锁五彩鱼关卡'. This represents illustrative game-state data, not real company metrics. Right 1/3: '去图鉴认认新同事' with 3 loose overlapping mini pet portrait stickers (blue cat, red dog, yellow dog), and an understated arrow '打开宠物图鉴'. Keep these zones subordinate to the main call to action.
Footer very quiet links '游戏说明' and '信息与删除申请'. Render all supplied Chinese text accurately and naturally, with precise spacing. Ensure every section fits within viewport with breathing room, large readable text and no clipped content. Do not invent extra currencies, shop systems, advertisements, paid items, buildings or unrelated game mechanics.

### 首页局部修订

Make ONE small localized edit to this existing MoeGo game homepage mockup. Add a subtle readable single line '我的最佳 2,480' in medium gray rounded sans-serif, approximately 18px, centered in the open vertical space between the existing text '一局 90 秒，快乐营业' and the existing underlined upload link '带我家毛孩子入职 +'. Preserve both existing lines and their wording. This new personal-best record should be visually quiet and not compete with the large orange '开始营业' button. Keep every other element and composition as close to the original as possible: the genuine logo, header, type, Chinese text, title, button, pet store and manager characters, orange/white palette, fishbowl, 68% progress, illustrated card entry, footer and 1536x1024 dimensions. Do not redesign or add other features.

### 三消棋盘

Use case: ui-mockup. Create ONE high-fidelity desktop match-three GAMEPLAY SCREEN, 1536 x 1024 landscape, Chinese UI. Single app screen, no browser chrome, no phone, no collage. Screen two of the same MoeGo employee pet game as reference image 1. Treat image 1 as the exact visual system: crisp white ground, vivid MoeGo orange #F47721, charcoal #292A2F, cobalt blue, adorable flat pet stickers with white rims, 2px playful charcoal contours, tiny offset shadows, rounded bold Chinese typography. Same recognizable MoeGo logo and proportional header placement. Maintain the genuine mascot identities from the attached sheets. No beige global wash, no gradients, no purple, no 3D/clay, no dashboard cards or unrelated mechanics. This is a realistic practical UI mockup with sharp legible game controls, generous spacing, not a poster.
REFERENCES: image 1 = homepage design to match; image 2 = official floppy-eared black/white/tan MoeGo dog; image 3 = official cobalt blue cat; image 4 = official coral red cat; image 5 = official mustard yellow dog. Include six easily differentiated pet portrait tile types: black-and-white dog, cobalt blue cat, coral red pointy-eared dog seen on homepage, mustard yellow scarf dog, coral red cat, and a small white dog in the same flat expressive visual language. All portraits for a given type must be IDENTICAL in pose/markings throughout the grid. Brand pets are sample game characters, not real employee photo claims.
HEADER 92px: small genuine MoeGo logo at left, text link '返回门店', small '中 / EN' and round orange B avatar at right. Gameplay header is simpler than home; no crowded navigation.
LAYOUT: three airy columns with clear hierarchy, usable full screen. Dominant central area from x420 to1050 has the title 'Smart Scheduling' and subtitle '拖一拖，安排明明白白。' above a complete 7-by-7 match-three board. EXACTLY 7 ROWS and 7 COLUMNS, 49 evenly sized rounded-square cells, consistent gutters, aligned straight-on. All seven rows fit comfortably. Pet portraits occupy cells clearly, bright pastel fills differentiate the six types, small subtle shadows make them tactile. Board approx 620 x620px, pale peach base with an understated charcoal outline and offset shadow. Show one adjacent swap selection with a small curved arrow, a highlighted run of three identical yellow-dog tiles, tiny sparkles and a compact orange '安排成功！' effect outside the active cells. Do not distort the grid, merge cells, scatter arbitrary stickers over tiles, cover cells with text, or put more than one pet per cell. No names on individual cells.
LEFT COLUMN about280px wide: title '营业中' with a small paw/clock motif. Very large orange ring clock with white center displaying '01:08', caption '剩余时间'. Below: large charcoal '2,480', label '本局得分'. Smaller service progress line '已服务 12 位毛孩子' with a short orange progress rail. Show one little official blue cat sitting near the bottom of this column, playful but subordinate.
RIGHT COLUMN about280px: an orange-outlined paper speech-note with label '主人催单', tiny orange clock '18 秒', exact message 'Mochi 快到了，能插个队吗？', supporting text '连续消除，优先接待'. No distracting modal. Below it in generous white space a half-body black-and-white shop-manager dog sticker with golden scarf, a small speech bubble '这排班，有两下子！'. The order stays outside the chessboard. No fishbowl, leaderboard, collection inventory, extra currencies, power-up shop, lives or monetization in this scene.
At bottom below board, quiet instruction '拖拽相邻宠物，三个相同即可完成服务'. Typography crisp, Chinese accurate, comfortable 16-20px controls, labels clearly readable; artwork should feel charming and polished. Show the full gameplay screen within the requested viewport, no clipping. Dates are unnecessary; if any must appear use October 21 2026.

### Report Card 初稿

Use case: ui-mockup. Create ONE polished desktop END-OF-GAME 'Grooming Report Card' screen, 1536 x1024 landscape, Chinese-first MoeGo employee pet match-three game, no browser chrome or device frame. Screen three of the SAME game in image1/homepage and image2/gameplay. Match those references faithfully: white airy base, vivid MoeGo orange #F47721, charcoal #292A2F, cobalt blue accents, playful flat expressive pet stickers with white rims, rounded heavy Chinese typography, selectively 2px charcoal outlines and tiny offset shadows. Use the genuine MoeGo logo and same 92px header placement, orange B avatar and 中 / EN switch. Image3 is the official black-and-white/tan dog character sheet. The black-and-white shop manager should keep its floppy ears, face markings and mustard/golden scarf as in screen1 and2. Characters and numerical results are illustrative sample data. No claim that these are actual employee pets. Avoid gradients, 3D clay, purple SaaS visuals, beige full-page wash, nested cards, decorative feature inventory.
HEADER: small genuine MoeGo logo left, link '返回门店', '中 / EN' and round B avatar right. Below, a strong clear heading 'Grooming Report Card', smaller sentence '今天，也把毛孩子安排明白了！'. The purpose is celebratory, collectible, shareable end-of-shift report. One action primary.
MAIN: a large share-ready horizontal white report sheet occupies about two-thirds width, from x72 to1050 and y235 to850, selectively charcoal outline with tiny offset shadow, a tasteful tear-off/scalloped bottom edge reminiscent of a grooming receipt. Paper is a meaningful report artifact, not an app-in-a-card around the whole screen. Leave generous margins. In the sheet's upper corner subtle date '2026.10.21'. Inside use a clear score-and-MVP split: bold large score '2,480', label '本局得分', small line '服务了 12 位毛孩子'. A playful orange award ribbon reads '精准排班大师'. Beside it large proud official black-and-white dog sticker with scarf, label '本局 MVP · Mochi'. Below, a readable pet-voice quote '洗得挺好，下次还来！'. Near lower edge a small row of three newly unlocked pet portrait stickers (blue cat, red pointed-ear dog, yellow dog), caption '新解锁 3 位毛孩子'. A small orange paw approval stamp and signature '今日店长 · Mochi' complete the report. Avoid extra lengthy report fields or random medical information.
RIGHT SUPPORTING RAIL about330px wide, two light groups on the white surface separated by whitespace, not a stack of nested heavy panels: top 'Peter 的鱼缸' with compact fishbowl illustration, sentence '本局贡献 +12', a progress rail marked '68%', small caption '离五彩鱼关卡又近了一点'. Below, an unobtrusive optional quiz, heading '猜猜 Mochi 的家长是谁？'. Three short selectable outlined answer options 'Alex', 'Mia', 'Sam' with simple colored initial avatars, and quiet text link '跳过'. This stays inline and does not block the main result.
ACTIONS: below the report sheet, a wide prominent orange button with charcoal offset shadow '再开一局', beside a white outlined button '分享战绩'. Quiet small success state nearby '成绩已记录'. These must fit completely with 40px bottom margin. Make buttons same anatomy as homepage Start button. No modals or reward overlays. All Chinese and English text rendered accurately, titles sharp, body comfortably legible, avoid any clipped or overlapping content. It should feel like an adorable MoeGo pet wrote and stamped a real report for a coworker, beautifully edited and joyful, professional UI mockup with restrained witty illustrations.

### Report Card 局部修订

Edit this existing MoeGo Report Card mockup with ONE precise UI correction. In the top-right light-blue 'Peter 的鱼缸' group, the orange horizontal progress bar currently fills about one third of its rounded gray track while the label says '68%'. Change ONLY this progress indicator so that orange fill spans exactly 68 percent, roughly two-thirds, of that same track's width. Keep the track location, width, height, rounded style and '68%' label unchanged. Preserve every other pixel of the complete design as closely as possible: all typography, all Chinese and English text, score2,480, service12, date2026.10.21, +12 contribution, logo, portraits, colors, quiz, paper shape, buttons, spacing and 1536x1024 composition. Do not redesign, add features, move elements or change any wording. This is a final design polish, not a new variant.



## 第二组页面生成提示词

继续使用内置 ImageGen，实际提示词如下。上传页包含宠物名字的局部修订。

### 宠物图鉴

Use case: ui-mockup. Create ONE polished desktop PET ENCYCLOPEDIA / COLLECTION screen for the same MoeGo pet match-three game as attached reference images, 1536 x 1024 landscape. This is a standalone UI concept image, no app code, no browser chrome, no device, no multi-screen collage. Image1 is the user-approved HOME visual system; image2 is the matching REPORT CARD. Match their exact logo, rounded bold Chinese lettering, crisp white ground, cheerful orange #F47721, charcoal #292A2F, cobalt blue accents, cute flat pet sticker cutouts with white rims, small offset shadows and selective hand-drawn outlines. Keep the design readable, airy and practical. Do not change to 3D, glassmorphism, photoreal character art, purple SaaS, beige full-page background, or unrelated game mechanics. Images3 and4 are actual MoeGo blue cat and black/white floppy-eared dog character references. All pet and owner data in this mockup is explicitly illustrative.
HEADER same as homepage, 92px: genuine MoeGo logo left, navigation '门店', '宠物图鉴' active with orange underline, '排行榜', '我的宠物'; right '中 / EN' and orange round B avatar. Thin divider.
PAGE TOP: bold warm title '毛孩子图鉴', subtitle '认识同事，从认识他家毛孩子开始。'. An understated collection count '已解锁 4 / 6' with simple progress rail representing four sixths. Top right prominent orange button '添加我家毛孩子 +' using same black offset shadow and paw treatment as homepage Start button. No decorative badge above heading.
MAIN LEFT TWO-THIRDS: a deliberate collection-card album, not a dashboard of arbitrary features. Filter row '全部' active, '已服务', '未遇见'. Six pet cards laid out in a clean 3-column by2-row grid. Card artworks comfortable large, names and owner labels below:
1 selected Mochi, official black-and-white floppy-eared dog with golden scarf, owner label '主人 Mia'.
2 Blue, official cobalt blue cat, '主人 Alex'.
3 Milo, official coral pointed-ear dog from home, '主人 Sam'.
4 Luna, official mustard yellow dog with blue scarf, '主人 Bob'.
5 and6 locked: pale gray pet silhouettes with small lock and text '还没遇见', no owner identity or full-color portrait.
Exactly FOUR full-color unlocked cards plus TWO locked cards, matching '4 / 6'. Use a very subtle peach, pale blue or white surface for each real collectible card; the selected Mochi card has an orange outline. No rarity currency, premium badges, star rankings of pets, duplicate unrelated metrics or card nesting.
RIGHT ONE-THIRD: selected Mochi's pet-profile flip card, a meaningful collectible ID-card object with an elegant slightly scalloped bottom, white base, thin charcoal outline and soft offset shadow. A large happy black-and-white floppy-eared dog portrait with golden scarf, identity consistent with its selected collection card and homepage manager. Name 'Mochi', playful job title '首席罐头品鉴官'. Owner row with coral round M avatar and text 'Mia 的毛孩子'. Personality line '性格：热情，见人就摇尾巴'. A small pet-voice quote '我的 KPI，只有干饭。'. A clear outlined action '翻面看原图' with a small flip icon. Quiet small link '信息删除申请' at bottom. This screenshot shows the FRONT of the card, not front/back simultaneously, no dialog overlay.
Quiet footer under left grid: '服务过，就能解锁它的入职卡。' and text link '去营业，认识更多毛孩子 →'. All supplied text accurate and readable. Avoid excessive decoration, giant mascot hero art, additional panels, or clipping. Everything fits a single 1536x1024 viewport with generous margins. No date is needed; current date anchor is October21 2026 if any date must appear.

### 排行榜

Use case: ui-mockup.
Asset type: a single polished Chinese desktop web game leaderboard screenshot, EXACT CANVAS 1536 pixels wide × 1024 pixels tall, landscape 3:2. Full page composed for this frame, no browser chrome, no device frame, no cropping. Generate the new leaderboard page of the existing MoeGo pet match-three online game.

Input reference images and invariants:
- Image 1 (/Users/bob/WebstormProjects/moego-pet-match/design/concepts/home-v2.png) is the approved home page. Use it as the precise brand, header, type, spacing, illustration and color reference.
- Image 2 (/Users/bob/WebstormProjects/moego-pet-match/design/concepts/report-v2.png) is the approved report page. Match its cheerful flat sticker cats and dogs, energetic hand drawn marks, simple offset shadows, round bold lettering, clear generous UI hierarchy.
These are STYLE REFERENCE images, not edit targets. Make ONE new leaderboard page, not a collage of the references.

Visual direction:
White background, MoeGo orange #F47721, charcoal black #25262A, small cobalt blue accents. Crisp flat 2D UI with subtle hand drawn warmth and very restrained paper texture. Rounded bold handwritten Chinese display type, rounded readable Chinese UI typography; dark thin outlines and tiny lower-right offset shadows. Friendly playful illustrated pet stickers with white cutout borders. Match approved MoeGo dog logo and black/orange wordmark accurately. Do not use 3D, glassmorphism, gradients as the main style, purple, futuristic technology, generic SaaS dashboard, elaborate trophies or visual clutter.

Layout and exact content:
1. Header is IDENTICAL IN DESIGN to the reference home page: same white full-width top bar about 94px tall, thin light-gray bottom separator; left MoeGo icon and wordmark at x70; navigation labels in this exact order "门店", "宠物图鉴", "排行榜", "我的宠物"; the "排行榜" tab is active with charcoal text and a short orange underline. Right utility "中 / EN", separator line, round orange avatar with white letter "B". Keep all header content aligned on one horizontal baseline.
2. A spacious centered page heading below the header. Exact title "毛孩子光荣榜" in large playful bold rounded display lettering, charcoal and orange. Exact gray subtitle "今天，谁把毛孩子安排得最明白？" below it, with a tiny cheerful orange accent mark. Title readable and never overlapping.
3. Below heading, a simple compact two-tab switch: "宠物店" is orange and active. "鱼关卡" is subdued gray and has a small clear lock icon. Directly next to or just below locked tab, small gray hint "鱼缸满后解锁". Do not use daily or weekly tabs.
4. Upper-middle area: a fun but restrained top-three podium, three clean rounded blocks with thin dark outlines and slight offset shadows, enough white space. Center first place is visibly highest; left second is lower; right third is lowest. Above each podium a CIRCULAR LETTER AVATAR represents a HUMAN PLAYER'S Slack avatar placeholder, never a pet photo. The exact podium data and spatial positions:
LEFT: rank "#2", orange circular avatar with white "A", player name "Alex", score "4,320 分".
CENTER: rank "#1", blue circular avatar with white "M", player name "Mia", score "4,860 分". A small simple crown only as an accent.
RIGHT: rank "#3", pink circular avatar with white "S", player name "Sam", score "3,980 分".
Be extremely precise: first Mia 4860, second Alex 4320, third Sam 3980. Rank numerals are large and names and scores are independently legible. Keep first, second and third correctly associated. Do not put pets inside player avatars. Add just two familiar MoeGo sticker characters as SMALL CHEERLEADERS at the outer edges of the podium: blue cat and black/white dog, cheering with paws. Pets are supporting decorations only and must not stand in for any human identity.
5. Below podium, ONE tidy wide leaderboard table, white rounded rectangle with thin charcoal outline or light-gray dividers and a subtle shadow. Four evenly spaced horizontal rows with clean column alignment. Header labels "排名", "玩家", "得分". Exact rows, in this top-to-bottom order:
rank "#4" | circular letter avatar "J" | "Jo" | "3,520"
rank "#5" | circular letter avatar "C" | "Chris" | "3,100"
rank "#6" | circular letter avatar "L" | "Luna" | "2,900"
rank "#7" | orange circular letter avatar "B" | "Bob（你）" | "2,480"
Only the Bob row has a very pale orange highlight background. Bob score must be exactly 2,480 to continue the home-page personal best. Letter avatars remain simple human profile placeholders. Do not add more rows or duplicate ranks.
6. Clear bottom summary/action area still comfortably inside this 1536×1024 frame: left concise text "我的排名 #7"; beside it "个人最佳 2,480"; right one large orange pill-shaped primary button with white paw icon and exact text "再挑战一次". Match orange button outline, rounded character and tiny charcoal offset shadow of the approved home-page button. The summary must not be confused with extra ranking rows. Generous bottom margin. Optionally very tiny unobtrusive gray text "示例数据" inside table top corner.

Composition requirements:
All content remains readable as a complete desktop page. Use comfortable whitespace, no large blank unused lower half, no overlap, no cut-off text or clipped button. Focus on the podium and clean table rather than adding side widgets. All exact Chinese strings, English player names, avatars, rank numbers and scores above must render faithfully. Maximal text clarity and natural Chinese glyphs.
Do not add payment, coins, premium currency, invitations, friend system, daily leaderboard, weekly leaderboard, reward offers, settings sidebar, pet adoption buttons, extra navigation, or unconfirmed functionality.

### 上传宠物

Use case: ui-mockup
Asset type: one finished high-fidelity desktop web page concept, exactly 1536 × 1024 pixels, landscape 3:2. Render only the UI, edge to edge, no browser chrome or surrounding device.
Primary request: Generate the Chinese “upload my own pet” page for the MoeGo pet match-three online game. This is ONE complete single-viewport page in an already-selected-photo / cropping-and-form-filling / NOT YET SUBMITTED state. All content must fit within the viewport with comfortable margins and no clipping.
Input images: Image 1 home-v2.png and image 2 report-v2.png are style references only. Faithfully continue their exact MoeGo brand treatment, header logo design, orange #F47721, charcoal near black, white backgrounds, cobalt blue accents, cheerful round bold typography, restrained hand-drawn marks, light outlines, short offset shadows, rounded cards and small sticker mascots. Preserve the MoeGo logo appearance from image 1. Do not copy the home/report layout or scores.
Composition: full-width familiar header, main title below, then a balanced two-column working area: real photo crop editor on the left (about half of main width) and concise form on right. A low compact bottom area contains workflow, consent and actions. White breathing room; polished confident spacing; readable Chinese text, concise hierarchy.
Header: same white header and thin gray divider as image 1. MoeGo logo at left. Navigation exactly “门店” “宠物图鉴” “排行榜” “我的宠物”; “我的宠物” is active in charcoal with orange underline. Right side “中 / EN”, thin separator, orange circular avatar with white “B”.
Hero: title “带我家毛孩子入职” in large rounded charcoal black, the word “入职” may be orange. Small subtitle exactly “先交照片，准备好可爱就行。”.
Left crop editor: compact label “调整照片”. Large roughly square photograph editing panel, rounded light outline. Show a clearly PHOTOREALISTIC fictional Bernese mountain dog / black-white-tan dog, frontal happy gentle face, distinctive continuous white blaze on the nose/forehead and symmetrical tan eyebrows, natural fur and normal softly blurred living room or garden background. Keep face and ears visible and do not turn it into a cartoon. Selected square crop area with draggable corner handles and subtle rule-of-thirds grid (two vertical, two horizontal lines); outside selected crop is slightly darkened. Photo must be a single normal coherent photograph. Under photo show minus icon, zoom slider with orange knob, plus icon, and text-link “更换照片”. No success indicator.
Right form: clear, uncluttered fields with labels outside inputs. “宠物名字 *” containing “Mochi”. “主人” row showing a small orange circular B avatar and “Bob” as already-known owner information, legible and confirmable. “性格介绍（选填）” containing “见人就摇尾巴”. “一句名言（选填）” is EMPTY; use light gray placeholder “选填” if desired, never invent an actual quote.
Directly below right form: heading “裁切预览”. Two small side-by-side preview components labeled “棋盘头像” and “图鉴卡片”. Both MUST use crops of the EXACT SAME PHOTOREALISTIC dog photo from the left crop editor: same black-white-tan fur, same white blaze, same tan eyebrows, same eye shape, pose and background. The first is a small circular or rounded-square game portrait; the second is a miniature pet card labeled “Mochi”. These are photo crop previews only, NOT generated cartoon stickers. A clearly visible nearby note exactly “当前为裁切预览，统一画风后再上架”. Avoid implying these preview components are already public.
Bottom workflow: a compact light peach strip or simple progress line with four equal small steps, exactly “提交 → 统一画风 → 审核 → 上架”. All steps are future/pending, not marked complete. Supporting text exactly “审核通过后，才会加入大家的图鉴和棋盘”.
Consent line: small checked checkbox plus text exactly “确认上传的是我家宠物，并了解照片与主人信息的展示范围”, with orange underlined link “查看说明”. This is a product design concept and no formal legal wall of text is needed.
Bottom actions: dominant large orange rounded button with dark outline and small offset shadow, white label exactly “提交入职申请”. Secondary quiet outlined/text action “暂不提交”. The orange button is an available action, NOT a submitted/success state.
Mascots: use only tiny official-style cobalt blue cat and yellow dog from the reference as corner helpers or small decorations, at most two small stickers. They must remain secondary to the real dog photo and form, not huge full-screen illustrations.
Text quality: render all quoted Chinese strings accurately and crisply, especially “当前为裁切预览，统一画风后再上架” and “审核通过后，才会加入大家的图鉴和棋盘”. Keep one coherent page and one state.
Avoid: 3D, glassmorphism, purple technology palette, gradients dominating UI, giant decorative illustrations, collage, multiple screens, numbered design annotations, watermarks, code, an application implementation, fake success message, green approved badge, published status, immediate public sharing promise, “立即进入棋盘”, claiming this fictional sample is an actual employee pet, phone/email/address fields, required breed collection, payment, extraneous fields.

FINAL TARGETED REVISION PROMPT (user changed new pet name to Oreo):
Use case: text-localization
Asset type: finished desktop web UI mockup, exactly 1536 × 1024.
Input image 1 is the EDIT TARGET, the already approved MoeGo upload-my-pet page. Preserve the entire page exactly: layout, all Chinese text, logo, header, white/orange/charcoal/cobalt style, photo crop editor, photorealistic dog identity, its same-photo crop previews, crop handles and grid, form, consent, workflow, pending-not-submitted state, buttons, spacing and all illustrations.
Change ONLY the two existing instances of the pet name “Mochi” to “Oreo”: (1) the text inside the “宠物名字 *” form field near upper right, (2) the name label beneath the “图鉴卡片” photo preview. Both must now read exactly “Oreo”. Owner is still “Bob”, with orange B avatar. This is a newly uploaded pet distinct from existing store manager Mochi.
Do not change any other words or content. Do not introduce success/approval/published messages. Do not change the photo into cartoon. Keep one coherent UI page, no cropping and no browser frame.
