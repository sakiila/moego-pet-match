# 游戏页组件化验收 · 2026-10-25

final result: passed

## 范围与视觉真值

- 用户确认：`mobile-board-frontdesk-v2.png`、`rush-frontdesk-states-v2.png`、`shift-finish-storyboard-v2.png`，要求拆分全部改动为组件元素、不得随意调整图案。
- 实现：`http://localhost:5180/dev/gallery?c=BoardLayout`；单状态可在该路由加 `state=active · approved 48s / 7 of 12`。正式游戏的 BoardScreen 组合相同组件。
- 模块：BrandHeader、StatusPanel、RushBar / RushTicket、ClosingSign、RoundFarewell、TimeUpBanner、BoardLayout、BoardControls；各有陈列状态。
- 源图案 12 件拆成独立透明 PNG，经 Icon 使用；新增英文牌仅做文字本地化。精确裁切、RGBA、透明孔、哈希、原生分辨率与处理记录在 `assets/icons/board-frontdesk-original-v1/`。
- 不使用整页或整张卡片截图；票纸、文字、数值和进度为实时组件。

## 浏览器与证据

内置 CUA 浏览器调用在分发前中止，改用现有 browser-skill / bsk 的独立 Agent Window。未借用用户标签，未改浏览器安全设置。

| 项目 | 结果 |
| --- | --- |
| 页面身份 / 非空 / 无框架错误层 | 通过 |
| 390×844 中文正常局、隐藏、处理中、成功、过期 | 通过 |
| 390×844 中文与英文的三头像收工 / 零服务仅挂牌 | 通过 |
| 中英文鱼关 | 通过 |
| 320×568 小高度、844×390 横屏 | 通过，无横向或整页纵向溢出 |
| 设置、退出确认、语言切换 | 通过，打开关闭响应正确 |
| 加单各状态棋盘位置不变 | 通过，实际格区均为 x20 / y339.109 / 350×350 CSS px |
| 图片加载、重复目标、虚假保存成功 | 图片均加载；重复目标不存在；无保存成功假宣称 |
| 刷新后的控制台 | 无新增应用 error |

源全页为 853×1844；实现截图为 780×1688（CSS 390×844、DPR=2），比较时双方均等比归一化为 390×844，无设备壳和浏览器边框。

全页并排比较：`/tmp/moego-board-frontdesk-comparison-final.png`；左源稿、右实现。
加单局部并排比较：`/tmp/moego-board-frontdesk-focus.png`。
核心素材放大比较：`assets/icons/board-frontdesk-original-v1/preview.html` 的源图 / 透明 / 蓝底逐项对照。

最终主画面：`/tmp/moego-board-active-final.png`。
中文收工：`/tmp/moego-board-finished-zh.png`；英文收工：`/tmp/moego-board-finished-en.png`。
展示拼图：`/tmp/moego-board-components-preview.png`。
批量几何和加载记录：`/tmp/moego-board-frontdesk-qa.json` 与 `/tmp/moego-board-frontdesk-qa-en.json`。

## 动态时序

独立浏览器会话对无保存的真实引擎 LocalRound 进行验证：

- 设置打开时游戏时钟43,525ms，剩余00:47；保持计时。
- 首次读到收工牌时，时钟90,029.9ms，设置已自动关闭；该局零服务，无头像。
- 约1.28秒后回调进入演示的静态结束态，时钟保持冻结。
- 演示没有POST请求。原有最后连消/输入/计分端点继续由game-layer与engine测试覆盖。
- MOTION 收工为1200ms，减少动效为300ms；CSS reduced-motion禁用落牌与弹跳。系统实际切换减少动效未单独运行。
- 开局预载中英挂牌，避免短暂收工演出开始时才下载图案；不延迟保存或改变结算事实。

## 视觉审查与迭代

1. 初次复核发现320px宽的读数溢出：固定图标和字体挤占卡片。改为按卡片容器可用宽度缩放字数，长分数单独限制。独立复测00:48右边界143.46 < 卡片154；2,480右边界299.46 < 卡片310。
2. 设置抽屉层级原本会遮住收工：到时关闭设置、禁用到时后的设置入口，动态验证通过。
3. 核对发现加单小钟与主钟不同，补拆原稿的小钟；补齐标题、时间和谢幕的原稿短线点缀。
4. 568px小高度的固定装饰挤小棋盘：优先缩字标、状态图标和提示条，让实际格区由163px增至218.8px，控件仍完整一屏。390×844确认稿尺寸不受此分支影响。
5. 最终独立视觉与代码审查无未解决P1/P2。保留P3：实际棋盘框/格距与概念图略有差别；字标用最新确认原始素材，宠物、道具和设置/退出用现有已确认资产，概念图中的生成近似和早期旧图标不是替换来源。

## 五个保真检查面

- 字体：现有圆体；主读数40px / 1000字重、等宽数字，长值/窄屏自适应。
- 间距与布局：固定票纸槽位、完整7×7，四种任务状态不推动棋盘；手机优先，横屏兼容。
- 色彩：浅橙时间、浅蓝分数、橙色票边/进度与灰色过期，鱼关继续使用主题语义令牌。
- 图案质量：源12件不透明主体RGB逐像素一致，母版未放大；仅等比尺寸导出。中文牌受分镜原稿原生分辨率限制，保留原样；英文仅替换字面。
- 文案：临时加单、独立剩余秒数、n/12、成功+100；右侧目标句删除；零服务无虚构头像，挂牌不代表保存。

## 验证与边界

- 最新 `npm test`：15文件、179项通过。
- `npm run typecheck` 和 `npm run build` 通过；最后build包含TypeScript检查。
- `git diff --check` 通过。
- 构建保留现有主包超过500kB的提示；本轮未引入新依赖。
- 过程中另一项报告改动曾短暂删除CollectionCards但尚未接好引用；该改动接入ReportHarvest后，已重新刷新、核验无新增应用错误，并重新通过构建。未覆盖其改动。
- 未改engine/server规则、后端数据或生产环境，未执行提交、推送、部署。

