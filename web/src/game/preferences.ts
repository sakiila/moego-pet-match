/** 背景音乐、消除音效与轻震的偏好：各自独立并记住；开局或重开设置不重置。 */
export interface SoundPreferences {
  music: boolean;
  sfx: boolean;
  haptics: boolean;
}

const KEY = 'pet-match.sound';

type Storage = Pick<globalThis.Storage, 'getItem' | 'setItem'>;

/** 首次：音乐与音效静音；设备支持震动时轻震开启。 */
export const defaultPreferences = (hapticsSupported: boolean): SoundPreferences => ({ music: false, sfx: false, haptics: hapticsSupported });

/** 读不到或内容损坏时回到默认；设备不支持震动时轻震一律按关。 */
export function loadPreferences(storage: Storage | null, hapticsSupported: boolean): SoundPreferences {
  const base = defaultPreferences(hapticsSupported);
  try {
    const raw = storage?.getItem(KEY);
    if (!raw) return base;
    const v = JSON.parse(raw) as Partial<SoundPreferences>;
    return {
      music: typeof v.music === 'boolean' ? v.music : base.music,
      sfx: typeof v.sfx === 'boolean' ? v.sfx : base.sfx,
      haptics: hapticsSupported && (typeof v.haptics === 'boolean' ? v.haptics : base.haptics),
    };
  } catch {
    return base;
  }
}

export function savePreferences(storage: Storage | null, prefs: SoundPreferences) {
  try {
    storage?.setItem(KEY, JSON.stringify(prefs));
  } catch {
    // 无法记住时下次回到默认
  }
}
