# 页面美化 · 第一轮（2026-10-24）

用户要求：首页、登录页按 mobile-home-v2／mobile-identity-v2 美化并全站换圆润加粗字体；标题做成图案；登录页选中同事时出现蓝色小猫；排行榜按 mobile-leaderboard-v1；图鉴卡片去掉已收集与翻面图标。执行方案 A：先做不依赖图片的部分并同时出图，图确认后再改登录页与首页。

## 已完成（不依赖图片）

- 图鉴：PetCard 去掉入册书签；PetDetailCard 去掉翻面图标（卡片仍可点按翻面）。「我的宠物」的已收集标记保留。
- 按钮：图标放进与首行等高的行内盒居中（`height: 1lh`），修正此前图标比文字低约 4 px；整宽大按钮的图标随缩放后的字号同比缩放。
- 字体：Resource Han Rounded CN（Medium／Bold／Heavy）＋ Nunito，子集化后约 600 KB，见 `assets/fonts/README.md`；成绩卡与店长海报画布绘制前显式加载字体。
- 排行榜：徽记第 1 名最大、第 2／3 名为 84%／72%；领奖台按位置做台阶高度（中 236、左 208、右 184 px，长名字最多两行），徽记压卡片上沿，分数白色胶囊；新增「领先玩家」小标题、表头、本人「你」标记（文案已写入 i18n 与 UI_COPY）；「再挑战一次」固定在底部，列表可滑动。

截图：`leaderboard-zh.png`、`leaderboard-all-en.png`、`home-zh.png`、`petdex-zh.png`、`pet-detail-zh.png`、`gallery-podium.png`。验收：typecheck、test（125 通过）、build 通过。

## 待确认的图

- `design/concepts/title-wordmark-zh-v1.png`、`title-wordmark-en-v1.png`：Codex image_gen，透明底。
- `design/concepts/home-storefront-v1.png`：店面框插画，橱窗留空供代码叠加店长、气泡与名牌。
- `design/concepts/identity-blue-cat-v1.png`：选中状态的探头蓝猫（生成中）。
- `assets/illustrations/brand/moego-logo.png`：由 `design/references/moego-logo.jpg` 本地去白底，未经 AI 重绘。

首次四张并行生成时 image_gen 有三张连接失败，改为逐张重试。

## 素材确认后：登录页与首页（用户回复「素材都可以」）

- 素材：选定稿复制到 `assets/illustrations/ui/`，Logo 在 `assets/illustrations/brand/`；`assets/illustrations/build_web.py` 裁边缩小为 WebP 输出到 `web/src/ui/art/`（标题 69／54 KB、店面 68 KB、蓝猫 9 KB、Logo 19 KB）。
- BrandHeader：浅色页面左上角改为官方 Logo（鱼关深蓝主题自动换回白色文字字标）；游戏名（登录页、门店）改为标题字标图片，中英文随语言切换，读屏读原文；副标题加大一档。
- 登录页：同事卡片加大（头像 56 px、名字加粗）；选中时品牌蓝猫从卡片上沿后面探头（约 0.3 秒，减少动态效果时直接显示），位置避开搜索框清除按钮；列表上方留出探头空间；「当前选择：名字」名字橙色。
- 首页：店长卡改用店面插画，橱窗内叠加店长贴纸、宣言气泡，名牌压在柜台上；名字过长时折行不截断（签名版同样）。
- 页尾链接去掉下划线（悬停与键盘聚焦时显示），不加竖线分隔，换行时不会留下孤立分隔符。

截图：`identity-zh.png`、`identity-en.png`、`home-zh.png`、`home-en.png`、`home-se-zh.png`（390 × 667）、`prep-zh.png`、`report-fish-zh.png`、`gallery-managercard.png`。

与图稿（mobile-identity-v2、mobile-home-v2）的差异：
- 未做副标题「90 秒三消」下的橙色波浪线、标题旁短线以外的装饰火花；「搜索你的 Slack 名字」仍是搜索框占位文字，没有单独加标签。
- 店长贴纸比图稿略小（受橱窗留白高度限制）；宣言气泡字号 12 px。
- 英文登录页在 390 × 844 下，选中第二个同事时确认按钮需要稍微下滑才完整可见（说明文字较长）。
- 页尾链接图稿有竖线分隔，现为留白分隔。

验收：typecheck、test（125 通过）、build 通过；仅在 Chrome 无头模式 390 × 844／390 × 667 下截图核对，未在真机检查。

## 首页店长区域：可爱气泡与动效（用户要求「对话框可爱一点，宠物头像轻微晃动」，选择「轻微可爱」）

- 宣言气泡改为椭圆粗描边（2.5 px）、加粗居中、向左倾 5°，中文在逗号处折行，尾巴朝左下指向店长并与气泡连成一体；英文较长时缩一档字号。进入首页时弹出（约 0.5 秒），之后上下浮动 3 px。
- 店长头像居中放大，以底部为轴左右摇摆 ±3°（3.2 秒一个来回）。
- 头像两侧与右下加三组橙色双短线（mobile-home-v2），交替闪烁。
- 点店长仍打开店长海报；系统「减少动态效果」时全部动效停止（已在 Chrome 中分别采样确认：摇摆角度在 ±3° 间变化；减少动态时为 none）。
- 截图：`home-zh.png`、`home-en.png`。验收：typecheck、test（127 通过）、build 通过。

## 首页名牌改为两行（用户选择方案 A，并要求字体和方框小一些）

- 门店名牌改为两行：上行「今日店长 / Today's Shop Manager」10 px 灰色小字，下行名字 14 px 加粗；内边距收至 2–3 px × 10 px，最大宽度从店面 76% 收到 52%。英文名牌从横跨整个柜台缩为约店面一半宽，长名字（Sir Fluffington）同样放得下，超长时折行不截断。
- 只改首页门店名牌；报告页签名、店长海报、分享卡仍用单行「今日店长 · 名字」，文案未改。
- 截图：`home-zh.png`、`home-en.png`、`gallery-managercard.png`。验收：typecheck、test（127 通过）、build 通过。
