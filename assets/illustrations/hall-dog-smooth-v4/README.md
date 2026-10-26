# 小狗肚皮两处平滑修正 v4

2026-10-26，用户明确指出白毛左右边界两处尖角，要求平滑过渡。两处折角也存在于已确认原图，v3 按原图提取时保留了它们。

- 基底：`../ui/hall-dog-v3.png`，661 × 820。
- 内置 ImageGen 编辑原稿：`generated.png`；完整请求：`prompt.txt`。
- 最终母版：`../ui/hall-dog-v4.png`；界面导出：`web/src/ui/art/hall-dog-v4.webp`。
- 生成稿只贡献两个小区域中的平滑边界；`apply.mjs` 将边界与原图在区间两端对齐，再局部合入 v3。左侧区间 y=530–575，右侧 y=550–625；不使用生成稿的其他区域。
- 两区域外的 RGB 与 v3 完全一致，全部 alpha 值与 v3 完全一致。脸、爪子、领巾、草叶、橙色点缀、三个斑点均保留。

复现：安装现有 server 依赖后运行 `node assets/illustrations/hall-dog-smooth-v4/apply.mjs`，然后经 `assets/illustrations/build_web.py` 导出。v3 和生成原稿均保留，不覆盖旧版本。
