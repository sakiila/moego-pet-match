# RackNerd 部署准备

> 本文记录首次部署准备时的状态。2026-10-25 已上线；数据库迁移后的当前配置以 [DEPLOY.md](DEPLOY.md) 和 [DATABASE_MIGRATION.md](DATABASE_MIGRATION.md) 为准。

日期：2026-10-25。用户已确认公开完整 Git 历史和项目文件，包括真实姓名、账号头像、宠物资料与归属。凭据、私钥与被忽略的原始工作数据继续排除；本次不使用脱敏快照或改写历史。

## 已准备

- 公开仓库 `sakiila/moego-pet-match`，镜像 `ghcr.io/sakiila/moego-pet-match`。
- main 自动测试、构建 amd64 镜像并推送 GHCR；SSH 更新应用使用 digest、严格主机校验和故障回滚。
- 准备期 `DEPLOY_ENABLED=false`；上线条件就绪后设为 true，后续 main 更新自动部署。
- RackNerd 为 Debian x86_64、Docker 27.3.1、Compose 2.29.7；python3 和 flock 已安装。
- `/app/moego-pet-match` 权限 700，运行配置 production.env 权限 600；未启动应用。
- OpenResty 使用 host 网络，代理目标 `http://127.0.0.1:8787`。
- GitHub 已配置 HOST、HOST_USERNAME、HOST_KNOWN_HOSTS；HOST_SSHKEY 由用户设置。
- 完整历史与当前未忽略文件已做常见 token、私钥、连接串和硬编码凭据扫描，未发现真实凭据；包含的个人资料已获用户明确公开确认。

## 首次上线前

1. 用户设置 HOST_SSHKEY，对应公钥能登录目标 root 用户。
2. 预览并确认应用生产 010_slack_members、011_submission_owner_quote、012_quiz_bonus、013_collection_achievements、014_daily_board 五项迁移及应用角色授权。当前只做了 dry-run，未执行 --apply。
3. 在 1Panel 配置 star.baobo.me 的反代与 HTTPS，上传上限 25m，API 不缓存。准备时公网 HTTPS 返回 Cloudflare 525；未改 DNS 或启用反代。
4. 核验 RackNerd 到 Supabase/R2/Slack 的真实业务链路，再开启 DEPLOY_ENABLED。

操作说明见 DEPLOY.md；公开范围与文件清单见 PUBLIC_FILE_LIST.md 和 public-files.json。最终校验与推送结果以交付说明和 GitHub Actions 为准。
