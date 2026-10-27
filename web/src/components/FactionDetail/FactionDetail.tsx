import type { Faction, FactionPerson, FactionPetStat, FactionView } from '../../api/types';
import { avatarUrl, stickerUrl } from '../../game/pets';
import { useI18n } from '../../i18n';
import { Avatar } from '../../ui/primitives/Avatar';
import { Icon } from '../../ui/primitives/Icon';
import { Sheet } from '../../ui/primitives/Sheet';
import { AchievementBadge } from '../AchievementBadge/AchievementBadge';
import { FactionTugBar } from '../FactionTugBar/FactionTugBar';
import { formatEventDay, formatPoints } from '../FactionCard/factionFormat';
import styles from './FactionDetail.module.css';

export interface FactionDetailProps {
  state: FactionView;
  onClose: () => void;
  onJoin?: () => void;
  inline?: boolean;
}

const FACTIONS: readonly Faction[] = ['cat', 'dog'];

/** 阵营详情：拉锯与人数平衡、我的状态、昨日看点；收官后为最终比分、贡献前三与本人徽章。 */
export function FactionDetail({ state, onClose, onJoin, inline }: FactionDetailProps) {
  const { t, locale } = useI18n();
  const team = (f: Faction) => t(`faction.${f}`);
  const pts = (n: number) => t('faction.points', { points: formatPoints(n, locale) });
  const { result, me } = state;

  const person = (p: FactionPerson, f: Faction, rank?: number) => (
    <li key={p.userId} className={styles.person} data-faction={f}>
      {rank !== undefined && <span className={styles.rank}>{rank}</span>}
      <Avatar name={p.name} src={avatarUrl(p.userId)} seed={p.userId} size={32} />
      <span className={styles.name}>{p.name}</span>
      <span className={styles.value}>{pts(p.points)}</span>
    </li>
  );
  const pet = (p: FactionPetStat | null, f: Faction) => p && (
    <li key={f} className={styles.person} data-faction={f}>
      <img className={styles.sticker} src={stickerUrl(p.petId, 128)} alt="" width={32} height={32} />
      <span className={styles.name}><small>{t(`faction.top_pet_${f}`)}</small>{p.name}</span>
      <span className={styles.value}>{t('faction.cells', { count: formatPoints(p.cells, locale) })}</span>
    </li>
  );

  return (
    <Sheet open inline={inline} label={t('faction.title')} closeLabel={t('action.close')} onClose={onClose} trapFocus
      badge={<h2 className={styles.title}>{t('faction.title')}</h2>}>
      <div className={styles.root} data-testid="faction-detail" data-phase={state.phase}>
        {result ? (
          <p className={styles.winner}>
            {result.winner && <Icon name={`faction-${result.winner}`} size={48} />}
            {result.winner ? t('faction.winner', { team: team(result.winner) }) : t('faction.tie')}
          </p>
        ) : (
          <p className={styles.dates}>{t('faction.ends', { date: formatEventDay(state.endsOn, locale) })}</p>
        )}
        <FactionTugBar sides={state.sides} lead={state.lead} />
        <div className={styles.sides}>
          {FACTIONS.map((f) => (
            <p key={f} className={styles.side} data-faction={f}>
              <span>{t('faction.members', { count: state.sides[f].members, active: state.sides[f].active })}</span>
              {state.sides[f].factor > 1 && <span className={styles.factor}>{t('faction.factor', { factor: state.sides[f].factor.toFixed(2) })}</span>}
            </p>
          ))}
        </div>
        {state.phase === 'fog' && <p className={styles.note}>{t('faction.fog_note')}</p>}

        {me.faction ? (
          <p className={styles.me} data-faction={me.faction}>
            <span>{t('faction.my_side', { team: team(me.faction), points: formatPoints(me.points, locale) })}</span>
            {me.todayLeft !== null && <span className={styles.today}>{me.todayLeft > 0 ? t('faction.today_left', { count: me.todayLeft }) : t('faction.today_full')}</span>}
          </p>
        ) : onJoin && !result ? (
          <button type="button" className={styles.join} onClick={onJoin}>{t('faction.join')}</button>
        ) : null}

        {result && me.faction && (
          <div className={styles.badge} data-earned={result.badge ? true : undefined}>
            {result.badge ? <><AchievementBadge id={result.badge} size={64} rarity /><strong>{t('faction.badge_earned')}</strong></> : <span>{t('faction.badge_missed')}</span>}
          </div>
        )}

        {result ? (
          <section className={styles.section}>
            <h3>{t('faction.top_players')}</h3>
            {FACTIONS.map((f) => (
              <div key={f} className={styles.group}>
                <h4 data-faction={f}>{team(f)}{state.sides[f].adjusted !== null && ` · ${pts(state.sides[f].adjusted)}`}</h4>
                {result.top[f].length ? <ol className={styles.list}>{result.top[f].map((p, i) => person(p, f, i + 1))}</ol> : <p className={styles.empty}>{t('faction.empty')}</p>}
              </div>
            ))}
            <ul className={styles.list}>{FACTIONS.map((f) => pet(result.pets[f], f))}</ul>
          </section>
        ) : state.yesterday ? (
          <section className={styles.section}>
            <h3>{t('faction.yesterday')}</h3>
            <ul className={styles.list}>
              {FACTIONS.map((f) => {
                const star = state.yesterday!.stars[f];
                return star && (
                  <li key={f} className={styles.person} data-faction={f}>
                    <Avatar name={star.name} src={avatarUrl(star.userId)} seed={star.userId} size={32} />
                    <span className={styles.name}><small>{t('faction.star', { team: team(f) })}</small>{star.name}</span>
                    {state.phase !== 'fog' && <span className={styles.value}>{pts(star.points)}</span>}
                  </li>
                );
              })}
              {FACTIONS.map((f) => pet(state.yesterday!.pets[f], f))}
            </ul>
          </section>
        ) : null}
      </div>
    </Sheet>
  );
}
