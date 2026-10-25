import assert from 'node:assert/strict';
import { test } from 'node:test';
import { setTimeout as sleep } from 'node:timers/promises';
import { runStage } from './load-read.mjs';

const config = { origin: 'http://127.0.0.1', paths: ['/api/manager', '/api/version'], rate: 100, concurrency: 2, seconds: .08 };

test('按路径统计完成的 GET 请求，读取响应体', async () => {
  const result = await runStage(config, async (_url, options) => {
    assert.equal(options.method, 'GET');
    assert.equal(options.redirect, 'error');
    return new Response('abc');
  });
  assert.equal(result.requests, 8);
  assert.equal(result.errors, 0);
  assert.equal(result.skipped, 0);
  assert.equal(result.stopped, null);
  assert.deepEqual(result.routes.map(route => [route.requests, route.bytes]), [[4, 12], [4, 12]]);
});

test('慢响应时严格限制在途请求，并记录无法发出的负载', async () => {
  let active = 0;
  let peak = 0;
  const result = await runStage(config, async () => {
    active++;
    peak = Math.max(peak, active);
    await sleep(40);
    active--;
    return new Response('ok');
  });
  assert.equal(peak, 2);
  assert.ok(result.skipped > 0);
  assert.equal(result.requests + result.skipped, 8);
  assert.equal(active, 0);
});

test('收到限流响应立即停止新增压力', async () => {
  const result = await runStage(config, async () => new Response('', { status: 429 }));
  assert.equal(result.stopped, 'error_budget');
  assert.equal(result.requests, 1);
  assert.equal(result.errors, 1);
});

test('连续连接失败触发停止，报告不丢失失败样本', async () => {
  const result = await runStage(config, async () => { throw new Error('unreachable'); });
  assert.equal(result.stopped, 'error_budget');
  assert.equal(result.errors, 3);
  assert.equal(result.requests, 3);
  assert.ok(result.samples.every(sample => sample.error === 'Error' && sample.status === 0));
});

test('低速阶段等待完整计划窗口，快速响应不夸大吞吐', async () => {
  const result = await runStage({ ...config, rate: 1, seconds: 1, concurrency: 1 }, async () => new Response('ok'));
  assert.equal(result.requests, 1);
  assert.ok(result.seconds >= 1);
  assert.ok(result.achievedRps <= 1);
});
