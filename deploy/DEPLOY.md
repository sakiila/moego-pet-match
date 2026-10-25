# GitHub Actions → GHCR → RackNerd → 1Panel

一个容器同时提供前端、API 和图片代理。游戏数据在 Supabase `pet_match` schema，图片在 R2 私有桶，RackNerd 只保留配置和可重建的图片缓存。

仓库：`sakiila/moego-pet-match`（公开）。镜像：`ghcr.io/sakiila/moego-pet-match`。`main` push 自动测试、构建和发布镜像；仓库变量 `DEPLOY_ENABLED=true` 时继续自动部署，也可在 Actions 手动运行 **Deploy to RackNerd**。准备期该变量为 false，服务器不启动应用。部署 job 串行执行，不中断进行中的部署。

## 首次发布前

- 用户已确认公开完整 Git 历史与项目文件，包括设计稿、验收截图、开发示例中的真实姓名、账号头像、宠物资料和归属。不做历史重写或脱敏替换。凭据、私钥、`data/`、`assets/pets/`、缓存和本地依赖继续按忽略规则排除。
- 在服务器准备 `/app/moego-pet-match/production.env`，只包含 `production.env.example` 的运行变量，权限 `600`，目录权限 `700`。禁止复制本地完整 `.env`。
- 核验 Supabase 最新迁移、应用角色权限及 R2 素材。仍使用 `server/scripts/supabase-setup.ts` 预览，核对后才 `--apply`，用 `supabase-verify.ts` 核验。Actions 和容器不自动迁移数据库。
- 游戏域名为 `star.baobo.me`，完成解析、1Panel 独立站点和 HTTPS。

准备时只读核查的目标机为 Debian x86_64、Docker 27.3.1、Compose 2.29.7，已安装 `python3`、`flock`。OpenResty 使用 host 网络，8787 当时空闲；首次发布前再核对变化。

## GitHub Actions 配置

在 **Settings → Secrets and variables → Actions** 配置四个 Secrets，也可放在 `production` Environment 的同名 Secrets 中：

| Secret | 内容 |
|---|---|
| `HOST` | RackNerd SSH 地址 |
| `HOST_USERNAME` | 有部署目录和 Docker 权限的 SSH 用户 |
| `HOST_SSHKEY` | 项目专用、无口令的 OpenSSH 私钥 |
| `HOST_KNOWN_HOSTS` | 通过可信渠道核验、与 HOST 匹配的 SSH 主机公钥记录 |

SSH 默认端口为 22，可通过 Repository Variable `HOST_PORT` 修改。非默认端口的 known_hosts 使用 `[host]:port` 格式。私钥只用于此项目，公钥安装到服务器对应用户的 `authorized_keys`。不要在流水线中用未经核验的 `ssh-keyscan` 替代主机身份校验。

首次上线前先完成 `HOST_SSHKEY`、生产数据库迁移与 1Panel HTTPS/反代，再把 Repository Variable `DEPLOY_ENABLED` 设为 `true`。之后每次 main 更新都会自动部署；需要部署已经构建的当前 main 时，手动运行一次 workflow。

GHCR 使用 Actions 自带的短期 `GITHUB_TOKEN`：构建 job 为 `contents:read`、`packages:write`，部署 job 为 `contents:read`、`packages:read`。服务器通过 SSH stdin 临时登录 GHCR，登录文件随本次上传目录清除，不需要旧 registry 密码或长期 PAT。Supabase、R2、Slack 凭据只在服务器，不进入 Secrets 或构建。

GHCR 新包默认可能是 private，与代码仓库公开与否分开管理。source label 将镜像关联到本仓库，使 workflow token 能拉取它；需要匿名拉取时，可在首次创建镜像后把对应 Package 的 Visibility 改为 public。依据见 [GHCR 官方说明](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)。

## 服务器运行配置

按 `production.env.example` 填入专用 `pet_match_app` 角色连接、R2 桶读写凭据和可选 Slack token。值使用单引号，防止密码中的 `$` 被 Compose 插值。不要添加 `DATABASE_URL`、`DATABASE_SSL`、`OBJECT_STORE`、`HOST`、`PORT` 等覆盖镜像默认行为的变量；脚本会拒绝未知键或缺失的必填值。

