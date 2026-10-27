import { useState } from 'react';
import type { Faction } from '../../api/types';
import { FACTION_RULES } from '../../game/factionWeek';
import { useI18n } from '../../i18n';
import { Button } from '../../ui/primitives/Button';
import { Icon } from '../../ui/primitives/Icon';
import { Sheet } from '../../ui/primitives/Sheet';
import { StatusMessage } from '../StatusMessage/StatusMessage';
import { formatEventDay } from '../FactionCard/factionFormat';
import styles from './FactionJoinSheet.module.css';

export type FactionJoinError = 'failed' | 'closed';

export interface FactionJoinSheetProps {
  endsOn: string;
  /** 报名；失败时抛出，closed 表示已截止。 */
  onJoin: (faction: Faction) => Promise<void>;
  onClose: () => void;
  /** 自家上架宠物里猫多或狗多时的推荐，只作提示。 */
  suggested?: Faction | null;
  inline?: boolean;
  /** 陈列页固定状态。 */
  initial?: { selected?: Faction; busy?: boolean; error?: FactionJoinError };
}

/** 选边弹层：两张阵营卡二选一，列出规则与「选定后不能更换」，确认后报名。 */
export function FactionJoinSheet({ endsOn, onJoin, onClose, suggested = null, inline, initial }: FactionJoinSheetProps) {
  const { t, locale } = useI18n();
  const [selected, setSelected] = useState<Faction | null>(initial?.selected ?? suggested);
  const [busy, setBusy] = useState(initial?.busy ?? false);
  const [error, setError] = useState<FactionJoinError | null>(initial?.error ?? null);
  const confirm = async () => {
    if (!selected || busy) return;
    setBusy(true);
    setError(null);
    try {
      await onJoin(selected);
      onClose();
    } catch (e) {
      setError((e as { detail?: string }).detail === 'closed' ? 'closed' : 'failed');
      setBusy(false);
    }
  };
  return (
    <Sheet open inline={inline} label={t('faction.join_title')} closeLabel={t('action.close')} onClose={onClose} trapFocus
      badge={<h2 className={styles.title}>{t('faction.join_title')}</h2>}>
      <div className={styles.root} data-testid="faction-join-sheet">
        <div className={styles.choices} role="radiogroup" aria-label={t('faction.join_title')}>
          {(['cat', 'dog'] as const).map((f) => (
            <button key={f} type="button" role="radio" aria-checked={selected === f} className={styles.choice} data-faction={f}
              disabled={busy} onClick={() => setSelected(f)}>
              <Icon name={`faction-${f}`} size={72} />
              <strong>{t(`faction.${f}`)}</strong>
            </button>
          ))}
        </div>
        <ul className={styles.rules}>
          <li>{t('faction.rule_lineup')}</li>
          <li>{t('faction.rule_points')}</li>
          <li>{t('faction.rule_daily', { count: FACTION_RULES.dailyGames, date: formatEventDay(endsOn, locale) })}</li>
          <li>{t('faction.rule_badge')}</li>
        </ul>
        <p className={styles.lock}>{t('faction.rule_lock')}</p>
        {error && <StatusMessage tone="error" text={t(error === 'closed' ? 'faction.join_closed' : 'faction.join_failed')} />}
        <Button size="lg" block disabled={!selected || busy || error === 'closed'} onClick={confirm} data-testid="faction-join-confirm">
          {selected ? t('faction.join_confirm', { team: t(`faction.${selected}`) }) : t('faction.join')}
        </Button>
      </div>
    </Sheet>
  );
}
