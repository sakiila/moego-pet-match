# Slack 普通链接预览对照实验

> **For agentic workers:** Use inline execution for this single module. Follow test-driven development and verification-before-completion.

**Goal:** 上线四个无需 Slack App 权限的预览入口，让用户比较 OG、完整 Twitter Card、oEmbed photo、oEmbed rich 的真实展示。

**Architecture:** 首页通过 `unfurl` 查询参数选择服务端输出的分享标签，页面主体和游戏资源保持一致。oEmbed JSON 和限尺寸的 JPEG 由现有 Node 服务提供，图片始终来自已选定的 `web/public/og.jpg`，不请求用户输入的外部地址。

**Tech Stack:** Fastify、TypeScript、Zod、Sharp、Vitest；沿用现有 Vite 构建和 GitHub Actions 部署。

## 1. 测试与基线

- [x] 在 `server/__tests__/linkPreviews.test.ts` 验证默认首页、四个实验模式、带查询参数的发现链接、JSON 响应、图片真实尺寸、格式错误和站外 URL 拒绝。
- [x] 运行 `npm test --prefix server -- --run __tests__/linkPreviews.test.ts`，确认新实验入口尚未实现时测试失败。

## 2. 实现

- [x] `server/src/services/linkPreview.ts` 只负责标签切换、受支持的本站链接及 oEmbed 表示与尺寸计算。
- [x] `server/src/routes/linkPreviews.ts` 注册 `/`、`/api/oembed`、`/api/oembed/image`；仅配置生产静态目录时启用。最多缓存 16 个已缩放图片、同时处理 4 个不同尺寸，输入参数只允许正整数。
- [x] `server/src/routes/web.ts` 在静态服务之后注册新路由，保留现有健康检查、静态资源和 SPA 回退。
- [x] `web/index.html` 补齐 Twitter 标题、描述、图片和替代文本，默认首页仍使用同一张已确认海报。
- [x] OG 模式仅保留 OG；Twitter 模式使用完整 OG 与 Twitter Card；photo 和 rich 模式在 OG 基础上各自提供标准发现链接。四种模式都输出各自的完整 `og:url`，并保留查询参数。

## 3. 验证

- [x] 新模块测试、现有静态服务测试、前后端类型检查、前端构建和服务端打包通过。
- [x] 启动本地构建服务检查四种 HTML、oEmbed JSON、JPEG 响应和实际图片尺寸；在 390×844 浏览器中确认实验入口仍加载正常游戏入口。
- [x] 仅提交本模块文件，确认没有包含其他任务的未发布改动。

## 4. 发布与交付

- [x] 在推送前刷新远端 main，并只做快进兼容的整合；禁止强推。
- [x] 用户已授权推送上线。通过现有 Deploy to RackNerd 工作流发布，跟踪到成功。
- [x] 使用 Slack 官方抓取 UA 验证生产 HTML、发现端点和图片可访问，并保留现有 Cloudflare 防护。
- [x] 交付四个带相同版本标记的 Slack 测试链接，注明 Slack 最终渲染仍需用户实测。

## 验证结果

- 提交：`4969487e59c5ac34df101fe040a624cd9a384d09`，已推送 main。
- 前端 277 项、服务端 181 项（含本模块 23 项）测试通过；类型检查、构建、打包和 9 项部署脚本测试通过。
- 独立复核通过；已验证缩图尺寸取整边界和 Sharp 并发上限。
- GitHub Actions 40193244268 的 verify、build、deploy 均成功。
- 生产版本 `20261025.47`，四种 HTML 和 photo/rich JSON、实际 JPEG 像素均通过线上验证。
- 390×844 下游戏入口正常；截图 `/tmp/slack-preview-variant-390.png`。
- 未接入 Slack App；最终卡片版式由用户在 Slack 实测。

## 原生图片分享补充（2026-10-25）

**证据：** 用户确认 Twitter Card、oEmbed photo、oEmbed rich 均为右侧小缩图；同一频道的 `/og.jpg?v=20261025-media-control` 完整显示横版海报。

**方案：** 独立 `/share.jpg` 路由只对 Slack 官方三类 UA 返回固定海报，普通浏览器 302 到游戏首页。保持现有根路径、HTML 标签和 Cloudflare 规则；所有表示禁止缓存并按 UA 区分。图片点击与正文链接点击可能不同，交付时说明并请用户实测。

- [x] 先添加测试，观察缺少路由时 8 项预期失败。
- [x] 最小路由实现，复用现有静态文件发送以支持 Range 和 HEAD，不新增权限、依赖或图片生成。
- [x] 完成模块及静态服务验证、类型检查、打包与独立复核；服务端 189 项通过（模块 31 项）。
- [x] 在最新 main 上整合并按已有授权推送部署，验证生产 JPEG、跳转、缓存隔离与防护状态。
- [x] 交付新的专用分享链接，用户确认完整显示海报且正文链接能进入游戏。

### 原生入口发布证据

- 提交 `125eaadbb3425661bceb5b7408f356a674508054`，GitHub Actions `40195394659` 的 verify、build、deploy 均成功；浏览器首页版本为 `20261025.48`。
- 生产三类 Slack UA 对同一分享 URL 均返回完整 JPEG，与仓库海报字节一致；交替用普通浏览器 UA 访问均为 302 到 `/`，Cloudflare 全部 BYPASS，保留 `Vary: User-Agent`。
- GET/HEAD 与跳转响应为 `private, no-store`。生产 206 被中间层改为 `private, max-age=14400`，仍保留 UA 区分和 Cloudflare BYPASS，不应将生产分段响应误报为 no-store。
- 真实 Chrome 导航为 `/share.jpg?...` 302 → `/` 200，首页完整加载，Bob 身份保留。浏览器证据 `/tmp/slack-native-share-browser-125eaad.json`。
- **独立防护复查发现现状漂移：** Meta 和 curl UA 均拿到首页 200；Cloudflare 当前两条 star 专用 Block/Challenge 均显示 Disabled。此轮没有修改 Cloudflare，未声称防护仍然生效；用户明确要求继续保持禁用，测试分享效果。

## 海报文案与本地修改合并发布

2026-10-25 用户确认海报 v2，并明确要求提交、本地所有修改推送及部署。合并主目录既有的蓝猫 favicon、报告提示精简与规则文档校读，保留远端最新提交的 Slack App 集成；不改动 Cloudflare 设置。发布前检查修改范围、运行前后端测试和构建，并通过既有 GitHub Actions 上线与线上验证。

合并后的本地验证：前端 277 项、版本脚本 8 项、服务端 198 项、部署脚本 9 项测试通过；前后端类型检查、前端构建、服务端打包与独立复核通过。海报与 favicon 构建产物和源文件一致。生产结果另以对应 GitHub Actions 及发布后的 HTTP 验证为准。
