import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { I18nProvider, translate, type Locale } from '../../i18n';
import { PlayerProfileBadge } from './PlayerProfileBadge';
import { AchievementAvatar } from '../AchievementAvatar/AchievementAvatar';
import { LeaderboardRow } from '../LeaderboardRow/LeaderboardRow';
import { Podium } from '../Podium/Podium';

afterEach(() => vi.unstubAllGlobals());

const render = (locale: Locale, revealed: boolean, chip = false) => {
  vi.stubGlobal('localStorage', { getItem: () => locale });
  return renderToStaticMarkup(createElement(I18nProvider, null, createElement(PlayerProfileBadge, { id: 'hotpot', chip, revealed })));
};

describe.each(['zh', 'en'] as const)('隐藏称号按查看者解锁状态显示（%s）', (locale) => {
  it.each([false, true])('未解锁查看者看到隐藏名称与条件，chip=%s', (chip) => {
    const html = render(locale, false, chip);
    expect(html).toContain(translate(locale, 'achievement.hidden_name'));
    expect(html).toContain(translate(locale, 'achievement.hidden_condition'));
    expect(html).not.toContain(translate(locale, 'achievement.hotpot'));
    expect(html).not.toContain(translate(locale, 'achievement.hotpot_unlock'));
  });

  it('已解锁查看者看到真实名称与条件', () => {
    const html = render(locale, true);
    expect(html).toContain(translate(locale, 'achievement.hotpot'));
    expect(html).toContain(translate(locale, 'achievement.hotpot_unlock').replace(/'/g, '&#x27;'));
    expect(html).not.toContain(translate(locale, 'achievement.hidden_condition'));
  });

  it('未解锁查看者的头像、排行榜与领奖台读屏文字也使用隐藏名称', () => {
    vi.stubGlobal('localStorage', { getItem: () => locale });
    const entry = { userId: 'other', name: 'Alice', rank: 1, score: 1000, equippedTitle: 'hotpot' as const };
    for (const node of [
      createElement(AchievementAvatar, { name: 'Alice', equippedTitle: 'hotpot', revealed: false, onTitleClick: () => {} }),
      createElement(LeaderboardRow, { entry, isMe: false, tied: false }),
      createElement(Podium, { entries: [entry] }),
    ]) {
      const html = renderToStaticMarkup(createElement(I18nProvider, null, node));
      expect(html).toContain(translate(locale, 'achievement.hidden_name'));
      expect(html).not.toContain(translate(locale, 'achievement.hotpot'));
    }
  });
});
