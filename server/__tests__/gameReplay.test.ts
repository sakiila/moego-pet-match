import { describe, expect, it } from 'vitest';
import { advance, createGame, findHint, getSummary, trySwap } from '../../web/src/engine/game.ts';
import { RULES_VERSION } from '../../web/src/engine/config.ts';
import { toResultPayload } from '../../web/src/game/result.ts';
import { validateReplay } from '../src/services/gameReplay.ts';

const registered = { seed: 12345, lineup: ['a', 'b', 'c', 'd', 'e', 'f'], rules_version: RULES_VERSION };
function legitimate() {
  let state = createGame({ seed: registered.seed, lineup: registered.lineup });
  const moves: { at: number; from: { r: number; c: number }; to: { r: number; c: number } }[] = [];
  for (let i = 0; i < 12; i++) {
    const move = findHint(state)!;
    const at = Math.max(state.busyUntil, i * 1000);
    const swapped = trySwap(state, move.from, move.to, at);
    if (!swapped.ok) throw new Error('fixture');
    moves.push({ ...move, at });
    state = swapped.state;
  }
  state = advance(state, Math.max(90_000, state.busyUntil)).state;
  return { ...toResultPayload(getSummary(state), registered.rules_version), moves };
}

describe('服务端确定性成绩回放', () => {
  it('接受真实操作产生的全部引擎事实', () => {
    expect(validateReplay(registered, legitimate()).valid).toBe(true);
  });
  it('拒绝没有操作记录的自洽假成绩', () => {
    const payload = legitimate();
    expect(validateReplay(registered, { ...payload, moves: undefined }).valid).toBe(false);
    expect(validateReplay(registered, { ...payload, moves: [] }).valid).toBe(false);
  });
  it('每个统计字段都必须与重演一致', () => {
    const original = legitimate();
    for (const key of ['score', 'clearedCells', 'maxChain', 'toolsFired', 'validMoves'] as const) {
      expect(validateReplay(registered, { ...original, [key]: original[key] + 1 }).valid, key).toBe(false);
    }
    expect(validateReplay(registered, { ...original, rushSucceeded: !original.rushSucceeded }).valid).toBe(false);
    expect(validateReplay(registered, { ...original, actedInLastSeconds: !original.actedInLastSeconds }).valid).toBe(false);
    expect(validateReplay(registered, { ...original, pets: original.pets.map((pet, i) => i ? pet : { ...pet, served: pet.served + 1 }) }).valid).toBe(false);
  });
  it('拒绝忙碌中、倒序、结束后的操作及非法坐标', () => {
    const p = legitimate();
    const badMoves = [
      [p.moves[0], { ...p.moves[1], at: 0 }],
      [{ ...p.moves[0], at: 90_000 }],
      [{ ...p.moves[0], from: { r: -1, c: 0 } }],
      Array(401).fill(p.moves[0]),
    ];
    for (const moves of badMoves) expect(validateReplay(registered, { ...p, moves }).valid).toBe(false);
  });
  it('零操作只允许真实的零分零统计', () => {
    const initial = createGame({ seed: registered.seed, lineup: registered.lineup });
    const payload = { ...toResultPayload(getSummary(initial), registered.rules_version), moves: [] };
    expect(validateReplay(registered, payload)).toMatchObject({ valid: true, endMs: 90_000 });
  });
});
