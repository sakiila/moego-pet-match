# 蓝猫 Favicon v3

2026-10-25 用户选定并授权接入：保留蓝猫的大眼睛、腮红与歪头，去掉小爪，下巴隐藏在下边框后。

- 原稿：[favicon-blue-cat-v3.png](../../../design/concepts/favicon-blue-cat-v3.png)
- 完整生成请求：[favicon-blue-cat-v3-prompt.txt](../../../design/concepts/favicon-blue-cat-v3-prompt.txt)
- 从仓库根目录重新导出：`node assets/icons/favicon-blue-cat-v3/export.mjs`，复用服务端已有的 `sharp`，无需新增依赖。
- 仅按 alpha > 8 定位主体，外留 2px 抗锯齿余量，再等比缩小并居中；不重画、不拉伸、不修改原稿。
- 输出到 `web/public/`：16 / 32px 透明 PNG、多尺寸 ICO（16 / 32 / 48px）、180px Apple Touch Icon。手机收藏图标铺白底，避免透明区域由系统填成黑色。
- 浏览器通过 `web/index.html` 的 `link` 标签引用。这是浏览器元数据资源，不经过页面内的 `Icon` 组件。
