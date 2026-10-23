import { describe, expect, it } from 'vitest';
import type { CollectionPet } from '../../api/types';
import { browseCollection, quoteExcerpt } from '../collection';

const pet = (petId: string, over: Partial<CollectionPet> = {}): CollectionPet => ({
  petId,
  name: petId,
  collected: false,
  collectedAt: null,
  owner: null,
  own: false,
  ...over,
});

const pets = [
  pet('Apple'),
  pet('Biscuit', { collected: true, collectedAt: '2026-10-20T01:00:00Z', owner: { userId: 'U1', name: 'Alice' } }),
  pet('Cookie', { collected: true, collectedAt: '2026-10-22T01:00:00Z', owner: { userId: 'U2', name: 'Bob' } }),
  pet('Dumpling', { own: true, owner: { userId: 'U2', name: 'Bob' } }),
];
const ids = (list: CollectionPet[]) => list.map((p) => p.petId);

describe('图鉴浏览', () => {
  it('已收集优先、新收集靠前，未收集保持目录顺序', () => {
    expect(ids(browseCollection(pets, 'all', ''))).toEqual(['Cookie', 'Biscuit', 'Apple', 'Dumpling']);
  });

  it('按筛选分已收集与未收集', () => {
    expect(ids(browseCollection(pets, 'collected', ''))).toEqual(['Cookie', 'Biscuit']);
    expect(ids(browseCollection(pets, 'uncollected', ''))).toEqual(['Apple', 'Dumpling']);
  });

  it('宠物名搜全部上架项，不区分大小写', () => {
    expect(ids(browseCollection(pets, 'all', 'app'))).toEqual(['Apple']);
  });

  it('主人名只匹配已收集宠物，自家未收集宠物也不被主人名揭晓', () => {
    expect(ids(browseCollection(pets, 'all', 'bob'))).toEqual(['Cookie']);
  });

  it('搜索配合当前筛选', () => {
    expect(ids(browseCollection(pets, 'uncollected', 'bob'))).toEqual([]);
  });
});

describe('主人说摘录', () => {
  it('取前两句，原文更长时可展开', () => {
    expect(quoteExcerpt('第一句。第二句！第三句。')).toBe('第一句。第二句！');
    expect(quoteExcerpt('She is shy. Loves treats! Hates baths.')).toBe('She is shy. Loves treats!');
  });

  it('两句以内不需要展开', () => {
    expect(quoteExcerpt('只有一句')).toBeNull();
    expect(quoteExcerpt('One. Two.')).toBeNull();
  });
});
