# GitHub Actions → GHCR → RackNerd → 1Panel

一个容器同时提供前端、API 和图片代理。游戏数据在 RackNerd PostgreSQL 的 `pet_match` 数据库、`pet_match` schema，图片在 R2 私有桶。应用和 PostgreSQL 通过现有 `1panel-network` 通信。

仓库：`sakiila/moego-pet-match`（公开）。镜像：`ghcr.io/sakiila/moego-pet-match`。`main` push 自动测试、构建和发布镜像；仓库变量 `DEPLOY_ENABLED=true` 时继续自动部署，也可在 Actions 手动运行 **Deploy to RackNerd**。首次准备期该变量为 false；线上迁移时临时关闭自动部署，完成切换后恢复。新的部署流程触发时，自动取消同组中正在运行或等待的旧流程；CI 按工作流和分支分组，同组只保留最新一次运行。

## 首次发布前

- 用户已确认公开完整 Git 历史与项目文件，包括设计稿、验收截图、开发示例中的真实姓名、账号头像、宠物资料和归属。不做历史重写或脱敏替换。凭据、私钥、`data/`、`assets/pets/`、缓存和本地依赖继续按忽略规则排除。
- 在服务器准备 `/app/moego-pet-match/production.env`，只包含 `production.env.example` 的运行变量，权限 `600`，目录权限 `700`。禁止复制本地完整 `.env`。
- 核验 PostgreSQL 最新迁移、应用角色权限及 R2 素材。生产维护用 `server/scripts/database.ts migrate|verify --prod`；迁移默认预览，`--apply` 执行。Actions 和容器不自动迁移数据库。
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

GHCR 使用 Actions 自带的短期 `GITHUB_TOKEN`：构建 job 为 `contents:read`、`packages:write`，部署 job 为 `contents:read`、`packages:read`。服务器通过 SSH stdin 临时登录 GHCR，登录文件随本次上传目录清除，不需要旧 registry 密码或长期 PAT。PostgreSQL、R2、Slack 凭据只在服务器，不进入 Secrets 或构建。

GHCR 新包默认可能是 private，与代码仓库公开与否分开管理。source label 将镜像关联到本仓库，使 workflow token 能拉取它；需要匿名拉取时，可在首次创建镜像后把对应 Package 的 Visibility 改为 public。依据见 [GHCR 官方说明](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)。

## 服务器运行配置

按 `production.env.example` 填入 RackNerd `pet_match` 库的专用 `pet_match_app` 角色连接、R2 桶读写凭据和可选 Slack token。值使用单引号，防止密码中的 `$` 被 Compose 插值。不要添加 `DATABASE_URL`、`DATABASE_SSL`、`OBJECT_STORE`、`HOST`、`PORT` 等覆盖镜像默认行为的变量；脚本会拒绝未知键或缺失的必填值。

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

首页版本号由 Git 自动生成，格式为 `YYYYMMDD.N`：最新提交的北京时间日期，加 first-parent 主线中同日提交数。CI 拉取完整历史，计算后通过 `GAME_VERSION` 构建参数传给 Docker；同一提交重复构建版本不变，不需要修改版本文件。Dockerfile 同时把它写成运行阶段的 `ENV GAME_VERSION`，服务端 `/api/version` 据此返回当前版本（与引擎规则版本一起），首页发现与页面不一致就提示刷新；不要在 `production.env` 里覆盖它。无完整 Git 历史且未显式提供版本时构建会报错，避免生成错误序号。

本地查看版本：`npm --prefix web run game-version`。本地开发在启动时读取版本，运行中提交后重启 `npm run dev` 即可更新。本地构建镜像使用：

```sh
docker buildx build --platform linux/amd64 \
  --build-arg GAME_VERSION="$(node web/scripts/game-version.mjs)" \
  -t moego-pet-match:<版本> --load .
```

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

组件与素材陈列页：`https://star.baobo.me/dev/gallery`，无需选择游戏身份。左侧选择组件，顶部切换语言、主题和预览宽度；`?c=Icon` 可直接打开图标库，`?c=组件名&state=状态名` 可单独预览指定状态。陈列页按需加载，使用各组件的示例数据，游戏 API 调用会在客户端阻止；图片仍经 `/img/` 读取。游戏首页的 `?report=`、`?preset=` 等验收功能仍仅在开发环境生效。

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

## 独立数据库与本地运维

生产连接：`postgresql://pet_match_app:<密码>@postgresql:5432/pet_match?sslmode=disable`。`sslmode=disable` 仅用于同机 Docker 内网；远程管理通过 SSH 隧道，不开放额外公网端口。数据库所有者为 `pet_match_owner`，应用角色只有运行需要的查询、插入与更新权限。不要向应用容器提供管理员连接。

同事信息直接从 Slack `users.list` 过滤：只接受 `@moego.pet` 邮箱，排除停用、机器人、Slackbot 与明确列出的公共账号（见 `server/src/services/slackDirectory.ts`），访客也适用同样限制。启动时和每五分钟刷新 `pet_match.slack_members`，不再符合条件的已有账号标记为停用、保留历史记录；一次同步在单个事务完成，空目录、分页不完整或请求失败不会清空已保存名单。`pet_match.colleagues` 仅展示有效账号。`public."user"` 不迁移，也不再用于运行时查询。

本机 `.env` 的 `PET_MATCH_ADMIN_DATABASE_URL` 指向 SSH 隧道，不能再通过旧 JDBC/Supabase 配置维护生产。先保持隧道运行：

```sh
ssh -N -L 15432:127.0.0.1:5432 racknerd
```

另一个终端在 `server/` 下执行：

```sh
npx tsx --env-file-if-exists=../.env scripts/database.ts verify --prod
npx tsx --env-file-if-exists=../.env scripts/database.ts migrate --prod
# 核对预览后执行同一命令并加 --apply
```

以上迁移命令用于维护已初始化的独立库；空库从经过核验的独立库备份恢复，不运行旧 Supabase 人员表初始化流程。数据迁移、校验和恢复依据见 [DATABASE_MIGRATION.md](DATABASE_MIGRATION.md)。

数据库每日备份已安装为 `moego-pet-match-db-backup.timer`，北京时间 04:10 运行、保留约 14 天；脚本与单元文件见 `deploy/backup-database.sh`、`deploy/systemd/`，安装和恢复步骤见 DATABASE_MIGRATION。应用发布不重置备份或数据库。
