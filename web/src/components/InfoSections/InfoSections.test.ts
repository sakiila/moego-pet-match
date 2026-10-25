import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { I18nProvider, type Locale } from '../../i18n';
import { InfoScreen } from '../../screens/InfoScreen';

afterEach(() => vi.unstubAllGlobals());

function renderInfo(locale: Locale, player: { userId: string; name: string } | null) {
  vi.stubGlobal('localStorage', { getItem: () => locale });
  return renderToStaticMarkup(createElement(I18nProvider, null,
    createElement(InfoScreen, { player, onBack: () => {} }),
  ));
}

describe.each(['zh', 'en'] as const)('information notice (%s)', (locale) => {
  it('shows all six disclosures, including consent, before choosing a profile', () => {
    const html = renderInfo(locale, null);
    expect(html.match(/<strong>/g)).toHaveLength(6);
    expect(html).toContain(`<strong>${locale === 'zh' ? '同意方式' : 'Consent'}</strong>`);
  });

  it('keeps the notice identical with and without a selected profile', () => {
    const without = renderInfo(locale, null);
    const withPlayer = renderInfo(locale, { userId: 'test-player', name: 'Long English Name & 中文' });
    // 没有身份时只禁用删除申请；信息说明本身不应按身份省略或改写。
    expect(without.replace(' disabled=""', '')).toBe(withPlayer);
    expect(without).not.toContain('{playerName}');
  });
});
