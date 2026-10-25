# 举爪击掌点赞实施计划

日期：2026-10-26。用户已选定举爪击掌原稿，明确授权原图切图、透明 PNG、实现、测试及推送上线；点赞永久不可取消。

**Goal:** 玩家可以给其他玩家永久点赞一次，并在自己的首页头像旁查看收赞数。

**Architecture:** 单独的点赞关系表和只增不删的 API；数据库唯一约束保证幂等。点赞状态独立于对局模式和现有名片数据，避免改动既有成绩与称号逻辑。前端复用一个只读数量组件及一个点赞栏，以 props 传入状态；请求编排放 hook 和页面层。

**Tech Stack:** PostgreSQL、Fastify、React、TypeScript、PNG 图标目录、Vitest、本地浏览器。

## 文件与任务

- [x] 从 `design/concepts/player-likes-high-five-v1.png` 的主举爪图提取透明 PNG，记录裁切框与源图 SHA256。母版进入 `assets/icons/library-original-png-v2/masters/17-player-likes/`，原图及处理脚本进入 `assets/icons/player-likes-original-v1/`。更新统一导出和 Icon catalog，所有 UI 使用 Icon。
- [x] 先为 `server/__tests__/playerLikes.test.ts` 写缺失功能测试并执行红灯：首次、重复、20 个并发、不同来源、互相点赞、自己点赞、无效身份、跨模式保持、DELETE 不生效。
- [x] 添加 `server/migrations/017_player_likes.sql`、`server/src/services/playerLikes.ts` 及玩家路由。表上使用来源和目标唯一约束、禁止自己点赞 CHECK、目标索引；不暴露撤销或清除 API。
- [x] `GET /api/players/:id/likes?viewerId=...` 与 `POST /api/players/:id/likes`（body `{playerId}`）统一返回 `{receivedLikes:number, likedByViewer:boolean, canLike:boolean}`。自己不可赞；未知或停用身份拒绝。插入冲突忽略并在提交后读取权威总数；不维护独立可漂移计数。
- [x] 前端添加 `PlayerLikesView`、API 方法、带请求锁及过期响应隔离的 hook；点赞成功前不加数。页面重新获得焦点时刷新，失败可重试，已赞永远不能再提交或取消。
- [x] 名片身份区下插入收赞栏；自己的名片只读。首页头像左侧放只读数量入口，点击打开自己的名片。未加载显示占位，不冒充 0；保留现有头像菜单和称号徽章。
- [x] 添加中英文文案、tokens 和陈列页：未赞、已赞、自己、0、大数、加载、失败、英文和长姓名。补充必要的请求并发、重试与状态隔离测试。
- [x] 运行 web 与 server 全部测试、typecheck、web build；审查功能、幂等和原图忠实度。独立浏览器在 390 × 844 下验收真实点赞、刷新持久化、自己的只读状态及中英文陈列页。
- [x] 同步 V1_RULES、GAME_FLOW、UI_COPY、DESIGN_NOTES 和 AGENTS 的本次图标授权。仅提交当前工作区的点赞改动。
- [ ] 再 fetch 核对远端 main；无覆盖地推送本次提交至 main，检查 Deploy to RackNerd workflow 完成和线上只读探测。生产不创建测试点赞。

## 验证命令

`cd server && npm test && npm run typecheck`，预期全部通过；`cd web && npm test && npm run typecheck && npm run build`，预期全部通过。幂等测试必须查询真实本地 PostgreSQL 的关系行数，不能只检查按钮禁用或 mock 返回。并发验证同一对身份最终只有一行，首次与重试后的数量均为 1；DELETE 请求失败后数量保持。

## 执行边界

原项目主目录有其他未提交改动，本次使用干净的独立 worktree；不复制或发布其他改动。实现分工为后端、前端两个互不编辑对方目录的任务，主任务处理素材、集成、审查与发布。已有授权不重复确认；仅在真实且无法自主消除的阻碍发生时报告。

## 本轮验证记录

- 前端完整测试：312 项 Vitest 与 8 项版本测试通过，typecheck 与生产 build 通过；构建仍有既有大 chunk 提示。
- 服务端完整测试：233 项 Vitest 与 5 项 Node 测试通过，typecheck 通过；新增 24 项真实 PostgreSQL 测试。
- 幂等覆盖 30 个同向并发、两个独立应用与连接池、未提交冲突等待后重读、重复请求、互相点赞、跨模式共享；数据库行数仍为一条。DELETE/PATCH 不改变数据，应用角色不能 UPDATE/DELETE/TRUNCATE。
- 390 × 844 真实浏览器：未赞 0 → 点赞成功 1 → 刷新后仍为 1 且按钮禁用；收赞者重新选择身份后首页显示 1；本人名片只读，菜单和称号不被遮挡。
- 英文与陈列页：单复数、大数换行、加载、发送中、已赞、自己、读取失败和发送失败状态已打开检查。静态截图保留在临时验收目录，不将真实玩家截图提交到公开仓库。
- 原图副本 SHA256 匹配；透明母版不透明主体 RGB 保持一致。未赞图切至按钮上方，避免带入一条相邻按钮边线。
- 生产迁移 017 已先于代码发布执行；只读核验确认唯一键、自赞 CHECK 及应用角色仅 SELECT/INSERT。未向生产写入测试点赞。
- 需求符合性与代码质量审查均通过；推送和 Actions 部署结果须单独核验。
