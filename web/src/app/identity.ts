/** 浏览器记住所选同事身份；只存 userId，回访时向服务端校验是否仍有效。 */
const KEY = 'pet-match.player';

export function loadSavedPlayerId(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function savePlayerId(userId: string | null) {
  try {
    if (userId) localStorage.setItem(KEY, userId);
    else localStorage.removeItem(KEY);
  } catch {
    // 无法记住时，下次打开重新选择身份
  }
}
