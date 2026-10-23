import type { TipView } from '../../game/tips';
import type { PetInfo } from '../../game/pets';
import { useI18n, type MessageKey } from '../../i18n';
import { PetTile } from '../PetTile/PetTile';
import styles from './TipBar.module.css';

const ICON: Partial<Record<MessageKey, string>> = {
  'tutorial.comb': '🪮',
  'tutorial.scissors': '✂️',
  'tutorial.water_jet': '💦',
  'tutorial.bubble_machine': '🫧',
  'tutorial.tool_combo': '🤝',
  'board.move_hint': '👉',
  'board.shuffle': '🔀',
  'round.finishing': '⏰',
  'round.last_seconds': '⏱️',
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
            <span className={styles.icon} aria-hidden>
              {ICON[tip.key] ?? '💡'}
            </span>
          )}
          <span>{t(tip.key, tip.vars)}</span>
        </div>
      )}
    </div>
  );
}
