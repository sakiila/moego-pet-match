import { useEffect, useRef } from 'react';
import type { ColleagueResult, PlayerProfileView } from '../../api/types';
import type { AchievementId } from '../../api/types';
import { ACHIEVEMENT_IDS, conditionRevealed } from '../../game/achievementRules';
import { ACHIEVEMENT_DISPLAY_ORDER } from '../../game/achievementRarity';
import { useI18n } from '../../i18n';
import { Avatar } from '../../ui/primitives/Avatar';
import { Sheet } from '../../ui/primitives/Sheet';
import { PlayerProfileBadge } from './PlayerProfileBadge';
import { ModeMark } from '../ModeMark/ModeMark';
import { StatusMessage } from '../StatusMessage/StatusMessage';
import styles from './PlayerProfileCard.module.css';

export interface PlayerProfileCardProps {
  player: ColleagueResult;
  view: PlayerProfileView | null;
  error?: 'not_found' | 'unavailable' | null;
  onRetry: () => void;
  onClose: () => void;
  inline?: boolean;
  /** 正在看名片的玩家自己已解锁的称号；隐藏称号的解锁条件只对其中的显示真实文字。 */
  viewerTitles?: readonly AchievementId[];
}

export function PlayerProfileCard({ player, view, error, onRetry, onClose, inline, viewerTitles = [] }: PlayerProfileCardProps) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (inline) return;
    const previous = document.activeElement;
    root.current?.closest('[role="dialog"]')?.querySelector<HTMLButtonElement>('button')?.focus({preventScroll:true});
    return () => { if (previous instanceof HTMLElement && previous.isConnected) previous.focus({preventScroll:true}); };
  },[inline]);
  const { t, locale } = useI18n();
  const language = locale === 'zh' ? 'zh-CN' : 'en-US';
  const number = (value: number) => value.toLocaleString(language);
  const date = new Intl.DateTimeFormat(language, {month:'short',day:'numeric',timeZone:'Asia/Shanghai'});
  const unlockedTitles = ACHIEVEMENT_DISPLAY_ORDER.filter(id => view?.unlockedTitles.includes(id));
  return <Sheet open inline={inline} label={t('profile.named', {playerName:player.name})} closeLabel={t('action.close')} onClose={onClose}
    badge={<h2 className={styles.title}>{t('profile.title')}</h2>}>
    <div ref={root} className={styles.root} data-testid="player-profile">
      <div className={styles.identity}>
        <Avatar name={player.name} seed={player.userId} src={`/img/avatars/${encodeURIComponent(player.userId)}`} size={64} />
        <div className={styles.identityText}>
          <h3 className={styles.name}>{view?.name ?? player.name}</h3>
          {view?.equippedTitle && <PlayerProfileBadge id={view.equippedTitle} chip revealed={conditionRevealed(view.equippedTitle, viewerTitles)} />}
        </div>
      </div>
      {error ? <StatusMessage tone="error" text={t(error === 'not_found' ? 'profile.not_found' : 'profile.load_failed')}
        actionLabel={error === 'unavailable' ? t('action.retry') : undefined} onAction={error === 'unavailable' ? onRetry : undefined} />
        : !view ? <p role="status" className={styles.hint}>{t('profile.loading')}</p> : <>
          <dl className={styles.stats}>
            <div><dd>{view.bestScore == null ? '—' : number(view.bestScore)}</dd><dt>{t('profile.best')}</dt></div>
            <div><dd>{number(view.collection.collected)} / {number(view.collection.total)}</dd><dt>{t('profile.collected')}</dt></div>
            <div><dd>{number(view.completedGames)}</dd><dt>{t('profile.games')}</dt></div>
          </dl>
          <section className={styles.section}>
            <div className={styles.sectionHeading}><h3>{t('profile.badges')}</h3><span>{view.unlockedTitles.length} / {ACHIEVEMENT_IDS.length}</span></div>
            {unlockedTitles.length ? <ul className={styles.badges}>{unlockedTitles.map(id => <li key={id}>
              <PlayerProfileBadge id={id} revealed={conditionRevealed(id, viewerTitles)} />
            </li>)}</ul> : <p className={styles.hint}>{t('profile.no_badges')}</p>}
          </section>
          <section className={styles.section}>
            <div className={styles.sectionHeading}><h3>{t('profile.recent')}</h3><span className={styles.mode}><ModeMark mode={view.mode} size={20} />{t(view.mode === 'fish' ? 'leaderboard.fish' : 'leaderboard.pets')}</span></div>
            {view.recentGames.length ? <table className={styles.history}>
              <thead><tr><th>{t('profile.date')}</th><th>{t('profile.score')}</th>{view.mode === 'normal' && <th>{t('profile.new_collected')}</th>}</tr></thead>
              <tbody>{view.recentGames.map(game => <tr key={game.gameId}>
                <td><time dateTime={game.completedAt}>{date.format(new Date(game.completedAt))}</time></td>
                <td>{number(game.score)}</td>
                {view.mode === 'normal' && <td className={game.newCollected ? styles.newCollected : undefined}>{game.newCollected ? `+${number(game.newCollected)}` : '0'}</td>}
              </tr>)}</tbody>
            </table> : <p className={styles.hint}>{t('profile.no_games')}</p>}
          </section>
        </>}
    </div>
  </Sheet>;
}
