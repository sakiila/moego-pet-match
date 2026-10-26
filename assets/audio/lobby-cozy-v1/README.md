# 毛孩子的小小午后 · Little Paws Afternoon v1

为 MoeGo 毛孩子全明星的所有局外页面制作。2026-10-26 用户要求「轻松可爱一点」。

- **曲式**：C 大调、100 BPM、4/4，32 小节，76.8 秒；A / A 变奏 / B / A 回归。
- **音色**：柔和木琴、模拟拨弦、圆润低音、少量铃音、轻沙沙声和木质拍点。
- **来源**：`compose.py` 中的原创音符与确定性合成，无外部录音、音乐采样或生成服务。
- **循环**：音符尾部和房间反射循环写回开头；MP3 保留 gapless 元数据，由 WebAudio 解码后连续循环。
- **音量**：母版峰值约 -2.5 dBFS，MP3 实测 -16.6 LUFS、真峰值 -2.9 dBTP；游戏再经 0.55 × 0.22 增益作为低音量背景。

## 文件

- `compose.py`：曲谱、音色、编排与导出脚本；依赖 Python 3、NumPy、ffmpeg。
- `little-paws-afternoon-v1.wav`：44.1 kHz / 16-bit / 双声道母版。
- `little-paws-afternoon-v1.mp3`：112 kbps 试听与网页压缩版，约 1.08 MB。
- `manifest.json`：节奏、长度、母版电平与循环接缝的可复现分析。
- 网页副本：`web/src/audio/clips/little-paws-afternoon-v1.mp3`，仅开启局外音乐时加载。

重建：在仓库根目录运行 `python3 assets/audio/lobby-cozy-v1/compose.py`。修改曲谱应另建新版本目录，保留本版。

播放器沿用现有音乐偏好，首次关闭；局外页面连续播放，棋盘/后台返回续播，失败重试与异步取消均有单元测试。2026-10-26 用户选定此版本，并要求提交、推送上线。
