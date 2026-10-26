/**
 * 宣传片真机录屏：390 × 844、3 倍像素，用 Chrome DevTools 屏幕帧流逐帧抓图，ffmpeg 合成 60fps 视频。
 * 录制从准备页开始，棋盘由开发环境的 ?demo= 自动走完整局，进报告页后慢慢滚到底（猜主人卡）。
 *
 * 前置：本地 Postgres、server（8787）与 web（5180）开发服务已启动；会向本地开发库写一条对局记录。
 * 用法：npm run record -- [--demo 135] [--play 2] [--lang zh|en] [--player <Slack User ID>] [--base http://localhost:5180]
 * 产物：public/recordings/<demo>-<play>-<lang>/{game.mp4, timing.json}（不进 git）
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { chromium } from 'playwright';

const { values: args } = parseArgs({
  options: {
    demo: { type: 'string', default: '135' },
    play: { type: 'string', default: '2' },
    lang: { type: 'string', default: 'zh' },
    player: { type: 'string', default: 'U03FPQWGTN2' },
    base: { type: 'string', default: 'http://localhost:5180' },
  },
});

const VIEWPORT = { width: 390, height: 844 };
const SCALE = 3;
const FPS = 60;
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'public/recordings', `${args.demo}-${args.play}-${args.lang}`);
const framesDir = join(out, 'frames');
rmSync(out, { recursive: true, force: true });
mkdirSync(framesDir, { recursive: true });

// 无头模式下帧流默认按 CSS 像素出图，强制设备缩放后才是 3 倍高清帧
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: [`--force-device-scale-factor=${SCALE}`] });
const context = await browser.newContext({
  viewport: VIEWPORT,
  deviceScaleFactor: SCALE,
  isMobile: true,
  hasTouch: true,
  locale: args.lang === 'en' ? 'en-US' : 'zh-CN',
  reducedMotion: 'no-preference',
});
// 全新的浏览器档案：带教提示照常出现；跳过首页声音提示
await context.addInitScript(([player, lang]) => {
  localStorage.setItem('pet-match.player', player);
  localStorage.setItem('pet-match.locale', lang);
  localStorage.setItem('pet-match.sound-tip-seen', '1');
}, [args.player, args.lang]);
const page = await context.newPage();
page.on('console', (m) => m.type() === 'warning' && m.text().startsWith('[demo]') && console.warn(m.text()));

await page.goto(`${args.base}/?demo=${args.demo}&play=${args.play}`);
await page.getByTestId('open-shop').click();
const start = page.getByTestId('start');
await start.waitFor();
await page.waitForFunction(() => !document.querySelector('[data-testid="start"]')?.hasAttribute('disabled'));

// 屏幕帧流：只在画面变化时出帧，时间戳为墙钟秒，后面按时间戳补成固定帧率
const cdp = await context.newCDPSession(page);
const frames = [];
cdp.on('Page.screencastFrame', ({ data, metadata, sessionId }) => {
  const file = `${String(frames.length).padStart(6, '0')}.jpg`;
  writeFileSync(join(framesDir, file), Buffer.from(data, 'base64'));
  frames.push({ file, t: metadata.timestamp });
  void cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {});
});
await cdp.send('Page.startScreencast', {
  format: 'jpeg',
  quality: 95,
  maxWidth: VIEWPORT.width * SCALE,
  maxHeight: VIEWPORT.height * SCALE,
  everyNthFrame: 1,
});
const epochNow = () => page.evaluate(() => performance.timeOrigin + performance.now());

await page.waitForTimeout(1000);
const startClickedAt = await epochNow();
await start.click();

// 整局 90 秒 + 收工挂牌，等报告页出现
await page.getByTestId('play-again').waitFor({ timeout: 150_000 });
const reportAt = await epochNow();
const demo = await page.evaluate(() => ({ ...window.__petMatchDemo, timeOrigin: performance.timeOrigin }));
await page.waitForTimeout(3000);
// 慢慢滚到报告底部（猜主人卡）
for (let i = 0; i < 40; i++) {
  await page.mouse.wheel(0, 50);
  await page.waitForTimeout(60);
}
await page.waitForTimeout(3000);
await cdp.send('Page.stopScreencast');
await browser.close();

if (demo.status !== 'done') console.warn(`演示状态 ${demo.status}：终局 ${demo.finalScore}，计划 ${demo.plan?.summary.score}`);

// 按时间戳给每帧定时长，ffmpeg 补成固定 60fps
const t0 = frames[0].t;
const list = frames
  .map((f, i) => `file 'frames/${f.file}'\nduration ${((frames[i + 1]?.t ?? f.t + 1 / FPS) - f.t).toFixed(6)}`)
  .concat(`file 'frames/${frames.at(-1).file}'`)
  .join('\n');
writeFileSync(join(out, 'frames.txt'), list);
execFileSync('ffmpeg', [
  '-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', 'frames.txt',
  '-vf', `fps=${FPS}`, '-c:v', 'libx264', '-preset', 'slow', '-crf', '14', '-pix_fmt', 'yuv420p', 'game.mp4',
], { cwd: out });

/** 棋盘段的帧间隔（毫秒）：中位数与最大值，用来判断有没有掉帧。 */
function frameGaps(from, to) {
  const ts = frames.map((f) => f.t - t0).filter((t) => t >= from && t <= to);
  const gaps = ts.slice(1).map((t, i) => (t - ts[i]) * 1000).sort((a, b) => a - b);
  return { median: +gaps[gaps.length >> 1].toFixed(1), p95: +gaps[Math.floor(gaps.length * 0.95)].toFixed(1), max: +gaps.at(-1).toFixed(1) };
}

// 时间对齐：所有时刻换算成成片素材里的秒数
const sec = (epochMs) => +((epochMs / 1000 - t0)).toFixed(3);
const moves = demo.log.map((entry) => {
  const move = demo.plan.moves[entry.index];
  const swapAt = sec(demo.timeOrigin + entry.wall);
  return {
    index: entry.index,
    swapAt,
    /** 连消结束、喝彩出现的时刻（游戏时钟与墙钟同速，期间无洗牌暂停）。 */
    settledAt: +(swapAt + (move.busyUntil - entry.g) / 1000).toFixed(3),
    from: entry.from,
    to: entry.to,
    cheer: move.cheer,
    chain: move.chain,
    score: move.score,
    toolsSpawned: move.toolsSpawned,
    effects: move.effects,
    rushBonus: move.rushBonus,
  };
});
const timing = {
  demo: Number(args.demo),
  play: Number(args.play),
  lang: args.lang,
  size: { width: VIEWPORT.width * SCALE, height: VIEWPORT.height * SCALE },
  fps: FPS,
  duration: +(frames.at(-1).t - t0).toFixed(3),
  capturedFrames: frames.length,
  status: demo.status,
  finalScore: demo.finalScore,
  marks: { startClicked: sec(startClickedAt), report: sec(reportAt) },
  boardFrameGaps: frameGaps(sec(startClickedAt), sec(reportAt)),
  moves,
};
writeFileSync(join(out, 'timing.json'), JSON.stringify(timing, null, 2));
rmSync(framesDir, { recursive: true });
rmSync(join(out, 'frames.txt'));
console.log(`录好 ${join(out, 'game.mp4')}：${timing.duration}s，抓到 ${frames.length} 帧（平均 ${(frames.length / timing.duration).toFixed(1)} fps），演示 ${demo.status}，终局 ${demo.finalScore}；棋盘段帧间隔 ${JSON.stringify(timing.boardFrameGaps)}ms`);
