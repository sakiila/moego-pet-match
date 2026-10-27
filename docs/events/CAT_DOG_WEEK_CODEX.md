# 猫派 vs 狗派周 · Codex 执行单

日期：2026-10-27
读者：本地 Codex（由 Bob 在 `/Users/bob/WebstormProjects/moego-pet-match` 运行）
目标：替换占位素材 → 执行生产数据库迁移 → 合并上线。活动从 10-27 开始，到 11-02 结束，越早上线越好。

## 0. 先读这些

1. 本仓库 `AGENTS.md`：图片任务、素材授权、数据库与推送 main 的约定。
2. [CAT_DOG_WEEK.md](CAT_DOG_WEEK.md)：完整规则与实现说明（第 14 节）。
3. [assets/icons/catdog-week-original-v1/README.md](../../assets/icons/catdog-week-original-v1/README.md)：素材清单与生图提示词。
4. `deploy/DEPLOY.md` 中「生产连接」到迁移命令一段：SSH 隧道与 `database.ts migrate|verify --prod`。

## 1. 现状

- 功能代码在分支 **`docs/cat-dog-week`**（已合入截至 `17b9c3b` 的 main），还没进 main。
- 图标是代码生成的占位图，母版在 `assets/icons/library-original-png-v2/masters/20-catdog-week/`，共 8 个文件。
- 新迁移 **`server/migrations/023_faction_week.sql`**：新建 `faction_members`、`faction_contributions`、`faction_results`，并在 `achievement_awards` 的 id 约束里加入 `meowchamp26`、`woofchamp26`。main 上的 `022_live_play_ai.sql` 如果生产还没执行，会一起列出。
- 代码对 023 未执行有保护：表不存在时活动整体隐藏，开局与结算照常。所以迁移和部署的先后不会让游戏出错，但**迁移完成前活动不可见**。

## 2. 拉取分支并本地验证

```sh
git fetch origin
git checkout docs/cat-dog-week
docker compose up -d                      # 本地 Postgres，端口 54329
(cd web && npm ci && npm run typecheck && npm test)
(cd server && npm ci && npm run typecheck && npm test)
```

通过标准：web 全部通过。server 只允许 `identity.test.ts`「数据库不可用时返回 503」这一条失败（云端容器里分支前后都失败，属于环境差异）；若本机这条也通过更好。任何其他失败先停下报告，不要继续。

## 3. 设计：生成并替换素材

按 [README](../../assets/icons/catdog-week-original-v1/README.md) 中的提示词，用内置 `image_gen` 生成，遵守 AGENTS.md 的图片约定：

- 对照稿：`design/concepts/catdog-week-icons-v1.png` 和 `design/concepts/catdog-week-icons-v1-prompt.txt`，不覆盖已有文件。
- 4 个图形提取成 1024 × 1024 透明 PNG，覆盖 `masters/20-catdog-week/` 的 8 个占位文件。两枚冠军徽章各存三份同图：`title-<id>.png`、`-avatar.png`、`-showcase.png`。
- 文件名必须不变，代码只按名字引用。
- 记录写入 `assets/icons/catdog-week-original-v1/manifest.json`：原图、提取方法、每个文件的 sha256。
- 导出：`python3 assets/icons/library-original-png-v2/export_web.py --group 20-catdog-week`。

检查：

1. `git diff --stat web/src/ui/icons/catalog.ts` 只涉及 `faction-cat`、`faction-dog`、`title-meowchamp26*`、`title-woofchamp26*`。
2. `cd web && npm run dev`，在 390 × 844 下打开：
   - `/dev/gallery?c=FactionCard`
   - `/dev/gallery?c=FactionJoinSheet`
   - `/dev/gallery?c=FactionDetail`
   - `/dev/gallery?c=FactionTag`
   - `/dev/gallery?c=HomeScreen&state=faction%20week%20·%20joined%20cat%20%2B%20streak`

   18 px（报告标签）下要能分清猫和狗；72 px（选边卡）下不能模糊或有白边。
3. 把对照稿和两三张截图给 Bob 看，**Bob 选定后**再继续。选定后在 `design/DESIGN_NOTES.md`「选定展示文件」加一行。
4. 在分支上提交：母版、`web/src/ui/icons/png/`、`catalog.ts`、对照稿与 prompt、manifest、DESIGN_NOTES。

## 4. 迁移：生产数据库

需要 Bob 本机的 `.env` 和 SSH 配置。

```sh
ssh -N -L 15432:127.0.0.1:5432 racknerd          # 终端 A，保持运行
cd server                                        # 终端 B
npx tsx --env-file-if-exists=../.env scripts/database.ts migrate --prod          # 只预览
```

预览里应只有 `023_faction_week`，可能还有 `022_live_play_ai`。如果出现其他版本，或预览报错，停下报告。核对无误后：

```sh
npx tsx --env-file-if-exists=../.env scripts/database.ts migrate --prod --apply
npx tsx --env-file-if-exists=../.env scripts/database.ts verify --prod
```

`verify` 必须通过，它会检查应用角色对三张新表有权限。不要连接或改动 1Panel，也不要动服务器上的其他内容。

## 5. 上线（需 Bob 明确同意）

推送 main 等于部署到 `https://star.baobo.me`。按 AGENTS.md，**先问 Bob「可以推 main 上线吗？」，得到明确同意后再执行**：

```sh
git checkout main && git pull origin main
git merge --no-ff docs/cat-dog-week               # 有冲突先停下报告；不要 rebase 或 force push
(cd web && npm run typecheck && npm test) && (cd server && npm run typecheck && npm test)
git push origin main
gh run list --workflow deploy.yml --limit 1       # 等到 completed / success
```

部署后冒烟检查：

- `curl -s https://star.baobo.me/api/version` 返回新版本。
- `curl -s -o /dev/null -w '%{http_code}' 'https://star.baobo.me/api/faction?playerId=x'` 返回 401 或 404，**不能是 500**。返回 500 通常说明迁移没执行或权限不对。
- 手机浏览器登录：首页出现「猫派 vs 狗派周」卡 → 选边 → 打一局普通局 → 报告出现「为喵派 +N」→ 首页积分增加。

## 6. 不要做的事

- 不改规则常量（`web/src/game/factionWeek.ts`）和活动日期，除非 Bob 要求。
- 不发 Slack，不加机器人权限。
- 不手改 `catalog.ts`，只用导出脚本。
- 不提交 `.env`、照片或 `/data/`。

## 7. 回报给 Bob

- 选定的素材对照稿路径和截图。
- 迁移预览和 `--apply` 输出的版本列表，以及 `verify` 结果。
- 部署运行编号、结果和冒烟检查结果。
- 任何跳过或失败的步骤。