```sh
install -d -m 700 /app/moego-pet-match
chmod 600 /app/moego-pet-match/production.env
```

R2 桶默认 `star`，当前为默认 jurisdiction，不设置 `R2_JURISDICTION`。

| 文件 | 用途 |
|---|---|
| `production.env` | 运行凭据，更新应用时保留 |
| `compose.yml`、`deploy.sh` | 当前已成功发布的配置与脚本 |
| `release.env` | 当前镜像 digest、端口、内存限制 |
| `compose.yml.previous`、`release.env.previous` | 上一成功版本 |
| `incoming-<run>-<attempt>/` | 候选文件与短期登录配置，结束后清除 |

默认回环端口 `8787`、内存上限 `512m`、图片缓存上限约 1.5 GB、日志最多 3 × 10 MB。Compose project `moego-pet-match` 隔离其他应用；缓存卷不随更新删除，Watchtower 自动更新已关闭。

## 部署顺序

1. 在本地 Postgres service 上运行前后端测试、类型检查和生产构建。
2. 构建 `linux/amd64` 镜像并推送 GHCR；tag 含 commit、run ID 和 attempt，实际按 digest 部署。
3. 上传候选 Compose 和脚本到独立 `incoming` 目录，校验运行变量。
4. 先拉镜像；失败时运行中的版本保持原状。
5. 更新本项目容器，用 `docker compose up --wait --wait-timeout 120` 等待健康状态。
6. 成功后保存新发布信息；失败时用原镜像和原 Compose 恢复。首次无旧版时，移除失败容器、保留缓存卷，Actions 标记失败。

不运行全机 `prune`，不重启 OpenResty，不修改其他 Compose project。

## 1Panel 反向代理

当前 1Panel：**网站 → 创建网站 → 反向代理**，建立独立站点：

- 主域名：`star.baobo.me`。
- 代理地址：`http://127.0.0.1:8787`，覆盖整个 `/`，包含 `/api/`、`/img/`。
- HTTPS：配置证书并启用 HTTPS 跳转。
- 上传上限：至少 21 MB，建议站点 `server` 级设置 `client_max_body_size 25m;`。
- 代理 `location` 中读取和发送超时建议均为 120 秒。
- 关闭反代缓存；API 不缓存，静态资源与图片保留应用返回的缓存头。

通过 1Panel 检查配置后重载。8787 不需要向公网开放。

## 检查与回滚

```sh
cd /app/moego-pet-match
docker compose --env-file release.env ps
curl --fail --max-time 5 http://127.0.0.1:8787/api/health
docker compose --env-file release.env logs --tail 100 pet-match
```

健康检查只验证 HTTP 与数据库 `SELECT 1`，不能替代迁移、R2 和 Slack 核验。还须通过最终 HTTPS 域名验证身份选择、头像/宠物图片、完整一局保存、刷新读取和照片上传。

自动回滚处理一次发布失败。手动恢复上一成功版本时，在服务器 Bash 中执行，以保留该版本的端口、内存和 Compose：

```bash
(
  set -euo pipefail
  cd /app/moego-pet-match
  previous_image=$(sed -n 's/^PET_MATCH_IMAGE=//p' release.env.previous)
  previous_port=$(sed -n 's/^PET_MATCH_PORT=//p' release.env.previous)
  previous_memory=$(sed -n 's/^PET_MATCH_MEMORY=//p' release.env.previous)
  test -n "$previous_image"
  rollback_dir=$(mktemp -d "$PWD/rollback.XXXXXX")
  trap 'rm -rf -- "$rollback_dir"' EXIT
  cp compose.yml.previous "$rollback_dir/compose.yml"
  cp deploy.sh "$rollback_dir/deploy.sh"
  PET_MATCH_PORT="$previous_port" PET_MATCH_MEMORY="$previous_memory" \
    bash "$rollback_dir/deploy.sh" "$previous_image" "$PWD"
)
```

需重新拉取 private 镜像时应先登录 GHCR，或把 Package 设为 public。镜像回滚不撤销数据库迁移；破坏性迁移需单独设计兼容与恢复步骤。

本地验证：`bash deploy/deploy.test.sh`、actionlint、shellcheck、Compose config 和完整 amd64 构建。真实 SSH/GHCR/1Panel 链路在首发时验证。
