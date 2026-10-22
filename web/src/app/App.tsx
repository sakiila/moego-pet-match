import { useCallback, useState } from 'react';
import { createGame, type GameState, type GameSummary } from '../engine';
import { petById, PLACEHOLDER_PETS } from '../game/pets';
import { PRESETS } from '../dev/presets';
import { BoardScreen } from '../screens/BoardScreen';
import { PrepScreen } from '../screens/PrepScreen';
import { ReportScreen } from '../screens/ReportScreen';

type Route = { name: 'prep' | 'board'; game: GameState } | { name: 'report'; summary: GameSummary };

/** 开发调试：?seed= 固定随机种子，?speed= 调快或放慢游戏时钟，?t0= 从指定游戏毫秒开始，?preset= 载入固定棋盘。生产环境忽略。 */
const params = import.meta.env.DEV ? new URLSearchParams(location.search) : new URLSearchParams();
const fixedSeed = params.get('seed');
const speed = Number(params.get('speed')) || 1;
const startAt = Number(params.get('t0')) || 0;
const preset = import.meta.env.DEV ? PRESETS[params.get('preset') ?? ''] : undefined;

function newGame(): GameState {
  const seed = fixedSeed ? Number(fixedSeed) : Math.floor(Math.random() * 2 ** 31);
  return createGame({ seed, lineup: PLACEHOLDER_PETS.map((p) => p.id), board: preset?.board, refill: preset?.refill });
}

export function App() {
  const [route, setRoute] = useState<Route>(() => ({ name: 'prep', game: newGame() }));
  const toPrep = useCallback(() => setRoute({ name: 'prep', game: newGame() }), []);
  const onFinished = useCallback((summary: GameSummary) => setRoute({ name: 'report', summary }), []);

  if (route.name === 'report') return <ReportScreen summary={route.summary} onPlayAgain={toPrep} />;
  const pets = route.game.lineup.map(petById);
  if (route.name === 'prep') return <PrepScreen pets={pets} onStart={() => setRoute({ name: 'board', game: route.game })} />;
  return <BoardScreen game={route.game} pets={pets} speed={speed} startAt={startAt} onFinished={onFinished} onExit={toPrep} />;
}
