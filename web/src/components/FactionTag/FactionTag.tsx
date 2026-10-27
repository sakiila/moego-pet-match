import type { FactionContribution } from '../../api/types';
import { useI18n } from '../../i18n';
import { Icon } from '../../ui/primitives/Icon';
import styles from './FactionTag.module.css';

/** 报告分数下标签行的一枚：本局为阵营带来的积分；当天已满 5 局时提示明天继续。 */
export function FactionTag({ contribution }: { contribution: FactionContribution }) {
  const { t } = useI18n();
  const team = t(`faction.${contribution.faction}`);
  return (
    <span className={styles.tag} data-faction={contribution.faction} data-capped={contribution.capped || undefined} data-testid="report-faction">
      <Icon name={`faction-${contribution.faction}`} size={18} />
      {contribution.capped ? t('faction.report_full') : t('faction.report_points', { team, points: contribution.points })}
    </span>
  );
}
