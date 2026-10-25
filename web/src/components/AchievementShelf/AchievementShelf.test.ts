import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { AchievementView } from '../../api/types';
import { I18nProvider, translate, type Locale } from '../../i18n';
import { AchievementShelf } from './AchievementShelf';

afterEach(() => vi.unstubAllGlobals());
const locked: AchievementView = { equippedTitle: null, achievements: [{ id: 'hotpot', current: 0, target: 1, unlockedAt: null }] };
const noop = () => {};
function render(locale: Locale, view: AchievementView | null = locked, failed = false) {
  vi.stubGlobal('localStorage', { getItem: () => locale });
  return renderToStaticMarkup(createElement(I18nProvider, null, createElement(AchievementShelf, {
    inline: true, view, failed, saving: false, saveFailed: false, onRetry: noop, onSelect: noop, onClose: noop,
  })));
}

describe.each(['zh', 'en'] as const)('稀有度图例（%s）', (locale) => {
  const caption = locale === 'zh' ? '稀有度由低到高' : 'Rarity: low to high';
  it('五档从低到高排列，位于说明与解锁统计之间', () => {
    const html = render(locale);
    expect(html).toContain(caption);
    const start = html.indexOf('data-testid="rarity-guide"');
    expect(start).toBeGreaterThan(html.indexOf(translate(locale, 'achievement.pick_hint')));
    expect(start).toBeLessThan(html.indexOf(translate(locale, 'achievement.unlocked_count', { count: 0, total: 1 })));
    const guide = html.slice(start, html.indexOf('</ol>', start));
    const positions = ['common', 'rare', 'epic', 'legendary', 'mythic'].map(rarity => guide.indexOf(`data-rarity="${rarity}"`));
    expect(positions.every(position => position >= 0)).toBe(true);
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
  });

  it('未解锁时仍隐藏真实名称与条件，保留不可佩戴占位', () => {
    const html = render(locale);
    expect(html).toContain(translate(locale, 'achievement.hidden_name'));
    expect(html).toContain(translate(locale, 'achievement.hidden_condition'));
    expect(html).toContain(translate(locale, 'achievement.locked'));
    expect(html).not.toContain(translate(locale, 'achievement.hotpot'));
    expect(html).not.toContain('aria-pressed=');
  });

  it.each([false, true])('加载或读取失败时图例仍可见，failed=%s', (failed) => {
    expect(render(locale, null, failed)).toContain(caption);
  });
});
