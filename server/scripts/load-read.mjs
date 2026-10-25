import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { pathToFileURL } from 'node:url';
import { setTimeout as sleep } from 'node:timers/promises';

const percentile = (values, p) => values.length ? [...values].sort((a, b) => a - b)[Math.ceil(values.length * p) - 1] : null;
const round = n => Math.round(n * 10) / 10;

/** 固定到达速率、限制在途请求；达到错误或延迟预算即停止发起新请求。 */
export async function runStage({ origin, paths, rate, concurrency, seconds, timeoutMs = 5000 }, fetchImpl = fetch) {
  const samples = [];
  const pending = new Set();
  let skipped = 0;
  let errors = 0;
  let consecutiveErrors = 0;
  let stopped = null;
  let next = 0;
  const start = performance.now();
  for (let i = 0; i < Math.ceil(rate * seconds); i++) {
    await sleep(Math.max(0, start + i * 1000 / rate - performance.now()));
    if (stopped) break;
    if (pending.size >= concurrency) { skipped++; continue; }
    const path = paths[next++ % paths.length];
    const job = (async () => {
      const at = performance.now();
      let status = 0;
      let bytes = 0;
      let error;
      try {
        const response = await fetchImpl(new URL(path, origin), {
          method: 'GET', signal: AbortSignal.timeout(timeoutMs),
          headers: { 'user-agent': 'MoeGo-Pet-Match-Loadtest/1.0' },
          redirect: 'error',
        });
        status = response.status;
        bytes = (await response.arrayBuffer()).byteLength;
      } catch (cause) {
        error = cause.cause?.code ?? cause.name;
      }
      const failed = status !== 200 || !!error;
      if (failed) { errors++; consecutiveErrors++; } else { consecutiveErrors = 0; }
      samples.push({ path, status, ms: round(performance.now() - at), bytes, ...(error ? { error } : {}) });
      if (status === 429 || consecutiveErrors >= 3 || (errors >= 3 && errors / samples.length > 0.05)) stopped = 'error_budget';
      if (samples.length >= 20 && percentile(samples.map(s => s.ms), .95) > 2000) stopped ??= 'latency_budget';
    })();
    pending.add(job);
    void job.finally(() => pending.delete(job));
  }
  await Promise.all(pending);
  const completedAt = performance.now();
  const end = start + seconds * 1000;
  while (!stopped && performance.now() < end) await sleep(Math.ceil(end - performance.now()));
  const latencies = samples.map(s => s.ms);
  const elapsed = performance.now() - start;
  return {
    rate, concurrency, plannedSeconds: seconds, seconds: round(elapsed / 1000),
    drainMs: round(Math.max(0, completedAt - end)), requests: samples.length, skipped, errors, stopped,
    achievedRps: round(samples.length / (elapsed / 1000)),
    p50: percentile(latencies, .5), p95: percentile(latencies, .95), p99: percentile(latencies, .99),
    routes: paths.map(path => {
      const items = samples.filter(s => s.path === path);
      return { path, requests: items.length, errors: items.filter(s => s.status !== 200 || s.error).length,
        p50: percentile(items.map(s => s.ms), .5), p95: percentile(items.map(s => s.ms), .95),
        bytes: items.reduce((sum, s) => sum + s.bytes, 0) };
    }),
    samples,
  };
}

async function main() {
  const { values } = parseArgs({ options: {
    url: { type: 'string', default: 'http://127.0.0.1:8787' },
    rates: { type: 'string', default: '2,10,25' },
    concurrency: { type: 'string', default: '40' },
    seconds: { type: 'string', default: '12' },
    output: { type: 'string' },
  } });
  const target = new URL(values.url);
  if (!['http:', 'https:'].includes(target.protocol) || target.username || target.password || target.pathname !== '/' || target.search || target.hash) {
    throw new Error('--url must be an HTTP(S) origin without credentials, path, query or fragment');
  }
  const rates = values.rates.split(',').map(Number);
  const seconds = Number(values.seconds);
  const maxConcurrency = Number(values.concurrency);
  if (!rates.length || rates.some(rate => !Number.isInteger(rate) || rate < 1 || rate > 100) ||
      !Number.isInteger(seconds) || seconds < 1 || seconds > 60 ||
      !Number.isInteger(maxConcurrency) || maxConcurrency < 1 || maxConcurrency > 40 ||
      rates.reduce((sum, rate) => sum + rate * seconds, 0) > 10_000) {
    throw new Error('Limits: 1–100 requests/s, 1–40 in flight, 1–60 seconds/stage, <=10000 total requests');
  }
  const json = async path => {
    const response = await fetch(new URL(path, target), { redirect: 'error', signal: AbortSignal.timeout(8000) });
    if (!response.ok) throw new Error(`Preflight ${path}: HTTP ${response.status}`);
    return response.json();
  };
  const version = await json('/api/version');
  const manager = await json('/api/manager');
  if (typeof manager.pet?.petId !== 'string') throw new Error('No published daily manager');
  const paths = ['/api/manager', '/api/leaderboard?mode=normal&scope=today', '/api/leaderboard?mode=normal&scope=all',
    `/img/pets/${encodeURIComponent(manager.pet.petId)}/128`, '/api/version'];
  const report = { startedAt: new Date().toISOString(), origin: target.origin, version, stages: [] };
  await json('/api/health');
  for (const rate of rates) {
    const stage = await runStage({ origin: target.origin, paths, rate, concurrency: Math.min(maxConcurrency, Math.max(2, Math.ceil(rate / 2))), seconds });
    report.stages.push(stage);
    console.log(JSON.stringify({ ...stage, samples: undefined }));
    if (stage.stopped) break;
    await sleep(1000);
  }
  try { report.healthAfter = await json('/api/health'); } catch { report.healthAfter = { ok: false }; }
  const output = resolve(values.output ?? `../data/performance/load-${Date.now()}.json`);
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, JSON.stringify(report, null, 2) + '\n');
  console.log(`Report: ${output}`);
  if (report.stages.some(stage => stage.stopped || stage.errors) || !report.healthAfter.ok) process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
