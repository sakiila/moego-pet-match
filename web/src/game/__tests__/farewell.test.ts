import { describe, expect, it } from 'vitest';
import type { GameSummary } from '../../engine';
import type { PetInfo } from '../pets';
import { selectFarewellPets } from '../farewell';

const base: GameSummary = {
  score: 0,
  clearedCells: 0,
  clearedByMultiplier: [0, 0, 0, 0, 0],
  maxChain: 0,
  toolsFired: 0,
  combos: { cc: 0, cs: 0, dryer: 0 },
  validMoves: 0,
  actedInLastSeconds: false,
  rushSucceeded: false,
  pets: [],
};

const pets: PetInfo[] = ['a', 'b', 'c', 'd', 'e'].map((id) => ({
  id,
  name: id,
  imageBase: `/img/pets/${id}`,
  emoji: '',
}));

const summary = (entries: [id: string, served: number, firstServedSeq: number | null, order?: number][]): GameSummary => ({
  ...base,
  pets: entries.map(([id, served, firstServedSeq, order], index) => ({ id, served, firstServedSeq, order: order ?? index })),
});

describe('selectFarewellPets', () => {
  it('最多选择三只服务最多的真实宠物，不按展示资料的排列顺序挑选', () => {
    const result = selectFarewellPets(summary([['a', 2, 1], ['b', 8, 2], ['c', 3, 3], ['d', 6, 4], ['e', 9, 5]]), pets);
    expect(result.map((pet) => pet.id)).toEqual(['e', 'b', 'd']);
    expect(result[0]).toBe(pets[4]);
  });

  it('服务数相同时先比首次服务批次，再比本局阵容登记顺序', () => {
    const result = selectFarewellPets(summary([['a', 5, 3, 0], ['b', 5, 2, 2], ['c', 5, 2, 1], ['d', 5, null, 3]]), pets);
    expect(result.map((pet) => pet.id)).toEqual(['c', 'b', 'a']);
  });

  it('缺少首次服务批次的同分宠物仍按阵容顺序稳定选择', () => {
    const result = selectFarewellPets(summary([['a', 5, null, 3], ['b', 5, null, 1], ['c', 5, null, 2]]), pets);
    expect(result.map((pet) => pet.id)).toEqual(['b', 'c', 'a']);
  });

  it('零服务局返回空列表，只有一只服务过时不拿未服务阵容凑数', () => {
    expect(selectFarewellPets(summary([['a', 0, null], ['b', 0, null]]), pets)).toEqual([]);
    expect(selectFarewellPets(summary([['a', 0, null], ['b', 3, 1], ['c', 0, null]]), pets)).toEqual([pets[1]]);
  });

  it('未知、缺失 id 或缺少贴纸展示信息安全跳过，不用 emoji 补位', () => {
    const displayPets = [...pets, { id: 'placeholder', name: 'Placeholder', emoji: '🐶' }];
    const result = selectFarewellPets(summary([['missing', 9, 1], ['', 8, 2], ['placeholder', 7, 3], ['a', 1, 4]]), displayPets);
    expect(result).toEqual([pets[0]]);
    expect(selectFarewellPets(summary([['a', 1, 1]]), [])).toEqual([]);
  });

  it('选择不修改冻结的本局结果与展示资料', () => {
    const source = summary([['b', 1, 2], ['a', 2, 1]]);
    const beforeSummary = structuredClone(source);
    const beforePets = structuredClone(pets);
    selectFarewellPets(source, pets);
    expect(source).toEqual(beforeSummary);
    expect(pets).toEqual(beforePets);
  });
});
