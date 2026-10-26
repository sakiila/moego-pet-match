export interface TurnstileConfig {
  siteKey: string;
  secret: string;
  hostname: string;
  fetchImpl?: typeof fetch;
}

/** 生产启动时即校验配置，不允许缺少验证密钥后静默放行。 */
export function productionTurnstile(env: NodeJS.ProcessEnv): TurnstileConfig {
  const siteKey = env.TURNSTILE_SITE_KEY?.trim();
  const secret = env.TURNSTILE_SECRET_KEY?.trim();
  if (!siteKey || !secret || /^[123]x000000/.test(siteKey) || /^[123]x000000/.test(secret)) {
    throw new Error('Production requires real TURNSTILE_SITE_KEY and TURNSTILE_SECRET_KEY');
  }
  return { siteKey, secret, hostname: 'star.baobo.me' };
}

/** 一次性 token 必须来自本站、本次开局；异常时不放行，不记录密钥或 token。 */
export async function verifyTurnstile(config: TurnstileConfig, token: string, gameId: string, fetcher = config.fetchImpl ?? fetch): Promise<boolean> {
  if (!token || token.length > 2048) return false;
  try {
    const response = await fetcher('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ secret: config.secret, response: token }),
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) return false;
    const result = await response.json() as Record<string, unknown> | null;
    return result?.success === true && result.hostname === config.hostname && result.action === 'start_game' && result.cdata === gameId;
  } catch { return false; }
}
