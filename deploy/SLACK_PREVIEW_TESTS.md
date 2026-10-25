# Slack 普通链接预览对照

这些入口无需 Slack App、`links:read` 或 `links:write` 权限。所有链接打开后仍进入同一游戏，只在服务器返回的 HTML 分享标签上有所区别。

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
