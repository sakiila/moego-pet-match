# 毛孩子动态 · 服务与发布

本模块已完成真实接口和本地联调，尚未由本任务推送或部署。依赖现有 PIN 登录及 018_player_auth，新增迁移 020_social_wall；不改变游戏计分、收集或永久玩家点赞。

## 开关

默认关闭。生产需要在部署环境配置：

```dotenv
PET_SOCIAL_ENABLED=true
PET_SOCIAL_SLACK_SYNC_ENABLED=true
PET_SOCIAL_PUBLIC_ORIGIN=https://star.baobo.me
```

继续复用 SLACK_BOT_TOKEN、SLACK_SIGNING_SECRET 和 SLACK_ADMIN_MEMBER_ID（多个管理员可用逗号分隔）。不把令牌写入前端或新配置文件。同步范围固定为工作区 T011CF3CMJN、频道 C0APZBRK49E（#the-pet-corner），没有跨频道抓取。

只开 PET_SOCIAL_ENABLED 时，原生动态可用，Slack 同步不运行。关闭正式开关时首页不开放入口；独立开发预览 /dev/social 和陈列页使用虚构数据，不连接真实接口。

## 发布顺序

需先得到用户明确的上线指令，不能把本文件当作授权：

1. 包含现有登录变更和 018 前置迁移。
2. 通过已有 database.ts 的生产迁移预览，再显式 --apply；不得使用本地 migrate.ts 连接生产。
3. 部署包含 020 的服务和前端，设置上述开关，管理员沿用有效 Slack User ID。
4. 验证登录、私有图片访问、发帖、表情、留言和管理状态。推送 main 会自动部署。
5. 在频道说明新的展示范围与移除方式；未获明确发消息指令时，Agent 不代发公告。

本任务只操作隔离的本地数据库与本地文件存储，没有连接 RackNerd、修改生产环境或更改 Slack App 权限。

## 同步

Slack 读取接口及签名验证依据官方文档：[Events API](https://docs.slack.dev/apis/events-api/)、[文件访问](https://docs.slack.dev/reference/objects/file-object/)、[原帖链接](https://docs.slack.dev/reference/methods/chat.getPermalink/)。

- 默认每分钟检查近 30 天消息，每轮最多 3 页、每页 100 条；窗口未读完整时不根据缺失判定删除。
- 已导入帖定时复核，包含 30 天以前的帖子，每轮最多取 20 条到期项。
- 有事件订阅时，现有 /api/slack/events 也接收 message.channels（含修改与删除）和 file_deleted；需加入对应订阅。轮询可独立工作，不要求先修改现有链接预览订阅。
- Webhook 在签名和目标工作区/频道校验后，先将定位信息入队再应答。event_id 唯一；重试不会重复导入。队列不保存正文、私有下载地址或令牌。
- Worker 使用数据库租约，重启后可重领；失败按 Retry-After 或退避重试，连续 8 次失败后等待管理员重试。
- 每次从 Slack 读取当前主帖，比较完整微秒版本。原时间保留，旧编辑不覆盖新版本。删除与本站隐藏不能被晚到的事件复活。
- 不导入机器人、线程回复、Slack 表情关系、视频和外部托管文件；照片与文字保留原语言。纯视频帖跳过，混合帖只保留支持的照片。
- 自定义/未识别的 Slack 表情保留文字代码；常用标准表情转换为 Unicode。Slack 转义与提及按纯文本处理，不执行 HTML。
- 同步只调用读取方法；没有 chat.postMessage、reactions.add、files.upload 或删除原帖调用。
- 删除文件时撤销本站访问并排队清理；定时复核也处理保留策略导致的文件消失。

## API 与权限

全部内容、媒体、互动和管理接口从现有 HttpOnly 会话取得操作者，不接收浏览器指定作者。有效性每次由当前同事名册校验；读写响应不缓存，写操作检查 Origin / Sec-Fetch-Site。

- GET /api/social/config：只公开功能是否启用。
- GET /api/social/session：当前身份、自己的上架宠物、管理能力和未读数。
- GET/POST /api/social/posts；GET/DELETE /api/social/posts/:id。
- POST /api/social/media；DELETE /api/social/media/:id（仅自己的未发布图片）；GET /img/social/:id。
- PUT /api/social/posts/:id/reactions/:kind：显式 selected 状态。
- GET/POST /api/social/posts/:id/comments；DELETE /api/social/posts/:id/comments/:commentId。
- GET /api/social/notices；POST /api/social/notices/read。
- POST /api/social/reports。
- 管理员：GET /api/social/admin/status、GET /api/social/admin/reports、POST /api/social/admin/retry（空 JSON 对象）。普通同事无权访问。

列表、消息和留言使用游标分页。表情只返回计数和当前用户的选中状态，不返回全部点赞者名单。自我操作不产生自我通知。

## 图片与删除

- 最多 9 张照片，正文 2000 字符，留言 500 字符；单张上传最多 12 MiB。
- 支持 JPEG、PNG、WebP；服务器检查魔数并限制解码像素，转正、缩到长边最多 1600、去掉 EXIF 后编码 WebP。客户端缩图不作为安全边界。
- 暂存图片只对上传者可见，最长可访问 24 小时；过期、放弃或删除项由后台清理。
- 已发布图片只对登录的有效同事开放。删除先用事务撤销帖子、照片、留言和通知的可见性，再由持久的媒体标记驱动私有对象存储清理，清理失败会重试。
- Slack 内容只能在本站隐藏，原帖仍由 Slack 管理。管理员可移除本站内容。
- R2 和本地目录使用 social/<UUID>/<hash>.webp 键，不触碰原有 pets/ 对象。

## 本地联调

开发预览仍为 http://127.0.0.1:5180/dev/social。真实接口联调使用独立 localhost:5181（前端）/127.0.0.1:8811（服务）和 pet_match_social_dev；测试库为 pet_match_social_test，均在本机 54329。

联调入口 http://localhost:5181/__social_qa 使用临时本地样例会话，重定向到 /moments。此入口只存在于 /tmp/moego-social-live-qa/server.mts，不进入仓库，不是生产登录入口；不要移植到生产。它不设置或修改任何人的 PIN。所有本站写入仅在本地，Slack 原帖和线上记录均不改动。

实际生产页面为 /moments，仍使用游戏登录。源频道初次本地快照：8 条动态、11 张照片，近 30 天；没有导入 Slack 的原反应或留言。
