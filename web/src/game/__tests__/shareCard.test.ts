import { describe, expect, it } from 'vitest';
import type { GameSummary } from '../../engine';
import { translate } from '../../i18n';
import type { PetInfo } from '../pets';
import { managerPosterModel, shareCardModel } from '../shareCard';

const pets: PetInfo[] = [0, 1, 2, 3, 4, 5].map((i) => ({ id: `pet_${i}`, name: `Pet${i}`, imageBase: `/img/pets/pet_${i}`, emoji: '🐾' }));
const fish: PetInfo[] = [
  { id: 'fish_color_blue', name: '天蓝色', nameEn: 'Sky Blue', imageBase: '/img/fish/fish_color_blue', emoji: '🐟' },
  ...[1, 2, 3, 4, 5].map((i) => ({ id: `fish_${i}`, name: `鱼${i}`, nameEn: `Fish ${i}`, imageBase: `/img/fish/fish_${i}`, emoji: '🐟' })),
];
const summary = (over: Partial<GameSummary> = {}): GameSummary => ({
  score: 2480,
  clearedCells: 120,
  clearedByMultiplier: [100, 20, 0, 0, 0],
  maxChain: 3,
  toolsFired: 1,
  combos: { cc: 0, cs: 0, dryer: 0 },
  validMoves: 30,
  actedInLastSeconds: false,
  rushSucceeded: true,
  pets: [0, 1, 2, 3, 4, 5].map((order) => ({ id: `pet_${order}`, order, served: order === 2 ? 40 : 10, firstServedSeq: 1 })),
  ...over,
});
const zero = (s: GameSummary): GameSummary => ({ ...s, score: 0, clearedCells: 0, maxChain: 0, toolsFired: 0, rushSucceeded: false, pets: s.pets.map((p) => ({ ...p, served: 0, firstServedSeq: null })) });
const manager = { date: '2026-10-23', pet: { petId: 'pet_mgr', name: 'Sanxian' } };
const zh = (key: Parameters<typeof translate>[1], vars?: Record<string, string | number>) => translate('zh', key, vars);
const en = (key: Parameters<typeof translate>[1], vars?: Record<string, string | number>) => translate('en', key, vars);

describe('成绩卡内容', () => {
  it('普通局：MVP 贴纸与名牌、评语、称号、分数与原对局玩家署名，均复用本局判定', () => {
    const m = shareCardModel({ summary: summary(), pets, mode: 'normal', playerName: 'Bob 包博', manager, locale: 'zh', t: zh });
    expect(m.hero).toEqual({ src: '/img/pets/pet_2/1024', label: '本局 MVP：Pet2', kind: 'mvp' });
    expect(m.review).toBe('临时加单？安排得明明白白。');
    expect(m.title).toBe('急什么我会消');
    expect(m.titleStamp).toMatch(/03-got-this-zh/);
    expect(m.mode).toBe('宠物店');
    expect(m.score).toBe('2,480');
    expect(m.scoreLabel).toBe('本局得分');
    expect(m.player).toBe('本局玩家：Bob 包博');
    expect(m.brand).toEqual({ lead: '毛孩子', accent: '全明星' });
  });

  it('鱼关：MVP 用鱼色类别名并跟随语言，模式牌为鱼关卡', () => {
    const s = summary({ pets: summary().pets.map((p, i) => ({ ...p, id: fish[i].id, served: i === 0 ? 50 : 5 })) });
    const zhCard = shareCardModel({ summary: s, pets: fish, mode: 'fish', playerName: 'Bob', manager, locale: 'zh', t: zh });
    expect(zhCard.hero).toEqual({ src: '/img/fish/fish_color_blue/1024', label: '本局 MVP：天蓝色', kind: 'mvp' });
    expect(zhCard.mode).toBe('鱼关卡');
    expect(zhCard.review).toBe('小鱼加急，水到渠成。');
    const enCard = shareCardModel({ summary: s, pets: fish, mode: 'fish', playerName: 'Bob', manager, locale: 'en', t: en });
    expect(enCard.hero?.label).toBe("This Round's MVP: Sky Blue");
    expect(enCard.score).toBe('2,480');
  });

  it('普通局零服务：不编造 MVP，由今日店长承接', () => {
    const m = shareCardModel({ summary: zero(summary()), pets, mode: 'normal', playerName: 'Bob', manager, locale: 'zh', t: zh });
    expect(m.hero).toEqual({ src: '/img/pets/pet_mgr/1024', label: '今日店长 · Sanxian', kind: 'manager' });
    expect(m.review).toBe('没关系，店长陪你热个身。');
    expect(m.score).toBe('0');
  });

  it('零服务且店长读取失败：只留评语，不放主角图', () => {
    const m = shareCardModel({ summary: zero(summary()), pets, mode: 'normal', playerName: 'Bob', manager: null, locale: 'zh', t: zh });
    expect(m.hero).toBeNull();
    expect(m.review).toBe('没关系，店长陪你热个身。');
  });

  it('鱼关零服务：不用店长，只留评语', () => {
    const m = shareCardModel({ summary: zero(summary()), pets: fish, mode: 'fish', playerName: 'Bob', manager, locale: 'zh', t: zh });
    expect(m.hero).toBeNull();
    expect(m.review).toBe('先熟悉一下水流，下局再露一手。');
  });
});

describe('原 MVP 已下架', () => {
  it('主角改为通用 MoeGo 图案与「本局成绩」，不另选 MVP；分数、称号、评语与署名保留', () => {
    const m = shareCardModel({ summary: summary(), pets, mode: 'normal', playerName: 'Bob', manager, locale: 'zh', t: zh, removed: new Set(['pet_2']) });
    expect(m.hero).toEqual({ src: null, label: '本局成绩', kind: 'generic' });
    expect(m.title).toBe('急什么我会消');
    expect(m.review).toBe('临时加单？安排得明明白白。');
    expect(m.score).toBe('2,480');
    expect(m.player).toBe('本局玩家：Bob');
  });

  it('下架的不是 MVP 时照常显示 MVP', () => {
    const m = shareCardModel({ summary: summary(), pets, mode: 'normal', playerName: 'Bob', manager, locale: 'zh', t: zh, removed: new Set(['pet_0']) });
    expect(m.hero?.kind).toBe('mvp');
  });
});

describe('店长小海报内容', () => {
  it('店长贴纸、名牌、宣言与北京日期（中文）', () => {
    const m = managerPosterModel({ manager, t: zh, locale: 'zh' });
    expect(m.hero).toEqual({ src: '/img/pets/pet_mgr/1024', label: '今日店长 · Sanxian', kind: 'manager' });
    expect(m.mode).toBe('今日店长');
    expect(m.line).toBe('你负责排班，我负责可爱。');
    expect(m.date).toBe('2026 年 10 月 23 日 · 北京时间');
  });

  it('英文日期用月份名，日期按服务端的北京日期，不受本机时区影响', () => {
    const m = managerPosterModel({ manager: { ...manager, date: '2026-01-05' }, t: en, locale: 'en' });
    expect(m.date).toBe('January 5, 2026 · Beijing Time');
    expect(m.line).toBe("You handle the schedule. I'll bring the cuteness.");
  });
});
