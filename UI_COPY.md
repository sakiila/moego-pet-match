# MoeGo 毛孩子全明星 · 首版中英文案草稿

日期：2026-10-22  
状态：友好、俏皮、轻吐槽的方向已确认，已完成首轮逐页关键文案校读；本表保留其他校读修订，尚未接入游戏或重绘界面。

规则依据：[第一版规则总表](V1_RULES.md)、[游戏流程](GAME_FLOW.md)。游戏名称已确认：「MoeGo 毛孩子全明星 / MoeGo Pet All-Stars」。各页已确认的关键文案与其他修订范围见下表；正式信息说明、处理边界与实际页面排版仍需后续核对。

## 逐页校读进度

| 页面 | 当前状态 |
| --- | --- |
| 游戏入口 | 名称已确认；副标题明确 90 秒消消乐，首次直接搜索并选择同事身份 |
| 同事身份 | 带名字的确认按钮已确认，其他文案已作校读修订 |
| 门店首页 | 默认店长宣言已确认，其他文案已作校读修订 |
| 开局准备 | 「开始这班」按钮已确认，90 秒时长放在计时说明中，其他文案已作校读修订 |
| 棋盘与反馈 | 「时间到，收完这波就下班」已确认，其他文案已作校读修订 |
| Report Card | 「这班辛苦啦，看看毛孩子怎么说」已确认，其他文案已作校读修订 |
| 图鉴与卡片详情 | 展示的关键文案已确认，其他文案已作校读修订 |
| 我的宠物 | 展示的关键文案已确认，其他文案已作校读修订 |
| 上传照片 | 「核对处理好，就让毛孩子来上班」成功句已确认，其他文案已作校读修订 |
| 删除申请 | 展示的关键文案已确认，其他文案已作校读修订 |
| 排行榜 | 展示的关键文案已确认，其他文案已作校读修订 |
| 隐藏鱼关 | 展示的关键文案已确认，其他文案已作校读修订 |
| 猜主人 | 展示的关键文案已确认 |
| 设置、退出与访问异常 | 展示的关键文案已确认 |

已确认保留游戏名，用入口副标题解释玩法。首次直接搜索并选择同事身份，按钮使用「以 {playerName} 身份 Clock In / Clock In as {playerName}」，直观核对当前将使用哪个同事身份。

## 使用约定

- 游戏角色台词可以俏皮；身份、保存、上传、删除和错误提示直接说明当前状态。角色台词不作为真实主人的原话展示。
- 界面首次跟随浏览器支持的中文或英文，均不匹配时默认英文；手动选择优先记住。分享图跟随当前界面、单张单语，语言切换只重排同一局结果和对应台词。
- 宠物、同事姓名保留原文；MoeGo、Slack、Smart Scheduling、Grooming Report Card、Fish Report Card 保留名称。中文谐音梗在英文中自然改写，事实与幽默强度保持一致。
- `{petName}`、`{playerName}`、`{ownerName}`、`{fishColorName}`、`{count}`、`{collected}`、`{total}`、`{seconds}`、`{score}`、`{waveScore}`、`{rank}` 和 `{chain}` 为真实显示数据。服务格数与独立宠物数量分别表达，不把同一宠物的多格消除写成多个不同宠物。
- 「已保存」「新收集」「个人新纪录」等完成态按已确认的保存条件显示，重试不重复奖励。称号和评语由本局实际表现决定，翻译或分享不重新抽取。
- 表中的 Key 仅便于后续对照，不代表已创建代码或数据结构。手机小屏优先保留状态和操作，较长说明放在既有详情区域。

## 1. 通用导航与动作

| Key | 中文 | English |
| --- | --- | --- |
| nav.home | 门店 | Shop |
| nav.collection | 宠物图鉴 | Pet Collection |
| nav.leaderboard | 排行榜 | Leaderboard |
| nav.my_pets | 我的宠物 | My Pets |
| nav.settings | 设置 | Settings |
| action.open_shop | 开始营业 | Open Shop |
| action.play_again | 再开一局 | Play Again |
| action.keep_playing | 继续游玩 | Keep Playing |
| action.back_to_shop | 回门店 | Back to the Shop |
| action.view_details | 查看详情 | View Details |
| action.retry | 重试 | Try Again |
| action.got_it | 知道啦 | Got It |
| action.cancel | 取消 | Cancel |
| action.close | 关闭 | Close |

「再开一局」继续当前报告的模式；首页「开始营业」固定普通宠物局。名称沿用相应页面语境，不增加模式选择窗口。

## 2. 进入与同事身份

### 2.1 游戏入口 · 名称已确认，直接选择身份

| Key | 中文 | English |
| --- | --- | --- |
| access.title | MoeGo 毛孩子全明星 | MoeGo Pet All-Stars |
| access.subtitle | 和同事家的毛孩子，来一局 90 秒消消乐。 | A 90-second match-3 with your coworkers' pets. |
| access.internal | 仅供 MoeGo 同事游玩 | For MoeGo Coworkers |

副标题承担玩法说明。游戏入口直接提供下方的同事身份搜索与带名字的确认按钮，确认后进入门店；当前仅为文案与设计方案，尚未接入或验证实际页面排版。

手机合并入口 v2 在同一页依次放置游戏名与副标题、较小的身份区标题、搜索与选中卡、信息摘要及确认按钮，页面视觉已确认；信息摘要仍待随正式说明核对。姓名、查询结果与带名字的按钮保持一致，不增加独立欢迎步骤。

### 2.2 同事身份 · 按钮已确认，文案已校读修订

| Key | 中文 | English |
| --- | --- | --- |
| identity.title | 你是哪位同事？ | Who's Playing? |
| identity.search | 搜索你的 Slack 名字 | Search your Slack name |
| identity.hint | 选择自己的身份，成绩和图鉴会记在这里。 | Choose your own profile. Your scores and collection will be saved to it. |
| identity.selected | 当前选择：{playerName} | Selected: {playerName} |
| identity.confirm | 以 {playerName} 身份 Clock In | Clock In as {playerName} |
| identity.menu | {playerName} 的身份菜单 | Profile menu for {playerName} |
| action.clock_out | Clock Out | Clock Out |
| identity.not_found | 没找到你的同事身份。换个名字试试，或联系 Bob 更新资料。 | We couldn't find your coworker profile. Try another name or contact Bob. |
| identity.load_failed | 暂时没能读取同事名单，请重试。 | We couldn't load the team directory. Please try again. |
| info.use_link | 信息使用说明 | How Your Information Is Used |
| info.entry_summary | 游戏会记录所选身份、成绩和图鉴进度，并在排行榜展示名字、头像与最好成绩，在你收集过的宠物卡上展示头像。 | The game records your selected profile, scores, and collection progress, shows your name, avatar, and best score on the leaderboard, and shows your avatar on cards for pets you've collected. |
| info.removal_link | 资料删除申请 | Request Data Removal |

身份来自现有 Supabase 可参与名单；选择名字不写成「已验证 Slack 本人」。查询失败与未找到身份使用不同提示，头像缺失使用默认头像，不阻止有效同事游戏。完整说明见下方 2.3。

`info.entry_summary` 放在身份确认按钮附近，并保留完整说明入口；点击「以 {playerName} 身份 Clock In」即表示同意，不增加勾选框或第二次确认弹窗。

### 2.3 完整信息使用说明 · 要点已确认，正文为草稿

六项要点已确认：收集内容、展示范围、AI 处理、存储位置、删除方式、同意方式；须如实写出 AI 处理和实际存储位置。2026-10-23 确认保留现有 R2 桶（亚太区域），存储句改为「数据库和游戏服务器在美国，图片在 Cloudflare R2 亚太区域」，上传说明同步。正文为友好、直接口吻的草稿，接入前按实际字段再核对一次。

