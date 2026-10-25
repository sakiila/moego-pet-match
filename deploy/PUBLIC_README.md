# MoeGo 毛孩子全明星

面向手机竖屏的宠物消消乐游戏。React + Vite + TypeScript 前端，一个 Node.js 服务同时提供网页、API 与图片代理；游戏规则引擎不依赖 DOM。

运行数据保存在 RackNerd PostgreSQL 的独立 `pet_match` 数据库与 schema，图片保存在 R2 私有桶。数据库、Slack 和对象存储凭据仅在服务端使用。公开代码不包含人员名录、宠物原图、数据库备份或运行凭据。

## 本地开发

需要 Node.js 22 与 Docker Compose。在仓库根目录启动本地 PostgreSQL：

```sh
docker compose up -d
npm ci --prefix server
npm ci --prefix web
npm run migrate --prefix server
```

分别在两个终端启动：

```sh
npm run dev --prefix server
npm run dev --prefix web
```

Vite 默认端口为 5180，API 默认端口为 8787。开发环境使用本地模拟人员和占位宠物；组件陈列页为 `/dev/gallery`。本地存储和数据不提交。

## 验证

```sh
npm test --prefix web
npm test --prefix server
npm run typecheck --prefix web
npm run typecheck --prefix server
npm run build --prefix web
npm run bundle --prefix server
bash deploy/deploy.test.sh
```

服务端测试只连接本地 PostgreSQL `pet_match_test`，端口 54329；不要让测试访问生产数据库。

## 部署

`main` 更新通过 GitHub Actions 运行检查、构建 Linux amd64 Docker 镜像，推送 GHCR，再通过 SSH 更新 RackNerd。1Panel OpenResty 反代到宿主机 `127.0.0.1:8787`。

运行变量、首次发布和回滚见 [deploy/DEPLOY.md](deploy/DEPLOY.md)。运行配置以 `production.env.example` 为模板，不要上传含其他权限的完整本机 `.env`。
