import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';
import type { GameMode, LeaderboardEntry, LeaderboardView, PlayerView } from '../api/types';
import { BrandHeader } from '../components/BrandHeader/BrandHeader';
import { LeaderboardHeader, LeaderboardRow } from '../components/LeaderboardRow/LeaderboardRow';
import { ModeMark } from '../components/ModeMark/ModeMark';
import { Podium } from '../components/Podium/Podium';
import { StatusMessage } from '../components/StatusMessage/StatusMessage';
import { useI18n } from '../i18n';
import { Button } from '../ui/primitives/Button';
import { Tabs } from '../ui/primitives/Tabs';
import styles from './Screen.module.css';

export interface LeaderboardScreenProps {
  player: PlayerView;
  /** 打开时选中的榜单；鱼榜只对已发现鱼关的玩家有效，否则回到宠物店榜。 */
  initialMode?: GameMode;
  onBack: () => void;
  onChallenge: (mode: GameMode) => void;
  /** 陈列页用：替换数据来源。 */
  load?: (mode: GameMode, playerId: string) => Promise<LeaderboardView>;
}

type View = 'near' | 'all';
const NEAR_RADIUS = 2;

/** 领先三位 + 我的名次附近；无成绩时先看全榜；鱼榜标签只对已发现鱼关的玩家显示。 */
export function LeaderboardScreen({ player, initialMode = 'normal', onBack, onChallenge, load = api.getLeaderboard }: LeaderboardScreenProps) {
  const { t } = useI18n();
  const [mode, setMode] = useState<GameMode>(initialMode === 'fish' && player.progress.fishUnlocked ? 'fish' : 'normal');
  const [view, setView] = useState<View>('near');
  const [data, setData] = useState<LeaderboardView | null>(null);
  const [failed, setFailed] = useState(false);

  const fetchBoard = useCallback(async () => {
    setFailed(false);
    setData(null);
    try {
      const board = await load(mode, player.userId);
      setData(board);
      setView(board.me ? 'near' : 'all');
    } catch {
      setFailed(true);
    }
  }, [load, mode, player.userId]);

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

  return (
    <main className={`${styles.screen} ${styles.withStickyActions}`}>
      <BrandHeader title="hall" tagline="leaderboard.tagline" onBack={onBack} />
      <Tabs value={mode} options={modes} onChange={setMode} label={t('nav.leaderboard')} />
      {failed && <StatusMessage tone="error" text={t('leaderboard.load_failed')} actionLabel={t('action.retry')} actionIcon="retry" onAction={fetchBoard} />}
      {data && (
        <>
          <Podium entries={data.entries} />
          {!data.me && <StatusMessage text={t('leaderboard.no_score')} />}
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
            {rows.length > 0 && <LeaderboardHeader />}
            {rows.map((e) => (
              <LeaderboardRow key={e.userId} entry={e} isMe={e.userId === player.userId} tied={(tiedRanks.get(e.rank) ?? 0) > 1} />
            ))}
          </div>
        </>
      )}
      <div className={styles.stickyActions}>
        <Button size="lg" block icon={<ModeMark mode={mode} tone="onAccent" size={32} />} onClick={() => onChallenge(mode)} data-testid="challenge">
          {t('leaderboard.challenge')}
        </Button>
      </div>
    </main>
  );
}
