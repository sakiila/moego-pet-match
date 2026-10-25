# 局内前台 · v2 原图拆分

本批按用户明确要求，从三张已确认原稿精确裁切并去底；没有生成、重画或换用旧图标。原图保留在 `design/concepts/`，SHA-256、原图坐标、母版尺寸、导出尺寸与逐像素检查见 [manifest.json](manifest.json)。

[原图／透明／蓝底对照](preview.html) · [蓝底总览](overview-blue.png) · [校验记录](validation.json) · [catalog 片段](catalog-fragment.json)

母版位于 `../library-original-png-v2/masters/16-board-frontdesk/`。母版保留来源裁切的原生分辨率，不放大。`previews/*-transparent-4x.png` 和 `*-blue-4x.png` 仅把透明母版按最近邻放大 4 倍用于检查，不作为界面素材。`source-crops/` 是未经去底的原稿区域。

| 名称 | 来源 | 保留内容 |
| --- | --- | --- |
| rush-accent | mobile-board-frontdesk-v2.png | 临时加单标题右侧原两笔橙色强调线 |
| time-accent | mobile-board-frontdesk-v2.png | 00:48 右侧原两笔橙色强调线 |
| farewell-accent-left | shift-finish-storyboard-v2.png | 第3格谢幕文案左侧原两笔橙色点缀 |
| farewell-accent-right | shift-finish-storyboard-v2.png | 第3格谢幕文案右侧原两笔橙色点缀 |
| rush-clock | mobile-board-frontdesk-v2.png | 加单头部原橙色轮廓小钟、橙色指针、白色内芯；区别于本局主时钟 |
| round-clock | mobile-board-frontdesk-v2.png | 原橙圈时钟、白色钟面、黑色指针 |
| round-score | mobile-board-frontdesk-v2.png | 原橙色星形、原稿白描边与白内芯、两条橙色强调线 |
| rush-clipboard | mobile-board-frontdesk-v2.png | 原橙色夹板、白色内页；上方圆孔透明 |
| rush-clip | mobile-board-frontdesk-v2.png | 卡片上方独立橙夹子；圆孔透明，按宽图比例导出 |
| rush-check | rush-frontdesk-states-v2.png | 绿色圆圈对勾、白内芯、上方两条绿色强调线 |
| rush-expired-clipboard | rush-frontdesk-states-v2.png | 灰色夹板、白色内页；上方圆孔透明 |
| closing-sign-zh | shift-finish-storyboard-v2.png | 第 3 格中的原绳、橙牌、收工啦字；绳内三角区域透明 |

去底使用前景色选择、连通区域和边界局部色线分解。只处理背景和抗锯齿边；所有最终 alpha=255 的像素，其 RGB 与对应源像素完全一致。时钟、星形、夹板和完成圆标的白色内容保留不透明。收工牌排除了原稿摆动弧线、周围注解、头像和棋盘。

原稿中夹子与卡片橙色横边相连：只去除夹子外的横边及浅色光晕；相交的 6 行轮廓边缘透明度由紧邻上下未遮挡行插值得到，主体不透明 RGB 保持原图。该边界处理单列在 manifest 中。

导出遵循已有 `export_web.py` 的等比缩小规则：32／48／72／96／144／192／288 中不超过原图上限的尺寸，并补充原生尺寸上限。普通图标放透明方形画布；`rush-clip`、`closing-sign-zh` 保留宽高比。仅新增本批 PNG 到 `web/src/ui/icons/png/`；未改 `catalog.ts` 或通用 `export_web.py`，未删除原有素材。

重建（需要 Pillow、NumPy）：

```sh
/Users/bob/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 assets/icons/board-frontdesk-original-v1/split_board_frontdesk.py
/Users/bob/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 assets/icons/board-frontdesk-original-v1/build_preview.py
```

仅重建单件时可在拆分命令末尾加 `rush-clock`，其余母版与导出不会重写。

本批未接入游戏组件，未提交、推送或部署。
