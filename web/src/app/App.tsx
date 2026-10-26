import { lazy, Suspense, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { ApiError, api } from '../api/client';
import { socialApi } from '../api/social';
import type { AchievementId, DailyManager, GameMode, PlayerView, RegisteredGame } from '../api/types';
import { AchievementOverlay } from '../screens/AchievementOverlay';
import { ScreenTransition } from '../components/ScreenTransition/ScreenTransition';
import { StatusMessage } from '../components/StatusMessage/StatusMessage';
import { PRESETS } from '../dev/presets';
import { createGame, RULES_VERSION, type GameState, type GameSummary } from '../engine';
import { petFromLineup, preloadPets } from '../game/pets';
import { needsRefresh } from '../game/updateCheck';
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
import { GAME_VERSION } from './version';
import { COPYRIGHT, GITHUB_REPOSITORY_URL } from './project';

interface Session {
  registered: RegisteredGame;
  game: GameState;
}

type Route =
  | { name: 'boot' }
  | { name: 'bootFailed' }
  | { name: 'identity'; query?: string }
  | { name: 'home' }
  | { name: 'social' }
  | { name: 'leaderboard'; mode: GameMode }
  | { name: 'petdex' }
  | { name: 'upload' }
  | { name: 'myPets' }
  | { name: 'info'; player: { userId: string; name: string } | null; removal: boolean; back: 'identity' | 'home'; query?: string }
  | { name: 'prep'; mode: GameMode; session: Session | null; ready: boolean; failed: boolean }
  | { name: 'board'; session: Session }
  | { name: 'report'; session: Session; summary: GameSummary }
  | { name: 'devReport'; session: Session; summary: GameSummary };

/** 开发调试：?speed= 调快或放慢游戏时钟，?t0= 从指定游戏毫秒开始，?preset= 载入固定棋盘。生产环境忽略。 */
const params = import.meta.env.DEV ? new URLSearchParams(location.search) : new URLSearchParams();
const speed = Number(params.get('speed')) || 1;
const startAt = Number(params.get('t0')) || 0;
const preset = import.meta.env.DEV ? PRESETS[params.get('preset') ?? ''] : undefined;
/**
 * 开发验收：?report=greedy|casual|zero 刷新即「游戏结束」，直接进入报告页（真实登记、结算与保存；可加 &mode=fish）；
 * ?report=showcase 用伪造的已保存结果让结算页全部元素同时出现（不结算，加 &invite=1 看鱼关邀请）。
 */
const devReport = params.get('report');
const devReportMode: GameMode = params.get('mode') === 'fish' ? 'fish' : 'normal';
const devInvite = params.get('invite') === '1';
/** 宣传片录屏：?demo=<棋盘种子>&play=<走法种子>，用固定种子开局，进棋盘后按 dev/demo 的计划自动走子。 */
const demoSeed = import.meta.env.DEV && params.has('demo') ? Number(params.get('demo')) : null;
const demoPlay = Number(params.get('play')) || 0;
const ReportShowcase = import.meta.env.DEV ? lazy(() => import('../dev/ReportShowcase').then((m) => ({ default: m.ReportShowcase }))) : null;
const LiveSocial = lazy(() => import('../screens/SocialLiveScreen').then(m => ({ default:m.SocialLiveScreen })));

export function App() {
  const { t } = useI18n();
  const [player, setPlayer] = useState<PlayerView | null>(null);
  const [route, setRoute] = useState<Route>(() => (loadSavedPlayerId() ? { name: 'boot' } : { name: 'identity' }));
  const prepAttempt = useRef(0);
  const [manager, setManager] = useState<DailyManager | null>(null);
  // 服务端已经换了版本（或规则版本不一致）：首页提示刷新；只提示，不打断对局与报告
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [showTitles, setShowTitles] = useState(false);
  const [socialEnabled, setSocialEnabled] = useState(false);
  const [clockOutFailed, setClockOutFailed] = useState(false);
  const clockOutPending = useRef(false);
  const closeTitles = useCallback(() => setShowTitles(false), []);
  const titleVersion = useRef(0);
  const playerId = player?.userId;
  const onEquipped = useCallback((id: AchievementId | null) => {
    titleVersion.current++;
    setPlayer(p => p && p.userId === playerId && p.equippedTitle !== id ? { ...p, equippedTitle: id } : p);
  }, [playerId]);
  const equipTitle = async (id: AchievementId) => {
    if (!player) return;
    const owner = player.userId;
    const result = await api.equipTitle(owner, id);
    titleVersion.current++;
    setPlayer(p => p?.userId === owner ? { ...p, equippedTitle: result.equippedTitle } : p);
  };

  // 开发验收（?report=）：登记一局 → 自动打完 → 直接进报告页，等同于玩完一局
  const devJumpToReport = useCallback(async (p: PlayerView) => {
    if (!import.meta.env.DEV) return;
    const { autoplay, parseAutoplayStyle } = await import('../dev/autoplay');
    const registered = await api.registerGame(p.userId, devReportMode);
    await preloadPets(registered.lineup.map((x) => petFromLineup(x, devReportMode)));
    const game = createGame({ seed: registered.seed, lineup: registered.lineup.map((x) => x.petId) });
    if (devReport === 'showcase') return setRoute({ name: 'devReport', session: { registered, game }, summary: autoplay(game, 'greedy') });
    setRoute({ name: 'report', session: { registered, game }, summary: autoplay(game, parseAutoplayStyle(devReport)) });
  }, []);

  // 校验浏览器记住的身份：失效回选择页；读取失败显示重试，不当作身份失效
  const restore = useCallback(async () => {
    const saved = loadSavedPlayerId();
    if (!saved) return setRoute({ name: 'identity' });
    setRoute({ name: 'boot' });
    try {
      const restored = await api.getPlayer(saved);
      setPlayer(restored);
      if (import.meta.env.DEV && devReport) return void (await devJumpToReport(restored));
      setRoute(location.pathname === '/moments' ? { name:'social' } : { name: 'home' });
    } catch (error) {
      if (error instanceof ApiError && (error.kind === 'not_found' || error.kind === 'unauthorized')) {
        savePlayerId(null);
        setRoute({ name: 'identity' });
      } else {
        setRoute({ name: 'bootFailed' });
      }
    }
  }, [devJumpToReport]);

  useEffect(() => {
    const requireLogin = () => {
      prepAttempt.current++;
      setShowTitles(false);
      savePlayerId(null);
      setPlayer(null);
      setRoute({ name: 'identity' });
    };
    window.addEventListener('pet-match:login-required', requireLogin);
    return () => window.removeEventListener('pet-match:login-required', requireLogin);
  }, []);

  useEffect(() => {
    // 只在首次进入时校验记住的身份
    if (route.name === 'boot') void restore();
  }, []);
  useEffect(() => {
    if(route.name!=='home')return;
    let cancelled=false;
    void socialApi.config().then(config=>{if(!cancelled)setSocialEnabled(config.enabled);}).catch(()=>{});
    return()=>{cancelled=true;};
  },[route.name]);

  // 开局准备：先向服务端登记本局（种子与阵容），成功后才可开始计时
  const toPrep = useCallback(
    async (mode: GameMode = 'normal') => {
      if (!player) return;
      const attempt = ++prepAttempt.current;
      setRoute({ name: 'prep', mode, session: null, ready: false, failed: false });
      try {
        const registered = await api.registerGame(player.userId, mode);
        if (attempt !== prepAttempt.current) return;
        // 服务端规则版本已变：这局打完也会被结算拒绝，回门店提示刷新，不进准备页
        if (registered.rulesVersion !== RULES_VERSION) {
          setUpdateAvailable(true);
          setRoute({ name: 'home' });
          return;
        }
        const game = createGame({
          seed: demoSeed ?? registered.seed,
          lineup: registered.lineup.map((p) => p.petId),
          board: preset?.board,
          refill: preset?.refill,
        });
        const session = { registered, game };
        // 阵容先展示，缓存命中的宠物立即出现；素材全部就绪后才允许开始计时。
        setRoute({ name: 'prep', mode, session, ready: false, failed: false });
        await preloadPets(registered.lineup.map((p) => petFromLineup(p, mode)));
        if (attempt !== prepAttempt.current) return;
        setRoute(current => current.name === 'prep' && current.session === session ? { ...current, ready: true } : current);
      } catch {
        if (attempt !== prepAttempt.current) return;
        setRoute(current => current.name === 'prep' ? { ...current, ready: false, failed: true } : current);
      }
    },
    [player],
  );

  const refreshPlayer = useCallback(async () => {
    if (!player) return;
    try {
      const version = titleVersion.current;
      const data = await api.getPlayer(player.userId);
      setPlayer(p => p?.userId === data.userId ? { ...data, equippedTitle: version === titleVersion.current ? data.equippedTitle : p.equippedTitle } : p);
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
    // 报告页也需要店长（零服务评语与「店长说」）：开发验收直接跳到报告时还没经过首页
    if (route.name === 'home' || route.name === 'report' || route.name === 'devReport') void refreshManager();
  }, [route.name, refreshManager]);

  // 回门店时比对服务端版本：部署过新版本就提示刷新；读取失败当作没有更新
  useEffect(() => {
    if (route.name !== 'home') return;
    let cancelled = false;
    api
      .getVersion()
      .then((remote) => {
        if (!cancelled && needsRefresh({ version: GAME_VERSION, rulesVersion: RULES_VERSION }, remote)) setUpdateAvailable(true);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [route.name]);

  const boardGame = route.name === 'board' ? route.session.game : null;
  useEffect(() => {
    if (!import.meta.env.DEV || demoSeed === null || !boardGame) return;
    let stop = () => {};
    let cancelled = false;
    void import('../dev/demo').then(({ planDemo, runDemo }) => {
      if (!cancelled) stop = runDemo(planDemo(boardGame, { seed: demoSeed, play: demoPlay }));
    });
    return () => {
      cancelled = true;
      stop();
    };
  }, [boardGame]);

  const toHome = useCallback(() => {
    prepAttempt.current++;
    setRoute({ name: 'home' });
  }, []);
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
            version={GAME_VERSION}
            repositoryUrl={GITHUB_REPOSITORY_URL}
            copyright={COPYRIGHT}
            manager={manager}
            updateAvailable={updateAvailable}
            onRefresh={() => window.location.reload()}
            onOpenShop={() => void toPrep('normal')}
            onCollection={toPetdex}
            onLeaderboard={() => setRoute({ name: 'leaderboard', mode: 'normal' })}
            onMyPets={() => setRoute({ name: 'myPets' })}
            onSocial={socialEnabled ? () => location.assign('/moments') : import.meta.env.DEV ? () => location.assign('/dev/social') : undefined}
            onTitles={() => setShowTitles(true)}
            onInfo={(removal) => setRoute({ name: 'info', player: { userId: player.userId, name: player.name }, removal, back: 'home' })}
            onClockOut={async () => {
              if (clockOutPending.current) return;
              clockOutPending.current = true;
              setClockOutFailed(false);
              try {
                await api.logout();
                setShowTitles(false);
                savePlayerId(null);
                setPlayer(null);
                setRoute({ name: 'identity' });
              } catch {
                setClockOutFailed(true);
              } finally {
                clockOutPending.current = false;
              }
            }}
            clockOutError={clockOutFailed ? t('auth.logout_failed') : undefined}
          />
        ) : null;
      case 'social':
        return player ? <Suspense fallback={<main className={screen.screen}/>}><LiveSocial onHome={()=>location.assign('/')}/></Suspense> : null;
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
            loading={!!route.session && !route.ready && !route.failed}
            ownPetNames={route.session ? ownNamesOf(route.session) : []}
            failed={route.failed}
            onRetry={() => void toPrep(route.mode)}
            onStart={() => route.ready && route.session && setRoute({ name: 'board', session: route.session })}
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
            equippedTitle={player?.equippedTitle}
            onEquipTitle={equipTitle}
            onTitles={() => setShowTitles(true)}
          />
        );
      case 'devReport':
        return ReportShowcase ? (
          <Suspense fallback={null}>
            <ReportShowcase
              summary={route.summary}
              registered={route.session.registered}
              pets={petsOf(route.session)}
              manager={manager}
              invite={devInvite}
              onPlayAgain={() => void toPrep(route.session.registered.mode)}
              onHome={toHome}
              onLeaderboard={() => setRoute({ name: 'leaderboard', mode: route.session.registered.mode })}
              onFishInvite={() => void toPrep('fish')}
              onOpenPet={() => {}}
              onShare={() => {}}
              onTitles={() => setShowTitles(true)}
            />
          </Suspense>
        ) : null;
    }
  };

  return <><ScreenTransition routeName={route.name}>{renderRoute()}</ScreenTransition>{showTitles && player && <AchievementOverlay key={player.userId} playerId={player.userId} onEquipped={onEquipped} onClose={closeTitles} />}</>;
}
