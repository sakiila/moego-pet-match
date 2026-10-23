import { describe, expect, it } from 'vitest';
import type { Batch } from '../../engine';
import { batchFeedback, createLimiter, FEEDBACK_GAP_MS } from '../feedback';
import { defaultPreferences, loadPreferences, savePreferences } from '../preferences';

const batch = (over: Partial<Batch> = {}): Batch =>
  ({
    index: 1,
    seq: 1,
    multiplier: 1,
    startAt: 0,
    settleAt: 100,
    effect: 'match',
    groups: [],
    combo: null,
    toolsFired: [],
    cleared: [],
    spawned: [],
    score: 30,
    rushProgress: null,
    servedByKind: [3, 0, 0, 0, 0, 0],
    rushBonus: false,
    boardAfter: [],
    ...over,
  }) as Batch;

describe('批次反馈', () => {
  it('普通消除：短「啵」+ 一次短点；连锁时音调随批序逐级上扬', () => {
    expect(batchFeedback(batch())).toEqual({ sound: 'pop', step: 0, haptic: 'tap' });
    expect(batchFeedback(batch({ index: 2 })).step).toBe(1);
    expect(batchFeedback(batch({ index: 3 })).step).toBe(2);
  });

  it('梳子「刷」、剪刀「咔嚓」', () => {
    expect(batchFeedback(batch({ effect: 'comb' })).sound).toBe('brush');
    expect(batchFeedback(batch({ effect: 'scissors' })).sound).toBe('snip');
  });

  it('合体只出一个主音，用短双点', () => {
    for (const effect of ['comboCC', 'comboCS', 'comboSS'] as const) expect(batchFeedback(batch({ effect }))).toMatchObject({ sound: 'combo', haptic: 'double' });
  });

  it('第 3 批以后的连锁用短双点', () => {
    expect(batchFeedback(batch({ index: 2 })).haptic).toBe('tap');
    expect(batchFeedback(batch({ index: 3 })).haptic).toBe('double');
  });

  it('限频：间隔不足时同一时刻的多个批次只放一次', () => {
    const allow = createLimiter(FEEDBACK_GAP_MS);
    expect(allow(1000)).toBe(true);
    expect(allow(1000)).toBe(false);
    expect(allow(1000 + FEEDBACK_GAP_MS - 1)).toBe(false);
    expect(allow(1000 + FEEDBACK_GAP_MS)).toBe(true);
  });
});

describe('声音与轻震偏好', () => {
  const memory = () => {
    const m = new Map<string, string>();
    return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) };
  };

  it('首次：音乐与音效关；支持震动时轻震开，不支持时关', () => {
    expect(defaultPreferences(true)).toEqual({ music: false, sfx: false, haptics: true });
    expect(defaultPreferences(false)).toEqual({ music: false, sfx: false, haptics: false });
    expect(loadPreferences(memory(), true)).toEqual({ music: false, sfx: false, haptics: true });
  });

  it('记住选择：关掉轻震、打开音效后再读取保持不变', () => {
    const store = memory();
    savePreferences(store, { music: false, sfx: true, haptics: false });
    expect(loadPreferences(store, true)).toEqual({ music: false, sfx: true, haptics: false });
  });

  it('存储不可用或内容损坏时回到默认，不报错', () => {
    const broken = { getItem: () => { throw new Error('denied'); }, setItem: () => { throw new Error('denied'); } };
    expect(loadPreferences(broken, true)).toEqual(defaultPreferences(true));
    expect(() => savePreferences(broken, defaultPreferences(true))).not.toThrow();
    const junk = memory();
    junk.setItem('pet-match.sound', '{not json');
    expect(loadPreferences(junk, false)).toEqual(defaultPreferences(false));
  });

  it('设备不支持震动时，即使之前存过轻震开也按关处理', () => {
    const store = memory();
    savePreferences(store, { music: true, sfx: true, haptics: true });
    expect(loadPreferences(store, false).haptics).toBe(false);
  });
});
