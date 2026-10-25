# RackNerd 部署与数据库准备

日期：2026-10-25。用户已确认公开完整 Git 历史和项目文件，包括真实姓名、账号头像、宠物资料与归属。凭据、私钥与被忽略的原始工作数据继续排除；本次不使用脱敏快照或改写历史。

## 当前已就绪（2026-10-25）

- 公开仓库 `sakiila/moego-pet-match`，镜像 `ghcr.io/sakiila/moego-pet-match`。
- main 自动测试、构建 amd64 镜像并推送 GHCR；SSH 更新应用使用 digest、严格主机校验和故障回滚。
- 生产入口 `https://star.baobo.me` 已上线，`DEPLOY_ENABLED=true`；main 后续更新按发布流程自动部署。维护时如需暂停发布，完成后恢复开关。
- RackNerd 为 Debian x86_64、Docker 27.3.1、Compose 2.29.7；python3 和 flock 已安装。
- `/app/moego-pet-match` 权限 700，运行配置 `production.env` 权限 600，应用容器已运行。
- OpenResty 使用 host 网络，代理目标 `http://127.0.0.1:8787`。
- GitHub 的 HOST、HOST_USERNAME、HOST_KNOWN_HOSTS 与 HOST_SSHKEY 已接通发布链路。
- PostgreSQL 18.4 使用独立 `pet_match` 数据库与 schema，迁移 001–016 已执行。应用角色 `pet_match_app` 经 `1panel-network` 连接，管理员角色为 `pet_match_owner`。
- 名册由 Slack 初始化并每五分钟同步，原 `public."user"` 未迁移；历史成绩、收集、称号及上传数据已逐表核验。
- 数据库每日北京时间 04:10 备份，保留约 14 天；恢复测试通过，本次迁移另存本机副本。图片继续存 R2。
- 完整历史与当前未忽略文件已做常见 token、私钥、连接串和硬编码凭据扫描，未发现真实凭据；包含的个人资料已获用户明确公开确认。

## 后续维护与发布前

1. 先合并最新 main，保留本地未提交工作；运行与改动匹配的测试、类型检查及构建。
2. 数据库维护使用 `server/scripts/database.ts migrate|verify --prod`；本机管理员连接经 15432 SSH 隧道，迁移先预览，确认后才加 `--apply`。应用与 Actions 不自动迁移数据库。
3. 保持 1Panel 的 HTTPS、回环反代与 25m 上传上限，API 不缓存。应用发布不修改其他站点或数据库。
4. 发布后核验身份、图片、结算及健康检查；涉及数据库变更时核验备份与恢复路径。具体步骤见 DEPLOY 与 DATABASE_MIGRATION。

操作说明见 DEPLOY.md；公开范围与文件清单见 PUBLIC_FILE_LIST.md 和 public-files.json。最终校验与推送结果以交付说明和 GitHub Actions 为准。
