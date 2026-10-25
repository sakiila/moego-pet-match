# RackNerd PostgreSQL 迁移

日期：2026-10-25。用户授权检查、设计并一次性完成迁移；明确不迁移 `public."user"`。

## 目标与设计

复用 1Panel 管理的 PostgreSQL 18.4，新建独立数据库 `pet_match`，保留 `pet_match` schema。原有 15 张游戏表完整迁移，旧 `colleagues` 视图不恢复；迁移 016 将其改为读取游戏自己的 Slack 名册。人员信息只从 Slack `users.list` 初始化，生产运行时每五分钟完整刷新。参与资格沿用原视图：排除停用、机器人和不满足工作区或 MoeGo 邮箱条件的账号，保留有效工作区访客。请求失败或目录为空时保留最后一次可用名单。

应用使用 `pet_match_app` 最小权限角色；数据库所有者为 `pet_match_owner`。应用和数据库加入现有 Docker 内网，通过 `postgresql:5432` 通信，连接串明确 `sslmode=disable`；不新增公网端口。图片继续使用现有 R2 对象键。

Supabase 上的源表、人员表和应用权限均不修改。切换前暂停游戏应用写入，导出同一份游戏快照，恢复后逐表核对行数和内容摘要；再执行 016、初始化 Slack 名册和权限、切换连接并启动服务。保留旧环境、旧镜像、原库和只读备份供恢复；新库开放写入后如需回切，必须先回收新产生的数据，不能直接切回旧库。

## 实施计划

- [x] 服务端基线验证；增加独立名册的失败回归测试，覆盖原人员表缺失、停用账号不回填、完整同步、空名单和 Slack 失败。
- [x] 新增 `016_standalone_directory.sql`：名册启用状态、同步时间、独立视图及中文表注释；本地测试/开发使用本地种子填充名册。
- [x] `players.ts` 改从游戏名册识别已登记账号；复用现有 Slack 分页与过滤，增加完整列表和事务同步；生产启动和五分钟定时刷新，退出时清理定时器。
- [x] 运维脚本 `--prod` 使用显式 `PET_MATCH_ADMIN_DATABASE_URL`，避免继续默认操作 Supabase；Compose 加入数据库内网，更新运行示例及部署文档。
- [x] 运行服务端测试、类型检查、打包和部署脚本验证；仅提交本轮文件，与用户现有前端改动隔离。
- [x] 创建非超级用户数据库并同步到 1Panel；备份运行配置，导出/恢复游戏数据，比较 15 张表；应用新迁移与最小权限，初始化 Slack 名册。
- [x] 在部署锁保护下完成最终停写快照、校验和连接切换；验证身份、排行、图鉴、已有对局、可回滚的真实结算、图片与上传路径。
- [x] 保存独立备份、迁移核验结果与恢复步骤；更新本地生产运维连接，确认 1Panel 可以看到新库。

## 验收依据

迁移前后全部游戏表在应用 016 前行数、内容摘要相同；016 以后仅 `schema_migrations` 和 Slack 名册因结构与同步发生预期变化。目标库不存在 `public."user"`；视图不引用该表；应用和运维连接指向 RackNerd。结算事务与身份边界由本地集成测试和目标库回滚冒烟共同验证。数据库备份存于受限目录，并另存一份到本机被忽略的 `data/migrations/`。

## 2026-10-25 执行结果

北京时间 17:03:23 完成数据库切换。切换快照包含 80 条宠物、28 个对局、19 份结算、70 条收集、12 条成就授予和 1 份上传；全部 15 张表的行数与内容摘要逐一相同。随后只在目标库执行 016，写入 15 张表、1 个视图的中文注释。目标库没有 `public."user"`，Supabase 源数据与权限均保留。

生产应用账号 `pet_match_app` 已跑通真实开局、结算与回滚；运行时连接方式经实际连接验证。新库上传事务和 R2 写入、逐字节回读成功，临时记录和对象已清理。HTTP 验收覆盖身份、名单、未知身份拒绝、排行、图鉴及玩家名片。源名单包含有效单频道访客，独立名册沿用原工作区/邮箱条件，避免迁库收紧参与资格；本地样例身份不运行生产全量同步。服务端 147 项测试、类型检查、打包及 9 项部署测试通过。

兼容更新上线后，Slack 独立名册为 158 人，5 位已有对局玩家全部可识别；应用账号无建表权限。正式 HTTPS 健康检查，以及宠物贴纸、剪影、鱼、Slack 头像和卡背照片均返回 200。前后端 CI 与 amd64 镜像构建通过，自动部署开关已恢复。

切换由 systemd 监督，持有部署锁；先停写、导出并比较源库前后摘要，再恢复和比较目标。新版本在回环端口 18787 验证通过后开放正式 8787 端口。开放前失败会同时恢复旧环境、镜像与编排；开放后以新库为准向前恢复，避免丢掉新成绩。源管理员凭据及临时目标凭据已从服务器清除。

迁移备份、原运行配置、最终逐表摘要和成功记录存于服务器 `/app/moego-pet-match/db-migration-20261025/`（目录 700、敏感文件 600）。当前库另由每日备份保存，并下载一份到本机被忽略的 `data/migrations/racknerd-20261025/`。含资料的归档或凭据不得提交到 Git。

## 备份与恢复

生产已安装 `deploy/backup-database.sh` 与 `deploy/systemd/` 中的服务、定时器：北京时间每日 04:10 备份独立库，保留约 14 天，目录 `/app/moego-pet-match/db-backups/`。归档保留应用授权，不包含集群角色密码。备份已实际恢复到临时独立数据库，验证 15 张表、宠物记录、应用读取权限及原人员表缺失后删除临时库。

安装命令在目标服务器执行：

```sh
install -m 700 deploy/backup-database.sh /app/moego-pet-match/backup-database.sh
install -m 644 deploy/systemd/moego-pet-match-db-backup.service /etc/systemd/system/
install -m 644 deploy/systemd/moego-pet-match-db-backup.timer /etc/systemd/system/
systemctl daemon-reload
systemctl enable --now moego-pet-match-db-backup.timer
systemctl start moego-pet-match-db-backup.service
```

重建时先建立 `pet_match_owner`、`pet_match_app` 两个非超级用户角色和专用数据库，密码从受限配置恢复。使用迁移后的独立库备份，以 `--role=pet_match_owner --no-owner --single-transaction --exit-on-error` 恢复；归档中的应用权限会一并恢复。应用通过内网主机名 `postgresql` 访问；本机运维需先开 15432 SSH 隧道。重新上线前运行 `scripts/database.ts verify --prod`，并验证真实接口。

Supabase 源归档是切换时的恢复依据，包含依赖原人员表的历史视图；不能把它当作独立库日常恢复包。生产开放后产生的新数据以 RackNerd 备份为准，不能直接改回旧 Supabase 连接。
