import { afterEach, describe, expect, it, vi } from 'vitest';
import { api } from './client';
import type { ResultPayload } from './types';

afterEach(() => vi.unstubAllGlobals());

describe('gallery preview isolation', () => {
  it.each([
    ['read player', () => api.getPlayer('U03FPQWGTN2')],
    ['read achievements', () => api.getAchievements('U03FPQWGTN2')],
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
