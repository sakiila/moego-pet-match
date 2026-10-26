import { describe, expect, it, vi } from 'vitest';
import { createImageCdnPurger, stickerPurgeUrls } from '../src/services/imageCdn.ts';

const env = { CLOUDFLARE_ZONE_ID: 'a'.repeat(32), CLOUDFLARE_API_TOKEN: 'test-purge-token' };

describe('公开贴纸 CDN 清理', () => {
  it('只列出 star.baobo.me 当前压缩版三个尺寸，路径字符被编码', () => {
    expect(stickerPurgeUrls('a/b ?')).toEqual([128, 512, 1024].map(size =>
      `https://star.baobo.me/img/pets/a%2Fb%20%3F/${size}?format=webp&v=q85-v2`));
    expect(stickerPurgeUrls('fish_color_blue', 'fish')[0]).toBe('https://star.baobo.me/img/fish/fish_color_blue/128?format=webp&v=q85-v2');
  });

  it('缺少或错误配置时在任何请求之前拒绝', () => {
    const fetcher = vi.fn();
    for (const config of [{}, { ...env, CLOUDFLARE_API_TOKEN: '' }, { ...env, CLOUDFLARE_ZONE_ID: 'invalid' }]) {
      expect(() => createImageCdnPurger(config, fetcher)).toThrow(/CLOUDFLARE_ZONE_ID/);
    }
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('使用 URL 清理并要求 Cloudflare 明确返回成功', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({ success: true })));
    await createImageCdnPurger(env, fetcher)('pet_one');
    const [url, init] = fetcher.mock.calls[0];
    expect(url).toBe(`https://api.cloudflare.com/client/v4/zones/${env.CLOUDFLARE_ZONE_ID}/purge_cache`);
    expect(init?.method).toBe('POST');
    expect(JSON.parse(init?.body as string)).toEqual({ files: stickerPurgeUrls('pet_one') });
  });

  it.each([
    [403, { success: false }],
    [200, { success: false }],
    [200, {}],
  ])('HTTP %s 未确认成功时拒绝，错误不包含令牌', async (status, body) => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify(body), { status }));
    await expect(createImageCdnPurger(env, fetcher)('pet_one')).rejects.toThrow(`Cloudflare image purge failed (HTTP ${status})`);
  });
});
