import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { ApiError, api } from '../api/client';
import type { DailyManager, GameMode, PlayerView, RegisteredGame } from '../api/types';
import { ScreenTransition } from '../components/ScreenTransition/ScreenTransition';
import { StatusMessage } from '../components/StatusMessage/StatusMessage';
import { PRESETS } from '../dev/presets';
import { createGame, type GameState, type GameSummary } from '../engine';
import { petFromLineup, preloadPets } from '../game/pets';
import { useI18n } from '../i18n';
import { BoardScreen } from '../screens/BoardScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { IdentityScreen } from '../screens/IdentityScreen';
import { LeaderboardScreen } from '../screens/LeaderboardScreen';
import { LiveReport } from '../screens/LiveReport';
import { PetdexScreen } from '../screens/PetdexScreen';
import { UploadScreen } from '../screens/UploadScreen';
import { MyPetsScreen } from '../screens/MyPetsScreen';
import { InfoScreen } from '../screens/InfoScreen';
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
  | { name: 'identity'; query?: string }
  | { name: 'home' }
  | { name: 'leaderboard'; mode: GameMode }
  | { name: 'petdex' }
  | { name: 'upload' }
  | { name: 'myPets' }
  | { name: 'info'; player: { userId: string; name: string } | null; removal: boolean; back: 'identity' | 'home'; query?: string }
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
  const [manager, setManager] = useState<DailyManager | null>(null);

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
        // 开局前加载好本局棋盘贴纸，素材就绪才允许开始计时
        await preloadPets(registered.lineup.map((p) => petFromLineup(p, mode)));
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

  // 今日店长：回门店时读取（北京时间跨日后自然换人）；失败时门店照常可开局
  const refreshManager = useCallback(async () => {
    try {
      setManager(await api.getManager());
    } catch {
      // 保留已读到的店长
    }
  }, []);
  useEffect(() => {
    if (route.name === 'home') void refreshManager();
  }, [route.name, refreshManager]);

  const toHome = useCallback(() => setRoute({ name: 'home' }), []);
  const toPetdex = useCallback(() => setRoute({ name: 'petdex' }), []);
  const petsOf = (s: Session) =>
    s.game.lineup.map((id) => petFromLineup(s.registered.lineup.find((p) => p.petId === id)!, s.registered.mode));
  const ownNamesOf = (s: Session) =>
    s.registered.ownPetIds.map((id) => s.registered.lineup.find((p) => p.petId === id)?.name).filter((n): n is string => !!n);

  const renderRoute = (): ReactNode => {
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
            initialQuery={route.query}
            onConfirm={async (c) => {
              savePlayerId(c.userId);
              await restore();
            }}
            onInfo={(c, removal) => setRoute({ name: 'info', player: c ? { userId: c.userId, name: c.name } : null, removal, back: 'identity', query: c?.name })}
          />
        );
      case 'home':
        return player ? (
          <HomeScreen
            player={player}
            manager={manager}
            onOpenShop={() => void toPrep('normal')}
            onCollection={toPetdex}
            onLeaderboard={() => setRoute({ name: 'leaderboard', mode: 'normal' })}
            onMyPets={() => setRoute({ name: 'myPets' })}
            onInfo={(removal) => setRoute({ name: 'info', player: { userId: player.userId, name: player.name }, removal, back: 'home' })}
            onSwitchIdentity={() => setRoute({ name: 'identity' })}
          />
        ) : null;
      case 'leaderboard':
        return player ? <LeaderboardScreen key={route.mode} player={player} initialMode={route.mode} onBack={toHome} onChallenge={(mode) => void toPrep(mode)} /> : null;
      case 'petdex':
        return player ? (
          <PetdexScreen player={player} onBack={toHome} onOpenShop={() => void toPrep('normal')} onUpload={() => setRoute({ name: 'upload' })} />
        ) : null;
      case 'myPets':
        return player ? (
          <MyPetsScreen player={player} onBack={toHome} onUpload={() => setRoute({ name: 'upload' })} onOpenShop={() => void toPrep('normal')} />
        ) : null;
      case 'info':
        return (
          <InfoScreen
            key={`${route.player?.userId}-${route.removal}`}
            player={route.player}
            openRemoval={route.removal}
            onBack={() => setRoute(route.back === 'identity' ? { name: 'identity', query: route.query } : { name: 'home' })}
          />
        );
      case 'upload':
        return player ? <UploadScreen player={player} onHome={toHome} onPlay={() => void toPrep('normal')} /> : null;
      case 'prep':
        return (
          <PrepScreen
            mode={route.mode}
            onBack={toHome}
            pets={route.session ? petsOf(route.session) : null}
            ownPetNames={route.session ? ownNamesOf(route.session) : []}
            failed={route.failed}
            onRetry={() => void toPrep(route.mode)}
            onStart={() => route.session && setRoute({ name: 'board', session: route.session })}
          />
        );
      case 'board':
        return (
          <BoardScreen
            mode={route.session.registered.mode}
            game={route.session.game}
            pets={petsOf(route.session)}
            speed={speed}
            startAt={startAt}
            uncollected={new Set(route.session.registered.uncollectedPetIds)}
            families={route.session.registered.families}
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
            pets={petsOf(route.session)}
            playerId={player!.userId}
            playerName={player!.name}
            manager={manager}
            onSaved={() => void refreshPlayer()}
            onPlayAgain={() => void toPrep(route.session.registered.mode)}
            onHome={toHome}
            onLeaderboard={() => setRoute({ name: 'leaderboard', mode: route.session.registered.mode })}
            onCollection={toPetdex}
            onOpenShop={() => void toPrep('normal')}
            onFishInvite={() => void toPrep('fish')}
          />
        );
    }
  };

  return <ScreenTransition routeName={route.name}>{renderRoute()}</ScreenTransition>;
}
