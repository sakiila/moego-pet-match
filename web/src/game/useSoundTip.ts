import { useEffect, useState } from 'react';

const KEY = 'pet-match.sound-tip-seen';
let seenInSession = false;

/** 浏览器级提示，与玩家身份无关；陈列页预览不读写真实记录。 */
export function useSoundTip(preview?: boolean) {
  const [open, setOpen] = useState(() => {
    if (preview !== undefined) return preview;
    if (seenInSession) return false;
    try {
      return localStorage.getItem(KEY) !== '1';
    } catch {
      return true;
    }
  });

  useEffect(() => {
    if (!open || preview !== undefined) return;
    seenInSession = true;
    try {
      localStorage.setItem(KEY, '1');
    } catch {
      // 存储不可用时，在本次页面会话内仍只展示一次。
    }
  }, [open, preview]);

  return { open, dismiss: () => setOpen(false) };
}
