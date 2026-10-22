export { RULES, TIMING } from './config';
export { formatBoard, parseBoard } from './board';
export { advance, confirmExit, createGame, findHint, getSummary, trySwap } from './game';
export type { CreateGameOptions, GameSummary, SwapResult } from './game';
export type * from './types';
