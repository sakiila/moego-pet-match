/**
 * 成片响度标准化：ffmpeg loudnorm 两遍处理，目标 −14 LUFS、真峰值 −1 dBTP，画面直接复制不重编码。
 * 用法：node scripts/loudnorm.mjs <输入.mp4> <输出.mp4>
 */
import { execFileSync, spawnSync } from 'node:child_process';

const [input, output] = process.argv.slice(2);
if (!input || !output) throw new Error('用法：node scripts/loudnorm.mjs <输入.mp4> <输出.mp4>');
const TARGET = 'I=-14:TP=-1:LRA=11';

// ffmpeg 把测量结果打印在 stderr 末尾的 JSON 里
const pass1 = spawnSync('ffmpeg', ['-hide_banner', '-i', input, '-af', `loudnorm=${TARGET}:print_format=json`, '-f', 'null', '-'], { encoding: 'utf8' }).stderr;
const m = JSON.parse(pass1.slice(pass1.lastIndexOf('{'), pass1.lastIndexOf('}') + 1));
const measured = `measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}`;
execFileSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-i', input, '-c:v', 'copy', '-af', `loudnorm=${TARGET}:${measured}:linear=true`, '-ar', '48000', '-c:a', 'aac', '-b:a', '256k', output]);
console.log(`响度 ${m.input_i} LUFS → 目标 −14 LUFS：${output}`);
