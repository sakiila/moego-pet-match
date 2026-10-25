import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';
import type { AchievementId, GameMode, LeaderboardEntry, LeaderboardScope, LeaderboardView, PlayerView } from '../api/types';
import { conditionRevealed } from '../game/achievementRules';
import { BoardDateCaption } from '../components/BoardDateCaption/BoardDateCaption';
import { BrandHeader } from '../components/BrandHeader/BrandHeader';
import { LeaderboardHeader, LeaderboardRow } from '../components/LeaderboardRow/LeaderboardRow';
import { ModeMark } from '../components/ModeMark/ModeMark';
import { Podium } from '../components/Podium/Podium';
import { StatusMessage } from '../components/StatusMessage/StatusMessage';
import { useI18n } from '../i18n';
import { Button } from '../ui/primitives/Button';
import { Tabs } from '../ui/primitives/Tabs';
import styles from './Screen.module.css';
import { PlayerProfileOverlay, loadUnlockedTitles, type ProfileLoader, type ViewerTitlesLoader } from './PlayerProfileOverlay';
import type { PlayerLikesLoader, PlayerLikesSender } from '../game/playerLikes';

export interface LeaderboardScreenProps {
  player: PlayerView;
  /** 打开时选中的榜单；鱼榜只对已发现鱼关的玩家有效，否则回到宠物店榜。 */
  initialMode?: GameMode;
  onBack: () => void;
  onChallenge: (mode: GameMode) => void;
  /** 打开时的榜单范围；默认今日榜。 */
  initialScope?: LeaderboardScope;
  /** 陈列页用：替换数据来源。 */
  load?: (mode: GameMode, playerId: string, scope: LeaderboardScope) => Promise<LeaderboardView>;
  loadProfile?: ProfileLoader;
  loadViewerTitles?: ViewerTitlesLoader;
  loadLikes?: PlayerLikesLoader;
  sendLike?: PlayerLikesSender;
}

type View = 'near' | 'all';
const NEAR_RADIUS = 2;

/**
 * 今日榜（默认，当天全公司同一盘棋）与总榜（个人历史最好）两层；
 * 领先三位 + 我的名次附近；无成绩时先看全榜；鱼榜标签只对已发现鱼关的玩家显示。
 */
