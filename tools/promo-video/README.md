# 宣传短视频

分镜与选定种子见 [STORYBOARD.md](../../design/reviews/2026-10-26-promo-video/STORYBOARD.md)。独立 npm 包，不影响 `web/` 与生产镜像；录屏和渲染产物不进 git。

## 真机录屏

前置：仓库根目录 `docker compose up -d`，`server/` 与 `web/` 的开发服务都已启动（8787、5180）；本机装有 Google Chrome 和 ffmpeg。

```sh
npm install
npm run record -- --lang zh
npm run record -- --lang en
```

参数：`--demo` 棋盘种子（默认 135）、`--play` 走法种子（默认 2）、`--lang zh|en`、`--player` 登记对局用的同事 Slack User ID、`--base` web 地址。每录一次会向本地开发库写一条对局记录。

流程：无头 Chrome 以 390 × 844、3 倍像素打开 `?demo=`，从门店进准备页，开始录制后点「开始这班」，棋盘自动走完整局；进报告页 3 秒后慢慢滚到底部，再停 3 秒（成片目前只用到收工挂牌为止）。帧来自 Chrome DevTools 屏幕帧流，按时间戳由 ffmpeg 补成固定 60fps（x264 CRF 14）。

无头模式下帧流默认按 CSS 像素出图，所以启动时加了 `--force-device-scale-factor=3`，才能拿到 1170 × 2532 的帧。

产物在 `public/recordings/<demo>-<play>-<lang>/`：

- `game.mp4`：1170 × 2532、60fps。
- `timing.json`：所有时刻都是素材里的秒数。`marks.startClicked` 和 `marks.report` 是开局与报告页出现的时刻；`moves[]` 的每一步有 `swapAt`（交换发出）、`settledAt`（连消结束、喝彩出现）、喝彩档位、连消倍率、生成的道具与是否完成催单，成片用它们对齐手势和卡点；`boardFrameGaps` 是棋盘段的帧间隔，用来检查有没有掉帧。

## 成片（Remotion 4.0.535）

```sh
npm run sync        # 复制贴纸、Logo、字体、喝彩、节拍与音效到 public/assets/
npm run studio      # 预览与调整
npm run render:zh   # 渲出 out/promo-zh-raw.mp4，再标准化响度输出 out/promo-zh.mp4（1080 × 1920、30fps、21 秒）
```

- 渲染直接用本机 Chrome。渲完由 `scripts/loudnorm.mjs` 做两遍 loudnorm，目标 −14 LUFS、真峰值 −1 dBTP，画面直接复制。
- Remotion 对 4 人及以上的公司要求购买公司许可，正式发布前请先确认。
- 镜头在 `src/Promo.tsx`，通用部件在 `src/parts.tsx`，字幕在 `src/copy.ts`，选定的宠物在 `src/pets.js`。
- 节拍是 120 BPM，`at(小节, 拍)` 换算成帧。每段录屏用「素材时刻 → 成片帧」对齐：喝彩、+1000 等关键时刻落在拍点上，倍速 1–1.5。
- 中文字幕只用游戏字体子集里已有的字（`web/src/ui/fonts/chars.txt`），新加字幕前先核对。
- 背景节拍与音效来自 `assets/audio/promo-beat-v2/compose.py`（原创合成），喝彩是 `assets/audio/cheers-bob-v1` 的自录原声。
