import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, expect, it, vi } from 'vitest';
import { I18nProvider } from '../../i18n';
import { PlayerProfileCard } from './PlayerProfileCard';
import type { PlayerProfileView } from '../../api/types';

afterEach(() => vi.unstubAllGlobals());
it('places household pets between gameplay stats and badges, and suspends the sheet beneath a pet detail', () => {
  vi.stubGlobal('localStorage', { getItem: () => 'zh' });
  const view: PlayerProfileView = { userId: 'bob', name: 'Bob', mode: 'normal', bestScore: 13770,
    completedGames: 12, collection: { collected: 18, total: 80 }, equippedTitle: null, unlockedTitles: [], recentGames: [] };
  const html = renderToStaticMarkup(createElement(I18nProvider, null, createElement(PlayerProfileCard, {
    inline: true, player: view, view, suspended: true, pets: createElement('section', null, 'HOUSEHOLD'), onClose() {}, onRetry() {},
  })));
  expect(html).toContain('HOUSEHOLD');
  expect(html.indexOf('已完成局数')).toBeLessThan(html.indexOf('HOUSEHOLD'));
  expect(html.indexOf('HOUSEHOLD')).toBeLessThan(html.indexOf('已解锁徽章'));
  expect(html).toContain('inert=""');
  expect(html).toContain('aria-hidden="true"');
});
