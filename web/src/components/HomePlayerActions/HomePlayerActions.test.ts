import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, expect, it, vi } from 'vitest';
import { I18nProvider } from '../../i18n';
import { HomePlayerActions } from './HomePlayerActions';

afterEach(() => vi.unstubAllGlobals());
it('puts received likes immediately before the existing avatar menu and preserves the title', () => {
  vi.stubGlobal('localStorage', { getItem: () => 'en' });
  const html = renderToStaticMarkup(createElement(I18nProvider, null, createElement(HomePlayerActions, {
    player: { userId: 'bob', name: 'Alexandria Catherine Montgomery-Wellington', equippedTitle: 'album', best: { normal: null, fish: null }, progress: { completedNormalGames: 0, fishUnlocked: false }, streak: { days: 0, today: false } },
    likes: { view: { receivedLikes: 0, likedByViewer: false, canLike: false }, loading: false, sending: false, error: null, celebration: 0 },
    onProfile() {}, onClockOut() {}, onTitles() {},
  })));
  expect(html.indexOf('data-testid="my-likes"')).toBeLessThan(html.indexOf('data-testid="player-menu-trigger"'));
  expect(html).toContain('View my player card: 0 likes received');
  expect(html).toContain('Alexandria Catherine Montgomery-Wellington');
  expect(html).toContain('title="Full Album Club"');
});