| 键 | 中文 | English |
| --- | --- | --- |
| info.full.title | 这个游戏会用到哪些信息 | What This Game Uses |
| info.full.intro | 毛孩子全明星是 MoeGo 同事之间的内部小游戏。下面把会用到的信息讲清楚。 | MoeGo Pet All-Stars is an internal game just for MoeGo coworkers. Here's exactly what it uses. |
| info.full.collect | **会记录什么**：你选择的同事身份（Slack ID、名字、头像，来自公司现有人员名单）；对局成绩、图鉴收集、游玩进度与隐藏关状态；你主动上传的宠物照片、名字及与你的主人关联；你提交的删除申请。上传的照片按原文件保存，可能带有拍摄位置等信息；原文件只私有存储，位置等信息不会在游戏中展示。语言与声音偏好只存在你的浏览器里。服务器会保留常规访问日志。 | **What we record**: the coworker profile you pick (Slack ID, name, and avatar from the company's existing people list); your scores, collection, play progress, and hidden-level status; pet photos, names, and owner links you choose to upload; and any removal requests you send. Uploaded photos are stored as original files, which may include details like where they were taken; the original files stay private and those details are never shown in the game. Language and sound settings stay in your browser. The server keeps standard access logs. |
| info.full.display | **会在哪里展示**：同事排行榜显示你的名字、头像和最好成绩。宠物会出现在棋盘、图鉴、每日店长和主人竞猜中；主人名字在图鉴里收集后才显示。你收集过的宠物，其图鉴卡会显示一共有多少同事收集了 TA，并可能展示你的头像。成绩卡只在你主动保存或分享时离开游戏。 | **Where it shows up**: the coworker leaderboard shows your name, avatar, and best score. Pets appear on the board, in the Pet Collection, as Manager of the Day, and in the owner quiz; owner names in the Pet Collection appear only after that pet is collected. Cards for pets you've collected show how many coworkers have collected them and may show your avatar. Score cards leave the game only when you save or share them. |
| info.full.ai | **AI 处理**：宠物照片会提交给 AI 图像服务，生成统一画风的头像贴纸，再由 Bob 人工核对后上架；交给 AI 前会先去掉拍摄位置等信息。已收集的同事可以在图鉴卡背面看到 Bob 处理过的照片版本，不会看到原文件。 | **AI processing**: pet photos are sent to an AI image service to create matching-style head stickers, which Bob reviews by hand before they go live. Location details are removed before anything is sent to AI. Coworkers who have collected a pet can see a processed version of the photo on the back of its card, never the original file. |
| info.full.storage | **存在哪里**：数据库在美国（Supabase），图片存储在亚太区域（Cloudflare R2），只用于这个内部游戏活动。 | **Where it's stored**: the database is in the United States (Supabase); images are stored in the Asia-Pacific region (Cloudflare R2). Used only for this internal game. |
| info.full.removal | **想删除怎么办**：在「我的宠物」或本页提交删除申请，Bob 人工核实后会下架并清理游戏里的资料。已有成绩会保留，但不再显示该宠物的资料。飞书原文档、AI 服务和托管备份中的副本不在游戏控制范围内，处理结果里会如实说明。 | **Want something removed?** Send a request from My Pets or this page. Bob will verify it, take the pet down, and clean up the game's copies. Existing scores stay, but the pet's details are no longer shown. Copies in the original Feishu doc, the AI service, or hosted backups are outside the game's control; the result will say so honestly. |
| info.full.consent | **同意方式**：点击「以 {playerName} 身份 Clock In」即表示你同意以上使用方式。 | **Consent**: tapping "Clock In as {playerName}" means you agree to the above. |


选中卡片展示姓名与头像，确认后只进入门店，不开始 90 秒计时、不增加第二次确认弹窗。带姓名的按钮已确认，名字须与当前选中卡片一致；较长姓名允许换行并保证可读，不把名字截成无法核对的内容。其他身份页文字为校读修订稿。

## 3. 首页与开局准备

### 3.1 门店首页 · 宣言已确认，文案已校读修订

| Key | 中文 | English |
| --- | --- | --- |
| home.manager | 今日店长 | Today's Shop Manager |
| home.manager_line | 你负责排班，我负责可爱。 | You handle the schedule. I'll bring the cuteness. |
| home.manager_line_maodu | 键盘我踩过了，bug 归店长。 | I walked the keyboard. Today's bugs are on me. |
| home.manager_line_boluo | 我是店长，不是水果，别切。 | Manager, not a fruit. No slicing. |
| manager.poster_title | 店长小海报 | Manager Poster |
| manager.poster_date | {year} 年 {month} 月 {day} 日 · 北京时间 | {monthName} {day}, {year} · Beijing Time |
| home.personal_best | 宠物店个人最好 | Pet Shop Personal Best |
| home.no_record | 第一份营业纪录，等你来写。 | Your first shop record starts here. |
| home.streak_active | 连续 {days} 天开工 · 今天已打卡 | {days}-day streak · clocked in today |
| home.streak_pending | 连续 {days} 天开工 · 今天还没开工 | {days}-day streak · not clocked in yet today |
| home.streak_none | 今天开一局，打卡从今天算起 | Play a round today to start your streak |
| home.photo_notice | 宠物照片由人工核对和处理，难免有误，如有纰漏，请 Slack 联系 @Bob（毛肚和菠萝的铲屎官） | Pet photos are manually reviewed and processed, so mistakes may happen. If you spot an error, please contact @Bob on Slack (Maodu and Boluo's human). |
| home.version | 版本 {version} | Version {version} |
| home.github_link | GitHub：{repository}（在新标签页打开） | GitHub: {repository} (opens in a new tab) |

版本号在首页页尾链接下方居中展示，使用低层级小字。格式为 `YYYYMMDD.N`（例如 `20261025.5`）：日期取最新 Git 提交的北京时间，序号取当前分支主线（first-parent）中同日提交数。启动／构建时自动生成并固定到产物，同一提交重复构建不换号，未提交的本地修改不递增。GitHub 构建自动向 Docker 传入相同版本；开发服务运行期间提交后，重启开发服务可读取新值。

版本号下方展示 GitHub 仓库地址 `github.com/sakiila/moego-pet-match`，小字居中并保留下划线，点击在新标签页打开项目首页。`home.github_link` 用作链接的中英文可访问名称，提示新标签页行为；可见地址保持原文。

首页主按钮共用「开始营业 / Open Shop」，进入普通宠物局准备，不直接开始计时；次级入口沿用图鉴、排行榜、我的宠物。个人最好只展示普通宠物局记录，不将鱼关成绩混入首页字段。人工处理提示保留用户指定原句，首页没有鱼关入口或解锁预告。

点击右上角头像，在头像下方展开下拉框，显示「Clock Out」（中英文一致）；再次点击头像、点击外部或按 Escape 收起。点击「Clock Out」清除浏览器记住的身份并返回身份选择页。

店长小海报已确认（2026-10-23，图稿 manager-poster-v1）：点门店的今日店长打开预览，海报含店长贴纸、「今日店长 · 名字」、既定宣言与北京日期；不自动弹出。保存与分享沿用成绩卡的 `share.save`、`share.send`、`share.failed`。

默认店长宣言已确认：「你负责排班，我负责可爱。 / You handle the schedule. I'll bring the cuteness.」这是游戏角色台词，不是主人原话，不增加每日随机或其他新机制。

### 3.2 开局准备 · 按钮已确认，文案已校读修订

| Key | 中文 | English |
| --- | --- | --- |
| prep.loading | 毛孩子正在集合…… | Getting the pets ready… |
| prep.guests | 本局来客 | This Round's Guests |
| prep.guests_lead | 本局 | This Round's |
| prep.guests_accent | 来客 | Guests |
| prep.own_pet | {petName} 也来啦！ | {petName} is here too! |
| prep.rule | 交换相邻棋子，让 3 个及以上相同宠物连成一线。 | Swap neighbors. Line up 3 or more of the same pet. |
| prep.controls | 可以拖拽，也可以先点一格、再点相邻格。 | Drag to swap, or tap a tile and then its neighbor. |
| prep.timer_hint | 本局 90 秒。准备和读说明不计时，点下方按钮后开始。 | This round lasts 90 seconds. The timer starts when you tap the button below. |
| prep.timer_duration | 90 秒 | 90 seconds |
| prep.start | 开始这班 | Start My Shift |
| prep.failed | 本局还没准备好，请重试。 | This round isn't ready yet. Please try again. |

只有实际入选自家宠物时显示 `prep.own_pet`。最多显示一行，只提示阵容中第一只自家宠物；长名字省略末尾，保留「也来啦」后缀，完整名字保留在悬停提示中。准备、加载和读规则不计时；玩家确认开始后才进入 90 秒。首页不显示鱼缸、鱼关入口或三局预告，`@Bob` 关联已核实的 Slack 身份 `U03FPQWGTN2`（工作区 `T011CF3CMJN`，可指向 `slack://user?team=T011CF3CMJN&id=U03FPQWGTN2` 或 `https://moego.slack.com/team/U03FPQWGTN2`）。

准备是棋盘的计时前状态，不新增独立经营页面；素材与对局准备完成后，才允许点击开始。首次只说明三消和交换方式，工具用法继续按首次自然出现时轻提示。按钮已确认使用「开始这班 / Start My Shift」，90 秒时长写在按钮上方的说明里，保持按钮简短；计时规则不变。其他文案为校读修订稿。

## 4. 普通宠物局：棋盘与反馈 · 收尾句已确认

| Key | 中文 | English |
| --- | --- | --- |
| board.score | 分数 {score} | Score {score} |
| board.time_left | 本局剩余 {seconds} 秒 | Time Left: {seconds}s |
| board.chain | {chain} 连锁！ | {chain}-Step Cascade! |
| board.chain_max | ×5 顶格！ | MAX ×5! |
| board.cheer_nice | Nice! | Nice! |
| board.cheer_great | Great! | Great! |
| board.cheer_amazing | Amazing! | Amazing! |
| board.cheer_wow | Wow! | Wow! |
| board.wave_score | +{waveScore} | +{waveScore} |
| board.new_pets | 新认识了 {count} 位毛孩子 | Met {count} New Pets |
| board.reunion | 终于一起下班了！ | Clocking Out Together! |
| board.reunion_hotpot | 毛肚菠萝到齐，开锅！ | Maodu & Boluo are in. Fire up the pot! |
| tutorial.comb | 梳子到位！和邻格交换，梳开一整行或列。 | Comb's ready! Swap with a neighbor to sweep a row or column. |
| tutorial.scissors | 剪刀登场！和邻格交换，清出一个十字。 | Scissors are here! Swap with a neighbor for a cross-shaped clear. |
| tutorial.tool_combo | 相邻工具交换，搭档开工！ | Swap neighboring tools. Teamwork time! |
| board.move_hint | 卡住啦？试试这一步。 | Stuck? Try This Move. |
| board.shuffle | 换个站位，继续营业。 | A quick reshuffle, then back to work. |
| rush.title | 临时加单！ | Rush Order! |
| rush.goal | 20 秒内服务 12 格 | Clear 12 tiles in 20s |
| rush.progress | 已服务 {count}/12 格 · 催单剩余 {seconds} 秒 | {count}/12 tiles · Rush time: {seconds}s |
| rush.success | 安排得明明白白！+1000 分 | All Sorted! +1000 Points |
| rush.expired | 这单没赶上，继续营业！ | Missed this one. Keep the shop rolling! |
| round.last_seconds | 最后 10 秒，稳住这班。 | Final 10 Seconds. You've Got This. |
| round.finishing | 时间到，收完这波就下班。 | Time's up. Clocking out after this chain. |
| round.finished | 收工啦！ | Shift Complete! |
| round.thanks | 这一班辛苦啦 | You made this shift! |
| board.title | Smart Scheduling | Smart Scheduling |
| board.tagline | 拖一拖，安排得明明白白。 | Drag it, sort it. |
| board.time_label | 本局剩余 | Time Left |
| board.score_label | 分数 | Score |
| board.exit | 退出 | Exit |
| rush.remaining | 催单剩余 {seconds} 秒 | Rush: {seconds}s |
| rush.served | 已服务 {count}/12 格 | {count}/12 tiles |

2026-10-25 棋盘确认稿：临时加单采用前台夹单小票，倒计时显示「还剩 N 秒 / Left N s」，底行仅保留已服务格数与进度条，不再重复显示 `rush.goal`。20 秒服务 12 格的规则不变。用于强调色与粗数字的分段 key 为 `rush.title_lead` / `rush.title_accent`、`rush.seconds_lead` / `rush.seconds_unit`、`rush.served_lead` / `rush.served_unit`、`rush.success_lead` / `rush.success_accent`、`rush.bonus` / `rush.bonus_unit`；分别组合成上表完整事实，不新增奖励。收工的感谢句只在至少有一张实际服务过的贴纸时随头像出现，零服务局仅挂牌。

催单在游戏时钟第 30 秒触发，目标和倒计时区分主时钟，成功才显示 +1000。`board.chain` 的链数与计分倍率分别计算，不因为显示第六轮就变成六倍。新宠提示是局内暂记，正式收集等结算保存；同次连锁合并一条，家庭团聚按同家每局一次。提示、收集和团聚不叠满棋盘。`round.finishing` 只在最后有效连锁仍待结算时显示，`round.last_seconds` 不新增奖励。

加分飘字已确认每个逻辑清除批次合并一条。`{waveScore}` 为本批次去重后、按当前连锁倍率计算的清除分，不是累计总分，也不含催单 +100；同批工具命中不拆成多条，补落形成下一批消除时再显示下一条。任务奖励继续用 `rush.success` 原位反馈，固定总分按实际结算实时更新，两种模式一致。

到时收尾句已确认：「时间到，收完这波就下班。 / Time's up. Clocking out after this chain.」只表达正在完成已生效的最后连锁，不开放新操作、不自动引爆闲置工具或额外加分；没有待完成连锁时直接进入正常结算，不为台词增加停留。

## 5. Report Card、称号与分享 · 副标题已确认

| Key | 中文 | English |
| --- | --- | --- |
| report.title | Grooming Report Card | Grooming Report Card |
| report.subtitle | 这班辛苦啦，看看毛孩子怎么说。 | Shift complete. Here's what your MVP has to say. |
| report.final_score | 本局得分 | Round Score |
| report.mvp | 本局 MVP：{petName} | This Round's MVP: {petName} |
| report.service_tiles | 服务格数 | Tiles Served |
| report.highest_chain | 最高连锁 | Longest Cascade |
| report.tools_used | 工具发动次数 | Tools Activated |
| report.new_collection | 本局新收集 | New to Your Collection |
| report.personal_best | 个人新纪录！ | New Personal Best! |
| report.developer_certified | 开发者家的认证 | Developer's pets, certified |
| report.quiz_bonus | 含猜家长 +{points} | Incl. owner quiz +{points} |
| report.saving | 正在保存本局结果…… | Saving Your Results… |
| report.saved | 本局结果已保存 | Results Saved |
| report.sync_retryable | 暂未确认保存，可在当前报告重试。 | Saving hasn't been confirmed. You can retry from this report. |
| report.sync_retry | 重试保存 | Retry Saving |
| report.validation_failed | 本局结果未通过检查，未计入线上记录。 | This round didn't pass validation and wasn't recorded online. |
| report.generic_title | 本局成绩 | This Round's Results |
| report.generic_caption | 今天的营业成果，记在这里。 | Your shift, in the books. |
| share.open | 分享成绩 | Share Results |
| share.preview | 成绩卡预览 | Results Card Preview |
| share.save | 保存图片 | Save Image |
| share.send | 分享图片 | Share Image |
| share.player | 本局玩家：{playerName} | Played by: {playerName} |
| share.failed | 图片还没生成好，请重试。 | We couldn't create the image. Please try again. |
| share.generating | 正在生成图片… | Creating image… |

`report.subtitle` 只用于有真实服务的普通宠物局；零服务使用下方店长鼓励，省略 MVP，不编造宠物满意或洗护成果。保存失败、校验失败不伪装已上榜；服务端确认严格超过该模式已有个人最好后才显示新纪录，首个成绩不算突破。原 MVP 下架时用通用 MoeGo 图案和中性标题承接，保留真实统计，不改选 MVP。分享按钮不等待揭晓动画，不放二维码。

普通宠物局的页头副标题已确认：「这班辛苦啦，看看毛孩子怎么说。 / Shift complete. Here's what your MVP has to say.」，承接「收工」并引出本局 MVP 的评语。副标题是普通说明文字，不增加领取评语或点开评语的步骤；最终分数立即显示、MVP 与称号随后出现的既定揭晓，以及再开／分享按钮可操作的规则不变。

手机报告已确认正文可滚动，底部固定「再开一局 / Play Again」与「分享成绩 / Share Results」。保存状态随正文结果展示；固定操作不增加领取、确认或强制观看步骤，正文末尾不得被按钮遮挡。

成绩重试已确认保持简单：仅在当前报告页保留未保存结果并提供 `report.sync_retry`；离开、刷新或关闭后不提供未保存结果的恢复入口，不增加首页待同步提示或历史页。已发出的请求如果实际保存成功，已保存记录仍保留；提示不能把未确认保存写成已上榜或已解锁。

预览里的操作已确认（2026-10-23）：「保存图片」始终下载 PNG；浏览器支持分享图片文件时另显示「分享图片」（`share.send`），调起系统分享面板，不自动发送。

成绩分享卡的玩家署名已确认使用 `share.player`，取原对局玩家姓名，保持次级字号；不使用当前查看者或 MVP 主人姓名替代，切换语言时姓名保持原文。本轮未增加玩家头像、联系方式或新奖励。

### 按实际表现选用的角色评语

普通宠物局与鱼关共用同一套固定优先级，先选择首个满足条件的场景，再从该场景的 5 条评语中选一条（与称号体系独立计算，不新增竞技分）：

| 优先级 | 触发条件 | Key / 场景 | 中文 | English |
| --- | --- | --- | --- | --- |
| 1 | 有效服务格数 `== 0` | `review.pet.no_service` / 零服务，由店长鼓励 | 我先可爱，你慢慢来。 | Take your time. I'll be cute. |
| 2 | 单次操作最高连锁 `>= 5` | `review.pet.high_chain` / 高连锁 | 等等，我还没反应过来！ | Wait! I'm still catching up! |
| 3 | `rushCompleted == true` | `review.pet.rush_success` / 催单成功 | 赶上了，我撤回那个眼神。 | On time. I take back that look. |
| 4 | 发动过梳＋梳、梳＋剪合体或吹风机 | `review.pet.tool_combo` / 实际发动过道具合体 | 有两下子，比我多两下。 | You've got skills. I brought none. |
| 5 | 其他有真实服务的完整对局（有效服务格数 `>= 1`） | `review.pet.normal` / 有真实服务的普通完成 | 先抱抱，别的等会儿。 | Cuddles first. Everything else later. |

鱼关 `review.fish.*`（见第 8 节）按完全相同的 1–5 优先级判定。英文表达不是主人的真实名言。

2026-10-25 结算评语扩充为每个场景 5 条，共 50 条中英文对应文案。上表及第 8 节列出各场景的第 1 条，以下为第 2–5 条。同一局的评语变体保持固定，报告重开、保存重试、分享与切换语言不重新抽取；新对局可出现同场景的其他表达。本次按用户选定的第二版替换全部 50 句：中文用简短的撒娇、嘴硬、贪吃、装忙与轻吐槽，英文保留对应笑点与口吻，不逐字硬译。评语不要求玩家理解连锁、合体或道具术语；零服务用轻松鼓励或玩笑，不编造本局已服务的表现。

| Key | 中文 | English |
| --- | --- | --- |
| review.pet.no_service.2 | 没事，我也刚睡醒。 | It's fine. I just woke up too. |
| review.pet.no_service.3 | 开工？我以为开饭。 | Work time? I heard snack time. |
| review.pet.no_service.4 | 这把算热身，我说了算。 | Warm-up round. I make the rules. |
| review.pet.no_service.5 | 不急，我还没伸完懒腰。 | No rush. Still stretching. |
| review.pet.high_chain.2 | 还有？零食都快吃完了。 | More? I'm running out of snacks. |
| review.pet.high_chain.3 | 你忙你的，我已经看呆。 | Carry on. I'm busy staring. |
| review.pet.high_chain.4 | 刚才没看清，再来。 | Missed that. Do it again. |
| review.pet.high_chain.5 | 行吧，刚才算你帅。 | Fine. That was pretty cool. |
| review.pet.rush_success.2 | 我急，是因为饭点到了。 | I'm in a hurry. It's dinner time. |
| review.pet.rush_success.3 | 催你的事，替我保密。 | Don't tell anyone I rushed you. |
| review.pet.rush_success.4 | 好了，不用喊我家长了。 | Fine. No need to call my human. |
| review.pet.rush_success.5 | 下次加急，我自带零食。 | Next rush, I'll bring snacks. |
| review.pet.tool_combo.2 | 我躺好了，你看着办。 | I'm comfy. Do your thing. |
| review.pet.tool_combo.3 | 顺便挠挠？就一下。 | A little scratch too? Just one. |
| review.pet.tool_combo.4 | 动静挺大，我先装睡。 | Bit loud. I'll pretend to sleep. |
| review.pet.tool_combo.5 | 嘘，我在假装上班。 | Shh. I'm pretending to work. |
| review.pet.normal.2 | 好了，轮到你夸我。 | Okay, your turn to praise me. |
| review.pet.normal.3 | 嘴上嫌弃，心里续约。 | Acting picky. Secretly rebooking. |
| review.pet.normal.4 | 别停，我才刚躺好。 | Don't stop. I just got comfy. |
| review.pet.normal.5 | 人可以走，零食留下。 | You may go. The snacks stay. |
| review.fish.no_service.2 | 别紧张，先吐个泡泡。 | Nervous? Blow a bubble first. |
| review.fish.no_service.3 | 等等，我游反了。 | Wait. Wrong way. |
| review.fish.no_service.4 | 慢慢来，我先绕一圈。 | Take your time. I'll do a lap. |
| review.fish.no_service.5 | 本鱼批准，下次再试。 | This fish approves another try. |
| review.fish.high_chain.2 | 我都忘了往哪儿游了。 | I forgot where I was swimming. |
| review.fish.high_chain.3 | 泡泡还没吐完，又来了！ | More? Let me finish this bubble! |
| review.fish.high_chain.4 | 刚才那段，我要吹一年。 | I'm bragging about that all year. |
| review.fish.high_chain.5 | 这热闹，够我下饭了。 | Dinner and a show. I'm in. |
| review.fish.rush_success.2 | 我没急，尾巴自己动的。 | Not nervous. That's just my tail. |
| review.fish.rush_success.3 | 没事了，我先潜水。 | Crisis over. Going quiet. |
| review.fish.rush_success.4 | 刚才那串泡泡，是催你的。 | Those bubbles meant 'hurry up.' |
| review.fish.rush_success.5 | 催完就跑，有点不好意思。 | Rushed you, then left. Awkward. |
| review.fish.tool_combo.2 | 小点声，隔壁虾在睡觉。 | Keep it down. The shrimp's asleep. |
| review.fish.tool_combo.3 | 我负责游，你负责秀。 | You show off. I'll swim. |
| review.fish.tool_combo.4 | 这排场，我要收门票了。 | I should sell tickets to this. |
| review.fish.tool_combo.5 | 这手艺，隔壁虾知道吗？ | Do the shrimp next door know? |
| review.fish.normal.2 | 本店工资，发鱼粮吗？ | Do you pay in fish food? |
| review.fish.normal.3 | 我先下班，你帮我看缸。 | Clocking out. Watch my tank. |
| review.fish.normal.4 | 认识你了，下次不躲。 | I know you now. No hiding next time. |
| review.fish.normal.5 | 别送了，我知道回缸的路。 | No escort. I know the way to my tank. |

### 既定主称号的中英文对应

| 实际触发条件（按既定优先级） | 中文 | English |
| --- | --- | --- |
| 剪刀＋剪刀全盘合体；鱼关对应珍珠贝壳双合体 | 这下真没了 | Poof. All gone. |
| 单次操作最高连锁达到 5 轮 | 我手都松开了 | I let go. It kept going. |
| 催单成功 | 急什么我会消 | Relax. I got this. |
| 实际发动至少 3 个工具 | 道具比我还忙 | My tools work harder. |
| 最后 3 秒发起有效操作 | 差点准时下班 | Almost clocked out. |
| 其他完整结束的对局 | 这班没白上 | That counts as work. |

2026-10-24 用户确认改用趣味称号章（`assets/icons/report-title-stamps-original-v1`，每款中英两版）上的文案，替换原「全店大扫除负责人」等称号名；i18n key、触发条件与优先级不变，报告页与分享卡显示对应语言的称号章图片。普通局和鱼关使用同一套既定称号及判定，鱼关工具按对应能力计数。称号只发一个，不能因换外观或语言切换重新判定。

## 6. 图鉴、搜索、我的宠物与竞猜

### 6.1 图鉴与卡片详情 · 关键文案已确认

| Key | 中文 | English |
| --- | --- | --- |
| collection.progress | 已收集 {collected} / {total} 位毛同事 | Pets Collected: {collected} / {total} |
| collection.filter_all | 全部 | All |
| collection.filter_collected | 已收集 | Collected |
| collection.filter_uncollected | 未收集 | Not Collected |
| collection.empty | 第一位毛同事，等你开门服务。 | Your first furry colleague is waiting. Time to open up! |
| collection.search | 搜宠物名或主人名 | Search pets or owners |
| collection.search_scope | 宠物名可搜全部已上架宠物；主人名搜已收集和自家的宠物。 | Search all listed pets by name. Owner searches cover collected pets and your own. |
| collection.search_empty | 当前范围里没找到。试试宠物名，或换个筛选。 | No matches in this view. Try a pet's name or a different filter. |
| collection.view_list | 列表 | List |
| collection.view_sheet | 贴纸册 | Sticker Book |
| collection.sheet_hint | 按主人和宠物名排序 · 点贴纸看详情 | Sorted by owner, then pet name · Tap a sticker for details |
| collection.sheet_title | {playerName} 的贴纸册 | {playerName}'s Sticker Album |
| collection.sheet_share | 分享贴纸册图片 | Share Sticker Album |
| collection.sheet_share_hint | 把这一页毛孩子，存成你的收藏 | Save a page of furry coworkers to your collection |
| collection.sheet_preview | 贴纸册图片预览 | Sticker Album Preview |
| pet.unlock_hint | 棋盘上服务过 TA，完整收工、成绩保存成功后，就会自动收集。 | Serve this pet on the board and finish the round. They'll join your collection automatically once your result is saved. |
| pet.owner | 主人 | Owner |
| pet.owner_developer | 本游戏开发者 | the game's developer |
| pet.original_photo | 翻面看原图 | Flip for the Original Photo |
| pet.owner_quote | 主人说 | A Word from Home |
| pet.unlisted | 这位伙伴已下架，回图鉴看看其他伙伴吧。 | This pet is no longer listed. Browse the rest of the collection. |
| pet.quote_more | 展开全文 | Read More |
| pet.quote_less | 收起 | Show Less |
| pet.flip_back | 翻回正面 | Flip Back |
| pet.known_by_one | 已有 1 位同事认识了 TA | 1 coworker has met this pet |
| pet.known_by_other | 已有 {count} 位同事认识了 TA | {count} coworkers have met this pet |
| pet.known_by_more | 还有 {count} 位同事 | and {count} more |

`pet.owner_quote` 下方显示飞书原介绍的原文摘录（不翻译，过长截取前一两句），或 Bob 手工补录的主人名言；两者都没有时隐藏整块。

`pet.known_by_*` 只在已收集或自家宠物详情正面底部出现，人数为 0 时整区隐藏，人数为 1 用 `_one`，其余用 `_other`；下方头像叠放超出 5 位时显示「+{count}」，`pet.known_by_more` 作为该标记的无障碍朗读文本。

图鉴展示的关键文案已确认。解锁说明使用「自动收集」，对应本局实际服务过该宠物、完整结束且结果保存成功，不要求另点领取或手动保存。单纯登场、点选或查看卡片不算收集。搜索空结果只说明当前范围没有匹配，不表示该同事没有宠物。没有已收集宠物时，提示与未收集剪影列表并存，不以空白页替代列表。既定排序、搜索范围和收集条件不变。

### 6.2 我的宠物 · 关键文案已确认

| Key | 中文 | English |
| --- | --- | --- |
| my_pets.empty | 暂时没有与你关联的已上架宠物。 | No listed pets are linked to you yet. |
| my_pets.list_scope | 新提交的宠物，人工处理并上架后可在这里查看。 | New submissions can be viewed here after they're prepared, reviewed, and listed. |
| my_pets.add | 添加我家毛孩子 | Add My Pet |
| my_pets.view | 查看资料 | View Profile |
| my_pets.collection_hint | 这里能看完整资料；棋盘上服务过 TA，完整收工、成绩保存成功后，就会自动收进图鉴。 | Their full profile is available here. Serve them on the board and finish the round; they'll join your collection once your result is saved. |

「我的宠物」展示的关键文案已确认。完整资料仅指当前所选同事身份关联的已上架宠物，不开放其他未收集宠物的主人信息。收集说明仅对尚未收集的自家宠物使用，查看资料不改变收集进度。`my_pets.list_scope` 是静态上架说明，不代表某份上传已收到或正在处理，也不增加提交进度、审核状态或自动上架通知。

### 6.3 猜主人 · 关键文案已确认

| Key | 中文 | English |
| --- | --- | --- |
| quiz.question | {petName} 的家长是谁？ | Who is {petName}'s human? |
| quiz.correct | 认亲成功！总分 +{points} | You Found Their Human! +{points} points |
| quiz.incorrect | 差一点！原来是 {ownerName}。 | Not quite! It's {ownerName}. |
| quiz.developer_correct | 没错，就是写这个游戏的那位。 | Yep, the one who built this game. |
| quiz.developer_incorrect | 它们可是开发者家的猫。 | They're the developer's cats. |
| quiz.skip | 跳过 | Skip |

题目、答对、答错与跳过四处文案已确认。答题后在原卡片揭晓真实主人头像与名字，错误反馈不责备玩家；可跳过，不增加确认步骤，也不影响本局成绩与下一局。文案不承诺答题奖励。

排序保持已收集优先、新收集靠前；未收集始终是名字与剪影，搜索不揭晓主人。`collection.empty` 仅在没有任何已收集宠物时显示；搜索空结果不表示目录缺资料或该同事没有宠物。`my_pets.collection_hint` 仅用于尚未收集的自家宠物。主人名言只在真实、自愿提供时显示，缺少时省略。竞猜沿用既定频率及资格，不编造候选主人；答对总分 +100，答错不扣分。2026-10-24 已加入永久收集成就，按本节新增文案展示称号与本局新解锁徽章，成就不加竞技分。贴纸册视图格内不放文字，读屏按「宠物名 · 未收集」朗读未收集格（复用 `collection.filter_uncollected`），已收集格只读宠物名。

## 7. 排行榜 · 关键文案已确认

| Key | 中文 | English |
| --- | --- | --- |
| leaderboard.pets | 宠物店 | Pet Shop |
| leaderboard.fish | 鱼关卡 | Fish Round |
| leaderboard.near_me | 我的名次 | My Rank |
| leaderboard.all | 全榜 | All Rankings |
| leaderboard.find_me | 回到我的名次 | Back to My Rank |
| leaderboard.rank | 名次 | Rank |
| leaderboard.best_score | 最好成绩 | Best Score |
| leaderboard.no_score | 本模式还没有你的已保存成绩。开一局，留下第一笔纪录。 | No saved score in this mode yet. Play a round to get on the board. |
| leaderboard.tied_rank | 同分并列 | Shared Rank |
| leaderboard.top_players | 领先玩家 | Top Players |
| leaderboard.hall_of_fame | 毛孩子光荣榜 | Pet Hall of Fame |
| leaderboard.tagline | 谁把毛孩子安排得最明白？ | Who keeps the fur crew in line? |
| leaderboard.points | {score} 分 | {score} pts |
| leaderboard.colleague | 同事 | Coworker |
| leaderboard.scope | 榜单范围 | Board range |
| leaderboard.today | 今日榜 | Today |
| leaderboard.all_time | 总榜 | All-Time |
| leaderboard.today_caption | {date} · 今天全公司同一盘棋 | {date} · Same board for everyone today |
| leaderboard.today_best | 今日最好 | Today's Best |
| leaderboard.today_empty | 今天还没有人开工，你来第一个。 | Nobody has clocked in today. Be the first. |
| leaderboard.today_no_score | 今天还没有你的成绩。开一局，上今日榜。 | No score from you today yet. Play a round to get on today's board. |
| report.today_first | 今日第 1 名，全店最明白 | #1 today. Nobody runs the shop better. |
| report.today_rank | 今日第 {rank} 名 | #{rank} today |
| report.today_alone | 今天第一个开工，等同事来挑战 | First to clock in today. Let's see who follows. |
| report.streak_day | 打卡第 {days} 天 | Day {days} streak |
| report.next_up_label | 店长说 | Manager says |
| report.next_up_fish | 再完成 {n} 局，解锁一个隐藏彩蛋。 | Finish {n} more round(s) to unlock a hidden surprise. |
| report.next_up_cats | 再认识 {n} 只猫，解锁称号「{title}」。 | Meet {n} more cat(s) to unlock the “{title}” title. |
| report.next_up_dogs | 再认识 {n} 只狗，解锁称号「{title}」。 | Meet {n} more dog(s) to unlock the “{title}” title. |
| report.next_up_friends | 再认识 {n} 只毛孩子，解锁称号「{title}」。 | Meet {n} more pet(s) to unlock the “{title}” title. |
| report.next_up_species | 再认识 {n} 种新动物，解锁称号「{title}」。 | Meet {n} more kind(s) of animal to unlock the “{title}” title. |
| report.next_up_neighbors | 再认识 {n} 位同事家的毛孩子，解锁称号「{title}」。 | Meet pets from {n} more coworker(s) to unlock the “{title}” title. |
| report.next_up_album | 再认识 {n} 只，就集齐全部毛孩子，解锁称号「{title}」。 | Meet {n} more to complete the collection and unlock the “{title}” title. |
| report.next_up_milestone | 再认识 {n} 只毛孩子，图鉴就到 {percent}%。 | Meet {n} more pet(s) and your collection hits {percent}%. |
| report.next_up_tomorrow | 明天换一盘新棋，今日榜重新排。 | New board tomorrow. Today’s ranks reset. |
| report.harvest | 本局收获 | This Round's Haul |
| report.new_title_tag | 新称号 | New title |
| leaderboard.challenge | 再挑战一次 | Play Another Round |
| leaderboard.load_failed | 暂时没能读取排行榜，请重试。 | We couldn't load the leaderboard. Please try again. |

默认领先玩家＋本人附近，名次使用真实并列结果，未保存的成绩不生成名次。鱼榜标签仅对个人已发现鱼关的玩家显示，不放锁定标签或解锁预告。挑战当前榜单对应模式，不新增挑战邀请或相同棋盘对战。

`leaderboard.top_players`（领先三人小标题）、`leaderboard.colleague`（列表表头，与 `leaderboard.rank`、`leaderboard.best_score` 一起）于 2026-10-24 按 mobile-leaderboard-v1 确认补入。2026-10-25 取消本人行的「你 / You」标签，仅保留橙色高亮；并列仍在行内标「同分并列」，不另加页脚说明。

2026-10-24 排行榜页改为「毛孩子光荣榜 / Pet Hall of Fame」标题字标（图片，读屏读 `leaderboard.hall_of_fame`）与副标题 `leaderboard.tagline`；排行记录的是个人最好成绩，副标题不写「今天」。领奖台分数用 `leaderboard.points`。领奖台上方不再显示 `leaderboard.top_players`。鱼关页签仍只对已发现鱼关的玩家显示，不加锁定标签或解锁预告。

聚焦本人及相邻名次的视图标签已确认使用「我的名次 / My Rank」，保留已定的邻近排名列表，不改成只显示本人；「回到我的名次」回到该视图。全榜标签用「All Rankings」，与棋盘区分。无成绩提示仅在数据读取成功且当前模式确无已保存成绩时显示，读取失败用对应重试提示；真实已保存的 0 分仍是记录。无成绩时先展示全榜，不生成虚构名次。本页展示的关键文案已确认，排名规则与模式入口不变。

## 8. 已发现后的 Peter 小鱼关 · 关键文案已确认

| Key | 中文 | English |
| --- | --- | --- |
| fish.invitation | Peter 悄悄递来一个鱼缸：这批客人不用吹干。 | Peter slips you a fish tank. These guests can skip the blow-dry. |
| fish.invitation_action | 去看看 | Take a Peek |
| fish.prep_title | 小鱼也来排班啦 | The Fish Have Appointments Too |
| fish.board_title | 小鱼也来排班啦 | The Fish Have Appointments Too |
| fish.prep_rule | 相邻交换，同色小鱼连成一线，3 个及以上即可消除。 | Swap neighbors. Match 3 or more fish of the same color in a line. |
| fish.conch | 海螺 | Conch |
| fish.conch_hint | 和邻格交换，螺口喷出水流，清一行或一列。 | Swap with a neighbor to sweep a row or column. |
| fish.pearl_shell | 珍珠贝壳 | Pearl Shell |
| fish.pearl_shell_hint | 和邻格交换，贝壳一开，清出一个十字。 | Swap with a neighbor. It pops open and clears a row and column. |
| fish.rush_title | Peter 的小鱼加急啦！ | A Rush Order from Peter! |
| fish.rush_goal | 20 秒内清除 12 格 | Clear 12 tiles in 20s |
| fish.rush_progress | 已清除 {count}/12 格 · 催单剩余 {seconds} 秒 | {count}/12 tiles cleared · Rush time: {seconds}s |
| fish.report_title | Fish Report Card | Fish Report Card |
| fish.report_subtitle | 今天，这批客人不用吹干。 | These guests can skip the blow-dry. |
| fish.report_mvp | 本局 MVP：{fishColorName} | This Round's MVP: {fishColorName} |
| fish.report_tiles | 清除格数 | Tiles Cleared |
| fish.leaderboard | 鱼关排行榜 | Fish Leaderboard |
| fish.prep_loading | 小鱼正在入缸…… | The fish are swimming in… |
| fish.rush_served | 已清除 {count}/12 格 | {count}/12 tiles cleared |
| tutorial.conch | 海螺：和邻格交换，螺口喷出水流，清一行或一列。 | Conch: swap with a neighbor to sweep a row or column. |
| tutorial.pearl_shell | 珍珠贝壳：和邻格交换，贝壳一开，清出一个十字。 | Pearl Shell: swap with a neighbor to clear a row and column. |
| review.fish.high_chain | 谁开的派对？没通知我？ | A party? Where's my invite? |
| review.fish.rush_success | 赶上饭点了，原谅你。 | Dinner on time. You're forgiven. |
| review.fish.tool_combo | 吹风机就免了。 | I'll skip the blow-dry. |
| review.fish.normal | 我嘴很严，只吐泡泡。 | I keep secrets. Only bubbles escape. |
| review.fish.no_service | 我没摸鱼，我就是鱼。 | Not slacking. Just being a fish. |

邀请仅在第三个有效完整普通局成功保存后的报告出现，不用于首页或提前预告。点击只是进入准备页，个人解锁已保存；未点击也可随后从鱼榜重玩。鱼关规则说明保留「连成一线」含义：直线三消与已确认的四消、五连、L / T 形规则并用；`{fishColorName}` 是本局鱼色类别的界面名称，使用相应语言，不是给个体鱼编造姓名。零服务省略 MVP；海螺／珍珠贝壳沿用梳子／剪刀能力、合体和称号条件，鱼关不使用毛发评语。

`fish.prep_loading`、`fish.rush_served`、`tutorial.conch`、`tutorial.pearl_shell`（原 `tutorial.water_jet`、`tutorial.bubble_machine`）于 2026-10-23 确认补入：后三条由已确认的名称、说明与 `fish.rush_progress` 拆分或拼成；鱼关工具合体带教复用通用的 `tutorial.tool_combo`。

2026-10-24 按 V1_RULES 已定的海底元素改名并确认文案：`fish.water_jet`／`fish.bubble_machine`（及 `_hint`）改为 `fish.conch`／`fish.pearl_shell`，带教键同步改为 `tutorial.conch`／`tutorial.pearl_shell`；`tutorial.big_wave_merge` 改为珍珠贝壳合成。`fish.big_wave`、`tutorial.big_wave` 与评语中的「水流」「水花」不变。

鱼关深蓝水下方向已确认。局内标题复用已校读的「小鱼也来排班啦」，不把实际游玩误标为加载或准备状态；鱼关催单进度用「已清除」表达格数，不表示独立鱼的数量，倒计时和奖励条件不变。

鱼色名称沿用当前素材清单的中英文展示名；例如「天蓝色 / Sky Blue」是一个鱼色类别，不是个体鱼的名字。鱼报告的「清除格数」与工具、连锁统计仍按同一套真实结算口径，排行榜入口指向当前已解锁的鱼榜。

邀请、准备规则、水族道具与鱼关评语的关键文案已确认；只有已触发的玩家能在对应局外位置看到这些内容，不以本段文案增加首页预告或提前模式入口。「不用吹干」是已定鱼关主题梗，不表示真实洗护操作。

## 9. 上传照片与删除申请

### 9.1 上传照片 · 成功句已确认，文案已校读修订

| Key | 中文 | English |
| --- | --- | --- |
| upload.title | 添加我家毛孩子 | Add My Pet |
| upload.photo_hint | 每次添加一只宠物，选一张主体清楚的照片。 | Add one pet at a time with a clear photo of them. |
| upload.choose_photo | 选择照片 | Choose a Photo |
| upload.change_photo | 换一张 | Choose Another Photo |
| upload.preview | 原图预览 | Original Photo Preview |
| upload.preview_hint | 这是原图预览。游戏形象会在人工处理和核对后上架。 | This is the original photo. The game portrait will be manually prepared and checked before it goes live. |
| upload.pet_name | 宠物名字 | Pet Name |
| upload.pet_name_placeholder | 填写宠物名字 | Enter your pet's name |
| upload.owner_quote | 主人说（选填） | A Word from Home (Optional) |
| upload.owner_quote_placeholder | 用英文对大家介绍一下这位毛孩子 | Introduce your pet to everyone in English |
| upload.owner_quote_english | 主人说只能用英文字母、数字和英文标点。 | Please use English letters, numbers, and punctuation only. |
| upload.owner | 主人：{ownerName} | Owner: {ownerName} |
| upload.owner_hint | 将以当前游戏身份提交。 | This submission will use your current game profile. |
| upload.use_info | 查看照片展示与处理说明 | Photo Use and Processing |
| upload.display_summary | 处理后的头像用于棋盘和图鉴，处理过的照片可在图鉴翻面查看；宠物名字和主人信息也会展示。 | Styled portraits appear on the board and in the Pet Collection. A processed photo is shown on the card's reverse. Pet names and owner details are also shown. |
| upload.submit | 提交 | Submit |
| upload.submitting | 正在提交照片和资料…… | Sending Your Photo and Details… |
| upload.received | 资料收到啦！核对处理好，就让毛孩子来上班。 | Submission received! We'll prepare and review it before your pet joins the crew. |
| upload.photo_required | 先选一张照片吧。 | Choose a photo first. |
| upload.name_required | 请填写宠物名字。 | Enter your pet's name. |
| upload.preview_unavailable | 已选择 {fileName}，这里暂时预览不了，可以照常提交。 | {fileName} selected. Preview isn't available here, but you can still submit. |
| upload.too_large | 照片超过 20 MB，换一张小一点的吧。 | This photo is over 20 MB. Please choose a smaller one. |
| upload.daily_limit | 今天已经提交 10 次啦，明天再来吧。 | You've made 10 submissions today. Please try again tomorrow. |
| upload.invalid_photo | 这张图片暂时无法使用，请换一张。 | We couldn't use this image. Please choose another. |
| upload.failed | 还没提交成功，填写内容已保留，请重试。 | Your submission didn't go through. Your details are kept. Please try again. |
| upload.leave_title | 照片和名字还没提交，要离开吗？ | Your photo and pet name haven't been submitted. Leave this page? |
| upload.keep_editing | 继续填写 | Keep Editing |
| upload.discard_and_leave | 放弃并离开 | Discard and Leave |

提交成功必须以照片与资料均保存成功为准。原图预览不代表最终形象；「人工处理」包含既定素材制作与核对，不声称全部手绘。没有在线裁切、处理进度、自动生成或专门审核管理页。主人信息展示与照片使用说明放在提交前，完整说明仍需按实际处理范围核对；展示摘要不替代说明正文。

上传主人已确认固定使用当前游戏身份，只读展示；上传页不提供修改主人或重新选择身份的入口。`upload.owner_hint` 说明本次资料的提交归属，不增加单独确认步骤。

提交成功句已确认：「资料收到啦！核对处理好，就让毛孩子来上班。 / Submission received! We'll prepare and review it before your pet joins the crew.」，保留「毛同事来上班」的角色感。它只表示资料已收到、后续由人工处理，不表示已核对通过或已加入公共素材，不承诺时间。成功页沿用「继续游玩」与「回门店」，不提前给出「已上架／去查看」反馈。

成功页按钮主次和去向已确认：「继续游玩」为主按钮，进入普通宠物局准备页；「回门店」为次按钮。准备页仍点「开始这班」才启动 90 秒，上传成功不立即开局，也不立即将新宠物加入阵容。提交中保留照片和名字并防止重复点击，失败原页保留内容供重试。

未提交表单的站内离开确认已确认：有照片或名字时，点击「回门店」或站内返回先使用 `upload.leave_title` 提醒；「继续填写」为主按钮，取消离开并保留内容，「放弃并离开」为次按钮，清除本页未提交内容并前往原目标。空白表单直接返回，成功页不显示此提醒。照片说明在当前页展开，关闭后保留内容；不新增草稿箱。

#### 9.1.1 照片展示与处理说明弹层正文

点击 `upload.use_info`（「查看照片展示与处理说明 / Photo Use and Processing」）时，在当前页展开以下说明弹层（与 2.3 口径一致，关闭后保留已选照片与已填名字）：

| Key | 中文 | English |
| --- | --- | --- |
| upload.use_title | 照片展示与处理说明 | Photo Use and Processing |
| upload.use_body | 1. **内部展示**：上架后，处理后的宠物贴纸头像将用于全公司同事可见的消消乐棋盘、宠物图鉴、每日店长及主人竞猜；已收集该宠物的同事可在图鉴卡背面查看 Bob 处理后的照片版本（已去除 EXIF 位置信息，不直接公开原始文件），并展示宠物名字与你的同事身份。<br>2. **AI 与人工处理**：提交的原图先私有存储在 Cloudflare R2（亚太），由 Bob（@Bob）人工下载、去除位置信息后通过 AI 图像服务转换统一贴纸画风，经人工核对后再上架；不会自动直接公开原始上传文件。<br>3. **随时申请移除**：上架后如不希望继续展示，可随时在「我的宠物」或图鉴详情页提交删除申请，由 Bob 人工核实后下架并清理游戏持有的文件。 | 1. **Internal Display**: Once listed, the styled pet sticker portrait will appear on the match-3 board, in the Pet Collection, as Manager of the Day, and in the owner quiz for MoeGo coworkers. Coworkers who collect your pet can flip the card to view a processed photo (with EXIF location details removed, never the raw file) alongside the pet's name and your coworker profile.<br>2. **AI & Manual Review**: Uploaded originals are stored privately in Cloudflare R2 (Asia-Pacific). Bob (@Bob) manually reviews each submission, strips location metadata, and uses an AI image service to generate the unified sticker portrait before listing. Raw uploads are never published automatically.<br>3. **Removal Anytime**: If you ever want your pet removed, submit a request from My Pets or the pet's detail card, and Bob will manually verify, unlist, and delete the game's copies. |

### 9.2 删除申请 · 关键文案已确认

| Key | 中文 | English |
| --- | --- | --- |
| delete.title | 申请移除这只宠物？ | Request Removal of This Pet? |
| delete.hint | 提交后，由 Bob 人工核实和处理；申请不会立即隐藏或删除资料。 | Bob will review and handle your request. Submitting it won't immediately hide or delete the pet's information. |
| delete.note | 补充说明（选填） | Additional Details (Optional) |
| delete.note_hint | 可以说明希望移除哪些资料，方便核实。 | You can tell us which information you'd like removed. |
| delete.submit | 提交申请 | Submit Request |
| delete.received | 申请已收到，等待人工处理。 | Request Received. Awaiting Review. |
| delete.pending | 待处理 | Pending |
| delete.processed | 已处理 | Processed |
| delete.failed | 申请还没提交成功，请重试。 | Your request didn't go through. Please try again. |

删除申请提交不会自动下架，不承诺处理时限；只有人工完成确认范围内的下架与清理后才显示处理完成。只删除宠物不默认删除其主人的游戏身份。对已下载或已分享到外部的图片，不写「已收回」等无法兑现的完成态。

本页展示的关键文案已确认。补充说明沿用既定选填字段，用来表达希望处理的范围，不改变人工核实流程；「申请已收到」只在申请成功保存后显示，保存失败使用重试提示。已开局与待同步合法对局按既定规则结算的处理已确认，删除申请页不增加局内中断或成绩作废提示。

## 10. 设置、退出与访问异常 · 关键文案已确认

| Key | 中文 | English |
| --- | --- | --- |
| settings.language | 语言 | Language |
| settings.chinese | 中文 | 中文 |
| settings.english | English | English |
| settings.music | 背景音乐 | Background Music |
| settings.sfx | 消除音效 | Sound Effects |
| settings.haptics | 轻震 | Haptics |
| settings.preference_hint | 会记住你的选择。 | We'll remember your choices. |
| settings.on | 开 | On |
| settings.off | 关 | Off |
| settings.haptics_unavailable | 此设备暂不支持轻震，可正常游玩。 | Haptics aren't available on this device. You can still play. |
| quit.title | 这班要提前收工吗？ | Clock Out Early? |
| quit.body | 本局成绩和新增收集不会保存，之前的记录保留。确认期间计时继续。 | This round's score and newly collected pets won't be saved. Earlier records stay. The timer keeps running. |
| quit.confirm | 提前收工 | Leave Round |
| error.connection | 暂时没连上，请重试。 | Couldn't connect. Please try again. |

音乐和音效首次关闭，支持轻震的设备首次默认开；各开关显示实际状态并记住选择。背景音乐只在棋盘计时期间播放，局终收尾音后停止，门店、报告等页面保持安静；首版音乐与音效为浏览器现场合成的占位，拿到正式素材后替换（2026-10-23 确认）。门店设置含语言与三个开关，棋盘轻量设置只有三个开关。轻震不可用提示仅在相关设置位置展示，不用弹窗打断。退出确认、设置和后台均不暂停游戏；原局待同步结果保持原玩家关联，不因当前所选身份改变而改归属。

开关标签、轻震不可用、提前退出及连接异常提示的关键文案已确认。默认开关、记住选择及计时规则沿用已确认方案；功能状态直接说明，不使用角色玩笑替代保存损失与操作后果。

## 接入前待核对

- 完整信息使用说明已按六项要点起草（见 2.3），接入前按实际字段再核对；上传照片处理说明沿用同一口径（AI 处理、人工核对；数据库与服务器在美国、图片在 R2 亚太区域）。
- 宠物下架前已开局及待同步的合法对局按原规则结算已确认；正常到时、基础校验、主动退出不保存与同局去重仍适用，不把这项规则写成无条件保存承诺。结算展示按当前上架目录过滤，符合条件的普通局仍累计隐藏关解锁进度。
- 本稿没有新增二维码、收齐徽章、公共鱼缸进度、邀请奖励或暂停机制。数字与变量显示、手机换行和英文按钮长度需在实际页面验证；目前仅完成文案草稿。



### 永久收集成就与称号（2026-10-24）

2026-10-25 开发者彩蛋：`achievement.hotpot*` 为隐藏称号「火锅搭子」，解锁前在我的称号里用 `achievement.hidden_name` / `hidden_condition` 占位（灰蒙层 + 问号，只露稀有度）；`rarity_mythic`「镇店之宝」是新增的最高一档。`home.manager_line_maodu` / `_boluo`、`board.reunion_hotpot` 与 `report.developer_certified`（认证章的读屏文字）只在 Maodu 毛肚、Boluo 菠萝出现时使用，宠物名保留中英混写原文。

| Key | 中文 | English |
| --- | --- | --- |
| achievement.cats | 猫猫亲友团 | Cat Circle |
| achievement.dogs | 汪汪好朋友 | Dog Besties |
| achievement.friends | 毛孩子熟人 | Familiar Faces |
| achievement.species | 跨物种交友家 | Across Species |
| achievement.neighbors | 串门小能手 | Neighborhood Pal |
| achievement.family | 一家都熟 | Family Friend |
| achievement.album | 全员点名成功 | Full Album Club |
| achievement.hotpot | 火锅搭子 | Hotpot Buddies |
| achievement.cats_condition | 猫猫 · {current} / {target} 只 | Cats · {current} / {target} |
| achievement.dogs_condition | 狗狗 · {current} / {target} 只 | Dogs · {current} / {target} |
| achievement.friends_condition | 毛孩子 · {current} / {target} 只 | Pets · {current} / {target} |
| achievement.species_condition | 动物 · {current} / {target} 种 | Species · {current} / {target} |
| achievement.neighbors_condition | 主人 · {current} / {target} 位 | Owners · {current} / {target} |
| achievement.family_condition | 多宠家庭 · {current} / {target} 个 | Pet families · {current} / {target} |
| achievement.album_condition | 当期名册 · {current} / {target} 只 | Catalog · {current} / {target} |
| achievement.hotpot_condition | 在一局里面同时遇到开发者家的 Maodu 毛肚和 Boluo 菠萝 | Served the developer's Maodu and Boluo in one game |
| achievement.unlock_condition | 解锁条件 | Unlock Condition |
| achievement.view_condition | 查看「{title}」的解锁条件 | View the unlock condition for {title} |
| achievement.cats_unlock | 收集 {target} 只不同的猫。 | Collect {target} different cats. |
| achievement.dogs_unlock | 收集 {target} 只不同的狗。 | Collect {target} different dogs. |
| achievement.friends_unlock | 收集 {target} 只不同的宠物。 | Collect {target} different pets. |
| achievement.species_unlock | 收集 {target} 类动物，猫狗的不同品种不单独计类。 | Collect {target} animal types. Cat breeds count together, as do dog breeds. |
| achievement.neighbors_unlock | 收集来自 {target} 位不同主人的宠物。 | Collect pets from {target} different owners. |
| achievement.family_unlock | 收齐 {target} 个多宠家庭的全部上架宠物，每家至少 2 只。 | Collect every listed pet from {target} multi-pet family with at least 2 listed pets. |
| achievement.album_unlock | 收齐当期名册中全部上架的普通宠物。 | Collect every listed regular pet in the catalog at the time of unlocking. |
| achievement.hotpot_unlock | 隐藏称号：同一局里把开发者家的毛肚和菠萝都服务到。 | Hidden title: serve the developer's cats, Maodu and Boluo, in the same game. |
| achievement.my_titles | 我的称号 | My Titles |
| achievement.rarity_common | 闪耀 | Radiant |
| achievement.rarity_rare | 卓越 | Outstanding |
| achievement.rarity_epic | 非凡 | Extraordinary |
| achievement.rarity_legendary | 传奇 | Legendary |
| achievement.rarity_mythic | 镇店之宝 | House Special |
| achievement.wearing_named | 正在佩戴「{title}」 | Wearing {title} |
| achievement.pick_hint | 解锁后，挑一个喜欢的挂上。 | Unlock a title, then pick your favorite to wear. |
| achievement.unlocked_count | 已解锁 {count} / {total} | Unlocked {count} / {total} |
| achievement.remove | 不佩戴 | No Title |
| achievement.equip | 佩戴 | Wear |
| achievement.equip_named | 佩戴「{title}」 | Wear {title} |
| achievement.wearing | 佩戴中 | Wearing |
| achievement.locked | 未解锁 | Locked |
| achievement.hidden_name | 隐藏称号 | Hidden Title |
| achievement.hidden_condition | 达成神秘条件后揭晓 | Revealed when a secret condition is met |
| achievement.no_score | 只改变展示，不影响分数 | Just for display. Your score stays the same. |
| achievement.loading | 正在整理你的徽章… | Gathering your badges… |
| achievement.load_failed | 徽章暂时没读到，请重试。 | We couldn’t load your badges. Please try again. |
| achievement.equip_failed | 称号没换成功，请再试一次。 | We couldn’t change your title. Please try again. |
| achievement.new_unlocks | 新称号解锁！ | New Titles Unlocked! |
| achievement.worn_by | {playerName} 的称号 | {playerName}'s Title |
| achievement.view_worn | 查看 {playerName} 的称号：{title} | View {playerName}'s title: {title} |

## 玩家名片 · 排行榜点击入口

| Key | 中文 | English |
| --- | --- | --- |
| profile.title | 玩家名片 | Player Card |
| profile.named | {playerName} 的玩家名片 | {playerName}'s Player Card |
| profile.open | 查看 {playerName} 的玩家名片 | View {playerName}'s player card |
| profile.best | 最高分 | Best Score |
| profile.collected | 已收集 | Collected |
| profile.games | 已完成局数 | Games Completed |
| profile.badges | 已解锁徽章 | Unlocked Badges |
| profile.recent | 最近 5 局 | Last 5 Games |
| profile.date | 日期 | Date |
| profile.score | 得分 | Score |
| profile.new_collected | 新收集 | New Pets |
| profile.no_badges | 还没有解锁徽章。 | No badges unlocked yet. |
| profile.no_games | 这个模式还没有完成的对局。 | No completed games in this mode yet. |
| profile.loading | 正在读取玩家记录… | Loading player records… |
| profile.load_failed | 玩家记录暂时没读到，请重试。 | We couldn’t load this player’s records. Please try again. |
| profile.not_found | 这位同事暂时不在可查看的名册中。 | This coworker is not currently available in the roster. |

最高分、已完成局数和最近五局跟随当前排行榜模式；收集统计只计当前上架宠物。未结算/退出的对局不进入历史。鱼关历史不展示宠物新增数。名片只读，不补发或切换对方称号，不展示邮箱、原始对局内容、宠物主人关系。
