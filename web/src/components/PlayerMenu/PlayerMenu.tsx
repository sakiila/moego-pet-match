import { useEffect, useId, useRef, useState } from 'react';
import { useI18n } from '../../i18n';
import styles from './PlayerMenu.module.css';
import type { AchievementId } from '../../api/types';
import { AchievementAvatar } from '../AchievementAvatar/AchievementAvatar';
import { Icon } from '../../ui/primitives/Icon';

export interface PlayerMenuProps {
  name: string;
  userId: string;
  avatarSrc?: string | null;
  onClockOut: () => void;
  defaultOpen?: boolean;
  equippedTitle?: AchievementId | null;
  onTitles?: () => void;
}

export function PlayerMenu({ name, userId, avatarSrc, onClockOut, defaultOpen = false, equippedTitle, onTitles }: PlayerMenuProps) {
  const { t } = useI18n();
  const [open, setOpen] = useState(defaultOpen);
  const root = useRef<HTMLSpanElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const dismiss = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', dismiss);
    return () => document.removeEventListener('pointerdown', dismiss);
  }, [open]);

  return (
    <span
      ref={root}
      className={styles.root}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && open) {
          event.stopPropagation();
          setOpen(false);
          trigger.current?.focus();
        }
      }}
    >
      <button
        ref={trigger}
        type="button"
        className={styles.trigger}
        onClick={() => setOpen((value) => !value)}
        aria-label={t('identity.menu', { playerName: name })}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        data-testid="player-menu-trigger"
      >
        <AchievementAvatar name={name} seed={userId} src={avatarSrc} equippedTitle={equippedTitle} />
      </button>
      {open && (
        <span id={panelId} className={styles.dropdown} data-testid="player-menu">
          {onTitles && <button type="button" className={styles.action} onClick={() => { setOpen(false); onTitles(); }} data-testid="my-titles"><Icon name="my-titles" size={24} />{t('achievement.my_titles')}</button>}
          <button
            type="button"
            className={styles.action}
            onClick={() => {
              setOpen(false);
              onClockOut();
            }}
            data-testid="clock-out"
          >
            <Icon name="clock-out" size={24} />{t('action.clock_out')}
          </button>
        </span>
      )}
    </span>
  );
}
