import { describe, expect, it } from 'vitest';
import type { GameSummary } from '../../engine';
import { translate } from '../../i18n';
import type { PetInfo } from '../pets';
import { pickReview } from '../report';
import { managerPosterModel, shareCardModel } from '../shareCard';
import { HOTPOT_PETS } from '../achievementRules';

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
    expect(m.hero).toEqual({ src: '/img/pets/pet_2/1024?format=webp', label: '本局 MVP：Pet2', kind: 'mvp' });
    expect(m.review).toBe('催你的事，替我保密。');
    expect(m.title).toBe('急什么我会消');
    expect(m.titleStamp).toMatch(/03-got-this-zh/);
    expect(m.mode).toBe('宠物店');
    expect(m.score).toBe('2,480');
    expect(m.scoreLabel).toBe('本局得分');
    expect(m.player).toBe('本局玩家：Bob 包博');
    expect(m.brand).toEqual({ lead: '毛孩子', accent: '全明星' });
  });

  it('开发者彩蛋：MVP 是毛肚或菠萝时带开发者认证章，店长是它们时换店长梗；其他情况为 null / 通用宣言', () => {
    const plain = shareCardModel({ summary: summary(), pets, mode: 'normal', playerName: 'Bob', manager, locale: 'zh', t: zh });
    expect(plain.developerStamp).toBeNull();
    const [maodu, boluo] = HOTPOT_PETS;
    const devPets = pets.map((p, i) => (i === 2 ? { ...p, id: maodu, name: 'Maodu 毛肚' } : p));
    const s = summary({ pets: summary().pets.map((p, i) => (i === 2 ? { ...p, id: maodu } : p)) });
    expect(shareCardModel({ summary: s, pets: devPets, mode: 'normal', playerName: 'Bob', manager, locale: 'zh', t: zh }).developerStamp).toMatch(/developer-zh/);
    expect(shareCardModel({ summary: s, pets: devPets, mode: 'normal', playerName: 'Bob', manager, locale: 'en', t: en }).developerStamp).toMatch(/developer-en/);
    // 已下架：主角是通用图案，不盖章
    expect(shareCardModel({ summary: s, pets: devPets, mode: 'normal', playerName: 'Bob', manager, locale: 'zh', t: zh, removed: new Set([maodu]) }).developerStamp).toBeNull();
    expect(managerPosterModel({ manager: { date: '2026-10-25', pet: { petId: boluo, name: 'Boluo 菠萝' } }, locale: 'zh', t: zh }).line).toBe('我是店长，不是水果，别切。');
    expect(managerPosterModel({ manager, locale: 'zh', t: zh }).line).toBe('你负责排班，我负责可爱。');
  });

  it('鱼关：MVP 用鱼色类别名并跟随语言，模式牌为摸鱼分店', () => {
    const s = summary({ pets: summary().pets.map((p, i) => ({ ...p, id: fish[i].id, served: i === 0 ? 50 : 5 })) });
    const zhCard = shareCardModel({ summary: s, pets: fish, mode: 'fish', playerName: 'Bob', manager, locale: 'zh', t: zh });
    expect(zhCard.hero).toEqual({ src: '/img/fish/fish_color_blue/1024?format=webp', label: '本局 MVP：天蓝色', kind: 'mvp' });
    expect(zhCard.mode).toBe('摸鱼分店');
    expect(zhCard.review).toBe('催完就跑，有点不好意思。');
    const enCard = shareCardModel({ summary: s, pets: fish, mode: 'fish', playerName: 'Bob', manager, locale: 'en', t: en });
    expect(enCard.hero?.label).toBe("This Round's MVP: Sky Blue");
    expect(enCard.score).toBe('2,480');
  });

  it('普通局零服务：不编造 MVP，由今日店长承接', () => {
    const m = shareCardModel({ summary: zero(summary()), pets, mode: 'normal', playerName: 'Bob', manager, locale: 'zh', t: zh });
    expect(m.hero).toEqual({ src: '/img/pets/pet_mgr/1024?format=webp', label: '今日店长 · Sanxian', kind: 'manager' });
    expect(m.review).toBe('我先可爱，你慢慢来。');
    expect(m.score).toBe('0');
  });

  it('零服务且店长读取失败：只留评语，不放主角图', () => {
    const m = shareCardModel({ summary: zero(summary()), pets, mode: 'normal', playerName: 'Bob', manager: null, locale: 'zh', t: zh });
    expect(m.hero).toBeNull();
    expect(m.review).toBe('我先可爱，你慢慢来。');
  });

  it('鱼关零服务：不用店长，只留评语', () => {
    const m = shareCardModel({ summary: zero(summary()), pets: fish, mode: 'fish', playerName: 'Bob', manager, locale: 'zh', t: zh });
    expect(m.hero).toBeNull();
    expect(m.review).toBe('我没摸鱼，我就是鱼。');
  });

  it('分享、切换语言、猜主人加分及下架处理，仍复用报告的同一句变体', () => {
    const s = summary();
    const key = pickReview(s, 'normal');
    for (const locale of ['zh', 'en'] as const) {
      for (const bonus of [0, 1000]) {
        const m = shareCardModel({
          summary: structuredClone(s), pets, mode: 'normal', playerName: 'Bob', manager,
          locale, t: (k, vars) => translate(locale, k, vars), score: s.score + bonus, removed: new Set(['pet_2']),
        });
        expect(m.review).toBe(translate(locale, key));
        expect(m.score).toBe((s.score + bonus).toLocaleString(locale === 'zh' ? 'zh-CN' : 'en-US'));
      }
    }
  });
});

describe('原 MVP 已下架', () => {
  it('主角改为通用 MoeGo 图案与「本局成绩」，不另选 MVP；分数、称号、评语与署名保留', () => {
    const m = shareCardModel({ summary: summary(), pets, mode: 'normal', playerName: 'Bob', manager, locale: 'zh', t: zh, removed: new Set(['pet_2']) });
    expect(m.hero).toEqual({ src: null, label: '本局成绩', kind: 'generic' });
    expect(m.title).toBe('急什么我会消');
    expect(m.review).toBe('催你的事，替我保密。');
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
    expect(m.hero).toEqual({ src: '/img/pets/pet_mgr/1024?format=webp', label: '今日店长 · Sanxian', kind: 'manager' });
    expect(m.mode).toBe('今日店长');
    expect(m.line).toBe('你负责排班，我负责可爱。');
    expect(m.date).toBe('2026 年 10 月 23 日 · 深圳时间');
  });

  it('英文日期用月份名，日期按服务端的北京日期，不受本机时区影响', () => {
    const m = managerPosterModel({ manager: { ...manager, date: '2026-01-05' }, t: en, locale: 'en' });
    expect(m.date).toBe('January 5, 2026 · Shenzhen Time');
    expect(m.line).toBe("You handle the schedule. I'll bring the cuteness.");
  });
});
