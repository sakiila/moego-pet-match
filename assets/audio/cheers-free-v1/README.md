# 免费英文喝彩候选 · v1

日期：2026-10-25。状态：**仅供试听，尚未选定或接入游戏。**

用户已选定经典消消乐的「英文人声＋弹跳字效」方向，并要求只考虑免费且授权清楚的素材。

## 来源与授权

作者：**Sadiquecat**。来源：[U67 Voice Acting – Generic NPC sounds and words](https://freesound.org/people/Sadiquecat/packs/43317/)。逐条源页均标记 **CC0**，并说明由作者本人录制。[CC0 许可](https://creativecommons.org/publicdomain/zero/1.0/)。

`source-previews/` 保存作者公开提供的完整 HQ MP3 预览，未剪词、未调音；它们不是原始 WAV。源页提供的原始 192kHz/24bit WAV 下载需要登录，本轮未取得原始 WAV。

`source-records/` 保存每条源页 HTML、下载记录 JSON 和总索引；原下载记录保留当时的临时路径。当前可用的相对路径、SHA256 和逐条来源见 `manifest.json`。这些文件只是来源证据，不作为可执行代码使用。

2026-10-25 发布核查时，已移除 HTML 中第三方网页自带的 Mapbox 访问令牌；未修改音频、来源、作者或许可信息。未改动的 HTML 原件仅保留在本地忽略目录 `data/deployment-audit/2026-10-25/freesound-original-html/`。

## 试听

| 文件 | 按顺序播放 | 处理 |
| --- | --- | --- |
| `auditions/cheers-main.wav` / `.mp3` | Nice 2 → Sweet 3 → That's awesome → Wow 2 | 完整单条依次拼接，间隔 600ms，开头 200ms、结尾 350ms 静音 |
| `auditions/cheers-variants.wav` / `.mp3` | Nice 1 → Sweet 1 → Sweet 4 → Woow | 相同方式，用于比较其余 take；不代表游戏触发顺序 |

制作时将完整 MP3 解码为 48kHz、单声道、16bit PCM，按上述间隔拼接。试听 WAV 为 PCM；MP3 试听另以 libmp3lame 160kbps 编码。未做均衡、变调、压缩、混响或音量调整。所有源文件完整保留。

## 候选清单

| 标题 | Freesound ID | 解码时长 |
| --- | --- | --- |
| Joyful – Nice 1 | [801284](https://freesound.org/people/Sadiquecat/sounds/801284/) | 0.631s |
| Joyful – Nice 2 | [801285](https://freesound.org/people/Sadiquecat/sounds/801285/) | 0.493s |
| Joyful – Sweet 1 | [801286](https://freesound.org/people/Sadiquecat/sounds/801286/) | 0.655s |
| Joyful – Sweet 3 | [801288](https://freesound.org/people/Sadiquecat/sounds/801288/) | 0.606s |
| Joyful – Sweet 4 | [801289](https://freesound.org/people/Sadiquecat/sounds/801289/) | 1.018s |
| Joyful – Thats awesome | [801290](https://freesound.org/people/Sadiquecat/sounds/801290/) | 0.782s |
| Surprised – Woow | [801211](https://freesound.org/people/Sadiquecat/sounds/801211/) | 0.725s |
| Surprised – Wow 2 | [801212](https://freesound.org/people/Sadiquecat/sounds/801212/) | 0.717s |

## 评审与排除记录

- 许可与文件：已核验逐条 CC0 标记、音频可解码、48kHz 单声道、时长和哈希。
- 表演：尚未经实际人耳试听确认。作者在源页自述初次配音、情绪略单调，并提示录音可能有 gate/pop；不能只凭「Joyful」标签认定适合最终效果。
- 这套没有单独的 Great / Amazing。可以考虑 Nice → Sweet → Awesome，清全盘用 Wow；词句替换和声线仍待试听选择，不在本轮默认为已批准。
- 未购买此前提到的 AudioJungle 素材；它们不符合本轮免费限制。
- Kenney Voiceover Pack 为 CC0，但词句与本轮喝彩需求不匹配；VoiceBosch Banter Man 的台词语气不适合本游戏，因此未选用。
- 没有使用其他商业游戏的录音，也没有采用系统朗读或声音克隆补词。

后续接入时沿用已讨论的单次操作最高档喝彩、现有音效开关和减少动态效果偏好；先确认本套声线与用词，再确定最终素材。
