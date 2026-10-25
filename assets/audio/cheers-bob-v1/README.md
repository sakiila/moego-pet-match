# 用户自录英文喝彩 · 裁切试听 v1

日期：2026-10-25。状态：**用户已确认试听，并授权将四条原声接入局内喝彩；已完成本地接入，尚未部署。**

## 来源与选择

用户提供 `/Users/bob/Downloads/sound.m4a`，要求挑选合适版本、裁成独立音效、统一音量并先试听。完整录音保存在 `source/sound.m4a`；SHA256 与用户原文件一致。

录音有四段独立发声，每句仅有一遍，没有可比较的重复 take。本轮保留四段，按实际发声位置裁切，前后保留短余量，以避免切掉字头和尾音。

本套来自用户此次提供的录音，不沿用另一套免费候选素材的 CC0 标记。

接入使用 `previews/{nice,great,amazing,wow}.mp3` 的原样副本，位置为 `web/src/audio/clips/`；不重新裁切或处理声线。原来的 `cheers-audition-v1.zip` 保留为确认试听时的归档。游戏的人声通道增益为 0.85，沿用音效开关。

## 文件

| 词句 | 裁切区间 | 独立时长 | WAV 母版 | MP3 试听 |
| --- | --- | --- | --- | --- |
| Nice | 2.245–2.875s | 0.630s | `masters/nice.wav` | `previews/nice.mp3` |
| Great | 4.085–4.665s | 0.580s | `masters/great.wav` | `previews/great.mp3` |
| Amazing | 6.055–6.815s | 0.760s | `masters/amazing.wav` | `previews/amazing.mp3` |
| Wow | 8.090–8.585s | 0.495s | `masters/wow.wav` | `previews/wow.mp3` |

区间相对于解码后的 PCM 开头。M4A 容器标称 10.048s，AAC 解码后的有效音频为 10.004s；差异来自编码延迟。未使用语音识别的词级时码作为剪切边界。

合并试听：`previews/cheers-audition.mp3` / `.wav`，顺序 Nice → Great → Amazing → Wow，句间额外留 550ms。它与四条独立音效使用同一母版。

## 处理

- 源音频 48kHz 双声道，左右相关系数约 0.9976；合为居中的单声道。
- 原始录音底噪约 −73.9dBFS，无削波。仅做 65Hz 高通去除低频成分，不使用强降噪或噪声门。
- 每条保留约 50ms 头部余量和约 100ms 尾部余量，在非发声边缘做 5ms 淡入、20ms 淡出。
- 使用双遍 EBU R128 响度测量与线性增益，统一至约 −18LUFS；未使用动态压缩。真峰值上限设为 −1.5dBTP，实际最高约 −5.3dBTP，无需限幅。
- WAV 为 48kHz、单声道、24bit PCM；MP3 为 48kHz、单声道、192kbps。输出不保留源容器元数据。
- 保留语速、音高和原有语气，没有变调、变速、混响、音乐或额外配音。

`takes/` 为未做响度处理的裁切，`analysis/source-mono.wav` 为解码单声道中间文件，`analysis/` 保存测量记录。`manifest.json` 记录裁切参数与文件哈希。运行 `python3 process.py` 可从保存的完整录音重建衍生产物，仅覆盖本目录生成的裁切、母版、试听与记录，不修改原录音。

## 核验

| 词句 | WAV 响度 | WAV 真峰值 |
| --- | --- | --- |
| Nice | −18.03LUFS | −6.09dBTP |
| Great | −18.00LUFS | −5.42dBTP |
| Amazing | −17.99LUFS | −6.77dBTP |
| Wow | −18.05LUFS | −5.32dBTP |

四条 WAV 响度最大相差 0.06LU；MP3 经独立复测约为 −18.24～−18.27LUFS。所有独立文件和合并试听均能解码、无削波；切口处无量测上可见的发声截断。以上为文件与信号核验，最终听感请由用户试听评审。
