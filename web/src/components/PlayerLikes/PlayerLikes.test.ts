import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { I18nProvider } from '../../i18n';
import { PlayerLikesPill, PlayerLikesRow } from './PlayerLikes';
import type { PlayerLikesState } from '../../game/playerLikes';

const noop = () => {};
const state: PlayerLikesState = { view: { receivedLikes: 12, likedByViewer: false, canLike: true }, loading: false, sending: false, error: null, celebration: 0 };
afterEach(() => vi.unstubAllGlobals());
function renderRow(value = state, own = false, locale = 'zh') {
  vi.stubGlobal('localStorage', { getItem: () => locale });
  return renderToStaticMarkup(createElement(I18nProvider, null, createElement(PlayerLikesRow, { state: value, own, onLike: noop, onRetry: noop })));
}

describe('player like presentation', () => {
  it('renders a visible zero and an accessible action', () => {
    const html = renderRow({ ...state, view: { ...state.view!, receivedLikes: 0 } });
    expect(html).toContain('收到 0 个赞');
    expect(html).toContain('送个赞');
    expect(html).not.toContain('disabled=');
  });
  it('keeps liked permanent and never offers a cancel action', () => {
    const html = renderRow({ ...state, view: { receivedLikes: 13, likedByViewer: true, canLike: false } });
    expect(html).toContain('已点赞');
    expect(html).toContain('disabled=""');
    expect(html).not.toContain('取消');
  });
  it('shows an own profile as read only', () => {
    const html = renderRow(state, true);
    expect(html).toContain('收到 12 个赞');
    expect(html).not.toContain('<button');
  });
  it('disables the action during a request without changing the confirmed number', () => {
    const html = renderRow({ ...state, sending: true });
    expect(html).toContain('收到 12 个赞');
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain('disabled=""');
  });
  it('keeps errors local and exposes retry', () => {
    const html = renderRow({ ...state, view: null, error: 'load' });
    expect(html).toContain('role="alert"');
    expect(html).toContain('重试');
    expect(html).not.toContain('送个赞');
  });
  it('localizes large counts and English labels', () => {
    const html = renderRow({ ...state, view: { ...state.view!, receivedLikes: 12345 } }, false, 'en');
    expect(html).toContain('12,345 likes received');
    expect(html).toContain('Like');
  });
  it('uses singular English copy for one received like in the row and its accessible label', () => {
    const html = renderRow({ ...state, view: { ...state.view!, receivedLikes: 1 } }, false, 'en');
    expect(html).toContain('aria-label="1 like received"');
    expect(html).toContain('>like received</span>');
    expect(html).not.toContain('likes received');
  });
  it('makes the compact count a profile entry', () => {
    vi.stubGlobal('localStorage', { getItem: () => 'en' });
    const html = renderToStaticMarkup(createElement(I18nProvider, null, createElement(PlayerLikesPill, { state, onOpen: noop })));
    expect(html).toContain('View my player card: 12 likes received');
    expect(html).toContain('data-testid="my-likes"');
  });
  it('uses singular English copy in the own-profile pill when the count is one', () => {
    vi.stubGlobal('localStorage', { getItem: () => 'en' });
    const html = renderToStaticMarkup(createElement(I18nProvider, null, createElement(PlayerLikesPill, {
      state: { ...state, view: { ...state.view!, receivedLikes: 1 } }, onOpen: noop,
    })));
    expect(html).toContain('View my player card: 1 like received');
    expect(html).not.toContain('likes received');
  });
});
