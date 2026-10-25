import { afterEach, describe, expect, it, vi } from 'vitest';
import { api } from './client';
import type { ResultPayload } from './types';

afterEach(() => vi.unstubAllGlobals());

describe('gallery preview isolation', () => {
  it.each([
    ['read player', () => api.getPlayer('U03FPQWGTN2')],
    ['read achievements', () => api.getAchievements('U03FPQWGTN2')],
    ['read likes', () => api.getPlayerLikes('U03FPQWGTN2', 'U_TEST_ALICE')],
    ['like player', () => api.likePlayer('U03FPQWGTN2', 'U_TEST_ALICE')],
    ['register game', () => api.registerGame('U03FPQWGTN2', 'normal')],
    ['save result', () => api.submitResult('game', 'U03FPQWGTN2', {} as ResultPayload)],
    ['answer quiz', () => api.answerQuiz('quiz', 'U03FPQWGTN2', null)],
    ['equip title', () => api.equipTitle('U03FPQWGTN2', null)],
    ['request removal', () => api.requestDeletion('U03FPQWGTN2', null, 'Preview only')],
    ['upload photo', () => api.submitPet('U03FPQWGTN2', 'Preview', '', new File(['image'], 'preview.png'))],
  ])('does not send a production API request to %s', async (_name, call) => {
    vi.stubGlobal('location', { pathname: '/dev/gallery' });
    const fetch = vi.fn().mockResolvedValue(new Response('{}'));
    vi.stubGlobal('fetch', fetch);

    await expect(call()).rejects.toBeInstanceOf(Error);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('keeps normal game requests working', async () => {
    vi.stubGlobal('location', { pathname: '/' });
    const result = { requestId: 'request', status: 'pending' };
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify(result)));
    vi.stubGlobal('fetch', fetch);

    await expect(api.requestDeletion('player', null, 'Request')).resolves.toEqual(result);
    expect(fetch).toHaveBeenCalledWith('/api/deletion-requests', expect.objectContaining({ method: 'POST' }));
  });
});

describe('permanent player like API', () => {
  it('encodes target and viewer separately and passes read cancellation', async () => {
    const view = { receivedLikes: 0, likedByViewer: false, canLike: true };
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify(view)));
    vi.stubGlobal('fetch', fetch);
    const controller = new AbortController();
    await expect(api.getPlayerLikes('target/id', 'viewer&id', controller.signal)).resolves.toEqual(view);
    expect(fetch).toHaveBeenCalledWith('/api/players/target%2Fid/likes?viewerId=viewer%26id', expect.objectContaining({ signal: controller.signal }));
  });
  it('sends an idempotent add request with the current identity', async () => {
    const view = { receivedLikes: 13, likedByViewer: true, canLike: false };
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify(view)));
    vi.stubGlobal('fetch', fetch);
    await expect(api.likePlayer('alice', 'bob')).resolves.toEqual(view);
    expect(fetch).toHaveBeenCalledWith('/api/players/alice/likes', expect.objectContaining({ method: 'POST', body: '{"playerId":"bob"}' }));
  });
});

class FakeXhr {
  static next: { status: number; body: string } | 'network' = { status: 200, body: '{}' };
  static sent: FormData | null = null;
  status = 0;
  responseText = '';
  upload: { onprogress: ((e: { lengthComputable: boolean; loaded: number; total: number }) => void) | null } = { onprogress: null };
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  ontimeout: (() => void) | null = null;
  onabort: (() => void) | null = null;
  open() {}
  send(body: FormData) {
    FakeXhr.sent = body;
    this.upload.onprogress?.({ lengthComputable: true, loaded: 50, total: 100 });
    this.upload.onprogress?.({ lengthComputable: true, loaded: 100, total: 100 });
    const next = FakeXhr.next;
    if (next === 'network') return this.onerror?.();
    this.status = next.status;
    this.responseText = next.body;
    this.onload?.();
  }
}

describe('submitPet', () => {
  const photo = new File(['jpeg'], 'cat.jpg', { type: 'image/jpeg' });
  const submit = (onProgress?: (f: number) => void) => api.submitPet('player', 'Mochi', '', photo, onProgress);

  it('reports upload progress and returns the submission id', async () => {
    vi.stubGlobal('location', { pathname: '/' });
    vi.stubGlobal('XMLHttpRequest', FakeXhr);
    FakeXhr.next = { status: 200, body: JSON.stringify({ submissionId: 'sub-1' }) };
    const progress: number[] = [];

    await expect(submit((f) => progress.push(f))).resolves.toEqual({ submissionId: 'sub-1' });
    expect(progress).toEqual([0.5, 1]);
    expect((FakeXhr.sent?.get('photo') as File).name).toBe('cat.jpg');
  });

  it.each([
    [{ status: 413, body: '' }, 'too_large'],
    [{ status: 415, body: '{"error":"unsupported_type"}' }, 'invalid_photo'],
    [{ status: 429, body: '{"error":"daily_limit"}' }, 'daily_limit'],
    [{ status: 400, body: '{"error":"name_required"}' }, 'name_required'],
    [{ status: 400, body: '{"error":"quote_not_english"}' }, 'quote_not_english'],
    [{ status: 502, body: '<html>' }, 'failed'],
    ['network' as const, 'failed'],
  ])('maps %j to %s', async (next, kind) => {
    vi.stubGlobal('location', { pathname: '/' });
    vi.stubGlobal('XMLHttpRequest', FakeXhr);
    FakeXhr.next = next;
    await expect(submit()).rejects.toMatchObject({ kind });
  });
});
