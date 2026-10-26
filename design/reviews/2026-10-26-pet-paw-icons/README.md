# 宠物爪印簿 · 图标重新设计

日期：2026-10-26。用户要求重新设计刚才这组图标，并选择本轮实际显示的第 2 稿“宠物小动作”。已按选定原图裁切接入，原图生成使用 Codex 内置 ImageGen，接入使用确定性裁切；当前修改未提交或发布。

范围为原有 11 个图形：四个互动短句、实心 / 回应描边 / 次要灰色三种爪印，以及选中勾、展开箭头、进入箭头和关闭叉号。每稿都提供大图与按钮内的小图示意，沿用 MoeGo 橙、炭黑、暖白和既有圆润图标语言。

## 图稿与完整请求

编号严格对应本聊天三个 ImageGen 结果的实际显示顺序：

| 显示编号 | 图稿 | 完整请求 |
| --- | --- | --- |
| 1 | [第一稿](../../concepts/pet-paw-icons-sticker-v1.png) | [提示词](../../concepts/pet-paw-icons-sticker-v1-prompt.txt) |
| 2 · 已选 | [第二稿](../../concepts/pet-paw-icons-playful-v1.png) | [提示词](../../concepts/pet-paw-icons-playful-v1-prompt.txt) |
| 3 | [第三稿](../../concepts/pet-paw-icons-duotone-v1.png) | [提示词](../../concepts/pet-paw-icons-duotone-v1-prompt.txt) |

每张均为同一方案的成套图形与组件示例，不是把多个方案放在一张图里。正文中的方向名称与大标题以各张图自身为准。

## 使用的参考

已直接查看并在三次 ImageGen 调用中分别提供：

- `assets/icons/library-original-png-v2/reference/home-entry-icons-v3.png`：已确认品牌图标、圆润炭黑轮廓、橙白配色与轻量层次。
- `assets/icons/pet-paw-book-original-v1/preview.png`：当前 11 枚图形的功能范围，不沿用低分辨率像素化外观。
- `/tmp/moego-paw-qa/reply-390x844.png`：实际爪印簿中的按钮、选中态与纸面布局；已另存为本目录 `references/paw-book-current.png` 方便回看。

已目视核对三稿：四句互动文案与功能一致，包含三种爪印状态及四枚通用控件，有同款图形的小尺寸按钮示例；没有加入新的玩法或奖励。主爪印均为平面肉垫印记，以区别玩家点赞的举爪击掌。图稿是视觉提案，不代表已完成小尺寸浏览器或触摸验收。

第 2 稿已加入 DESIGN_NOTES 的选定展示文件。11 枚透明母版与 59 份导出已替换对应图标，来源与像素校验见 [提取记录](../../../assets/icons/pet-paw-icons-playful-original-v1/README.md)。旧稿与旧小切图仍保留。按钮内四个情感图标调整为 40px，纵向留白适度收紧，保持原有按钮高度与触控面积。

## 接入验收

已在应用内浏览器按 390 × 844 检查中文、英文、主人回爪与长名；13 种陈列状态及横屏通过，无应用控制台错误。实际图标统一 40px，按钮仍为 52px。视觉同框与修正记录见根目录 [design-qa.md](../../../design-qa.md)。像素校验见新素材目录 `validation.json`。
