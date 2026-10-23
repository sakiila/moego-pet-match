# 部署说明（DMIT · Docker）

一个容器同时提供前端页面、API 与图片代理。持久数据不在服务器上：游戏数据在 Supabase `pet_match` schema，图片在 R2 `star` 桶；服务器只有容器、配置和可随时删除重建的图片缓存。重新部署不影响任何数据。

## 1. 构建镜像（本机）

DMIT 为 x86_64 时：

```sh
docker buildx build --platform linux/amd64 -t moego-pet-match:<版本> --load .
```

构建上下文只含 `web/` 与 `server/`（见 `.dockerignore`），`.env`、`data/`、`assets/` 与本地缓存都不会进入镜像。

## 2. 送到服务器（二选一）

- 导出后拷过去：`docker save moego-pet-match:<版本> | gzip > pet-match-<版本>.tar.gz`，服务器上 `gunzip -c pet-match-<版本>.tar.gz | docker load`。
- 或在服务器上拉取源码后直接执行上面的构建命令（需要服务器能访问 npm 源）。

## 3. 配置与启动

1. 把 `deploy/compose.yml` 与按 `deploy/production.env.example` 填好的 `production.env` 放到服务器同一目录。
2. `PET_MATCH_VERSION=<版本> docker compose up -d`
3. 检查：`curl -s http://127.0.0.1:8787/api/health` 返回 `{"ok":true}`；`docker ps` 显示 `healthy`。

## 4. 反向代理

沿用服务器现有的反向代理（Nginx / Caddy 等），只新增本站点：

- 最终域名的 HTTPS 转发到 `http://127.0.0.1:8787`。
- 请求体上限至少放宽到 **21 MB**（上传照片单张上限 20 MB）。
- 不要缓存 `/api/*`；`/assets/*` 与 `/img/*` 由应用自带缓存头。

## 5. 更新与回滚

- 更新：构建新版本镜像 → 送到服务器 → `PET_MATCH_VERSION=<新版本> docker compose up -d`。
- 回滚：用上一个版本号再执行一次。镜像保留最近两三个版本即可，旧的用 `docker image rm` 清掉。
- 数据库结构变更（`server/migrations/`）不在容器里执行，由本机 `server/scripts/supabase-setup.ts` 预览后 `--apply`。

## 6. 上线前待办

- 确认最终域名，在大陆与海外各实测一遍：身份选择、头像与宠物图片、完整一局保存、当前报告重试、刷新后读取记录、上传照片。
- Supabase 套餐与备份：免费版没有可下载的自动备份，一周无活动会暂停；需定期导出 `pet_match` 到服务器之外，并用测试数据恢复一次。
- 重启容器、重新部署后确认数据仍在。
- 记录实际 CPU、内存与磁盘用量（1 核 2 GB 为设计目标，未实测）。
