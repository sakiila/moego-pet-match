import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import type { AchievementId } from '../../api/types';
import { ACHIEVEMENTS } from '../../game/achievementRules';
import { useI18n, type MessageKey } from '../../i18n';
import { AchievementBadge, achievementName } from '../AchievementBadge/AchievementBadge';
import styles from './PlayerProfileBadge.module.css';

/** 名片里的只读徽章：悬浮、键盘聚焦或轻点查看条件。 */
export function PlayerProfileBadge({ id, chip = false }: { id: AchievementId; chip?: boolean }) {
  const { t, locale } = useI18n();
  const tooltipId = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const tooltip = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<number | undefined>(undefined);
  const [open, setOpen] = useState(false);
  const name = t(achievementName(id));
  // 隐藏成就（火锅搭子）不在按图鉴计数的 ACHIEVEMENTS 表里，解锁条件文案不带数字，目标按 1 处理
  const target = ACHIEVEMENTS.find(achievement => achievement.id === id)?.target ?? 1;

  const cancelClose = () => window.clearTimeout(closeTimer.current);
  const hide = () => {
    cancelClose();
    if (tooltip.current?.matches(':popover-open')) tooltip.current.hidePopover();
  };
  const show = () => {
    cancelClose();
    if (!tooltip.current?.matches(':popover-open')) tooltip.current?.showPopover();
  };
  const leave = () => {
    cancelClose();
    if (!trigger.current?.matches(':focus-visible')) {
      closeTimer.current = window.setTimeout(hide, 150);
    }
  };

  useLayoutEffect(() => {
    if (!open) return;
    const position = () => {
      const button = trigger.current;
      const bubble = tooltip.current;
      if (!button || !bubble) return;
      const anchor = button.getBoundingClientRect();
      const bounds = bubble.getBoundingClientRect();
      const tokens = getComputedStyle(bubble);
      const margin = parseFloat(tokens.getPropertyValue('--space-4'));
      const gap = parseFloat(tokens.getPropertyValue('--space-2'));
      const card = button.closest('[role="dialog"]')?.getBoundingClientRect();
      const leftEdge = Math.max(margin, (card?.left ?? 0) + margin);
      const rightEdge = Math.min(window.innerWidth - margin, (card?.right ?? window.innerWidth) - margin);
      const left = Math.max(leftEdge, Math.min(anchor.left + (anchor.width - bounds.width) / 2, rightEdge - bounds.width));
      const preferredTop = anchor.top - bounds.height - gap;
      const top = preferredTop >= margin ? preferredTop : anchor.bottom + gap;
      bubble.style.left = `${left}px`;
      bubble.style.top = `${Math.max(margin, Math.min(top, window.innerHeight - bounds.height - margin))}px`;
    };
    position();
    window.addEventListener('resize', position);
    return () => window.removeEventListener('resize', position);
  }, [open, locale]);

  useEffect(() => {
    if (!open) return;
    // 先收起说明，避免 Sheet 的 Escape 同时关闭整张名片。
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      event.stopPropagation();
      hide();
    };
    document.addEventListener('keydown', onKey, true);
    window.addEventListener('scroll', hide, true);
    return () => {
      document.removeEventListener('keydown', onKey, true);
      window.removeEventListener('scroll', hide, true);
    };
  }, [open]);
  useEffect(() => () => window.clearTimeout(closeTimer.current), []);

  return <div className={`${styles.root} ${chip ? styles.chip : ''}`}
    onPointerEnter={event => { if (event.pointerType === 'mouse' && window.matchMedia('(hover: hover)').matches) show(); }}
    onPointerLeave={event => { if (event.pointerType === 'mouse' && window.matchMedia('(hover: hover)').matches) leave(); }}>
    <button ref={trigger} type="button" className={styles.trigger} popoverTarget={tooltipId}
      aria-label={t('achievement.view_condition', { title: name })} aria-expanded={open} aria-describedby={tooltipId}
      onFocus={event => { if (event.currentTarget.matches(':focus-visible')) show(); }} onBlur={hide}>
      <AchievementBadge id={id} chip={chip} size={chip ? undefined : 56} title="" />
      {!chip && <span>{name}</span>}
    </button>
    <div ref={tooltip} id={tooltipId} role="tooltip" popover="auto" className={styles.tooltip}
      onToggle={event => setOpen(event.currentTarget.matches(':popover-open'))}
      onPointerEnter={cancelClose}
      onPointerLeave={event => { if (event.pointerType === 'mouse' && window.matchMedia('(hover: hover)').matches) leave(); }}>
      <strong>{t('achievement.unlock_condition')}</strong>
      <p>{t(`achievement.${id}_unlock` as MessageKey, { target })}</p>
    </div>
  </div>;
}
