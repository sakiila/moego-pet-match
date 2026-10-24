# 排行榜「毛孩子光荣榜」（2026-10-24）

用户提供参考图（`design/references/hall-of-fame-reference.webp`）：要阶梯感领奖台、名字旁麦穗、两侧卡通宠物贴纸，并设计中英文「毛孩子光荣榜」标题。

## 素材（Codex image_gen，用户确认后本地去白底）

- 中文标题 `hall-of-fame-title-zh-v2`；英文标题 v1→v4 由 Codex 生成，v5/v6 由 `assets/illustrations/tools/space_wordmark_en_v5.py` 在 v4 上本地调整单词间距（不重绘），选定 v6。
- 麦穗 `hall-of-fame-laurel-v1`（拆成左右两支）、左侧蓝猫 `hall-of-fame-cat-v1`、右侧黑白狗 `hall-of-fame-dog-v1`。
- 去底：`assets/illustrations/tools/remove_white.py`（只把与画布边缘连通的白底变透明，主体内白色保留）；源文件在 `assets/illustrations/ui/hall-*.png`，`build_web.py` 导出 WebP 到 `web/src/ui/art/`。

## 改动

- BrandHeader 新增 `title="hall"`：标题字标随语言切换，读屏读 `leaderboard.hall_of_fame`；副标题 `leaderboard.tagline`。
- 新增文案：`leaderboard.hall_of_fame`、`leaderboard.tagline`（谁把毛孩子安排得最明白？/ Who keeps the fur crew in line?）、`leaderboard.points`（{score} 分 / {score} pts），已登记 UI_COPY。领奖台上方的「领先玩家」不再显示。
- Podium 重写为阶梯领奖台：三级台阶按位置定高度（中 150、左 126、右 110 px），按真实名次配金／银／铜色（新增 `--podium-*` 令牌）；头像坐在台阶上沿，第 1 名戴皇冠图标、名字两侧麦穗（并列第 1 时都显示）；台阶正面名字、橙色分数与大号名次数字；长名字截断（悬停看全名）。两侧蓝猫与黑白狗藏在台阶后面探出半身，轻微摇摆，减少动态效果时静止。
- 未采用参考图中的「鱼缸满后解锁」与锁图标（规则已取消公共鱼缸；鱼关页签只对已发现者显示）。

## 截图与验收

`leaderboard-zh.png`、`leaderboard-en.png`（390 × 844）、`gallery-podium.png`（三人、并列第二、仅一人、并列第一、六位数分数、长名字）。typecheck、test（127 通过）、build 通过。只在 Chrome 无头模式下核对，未在真机查看摇摆动效。

## 第 1 名皇冠与点缀（用户补充参考 `design/references/hall-of-fame-crown-reference.png`）

- 皇冠换成 Codex 生成、用户确认的无数字金色小皇冠 `hall-of-fame-crown-v1`（本地去底，导出 `hall-crown.webp`），压在头像顶上、略倾斜；列表行仍用名次徽记。
- 头像左上两笔粗细均匀的橙色圆头短线、右侧一大一小四角星（大星用更亮的金黄），以头像中心定位、贴近头像，交替闪烁；减少动态效果时静止。
- 两侧宠物按在榜人数显示：只有 1 人时不显示，只有 2 人时只显示左侧蓝猫，3 人及以上两侧都显示。
- 验收：test（127 通过）、build 通过；截图 `leaderboard-zh.png`、`gallery-podium.png`。

## 皇冠 v2（用户参考 `design/references/hall-of-fame-crown-reference-2.png`：端正摆放、带白边）

- Codex 以品红纯色底生成 `hall-of-fame-crown-v2`（端正、外圈白色贴纸描边、无数字）；新增 `assets/illustrations/tools/remove_key.py` 去掉品红底并保留白边，替换 `hall-crown.webp`。
- 皇冠宽 50 px，端正戴在头像正上方，底边压住头像外圈白边约 15 px。
- 验收：typecheck、test（127 通过）、build 通过；截图 `leaderboard-zh.png`、`gallery-podium.png`。
