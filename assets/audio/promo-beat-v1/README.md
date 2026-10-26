# 宣传片节拍 · Promo Beat v1

为 25 秒宣传短视频写的原创合成短曲，按 [分镜](../../../design/reviews/2026-10-26-promo-video/STORYBOARD.md) 的 12 小节对拍。2026-10-26 制作，尚未经用户试听确认。

- **曲式**：C 大调、120 BPM、4/4。第 1–2 小节每拍一记重鼓，配合贴纸砸进画面；第 3–9 小节是完整律动（四拍底鼓、二四拍拍手、反拍踩镲、跳跃低音、两小节一循环的旋律钩子）；第 10 小节前半留空、后半拍手渐强；第 11 小节副歌回归；第 12 小节第 1 拍收在重拍上，之后和弦延音 1 秒淡出。
- **来源**：`compose.py` 里的原创音符与确定性合成，没有外部录音、采样或生成服务。
- **音效** `sfx/`：pop（消除）、slam（砸落）、whoosh（转场）、ding（催单完成）、crash（Wow 重击），由成片按帧放置。
- **文件**：`promo-beat-v1.wav`（48 kHz / 16-bit 母版）、`promo-beat-v1.mp3`（192 kbps，成片使用）、`manifest.json`（电平记录）。

重建：`python3 assets/audio/promo-beat-v1/compose.py`。改曲应另建新版本目录。
