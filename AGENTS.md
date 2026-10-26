# MoeGo 毛孩子全明星 · Agent 工作约定

本文件是 Claude Code 与 Codex 共用的项目约定。`CLAUDE.md` 只引用本文件，修改约定时只改这里。

## 文档权威顺序

规则冲突时以排在前面的为准，不自行发明规则：

1. [V1_RULES.md](V1_RULES.md)：首版规则总表
2. [GAME_FLOW.md](GAME_FLOW.md)：页面流程与交互
3. [TECH_PLAN.md](TECH_PLAN.md) / [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md)：技术方案、阶段与验收
4. [UI_COPY.md](UI_COPY.md)：中英文案
5. [design/DESIGN_NOTES.md](design/DESIGN_NOTES.md)：视觉方向与已选定图稿；[design/PET_ASSET_STYLE.md](design/PET_ASSET_STYLE.md)：宠物素材规范

[DESIGN_REVIEW.md](DESIGN_REVIEW.md) 第 4–8 条（退出与归零优先级、洗牌约束、匹配组与＋形五格、MVP 平手、催单与到时端点）已于 2026-10-22 确认并写入 V1_RULES 与 GAME_FLOW。

## 技术栈与目录

React + Vite + TypeScript 前端，一个 Node.js 服务同时提供构建产物与 API；生产数据在 RackNerd PostgreSQL 的 `pet_match` 数据库、`pet_match` schema，图片在 R2 私有桶，由 Node 代理。详见 TECH_PLAN。

```
web/src/
  engine/          纯 TS 规则引擎：可传随机种子与固定棋盘，输出事件时间线；不依赖 React/DOM
  i18n/            zh / en 文案，key 与 UI_COPY 对应
  ui/tokens.css    设计令牌：颜色、圆角、描边、阴影、字号、间距；鱼关深蓝主题另一套
  ui/primitives/   通用基础组件：Button、Card、Sheet、Toggle、SearchInput、Avatar、ProgressBar、Toast…
  components/      领域组件：PetSticker、Board、BoardCell、GameClock、RushOrderBar、ScorePopup、LineupPanel、
                   ReportCard 各分区、PetCard、LeaderboardRow、UploadForm…
  screens/         页面：Identity、Home、Prep、Board、Report、Petdex、Leaderboard、MyPets、Upload、Fish*
  dev/gallery/     组件陈列页（开发与生产均可访问 /dev/gallery，使用示例数据，不调用游戏 API）
server/            Node 服务：名册、结算事务、排行、图鉴、上传、删除申请、图片代理
tools/pet-studio/  已有的独立素材工作台，与游戏代码分开，不在游戏任务中改动
```

## 组件化规则（必须遵守）

- **设计图是视觉参考，不是切图来源。** `design/concepts/*.png` 只用于对照布局、层级和风格；不得把整张或局部截图作为页面背景或组件图片。
- **只有内容素材用图片**：宠物贴纸（`assets/pets/`）、单鱼素材、品牌角色与插画。按钮、卡片、底色、进度条、棋格、图标用 CSS / SVG / Canvas 实现。
  - 例外（2026-10-24 用户确认）：已确认图标库可用 PNG，待矢量化。来源为 `assets/icons/library-original-png-v2/` 原稿母版，经同目录 `export_web.py` 等比导出到 `web/src/ui/icons/`，界面一律通过 `ui/primitives/Icon` 使用，不在组件里直接引图标文件；以后矢量化只替换 `ui/icons` 与 `Icon` 内部。图标库以外的界面元素仍按上条实现。
  - 同日用户明确授权收集称号徽章从已确认的 `collection-title-badges-v3.png` 直接切图去底；母版在 `assets/icons/collection-titles-original-v1/`，同步到图标库 `masters/13-collection-titles/`，同样通过 `Icon` 使用。此授权仅适用于七枚已确认徽章，不扩大到其他页面截图。
  - 例外（2026-10-25 用户确认）：游戏页前台加单与收工稿已确认，用户要求全部拆分成组件元素、不得随意调整图案。本轮钟、星、夹板、夹子、勾、小钟、收工牌和四组点缀由确认稿拆成独立透明素材，母版在 `masters/16-board-frontdesk/`，精确来源和像素保留记录在 `assets/icons/board-frontdesk-original-v1/`，经 `Icon` 使用；英文牌仅做文字本地化。文案、数字、纸张、进度条和布局仍为可更新的组件，不使用整页或整个卡片截图。此例外仅限本轮列明图案。
