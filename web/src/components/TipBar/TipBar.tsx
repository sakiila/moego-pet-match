import type { TipView } from '../../game/tips';
import type { PetInfo } from '../../game/pets';
import { useI18n, type MessageKey } from '../../i18n';
import { PetTile } from '../PetTile/PetTile';
import { Icon, type IconName } from '../../ui/primitives/Icon';
import styles from './TipBar.module.css';

/** 提示对应的已确认图标；道具带教用道具缩略图，其余无专属图标的提示用信息说明。 */
const ICON: Partial<Record<MessageKey, IconName>> = {
  'tutorial.comb': 'comb-horizontal',
  'tutorial.scissors': 'scissors',
  'tutorial.dryer_merge': 'hair-dryer',
  'tutorial.dryer': 'hair-dryer',
  'tutorial.conch': 'conch-horizontal',
  'tutorial.pearl_shell': 'pearl-shell',
  'tutorial.big_wave_merge': 'big-wave',
  'tutorial.big_wave': 'big-wave',
  'tutorial.tool_combo': 'tool-combo',
  'board.move_hint': 'tap-swap',
  'board.shuffle': 'automatic-shuffle',
  'round.finishing': 'time-left',
  'round.last_seconds': 'time-left',
};

/**
 * 棋盘外的提示区：固定高度，同一时刻至多一条，出现与消失不推动棋盘。
 * 局内事件贴纸（新宠、团聚）带宠物小头像；底色沿用本局 kind，对应棋盘上的同一只。
 */
export function TipBar({ tip, pets = [] }: { tip: TipView | null; pets?: PetInfo[] }) {
  const { t } = useI18n();
  const faces = (tip?.petIds ?? []).map((id) => ({ pet: pets.find((p) => p.id === id), kind: pets.findIndex((p) => p.id === id) }));
  return (
    <div className={styles.slot} data-testid="tip" aria-live="polite">
      {tip && (
        <div key={`${tip.key}-${(tip.petIds ?? []).join()}`} className={styles.tip}>
          {faces.length > 0 ? (
            <span className={styles.faces} aria-hidden>
              {faces.slice(0, 4).map(({ pet, kind }) =>
                pet ? (
                  <span key={pet.id} className={styles.face}>
                    <PetTile pet={pet} tint={kind} size={36} />
                  </span>
                ) : null,
              )}
            </span>
          ) : (
            <Icon name={ICON[tip.key] ?? 'information'} className={styles.icon} size={36} />
          )}
          <span>{t(tip.key, tip.vars)}</span>
        </div>
      )}
    </div>
  );
}
