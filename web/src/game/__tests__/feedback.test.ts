import { describe, expect, it } from 'vitest';
import type { Batch } from '../../engine';
import { batchFeedback, batchLevel, clearHoldMs, createLimiter, FEEDBACK_GAP_MS, hapticFor, impactOf, particlesPerCell } from '../feedback';
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

describe('强度等级', () => {
  it('等级就是批次倍率 ×1–×5', () => {
    for (const m of [1, 2, 3, 4, 5]) expect(batchLevel(batch({ multiplier: m, index: m }))).toBe(m);
  });

  it('双道具合体与吹风机直接按 ×5', () => {
    for (const effect of ['comboCC', 'comboCS', 'dryer'] as const) expect(batchLevel(batch({ effect, multiplier: 1 }))).toBe(5);
  });

  it('清除定格：×3 起 50 / 70 / 90 ms，低于 ×3 为 0', () => {
    expect([1, 2, 3, 4, 5].map(clearHoldMs)).toEqual([0, 0, 50, 70, 90]);
  });

  it('震屏：×4 轻挤压，×5 挤压加抖动，以下没有', () => {
    expect([1, 2, 3, 4, 5].map(impactOf)).toEqual(['none', 'none', 'none', 'punch', 'shake']);
  });

  it('震动与粒子按等级递增', () => {
    expect([1, 2, 3, 4, 5].map(hapticFor)).toEqual(['tap', 'tap', 'double', 'strong', 'triple']);
    expect([1, 2, 3, 4, 5].map(particlesPerCell)).toEqual([3, 3, 4, 5, 6]);
  });
});

describe('批次反馈', () => {
  it('普通消除：短「啵」+ 一次短点；连锁时音调随批序逐级上扬', () => {
    expect(batchFeedback(batch())).toEqual({ sound: 'pop', step: 0, haptic: 'tap', level: 1 });
    expect(batchFeedback(batch({ index: 2, multiplier: 2 })).step).toBe(1);
    expect(batchFeedback(batch({ index: 3, multiplier: 3 })).step).toBe(2);
  });

  it('梳子「刷」、剪刀「咔嚓」', () => {
    expect(batchFeedback(batch({ effect: 'comb' })).sound).toBe('brush');
    expect(batchFeedback(batch({ effect: 'scissors' })).sound).toBe('snip');
  });

  it('合体只出一个主音，按 ×5 用三连点', () => {
    for (const effect of ['comboCC', 'comboCS', 'dryer'] as const) expect(batchFeedback(batch({ effect }))).toMatchObject({ sound: 'combo', haptic: 'triple', level: 5 });
  });

  it('震动随倍率：×3 双点，×4 重双点，×5 三连点', () => {
    expect(batchFeedback(batch({ index: 2, multiplier: 2 })).haptic).toBe('tap');
    expect(batchFeedback(batch({ index: 3, multiplier: 3 })).haptic).toBe('double');
    expect(batchFeedback(batch({ index: 4, multiplier: 4 })).haptic).toBe('strong');
    expect(batchFeedback(batch({ index: 6, multiplier: 5 })).haptic).toBe('triple');
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
