# MoeGo 毛孩子全明星：一个容器同时提供前端页面、API 与图片代理。
# 构建时传入 --build-arg GAME_VERSION="$(node web/scripts/game-version.mjs)"；见 deploy/DEPLOY.md。
# 持久数据不在应用容器里：数据在 RackNerd PostgreSQL，图片在 R2；应用容器只有可随时重建的图片缓存。

# ---------- 前端 ----------
FROM node:22-slim AS web
WORKDIR /app/web
COPY web/package.json web/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY web/ ./
ARG GAME_VERSION
RUN GAME_VERSION="$GAME_VERSION" npm run build

# ---------- 服务端打包（含 web/src/engine 等源码引用） ----------
FROM node:22-slim AS server-build
WORKDIR /app/server
COPY server/package.json server/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY server/ ./
COPY web/src /app/web/src
RUN npm run bundle

# ---------- 运行 ----------
FROM node:22-slim
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=8787 \
    STATIC_DIR=/app/public \
    OBJECT_STORE=r2 \
    IMAGE_CACHE_DIR=/var/cache/pet-match/img
WORKDIR /app
COPY server/package.json server/package-lock.json ./
# 只装生产依赖（含 sharp 的 Linux 版本）
RUN npm ci --omit=dev --no-audit --no-fund && npm cache clean --force
COPY --from=server-build /app/server/dist/ ./
COPY --from=web /app/web/dist/ ./public/
# 运行时也带上构建版本：/api/version 用它让还开着旧页面的玩家发现更新
ARG GAME_VERSION
ENV GAME_VERSION=$GAME_VERSION
RUN mkdir -p /var/cache/pet-match/img && chown -R node:node /var/cache/pet-match
USER node
EXPOSE 8787
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+process.env.PORT+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "--enable-source-maps", "server.mjs"]
