/** 可播种的 mulberry32；状态是一个 32 位整数，存进 GameState 以保证重放一致。 */
export interface Rng {
  next(): number;
  int(n: number): number;
  readonly state: number;
}

export function createRng(seed: number): Rng {
  let s = seed >>> 0;
  return {
    next() {
      s = (s + 0x6d2b79f5) >>> 0;
      let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
    int(n: number) {
      return Math.floor(this.next() * n);
    },
    get state() {
      return s;
    },
  };
}

export function shuffleInPlace<T>(items: T[], rng: Rng): T[] {
  for (let i = items.length - 1; i > 0; i--) {
    const j = rng.int(i + 1);
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}
