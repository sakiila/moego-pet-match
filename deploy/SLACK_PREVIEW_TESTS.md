# Slack 普通链接预览对照

这些入口无需 Slack App、`links:read` 或 `links:write` 权限。普通浏览器打开后都进入同一游戏。

## 原生海报对照

分享 `https://star.baobo.me/share.jpg?v=新版本`。Slack 的 LinkExpanding、Slackbot 与 ImgProxy 请求会收到固定的 `og.jpg` JPEG，支持 HEAD 和 Range；其他客户端临时跳转到 `/`，不把查询参数作为跳转目标。这里的 UA 只选择公开海报的表示，不是身份验证，也不提供任何游戏访问豁免。

同一链接的图片与跳转响应均使用 `Vary: User-Agent` 和 `Cache-Control: private, no-store`，防止 CDN 或浏览器把两种表示混用。Slack 自身仍可能缓存预览，因此测试时使用新的版本参数。既有海报 `/og.jpg` 仍是纯图片直链。

普通网页的三种实测方案（Twitter Card、oEmbed photo、oEmbed rich）均仍显示右侧缩略图，而纯 JPEG 直链已由用户确认完整显示海报。`/share.jpg` 用于验证原生图片预览与浏览器进入游戏能否兼得；点击 Slack 里的图片可能打开图片查看器，点击消息正文中的链接才进入游戏。最终效果仍以真实 Slack 消息为准。

## HTML 标签对照

下面四个入口只在服务器返回的 HTML 分享标签上有所区别。

| 方案 | 链接 | 标签 |
|---|---|---|
| OG | `https://star.baobo.me/?unfurl=og` | 仅 Open Graph |
| Twitter Card | `https://star.baobo.me/?unfurl=twitter` | OG + 完整 `summary_large_image` |
| oEmbed photo | `https://star.baobo.me/?unfurl=oembed-photo` | OG + `photo` 发现链接 |
| oEmbed rich | `https://star.baobo.me/?unfurl=oembed-rich` | OG + `rich` 发现链接，HTML 是带游戏链接的完整海报 |

对照时在每条链接后加相同的新 `&v=日期或版本`，分开发出新 Slack 消息，减少已缓存结果对实验的影响。不要仅根据输入框里的草稿判断。默认首页保留完整 OG/Twitter Card，不默认选择任何 oEmbed 实验。

`/api/oembed?url=<编码后的首页地址>&format=json` 返回标准 JSON；支持 `maxwidth`、`maxheight`，只处理本站 HTTPS 首页。图片始终来自固定的 `og.jpg`，不抓取用户输入的网页。缩略尺寸对应 `/api/oembed/image`，返回 JPEG，声明尺寸与实际像素一致，不放大原图。

Cloudflare 已有的 Slack 抓取豁免仅覆盖首页 GET/HEAD，查询参数不会扩大豁免路径。oEmbed 与缩图位于现有 `/api/` 范围，不需要给整个站点跳过 WAF。

Slack 的最终布局由其客户端决定。四种入口用于实际对照，不代表 oEmbed 一定会被 Slack 采用，也不保证所有客户端显示相同。

## Slack App 整宽预览（chat.unfurl）

普通网页标签在 Slack 中只显示右侧缩略图；由 App 接管 `star.baobo.me` 的预览后，游戏首页链接显示为「标题链接 + 简介 + 整宽 `og.jpg` 海报」。只处理首页（`/`、`/index.html`，带任意查询参数），其他路径与图片直链仍按 Slack 默认方式显示。

配置步骤（api.slack.com/apps 中的同一个 App）：

1. OAuth & Permissions → Bot Token Scopes 加 `links:read`、`links:write`，然后 Reinstall to Workspace。
2. Event Subscriptions → 打开，Request URL 填 `https://star.baobo.me/api/slack/events`（需先完成第 4 步部署，Slack 会立即发验证请求）；Subscribe to bot events 加 `link_shared`。
3. 同页 App unfurl domains 添加 `star.baobo.me`，保存后按提示重新安装。
4. 服务器 `production.env` 加 `SLACK_SIGNING_SECRET`（Basic Information → App Credentials → Signing Secret），重新部署或重启。未设置时 `/api/slack/events` 不存在。

服务端校验 `X-Slack-Signature`（HMAC-SHA256，拒绝 5 分钟前的请求），先回 200 再在后台调用 `chat.unfurl`；Slack 重试请求不重复调用。输入框草稿预览使用 `unfurl_id` + `source`，已发出的消息使用频道与时间戳。若 Cloudflare 对 `/api/slack/events` 的 POST 做挑战或拦截，需要为该路径放行 Slack 请求（签名校验仍由应用完成）。
