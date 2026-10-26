import { useEffect, useRef, type RefObject } from 'react';

export function useSocialModal(ref: RefObject<HTMLElement | null>, onClose: () => void) {
  const latestClose = useRef(onClose);
  latestClose.current = onClose;
  useEffect(() => {
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const buttons = () =>
      Array.from(
        ref.current?.querySelectorAll<HTMLElement>(
          'button:not(:disabled),a[href],textarea,input,select,[tabindex="0"]',
        ) ?? [],
      );
    buttons()[0]?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopImmediatePropagation();
        latestClose.current();
      }
      if (e.key !== 'Tab') return;
      const list = buttons();
      const target = e.shiftKey ? list.at(-1) : list[0];
      if (
        (e.shiftKey && document.activeElement === list[0]) ||
        (!e.shiftKey && document.activeElement === list.at(-1))
      ) {
        e.preventDefault();
        target?.focus();
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener('keydown', onKey, true);
      if (previous instanceof HTMLElement && previous.isConnected) previous.focus({ preventScroll: true });
    };
  }, [ref]);
}
