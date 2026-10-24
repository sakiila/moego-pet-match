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

React + Vite + TypeScript 前端，一个 Node.js 服务同时提供构建产物与 API；数据在 Supabase `pet_match` schema，图片在 R2 私有桶，由 Node 代理。详见 TECH_PLAN。

```
web/src/
  engine/          纯 TS 规则引擎：可传随机种子与固定棋盘，输出事件时间线；不依赖 React/DOM
  i18n/            zh / en 文案，key 与 UI_COPY 对应
  ui/tokens.css    设计令牌：颜色、圆角、描边、阴影、字号、间距；鱼关深蓝主题另一套
  ui/primitives/   通用基础组件：Button、Card、Sheet、Toggle、SearchInput、Avatar、ProgressBar、Toast…
  components/      领域组件：PetSticker、Board、BoardCell、GameClock、RushOrderBar、ScorePopup、LineupPanel、
                   ReportCard 各分区、PetCard、LeaderboardRow、UploadForm…
  screens/         页面：Identity、Home、Prep、Board、Report、Petdex、Leaderboard、MyPets、Upload、Fish*
  dev/gallery/     组件陈列页（仅开发环境的 /dev/gallery 路由）
server/            Node 服务：名册、结算事务、排行、图鉴、上传、删除申请、图片代理
tools/pet-studio/  已有的独立素材工作台，与游戏代码分开，不在游戏任务中改动
```

## 组件化规则（必须遵守）

- **设计图是视觉参考，不是切图来源。** `design/concepts/*.png` 只用于对照布局、层级和风格；不得把整张或局部截图作为页面背景或组件图片。
- **只有内容素材用图片**：宠物贴纸（`assets/pets/`）、单鱼素材、品牌角色与插画。按钮、卡片、底色、进度条、棋格、图标用 CSS / SVG / Canvas 实现。
  - 例外（2026-10-24 用户确认）：已确认图标库可用 PNG，待矢量化。来源为 `assets/icons/library-original-png-v2/` 原稿母版，经同目录 `export_web.py` 等比导出到 `web/src/ui/icons/`，界面一律通过 `ui/primitives/Icon` 使用，不在组件里直接引图标文件；以后矢量化只替换 `ui/icons` 与 `Icon` 内部。图标库以外的界面元素仍按上条实现。
  - 同日用户明确授权收集称号徽章从已确认的 `collection-title-badges-v3.png` 直接切图去底；母版在 `assets/icons/collection-titles-original-v1/`，同步到图标库 `masters/13-collection-titles/`，同样通过 `Icon` 使用。此授权仅适用于七枚已确认徽章，不扩大到其他页面截图。
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
- 数据库选择：开发与测试只连本地库；只有 `NODE_ENV=production`（`npm start`）才使用 `.env` 的 `PET_MATCH_DATABASE_URL`（Supabase 专用角色 `pet_match_app`）。Supabase 运维只用 `server/scripts/supabase-setup.ts`（默认预览，`--apply` 执行）与 `supabase-verify.ts`（只读核验 + 回滚冒烟）。
- 素材上下架：`server/scripts/catalog.ts publish|unpublish`（默认只列变更，`--yes` 写入，`--prod` 写 Supabase 需先确认）；读 v4 名录、`assets/pets/stickers-b-head-active-v1` 与已确认的 `data/pet-materials/owner-slack-map.json`。贴纸默认存本地目录 `server/.store/`（与 R2 相同键布局），`OBJECT_STORE=r2` 切到 R2。删除申请用 `server/scripts/deletions.ts list|resolve`（`resolve` 只改状态、须写 `--note`；关联宠物仍上架时拒绝，先 `catalog unpublish`）。同事上传用 `server/scripts/submissions.ts list|pull|done`（`pull --yes` 把原文件与资料下载到不进 git 的 `data/submissions/<北京日期>/<id>/`；原文件可能带 EXIF，交给 AI 前先去除）。本地目录的对象用 `server/scripts/store-sync.ts` 补传到 R2（只传桶里没有的键，不覆盖、不删除、不碰数据库；默认只列出，`--yes` 上传）。
- 生产镜像：仓库根目录 `docker buildx build --platform linux/amd64 -t moego-pet-match:<版本> --load .`；部署说明、编排示例与生产环境变量清单在 `deploy/`。不自行部署。
- engine 与 server 的规则改动必须有单元测试并跑通。引擎只认游戏时钟毫秒数；测试用 ASCII 棋盘夹具与固定补落序列（见 `web/src/engine/__tests__/fixtures.ts`）。
- 报告页验收（仅开发环境）：打开 `http://localhost:5180/?report=greedy`（或 `casual` 随机走子、`zero` 零服务局；加 `&mode=fish` 看鱼关报告），刷新一次就登记并自动打完一局、直接进入报告页，走真实结算与保存；需要先在浏览器里选过一次身份，会向本地开发库写入对局记录（成绩、图鉴、局数）。生产构建不含此功能。
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
- 不修改 Supabase `public."user"` 原表的结构、数据或权限；只读该表，读写 `pet_match` schema。
- 不自行部署、修改 DNS、连接或改动 DMIT 服务器，除非用户明确要求。
