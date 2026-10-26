import { describe, expect, it } from 'vitest';
import { requestBudget } from '../src/services/requestBudget.ts';
describe('写接口突发限流', () => {
  it('按来源分开计数，窗口后恢复', () => {
    const take = requestBudget(2, 10_000);
    expect(take('a', 0)).toBeNull(); expect(take('a', 0)).toBeNull(); expect(take('a', 1)).toBe(10);
    expect(take('b', 1)).toBeNull(); expect(take('a', 10_000)).toBeNull();
  });
  it('容量满时拒绝新来源，过期后释放，已有来源继续计数', () => {
    const take = requestBudget(2, 10_000, 2);
    expect(take('a', 0)).toBeNull(); expect(take('b', 0)).toBeNull(); expect(take('c', 0)).toBe(10);
    expect(take('a', 1)).toBeNull(); expect(take('a', 2)).toBe(10); expect(take('c', 10_000)).toBeNull();
  });
});
