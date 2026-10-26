import { describe, expect, it, vi } from 'vitest';
import { verifyTurnstile } from '../src/services/turnstile.ts';

const config = { siteKey: 'public-key', secret: 'private-test-secret', hostname: 'star.baobo.me' };
const good = { success: true, hostname: config.hostname, action: 'start_game', cdata: 'game-id' };
const response = (value: unknown) => vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify(value)));

describe('Turnstile 服务端校验', () => {
  it('只向官方 Siteverify 发送 token，校验成功及对局绑定', async () => {
    const fetcher = response(good);
    expect(await verifyTurnstile(config, 'token', 'game-id', fetcher)).toBe(true);
    expect(fetcher.mock.calls[0][0]).toBe('https://challenges.cloudflare.com/turnstile/v0/siteverify');
    expect(JSON.parse(fetcher.mock.calls[0][1]!.body as string)).toMatchObject({ secret: config.secret, response: 'token' });
  });
  it.each([{ ...good, success: false }, { ...good, hostname: 'other.baobo.me' }, { ...good, action: 'login' }, { ...good, cdata: 'other-game' }])('拒绝失败、其他域名、action 或对局：%j', async (value) => {
    expect(await verifyTurnstile(config, 'token', 'game-id', response(value))).toBe(false);
  });
  it('缺少或超长 token 不调用上游', async () => {
    const fetcher = response(good);
    for (const token of ['', 'a'.repeat(2049)]) expect(await verifyTurnstile(config, token, 'game-id', fetcher)).toBe(false);
    expect(fetcher).not.toHaveBeenCalled();
  });
  it('上游异常、非成功状态或错误 JSON 均不放行', async () => {
    for (const fetcher of [vi.fn<typeof fetch>().mockRejectedValue(new Error('network')), vi.fn<typeof fetch>().mockResolvedValue(new Response('{}', { status: 503 })), vi.fn<typeof fetch>().mockResolvedValue(new Response('invalid'))]) {
      expect(await verifyTurnstile(config, 'token', 'game-id', fetcher)).toBe(false);
    }
  });
});
