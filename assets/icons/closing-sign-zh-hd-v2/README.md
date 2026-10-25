# 收工啦 · 中文高清稿 v2

2026-10-25 用户反馈网页上的「收工啦」图片模糊。本轮已制作同造型高清增强稿并接入网页。

用户已确认「可以，替换进去」，当前选定并使用本 v2 高清稿。

## 原因与结果

- 原中文牌从分镜拆出，母版270×203、有效图案256×187，网页最大导出仅256px；显示宽度300px时，在高分屏上明显欠采样。
- 新高清原图1448×1086，输出透明PNG。网页使用独立版本名 `closing-sign-zh-hd-v2`，最大导出960×685；显示宽度和动效配置不变。
- 使用内置ImageGen，未使用CLI/API fallback。v1为首次增强稿，v2按原稿进一步校正挂绳粗细、牌身比例和圆结；保留橙牌、深色描边、挂绳及单行「收工啦！」。
- 这是同造型的高清复原；旧低清母版与所有旧导出的哈希均核验未变，保留来源历史。

## 文件

- [高清原图](original.png)
- [v2完整提示词](prompt.txt)
- [v1原图与提示词](../closing-sign-zh-hd-v1/)
- [生成、尺寸、来源与导出哈希](generation-record.json)
- 接入母版：`assets/icons/library-original-png-v2/masters/16-board-frontdesk/closing-sign-zh-hd-v2.png`
- 旧来源：`masters/16-board-frontdesk/closing-sign-zh.png`，未覆盖。
- 高清清晰度参考：原有英文牌 `masters/16-board-frontdesk/closing-sign-en.png`，未改动。

## 导出与接入

- 新增32、48、72、96、144、192、288、576、960宽的PNG，仅等比缩小。
- 导出边界按alpha>8主体的包围框外留2px，忽略外围几乎透明的孤立噪点；原始PNG保留不处理。
- ClosingSign和BoardScreen预载均改为新中文ID；英文ID不变。
- 通用export_web.py登记宽图和576/960规则，后续全库导出仍可重建高清版。旧分镜拆分脚本只会覆盖旧ID，不能使网页退回旧低清版。
- 本轮只导出新增ID，没有运行会删除全部PNG的全库重建。

## 网页验证

- 390×844、DPR2：实际牌宽300px，currentSrc为 `closing-sign-zh-hd-v2@960.png`，物理图像960×685，解码成功。
- 同视口DPR3：实际牌宽仍为300px，仍命中960高清版，覆盖300×3所需物理像素。
- 鱼关横屏844×390、DPR2：牌宽220px，命中高清版，无页面溢出、无失效图片。
- 英文牌仍使用原有960×700资源。
- 动画结束后已实际查看中文网页截图，字和绳边清晰；typecheck、build及相关文件diff check通过。
- 本轮未改计时、收工停留或保存逻辑，没有新增测试对局，未提交或部署。

对照与截图：
- `/tmp/moego-closing-web-hd-comparison.png`：原网页素材 / 新高清素材，同宽600物理像素比较。
- `/tmp/moego-closing-hd-web-zh.png`：中文实际网页，300 CSS px / DPR2。
- `/tmp/moego-closing-hd-fish-landscape.png`：鱼关横屏。