- **页面只组合组件。** `screens/` 不写细节样式，不复制粘贴组件内部结构；需要新外观时先在 `components/` 或 `ui/primitives/` 中新增或扩展组件。
- **组件数据全部来自 props**，不在组件内写死宠物、姓名、分数或文案；文案一律经 i18n key 读取，宠物名与同事名保留原文。
- **样式只引用 tokens**，不写死颜色、阴影和间距数值；鱼关通过切换主题令牌实现，不另写一套组件。
- **每个组件都登记到陈列页**，列出全部状态：默认、选中、禁用、加载、空、错误、长英文名、中英文，以及适用时的鱼关主题。做法：在组件旁新建 `<Name>.gallery.tsx`，默认导出 `GalleryEntry`（见 `web/src/dev/gallery/types.ts`），陈列页会自动收录。
- 布局竖屏优先（参考 390 × 844），横屏兼容；提示与催单不得推动棋盘位置。

## 开发顺序

按 IMPLEMENTATION_PLAN 的五个阶段推进，不同时铺开所有页面。每个阶段先出计划，确认后再实现。单次任务只做一个模块或一个组件。

1. 规则引擎先写测试，再写实现；验收场景与期望值以 IMPLEMENTATION_PLAN 为准，不以动画表现代替规则正确。
2. 先做 tokens 与 primitives，再做领域组件，最后组合页面。
3. 局内逻辑由 engine 驱动，React DOM 按事件时间线播放动画，粒子另用一层 Canvas。

## 验证

