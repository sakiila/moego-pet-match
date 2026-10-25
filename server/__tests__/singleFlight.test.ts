import { expect, it } from 'vitest';
import { singleFlight } from '../src/services/singleFlight.ts';

it('成功只合并在途请求，之后重新读取，不长期缓存结果', async () => {
  const run = singleFlight<number>();
  let calls = 0;
  const load = async () => ++calls;
  const a = run('same', load);
  const b = run('same', load);
  expect(a).toBe(b);
  expect(await a).toBe(1);
  expect(await run('same', load)).toBe(2);
});

it('失败释放在途记录，允许下一次重试', async () => {
  const run = singleFlight<number>();
  const a = run('same', async () => { throw new Error('offline'); });
  const b = run('same', async () => 9);
  expect(a).toBe(b);
  const outcomes = await Promise.allSettled([a, b]);
  expect(outcomes.every(result => result.status === 'rejected')).toBe(true);
  expect(await run('same', async () => 9)).toBe(9);
});

it('不同玩家或内容的请求键独立执行', async () => {
  const run = singleFlight<number>();
  const outcomes = await Promise.all([run('player-a', async () => 1), run('player-b', async () => 2)]);
  expect(outcomes).toEqual([1, 2]);
});
