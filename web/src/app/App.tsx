import { useCallback, useEffect, useState } from 'react';
import { ApiError, api } from '../api/client';
import type { GameMode, PlayerView, RegisteredGame } from '../api/types';
import { StatusMessage } from '../components/StatusMessage/StatusMessage';
import { PRESETS } from '../dev/presets';
import { createGame, type GameState, type GameSummary } from '../engine';
import { petFromLineup } from '../game/pets';
import { useI18n } from '../i18n';
import { BoardScreen } from '../screens/BoardScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { IdentityScreen } from '../screens/IdentityScreen';
import { LeaderboardScreen } from '../screens/LeaderboardScreen';
import { LiveReport } from '../screens/LiveReport';
import { PrepScreen } from '../screens/PrepScreen';
import screen from '../screens/Screen.module.css';
import { loadSavedPlayerId, savePlayerId } from './identity';

interface Session {
  registered: RegisteredGame;
  game: GameState;
}

type Route =
  | { name: 'boot' }
  | { name: 'bootFailed' }
  | { name: 'identity' }
  | { name: 'home' }
  | { name: 'leaderboard' }
  | { name: 'prep'; mode: GameMode; session: Session | null; failed: boolean }
  | { name: 'board'; session: Session }
  | { name: 'report'; session: Session; summary: GameSummary };

/** 开发调试：?speed= 调快或放慢游戏时钟，?t0= 从指定游戏毫秒开始，?preset= 载入固定棋盘。生产环境忽略。 */
const params = import.meta.env.DEV ? new URLSearchParams(location.search) : new URLSearchParams();
const speed = Number(params.get('speed')) || 1;
const startAt = Number(params.get('t0')) || 0;
const preset = import.meta.env.DEV ? PRESETS[params.get('preset') ?? ''] : undefined;

export function App() {
  const { t } = useI18n();
  const [player, setPlayer] = useState<PlayerView | null>(null);
  const [route, setRoute] = useState<Route>(() => (loadSavedPlayerId() ? { name: 'boot' } : { name: 'identity' }));

  // 校验浏览器记住的身份：失效回选择页；读取失败显示重试，不当作身份失效
  const restore = useCallback(async () => {
    const saved = loadSavedPlayerId();
    if (!saved) return setRoute({ name: 'identity' });
    setRoute({ name: 'boot' });
    try {
      setPlayer(await api.getPlayer(saved));
      setRoute({ name: 'home' });
    } catch (error) {
      if (error instanceof ApiError && error.kind === 'not_found') {
        savePlayerId(null);
        setRoute({ name: 'identity' });
      } else {
        setRoute({ name: 'bootFailed' });
      }
    }
  }, []);

  useEffect(() => {
    // 只在首次进入时校验记住的身份
    if (route.name === 'boot') void restore();
  }, []);

  // 开局准备：先向服务端登记本局（种子与阵容），成功后才可开始计时
  const toPrep = useCallback(
    async (mode: GameMode = 'normal') => {
      if (!player) return;
      setRoute({ name: 'prep', mode, session: null, failed: false });
      try {
        const registered = await api.registerGame(player.userId, mode);
        const game = createGame({
          seed: registered.seed,
          lineup: registered.lineup.map((p) => p.petId),
          board: preset?.board,
          refill: preset?.refill,
        });
        setRoute({ name: 'prep', mode, session: { registered, game }, failed: false });
      } catch {
        setRoute({ name: 'prep', mode, session: null, failed: true });
      }
    },
    [player],
  );

  const refreshPlayer = useCallback(async () => {
    if (!player) return;
    try {
      setPlayer(await api.getPlayer(player.userId));
    } catch {
      // 门店展示用，读取失败时沿用旧数据
    }
  }, [player]);

  const toHome = useCallback(() => setRoute({ name: 'home' }), []);
  const petsOf = (s: Session) => s.game.lineup.map((id) => petFromLineup(s.registered.lineup.find((p) => p.petId === id)!));

  switch (route.name) {
    case 'boot':
      return <main className={screen.screen} />;
    case 'bootFailed':
      return (
        <main className={`${screen.screen} ${screen.center}`}>
          <StatusMessage tone="error" text={t('identity.load_failed')} actionLabel={t('action.retry')} onAction={restore} />
        </main>
      );
    case 'identity':
      return (
        <IdentityScreen
          onConfirm={async (c) => {
            savePlayerId(c.userId);
            await restore();
          }}
        />
      );
    case 'home':
      return player ? (
        <HomeScreen
          player={player}
          onOpenShop={() => void toPrep('normal')}
          onLeaderboard={() => setRoute({ name: 'leaderboard' })}
          onSwitchIdentity={() => setRoute({ name: 'identity' })}
        />
      ) : null;
    case 'leaderboard':
      return player ? <LeaderboardScreen player={player} onBack={toHome} onChallenge={(mode) => void toPrep(mode)} /> : null;
    case 'prep':
      return (
        <PrepScreen
          pets={route.session ? petsOf(route.session) : null}
          failed={route.failed}
          onRetry={() => void toPrep(route.mode)}
          onStart={() => route.session && setRoute({ name: 'board', session: route.session })}
        />
      );
    case 'board':
      return (
        <BoardScreen
          game={route.session.game}
          pets={petsOf(route.session)}
          speed={speed}
          startAt={startAt}
          onFinished={(summary) => setRoute({ name: 'report', session: route.session, summary })}
          onExit={toHome}
        />
      );
    case 'report':
      return (
        <LiveReport
          key={route.session.registered.gameId}
          summary={route.summary}
          registered={route.session.registered}
          playerId={player!.userId}
          onSaved={() => void refreshPlayer()}
          onPlayAgain={() => void toPrep(route.session.registered.mode)}
          onHome={toHome}
        />
      );
  }
}