export function LeaderboardScreen({ player, initialMode = 'normal', initialScope = 'today', onBack, onChallenge, load = api.getLeaderboard, loadProfile, loadViewerTitles = loadUnlockedTitles, loadLikes, sendLike }: LeaderboardScreenProps) {
  const { t } = useI18n();
  const [mode, setMode] = useState<GameMode>(initialMode === 'fish' && player.progress.fishUnlocked ? 'fish' : 'normal');
  const [scope, setScope] = useState<LeaderboardScope>(initialScope);
  const [view, setView] = useState<View>('near');
  const [data, setData] = useState<LeaderboardView | null>(null);
  const [failed, setFailed] = useState(false);
  const [selectedPlayer,setSelectedPlayer] = useState<LeaderboardEntry | null>(null);
  const [viewerAchievements, setViewerAchievements] = useState<{ playerId: string; titles: AchievementId[] } | null>(null);
  const viewerTitles = viewerAchievements?.playerId === player.userId ? viewerAchievements.titles : [];

  useEffect(() => {
    let active = true;
    void loadViewerTitles(player.userId).then(titles => {
      if (active) setViewerAchievements({ playerId: player.userId, titles });
    }).catch(() => {
      if (active) setViewerAchievements({ playerId: player.userId, titles: [] });
    });
    return () => { active = false; };
  }, [player.userId, loadViewerTitles]);

  const fetchBoard = useCallback(async () => {
    setFailed(false);
    setData(null);
    try {
      const board = await load(mode, player.userId, scope);
      setData(board);
      setView(board.me ? 'near' : 'all');
    } catch {
      setFailed(true);
    }
  }, [load, mode, scope, player.userId]);

  useEffect(() => {
    void fetchBoard();
  }, [fetchBoard]);

  const rows = useMemo<LeaderboardEntry[]>(() => {
    if (!data) return [];
    if (view === 'all' || !data.me) return data.entries;
    const i = data.entries.findIndex((e) => e.userId === player.userId);
    return data.entries.slice(Math.max(0, i - NEAR_RADIUS), i + NEAR_RADIUS + 1);
  }, [data, view, player.userId]);

  const tiedRanks = useMemo(() => {
    const counts = new Map<number, number>();
    data?.entries.forEach((e) => counts.set(e.rank, (counts.get(e.rank) ?? 0) + 1));
    return counts;
  }, [data]);

  const tab = (value: GameMode, label: string) => ({
    value,
    label,
    icon: <ModeMark mode={value} size={26} tone={value === mode ? 'onAccent' : 'default'} />,
  });
  const modes = [tab('normal', t('leaderboard.pets'))];
  if (player.progress.fishUnlocked) modes.push(tab('fish', t('leaderboard.fish')));
  const today = scope === 'today';
  const emptyKey = today ? (data?.entries.length === 0 ? 'leaderboard.today_empty' : 'leaderboard.today_no_score') : 'leaderboard.no_score';

  return (
    <main className={`${styles.screen} ${styles.withStickyActions}`}>
      <BrandHeader title="hall" tagline="leaderboard.tagline" onBack={onBack} />
      <Tabs value={mode} options={modes} onChange={setMode} label={t('nav.leaderboard')} />
      <Tabs
        variant="underline"
        value={scope}
        onChange={setScope}
        label={t('leaderboard.scope')}
        options={[
          { value: 'today', label: t('leaderboard.today') },
          { value: 'all', label: t('leaderboard.all_time') },
        ]}
      />
      {today && data && <BoardDateCaption date={data.date} />}
      {failed && <StatusMessage tone="error" text={t('leaderboard.load_failed')} actionLabel={t('action.retry')} actionIcon="retry" onAction={fetchBoard} />}
      {data && (
        <>
          {data.entries.length > 0 && <Podium entries={data.entries} onPlayerSelect={setSelectedPlayer} viewerTitles={viewerTitles} />}
          {!data.me && <StatusMessage text={t(emptyKey)} />}
          {data.me && (
            <Tabs
              variant="underline"
              value={view}
              onChange={setView}
              label={t('leaderboard.near_me')}
              options={[
                { value: 'near', label: t('leaderboard.near_me') },
                { value: 'all', label: t('leaderboard.all') },
              ]}
            />
          )}
          <div className={styles.list} data-testid="leaderboard-rows">
            {rows.length > 0 && <LeaderboardHeader scoreLabel={today ? 'leaderboard.today_best' : 'leaderboard.best_score'} />}
            {rows.map((e) => (
              <LeaderboardRow key={e.userId} entry={e} isMe={e.userId === player.userId} tied={(tiedRanks.get(e.rank) ?? 0) > 1} onSelect={setSelectedPlayer}
                titleRevealed={!e.equippedTitle || conditionRevealed(e.equippedTitle, viewerTitles)} />
            ))}
          </div>
        </>
      )}
      <div className={styles.stickyActions}>
        <Button size="lg" block icon={<ModeMark mode={mode} tone="onAccent" size={32} />} onClick={() => onChallenge(mode)} data-testid="challenge">
          {t('leaderboard.challenge')}
        </Button>
      </div>
      {selectedPlayer && <PlayerProfileOverlay key={`${selectedPlayer.userId}:${mode}`} player={selectedPlayer} viewerId={player.userId} mode={mode} load={loadProfile} loadViewerTitles={loadViewerTitles} loadLikes={loadLikes} sendLike={sendLike} onClose={() => setSelectedPlayer(null)} />}
    </main>
  );
}
