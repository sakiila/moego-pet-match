import { describe, expect, it } from 'vitest';
import type { AchievementStatus } from '../../api/types';
import { pickNextUp } from '../nextUp';

const status = (over: Partial<Record<AchievementStatus['id'], Partial<AchievementStatus>>> = {}, total = 80): AchievementStatus[] => {
  const base: AchievementStatus[] = [
    { id: 'cats', current: 0, target: 5, unlockedAt: null },
    { id: 'dogs', current: 0, target: 5, unlockedAt: null },
    { id: 'friends', current: 0, target: 10, unlockedAt: null },
    { id: 'species', current: 0, target: 3, unlockedAt: null },
    { id: 'neighbors', current: 0, target: 10, unlockedAt: null },
    { id: 'family', current: 0, target: 1, unlockedAt: null },
    { id: 'album', current: 0, target: total, unlockedAt: null },
  ];
  return base.map((s) => ({ ...s, ...over[s.id] }));
};
const unlocked = { fishUnlocked: true, completedNormalGames: 9 };

describe('下一件事：优先级', () => {
  it('未解锁鱼关且还差 1–2 局时先报鱼关，不管成就多近', () => {
    const near = status({ cats: { current: 4 } });
    expect(pickNextUp({ progress: { completedNormalGames: 2, fishUnlocked: false }, achievements: near })).toEqual({ kind: 'fish', rounds: 1 });
    expect(pickNextUp({ progress: { completedNormalGames: 1, fishUnlocked: false }, achievements: near })).toEqual({ kind: 'fish', rounds: 2 });
  });

  it('零局（本局未计入）或已解锁时不报鱼关', () => {
    expect(pickNextUp({ progress: { completedNormalGames: 0, fishUnlocked: false }, achievements: null })).toEqual({ kind: 'tomorrow' });
    expect(pickNextUp({ progress: { completedNormalGames: 2, fishUnlocked: true }, achievements: null })).toEqual({ kind: 'tomorrow' });
  });

  it('取差得最少的未解锁成就，平手按成就表顺序', () => {
    const a = status({ cats: { current: 3 }, dogs: { current: 4 }, friends: { current: 9 } });
    expect(pickNextUp({ progress: unlocked, achievements: a })).toEqual({ kind: 'achievement', id: 'dogs', remaining: 1 });
    const tie = status({ cats: { current: 3 }, dogs: { current: 3 } });
    expect(pickNextUp({ progress: unlocked, achievements: tie })).toEqual({ kind: 'achievement', id: 'cats', remaining: 2 });
  });

  it('已解锁的成就与差得太多的不算', () => {
    const a = status({ cats: { current: 5, unlockedAt: '2026-10-24T00:00:00Z' }, dogs: { current: 1 } });
    expect(pickNextUp({ progress: unlocked, achievements: a }).kind).not.toBe('achievement');
  });

  it('全员点名作为成就预告（差 ≤ 3 只）', () => {
    const a = status({ album: { current: 78 } });
    expect(pickNextUp({ progress: unlocked, achievements: a })).toEqual({ kind: 'achievement', id: 'album', remaining: 2 });
  });

  it('图鉴里程碑：按总数取整，差 ≤ 5 只才报', () => {
    // 80 只：25% = 20，50% = 40，75% = 60
    expect(pickNextUp({ progress: unlocked, achievements: status({ album: { current: 17 } }) })).toEqual({ kind: 'milestone', percent: 25, remaining: 3 });
    expect(pickNextUp({ progress: unlocked, achievements: status({ album: { current: 36 } }) })).toEqual({ kind: 'milestone', percent: 50, remaining: 4 });
    expect(pickNextUp({ progress: unlocked, achievements: status({ album: { current: 59 } }) })).toEqual({ kind: 'milestone', percent: 75, remaining: 1 });
    expect(pickNextUp({ progress: unlocked, achievements: status({ album: { current: 10 } }) })).toEqual({ kind: 'tomorrow' });
    // 81 只：25% 向上取整为 21
    expect(pickNextUp({ progress: unlocked, achievements: status({ album: { current: 20 } }, 81) })).toEqual({ kind: 'milestone', percent: 25, remaining: 1 });
  });

  it('刚过里程碑（差 0）不重复报，看下一个', () => {
    expect(pickNextUp({ progress: unlocked, achievements: status({ album: { current: 20 } }) })).toEqual({ kind: 'tomorrow' });
  });

  it('成就比里程碑优先', () => {
    const a = status({ cats: { current: 4 }, album: { current: 19 } });
    expect(pickNextUp({ progress: unlocked, achievements: a })).toEqual({ kind: 'achievement', id: 'cats', remaining: 1 });
  });

  it('「一家都熟」0 / 1 不算差 1，不参与预告；零进度的成就也不算近', () => {
    expect(pickNextUp({ progress: unlocked, achievements: status() })).toEqual({ kind: 'tomorrow' });
    expect(pickNextUp({ progress: unlocked, achievements: status({ species: { current: 0 } }) })).toEqual({ kind: 'tomorrow' });
    expect(pickNextUp({ progress: unlocked, achievements: status({ species: { current: 1 } }) })).toEqual({ kind: 'achievement', id: 'species', remaining: 2 });
  });

  it('成就读取失败只剩鱼关与兜底', () => {
    expect(pickNextUp({ progress: unlocked, achievements: null })).toEqual({ kind: 'tomorrow' });
  });
});
