export type ToolType = 'combH' | 'combV' | 'scissors';

/** 棋子带稳定 id，UI 据此在时间线前后追踪同一枚棋子的移动。 */
export type Piece = { id: number; type: 'pet'; kind: number } | { id: number; type: 'tool'; tool: ToolType };

/** board[r][c]，r = 0 为最上一行。稳定棋盘不含 null。 */
export type Board = (Piece | null)[][];

export interface Pos {
  r: number;
  c: number;
}

/** 决定本批清除时长的效果强度，由弱到强。 */
export type Effect = 'match' | 'comb' | 'scissors' | 'comboCC' | 'comboCS' | 'comboSS';

export interface Batch {
  /** 本次操作内的批序，从 1 开始，决定倍率。 */
  index: number;
  /** 整局的全局批序，用于 MVP「首次服务批次」比较。 */
  seq: number;
  multiplier: number;
  startAt: number;
  /** 清除结算时刻（游戏时钟），催单按它判定是否在窗口内。 */
  settleAt: number;
  effect: Effect;
  groups: Pos[][];
  combo: { tools: [ToolType, ToolType]; center: Pos } | null;
  toolsFired: { pos: Pos; tool: ToolType }[];
  cleared: Pos[];
  spawned: { pos: Pos; piece: Piece }[];
  score: number;
  /** 本批结算后的催单进度；不在催单窗口内为 null。 */
  rushProgress: number | null;
  rushBonus: boolean;
  /** 清除、生成道具、下落与补落后的棋盘。 */
  boardAfter: Board;
}

export type Timeline =
  | { kind: 'bounce'; acceptedAt: number; from: Pos; to: Pos; busyUntil: number }
  | {
      kind: 'chain';
      acceptedAt: number;
      from: Pos;
      to: Pos;
      boardAfterSwap: Board;
      batches: Batch[];
      busyUntil: number;
      /** 连锁结束后若成死局，洗牌后的棋盘（洗牌不占游戏时间）。 */
      shuffled: Board | null;
    };

export interface Move {
  from: Pos;
  to: Pos;
}

export interface GameState {
  board: Board;
  /** 本局阵容登记顺序（开局随机打乱后固定），kind 即其下标。 */
  lineup: string[];
  rngState: number;
  refillQueue: number[];
  nextId: number;
  phase: 'playing' | 'ended' | 'discarded';
  busyUntil: number;
  batchSeq: number;
  score: number;
  clearedCells: number;
  maxChain: number;
  toolsFired: number;
  served: number[];
  firstServedSeq: (number | null)[];
  validMoves: number;
  lastValidMoveAt: number | null;
  rush: { progress: number; succeeded: boolean; bonusAt: number | null };
  emitted: { rushStart: boolean; rushEnd: boolean; timeUp: boolean };
}

export type GameEvent =
  | { type: 'rushStart'; at: number }
  | { type: 'rushEnd'; at: number; succeeded: boolean }
  | { type: 'timeUp'; at: number }
  | { type: 'finished'; at: number };

export type SwapRejection = 'ended' | 'timeUp' | 'busy' | 'notAdjacent';
