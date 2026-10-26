import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { socialApi, SocialApiError } from './social';
import type { SocialPost } from '../social/model';

const value: SocialPost = {
  id: '12345678-1111-4111-8111-123456789abc',
  author: { id: 'selected-in-browser', name: 'Sample' },
  source: 'native',
  body: ' hello ',
  createdAt: '2026-10-26T00:00:00Z',
  photos: [{ id: 'media-id', src: '/private-photo', alt: '' }],
  comments: [],
  reactions: { cute: [], pets: [], play: [], love: [] },
};
describe('社交 API 边界', () => {
  const fetchMock = vi.fn<typeof fetch>();
  let events: EventTarget;
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
    vi.stubGlobal('location', { pathname: '/moments' });
    events = new EventTarget();
    vi.stubGlobal('window', events);
  });
  afterEach(() => vi.unstubAllGlobals());
  it('发布只发送内容、照片 ID 和选填宠物，不发送客户端作者或分数', async () => {
    fetchMock.mockResolvedValue(Response.json(value));
    await socialApi.publish(value);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/social/posts');
    expect(JSON.parse(String(init?.body))).toEqual({
      id: value.id,
      body: ' hello ',
      photoIds: ['media-id'],
      petId: null,
    });
    expect(init?.headers).toMatchObject({ 'content-type': 'application/json' });
  });
  it('DELETE 不携带空 JSON Content-Type，避免服务端把空正文当解析错误', async () => {
    fetchMock.mockResolvedValue(Response.json({ ok: true, unreadCount: 0 }));
    await socialApi.remove(value.id);
    const [, init] = fetchMock.mock.calls[0];
    expect(init?.method).toBe('DELETE');
    expect(init?.headers).not.toHaveProperty('content-type');
    expect(init?.body).toBeUndefined();
  });
  it('回应丢失时按同一个 ID 找回已保存的发布，不创建第二条', async () => {
    const saved = { ...value, body: 'hello' };
    fetchMock.mockRejectedValueOnce(new TypeError('network')).mockResolvedValueOnce(Response.json(saved));
    expect(await socialApi.publish(value)).toEqual(saved);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][1]?.method).toBe('POST');
    expect(fetchMock.mock.calls[1][0]).toBe(`/api/social/posts/${value.id}`);
  });
  it('找回的内容不匹配时保留失败，不误报发布成功', async () => {
    fetchMock
      .mockRejectedValueOnce(new TypeError('network'))
      .mockResolvedValueOnce(Response.json({ ...value, body: 'different' }));
    await expect(socialApi.publish(value)).rejects.toMatchObject({ status: 0, code: 'network_error' });
  });
  it('401 通知现有登录流程，其他权限错误不会冒充掉线', async () => {
    const listener = vi.fn();
    events.addEventListener('pet-match:login-required', listener);
    fetchMock.mockResolvedValueOnce(Response.json({ error: 'login_required' }, { status: 401 }));
    await expect(socialApi.session()).rejects.toBeInstanceOf(SocialApiError);
    expect(listener).toHaveBeenCalledTimes(1);
    fetchMock.mockResolvedValueOnce(Response.json({ error: 'forbidden' }, { status: 403 }));
    await expect(socialApi.remove(value.id)).rejects.toMatchObject({ code: 'forbidden' });
    expect(listener).toHaveBeenCalledTimes(1);
  });
  it('陈列页禁止访问真实社交接口', async () => {
    vi.stubGlobal('location', { pathname: '/dev/gallery' });
    await expect(socialApi.session()).rejects.toMatchObject({ code: 'gallery_preview' });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
