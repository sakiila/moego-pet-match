# 玩家名片自家宠物 · 实现计划

用户于 2026-10-26 选择第 1 稿。沿用当前 checkout，在独立功能分支实现；仅本地验证，不推送 main 或部署。

目标：成绩下方、徽章上方显示被查看玩家的已上架宠物，双列卡片；按查看者自己的收集状态选择贴纸或剪影。看自家宠物始终显示完整贴纸，收集标记保持真实。

## 1. 只读查询

- [x] 先新增 `server/__tests__/player-pets.test.ts`，验证 `/api/players/:id/pets?viewerId=...` 的归属过滤、上架过滤、查看者收集状态、空列表、双方身份校验、参数校验、只读和详情权限。先运行并确认新端点返回 404。
- [x] `web/src/api/types.ts` 新增 `PlayerPet = { petId: string; name: string; collected: boolean }`，不返回申请记录、原图键、主人说或其他玩家的图鉴。
- [x] `server/src/services/playerPets.ts` 按 `p.owner_user_id=$1 AND p.status='published'` 查询，`collections.player_id=$2` 决定 collected；按宠物名、petId 稳定排序。复用现有 owner 索引，无需迁移。
- [x] `server/src/routes/players.ts` 校验 viewerId 非空与双方名单资格，返回 `{ pets }`；前端 client 添加可取消的只读查询。
- [x] 运行新增及原玩家名片测试，确认通过。

## 2. 双列分区和弹层

- [x] 先写分区展示测试，覆盖两种状态、自己未收集仍显示贴纸、中英文、长名称、加载、空和错误；运行确认尚未实现。
- [x] 新增 `components/PlayerPets/`（组件、tokens 样式、测试和 gallery），全数据通过 props 传入，使用现有 Icon 和正式宠物素材。标题、数量、查看者收集进度和提示通过 i18n。
- [x] `PlayerProfileCard` 在 stats 和 badges 之间增加宠物分区 slot，保留现有对局表格。
- [x] `PlayerProfileOverlay` 独立读取宠物、独立重试，复用 usePetDetail。上层详情期间暂停名片 Escape，保持名片挂载和滚动。为 Sheet 增加可选 suspended 状态（inert、aria-hidden、停止 Escape），为详情增加仅此入口启用的 aboveSheet 层级。
- [x] 名片入口不提供删除申请；未收集详情仍可开始营业。Home / Leaderboard 传入相应开局回调，gallery 注入全部示例 loader，不调用游戏 API。
- [x] 补齐组件与完整名片 gallery 状态、交互预览，运行相关测试和两端类型检查。

## 3. 验收和文档

- [x] 在 390 × 844 下核对已选定图稿，验证点开、翻面、Escape 只关上层、点背景、原位返回；检查自己未收集、他人未收集、英文长名、空、错误、加载和鱼关主题。
- [x] 使用本地接口验证真实列表与详情权限；浏览器陈列页不发送 `/api` 请求。
- [x] 跑 web/server 测试、类型检查与 web build，修复本任务引入的问题；独立审查新增改动。
- [x] 更新 GAME_FLOW、UI_COPY、DESIGN_NOTES 和本目录 QA，记录设计差异和实际运行结果。

设计边界：允许从名片揭晓主人与宠物归属，现有图鉴搜索范围不改；照片与主人说权限不扩展；查看不产生收集或成就；不新增对局详情、查看全部或生成稿下缘的收集比例。