- 常用命令（在 `web/` 下）：`npm test`、`npm run typecheck`、`npm run build`、`npm run dev`（端口 5180，陈列页在 `/dev/gallery`）。
- 服务端（在 `server/` 下）：先在仓库根目录 `docker compose up -d` 启动本地 Postgres（15.8，端口 54329，库 `pet_match_dev` / `pet_match_test`）；`npm run migrate`（本地建模拟人员表、迁移、种占位宠物）、`npm test`、`npm run typecheck`、`npm run dev`（端口 8787，web 开发服务已代理 `/api` `/img`）。
- 数据库选择：开发与测试只连本地库；只有 `NODE_ENV=production`（`npm start`）才使用 `.env` 的 `PET_MATCH_DATABASE_URL`（RackNerd 专用角色 `pet_match_app`）。生产运维用 `server/scripts/database.ts migrate|verify --prod`，迁移默认预览、`--apply` 执行；管理员连接为 `PET_MATCH_ADMIN_DATABASE_URL`，本机通过 SSH 隧道访问。原 Supabase 脚本仅保留历史，不再作为生产入口。同事名册由 Slack 初始化和同步，不迁移 `public."user"`。
- 素材上下架：`server/scripts/catalog.ts publish|unpublish`（默认只列变更，`--yes` 写入，`--prod` 写生产 PostgreSQL 需先确认）；读 v4 名录、`assets/pets/stickers-b-head-active-v1` 与已确认的 `data/pet-materials/owner-slack-map.json`。贴纸默认存本地目录 `server/.store/`（与 R2 相同键布局），`OBJECT_STORE=r2` 切到 R2。删除申请用 `server/scripts/deletions.ts list|resolve`（`resolve` 只改状态、须写 `--note`；关联宠物仍上架时拒绝，先 `catalog unpublish`）。有新上传或新删除申请时，服务端用 `SLACK_BOT_TOKEN`（需 `chat:write`、`files:write`、`im:write`）私信 `SLACK_NOTIFY_CHANNEL`（Bob 为 `U03FPQWGTN2`）；上传通知附去掉 EXIF、长边 1600 的 JPEG 预览，HEIC 或附图失败时只发文字，发送失败不影响提交。游戏首页链接的 Slack 整宽预览由 `/api/slack/events`（`SLACK_SIGNING_SECRET`，Bot 需 `links:read`、`links:write`）收到 `link_shared` 后 `chat.unfurl`，配置见 `deploy/SLACK_PREVIEW_TESTS.md`。同事上传用 `server/scripts/submissions.ts list|pull|done`（`pull --yes` 把原文件与资料（`info.json`，含选填的英文主人说 `ownerQuote`）下载到不进 git 的 `data/submissions/<北京日期>/<id>/`；原文件可能带 EXIF，交给 AI 前先去除）。本地目录的对象用 `server/scripts/store-sync.ts` 补传到 R2（只传桶里没有的键，不覆盖、不删除、不碰数据库；默认只列出，`--yes` 上传）。
- 生产镜像：仓库根目录 `docker buildx build --platform linux/amd64 --build-arg GAME_VERSION="$(node web/scripts/game-version.mjs)" -t moego-pet-match:<版本> --load .`；首页版号取 Git 最新提交的北京时间日期与当日主线提交序号，CI 自动传入，开发服务启动时读取。部署说明、编排示例与生产环境变量清单在 `deploy/`。
- 自动部署：推送 `main` 即触发 GitHub Actions「Deploy to RackNerd」，依次测试、构建 GHCR 镜像并部署到 `https://star.baobo.me`（仓库变量 `DEPLOY_ENABLED=true`；维护时可临时关闭）。**推送 main 等同上线**：只在用户明确要求时推送，推送后用 `gh run list --workflow deploy.yml` 确认运行结果。
- engine 与 server 的规则改动必须有单元测试并跑通。引擎只认游戏时钟毫秒数；测试用 ASCII 棋盘夹具与固定补落序列（见 `web/src/engine/__tests__/fixtures.ts`）。
- 报告页验收（仅开发环境）：打开 `http://localhost:5180/?report=greedy`（或 `casual` 随机走子、`zero` 零服务局；加 `&mode=fish` 看鱼关报告），刷新一次就登记并自动打完一局、直接进入报告页，走真实结算与保存；`?report=showcase` 用伪造的已保存结果让结算页全部元素同时出现（新纪录、今日名次、打卡、新收集与新称号、猜主人、下一件事；加 `&invite=1` 换成鱼关邀请），只登记不结算；需要先在浏览器里选过一次身份，会向本地开发库写入对局记录（成绩、图鉴、局数）。生产构建不含此功能。宣传片录屏用 `?demo=<棋盘种子>&play=<走法种子>`：开局后棋盘按固定走法自动打完整局，挑种子用 `web/` 下的 `npx vite-node scripts/demo-seeds.ts`，见 [宣传片分镜](design/reviews/2026-10-26-promo-video/STORYBOARD.md)。
- UI 改动在浏览器 390 × 844 下截图，与对应的已选定图稿（见 DESIGN_NOTES「选定展示文件」）对比并说明差异；同时检查陈列页中的各状态。
- 未实际运行验证的内容，在交付说明中明确写出。

## 图片任务：交给 Codex ImageGen

需要生成或编辑位图（新效果图、图稿修订、宠物贴纸、鱼素材、插画、分享卡底图等）时，使用 Codex 内置 `image_gen`；不用 CLI fallback，不在代码中直接调用图片 API。界面元素本身不属于图片任务，应使用代码实现。

Claude Code 从项目根目录以非交互方式调用：

