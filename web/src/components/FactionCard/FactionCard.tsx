import type { Faction, FactionState } from '../../api/types';
import { useI18n } from '../../i18n';
import { Icon } from '../../ui/primitives/Icon';
import { Button } from '../../ui/primitives/Button';
import { FactionTugBar } from '../FactionTugBar/FactionTugBar';
import { formatEventDay, formatPoints } from './factionFormat';
import styles from './FactionCard.module.css';

export interface FactionCardProps {
  /** null 为尚未读到；hidden 或读取失败且没有旧数据时不占首页位置。 */
  state: FactionState | null;
  /** 领先方换人：只提示一次。 */
  overtake?: Faction | null;
  onJoin: () => void;
  onOpen: () => void;
}

/**
 * 首页「开始营业」上方的阵营周小卡：拔河条 + 一行个人状态。
 * 未报名给「选边站」；已报名显示本期积分与今天剩余计分局数；迷雾期只给领先程度；收官后改为结果卡。
 */
export function FactionCard({ state, overtake = null, onJoin, onOpen }: FactionCardProps) {
  const { t, locale } = useI18n();
  if (!state || state.phase === 'hidden') return null;
  const team = (f: Faction) => t(`faction.${f}`);
  const { me } = state;
  const ended = state.phase === 'ended';
  return (
    <section className={styles.card} data-testid="faction-card" data-phase={state.phase} data-faction={me.faction ?? undefined}>
      <header className={styles.head}>
        <h2 className={styles.title}>{t('faction.title')}</h2>
        <span className={styles.ends}>{ended ? '' : t('faction.ends', { date: formatEventDay(state.endsOn, locale) })}</span>
        <button type="button" className={styles.more} onClick={onOpen}>{t('faction.details')}</button>
      </header>
      {ended && state.result ? (
        <p className={styles.winner}>
          {state.result.winner ? <Icon name={`faction-${state.result.winner}`} size={32} /> : null}
          {state.result.winner ? t('faction.winner', { team: team(state.result.winner) }) : t('faction.tie')}
        </p>
      ) : (
        <FactionTugBar compact sides={state.sides} lead={state.lead} />
      )}
      {overtake && !ended && <p className={styles.overtake} role="status">{t('faction.overtake', { team: team(overtake) })}</p>}
      {ended ? (
        me.faction && (
          <p className={styles.line} data-tone={state.result?.badge ? 'win' : undefined}>
            {state.result?.badge ? <><Icon name={`title-${state.result.badge}-avatar`} size={24} />{t('faction.badge_earned')}</> : t('faction.badge_missed')}
          </p>
        )
      ) : me.faction ? (
        <p className={styles.line}>
          <span>{t('faction.my_side', { team: team(me.faction), points: formatPoints(me.points, locale) })}</span>
          {me.todayLeft !== null && <span className={styles.today}>{me.todayLeft > 0 ? t('faction.today_left', { count: me.todayLeft }) : t('faction.today_full')}</span>}
        </p>
      ) : (
        <div className={styles.join}>
          <p className={styles.prompt}>{t('faction.join_prompt')}</p>
          <Button variant="secondary" onClick={onJoin} data-testid="faction-join">{t('faction.join')}</Button>
        </div>
      )}
      {state.phase === 'fog' && <p className={styles.note}>{t('faction.fog_note')}</p>}
    </section>
  );
}
