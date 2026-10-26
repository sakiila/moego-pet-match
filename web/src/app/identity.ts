/** 只记住所选 userId；登录权限由服务端 HttpOnly 会话验证，不以本地记录作为凭证。 */
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