```sh
codex exec -m gpt-6-sol -s workspace-write -C /Users/bob/WebstormProjects/moego-pet-match \
  "用内置 image_gen 生成……；完成后把选定结果复制到 design/concepts/<name>-vN.png，并把完整请求写入 design/concepts/<name>-vN-prompt.txt" \
  -i design/concepts/<参考图>.png </dev/null
```

- 提示词必须写在 `-i` 之前：`-i` 可接多个文件，写在它后面的提示词会被当作图片路径。
- 显式指定 `-m gpt-6-sol`：全局默认的 `gpt-6.1-sol` 在 ChatGPT 账号下不可用。
- 用 `</dev/null` 关闭 stdin，避免 Codex 等待标准输入；只读的看图、对比任务改用 `-s read-only`。

图片产物约定（与现有留档方式一致）：

- 效果图放 `design/concepts/`，命名 `<页面>-vN.png`，同目录保存 `<页面>-vN-prompt.txt` 完整请求。
- 宠物与鱼素材遵循 PET_ASSET_STYLE 与对应目录 README，保留生成原图与处理记录。
- 不覆盖已有文件，修订一律升版本号；不得只把结果留在 `$CODEX_HOME/generated_images`。
- 新图稿被选定后，同步更新 DESIGN_NOTES 的「选定展示文件」。
- Claude Code 收到结果后自行查看图片，确认文件已落到约定位置、内容符合要求，再向用户汇报。

## 数据与安全

- `.env` 含 Slack、数据库与 OpenAI 等凭据，不提交到 git，不在输出中回显。
- 宠物照片、名录数据与 `/data/` 下的工作数据不提交到 git。
- 不迁移、不修改 Supabase `public."user"` 原表的结构、数据或权限。生产游戏只读写 RackNerd `pet_match` 数据库，独立同事名单保存在 `pet_match.slack_members`。
- 不自行推送 main（即部署）、修改 DNS、连接或改动 RackNerd 服务器与 1Panel（以及原 DMIT 服务器），除非用户明确要求。

## 2026-10-27 动态墙评论图标授权

用户指定 `design/concepts/pet-social-comment-icon-v2.png`（用户附件逐字节副本）作为动态墙评论图标，原样复制为图标库母版 `masters/19-pet-social/social-comment.png`，来源记录在 `assets/icons/pet-social-comment-original-v1/`，经统一 `Icon` 使用。快捷互动复用已入库的 `paw-cute/pets/play/love`。此授权仅限这一枚评论图标。

## 2026-10-26 玩家点赞素材补充授权

用户选定「举爪击掌」，明确要求按原图切图为透明 PNG，并实现、测试幂等和推送上线；点赞不可取消。未赞与已赞两枚允许从 `design/concepts/player-likes-high-five-v1.png` 原图直接提取，来源记录在 `assets/icons/player-likes-original-v1/`，透明母版在 `masters/17-player-likes/`，仍通过统一 `Icon` 使用。此例外只授权本次两枚举爪图标，不扩大到其他截图。

## 2026-10-26 宠物爪印簿素材补充授权

用户提供爪印簿三状态设计稿，明确要求按原图做元素组件裁切、不要手绘并修改代码。本轮 11 个小图形允许直接提取：橙色实心爪印、四个留言图标、已回爪描边爪印、灰色爪印、选中圆勾、展开箭头、详情入口箭头和关闭叉号。原始附件与像素保留记录在 `assets/icons/pet-paw-book-original-v1/`，透明母版在 `masters/18-pet-paw-book/`，经统一 `Icon` 使用；不得用 SVG 重绘替代。此授权仅限本轮列明图形，文字、按钮底色和布局继续为组件。

同日用户要求重新设计并选择实际显示的第 2 稿“宠物小动作” `design/concepts/pet-paw-icons-playful-v1.png`。沿用原图裁切要求，当前 11 枚母版更新为该稿的高清提取；来源与校验在 `assets/icons/pet-paw-icons-playful-original-v1/`。旧母版移入 `assets/icons/pet-paw-book-original-v1/masters/` 留档，两个版本的原图均保留。
