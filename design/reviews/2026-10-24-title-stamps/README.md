# 趣味称号章接入（2026-10-24）

用户要求把 `assets/icons/report-title-stamps-original-v1/transparent` 接入游戏并对应触发条件；确认：称号文案改为章上的新文案，分享卡一起换成图片章。

## 对应关系（触发条件与优先级不变）

| 优先级 | 触发条件 | key | 章 | 中文 / English |
| --- | --- | --- | --- | --- |
| 1 | 发动过吹风机（鱼关大浪花） | `title.cleanup_chief` | 02-all-gone | 这下真没了 / Poof. All gone. |
| 2 | 单次最高连锁 ≥ 5 | `title.chain_lead` | 01-hands-off | 我手都松开了 / I let go. It kept going. |
| 3 | 催单成功 | `title.scheduling_pro` | 03-got-this | 急什么我会消 / Relax. I got this. |
| 4 | 实际发动 ≥ 3 个道具 | `title.tool_pro` | 04-tools-work-harder | 道具比我还忙 / My tools work harder. |
| 5 | 最后 3 秒仍有有效操作 | `title.last_second` | 05-almost-clocked-out | 差点准时下班 / Almost clocked out. |
| 6 | 其他完整对局 | `title.pet_officer` | 06-counts-as-work | 这班没白上 / That counts as work. |

## 改动

- 素材：`assets/illustrations/build_web.py` 把 12 枚透明章缩为 WebP（≤ 300 px，26–59 KB）到 `web/src/ui/art/stamps/`，不重绘。
- `web/src/game/titleStamps.ts`：称号 → 章的对应与按语言取图；新增测试 `game/__tests__/titleStamps.test.ts`（6 款各不相同、中英文图片都存在、文案与章一致）。
- i18n：6 个称号的中英文改为章上文案，key 不变；`shareCard.test.ts` 期望值随之更新。
- `TitleStamp`：改为圆形图片章（默认 120 px），读屏读称号原文；图片缺失时退回文字小章。ScoreCard 中章压在 MVP 贴纸右上、倾斜 8°，落章动画保留，扩散环改为圆形。
- 分享卡：模型新增 `titleStamp`，画布先加载章图再绘制（280 px、倾斜约 8°）；读取失败时退回原文字小章，不影响出图。
- 文档：UI_COPY 称号表与说明、GAME_FLOW 称号表、DESIGN_NOTES 选定展示文件、素材目录 README。

## 截图与验收

`report-zh.png`（催单成功 → 急什么我会消）、`report-en.png`（Relax. I got this.）、`report-fish-zh.png`（连锁 6 → 我手都松开了）、`share-zh.png`（分享卡同一枚章）、`gallery-titlestamp-zh.png`、`gallery-titlestamp-en.png`。

typecheck、test（127 通过）、build 通过。

## 未验证与遗留

- 只在真实结算中触发了「催单成功」「连锁 ≥ 5」两种称号；其余四种只在陈列页与单元测试核对。
- 章在 80 px 以下时英文小字较难读，报告页使用 120 px；如需在更小位置展示需另外评估。
- 原圆角称号框（图标库 title-stamp）不再使用，保留在图标库中。
