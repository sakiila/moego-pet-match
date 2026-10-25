import { createElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { I18nProvider } from '../../i18n';
import { AchievementBadge } from './AchievementBadge';
import { AchievementAvatar } from '../AchievementAvatar/AchievementAvatar';
import { PlayerMenu } from '../PlayerMenu/PlayerMenu';
import { LeaderboardRow } from '../LeaderboardRow/LeaderboardRow';
import { Podium } from '../Podium/Podium';
import { PlayerProfileBadge } from '../PlayerProfileCard/PlayerProfileBadge';
import { ReportHarvest } from '../ReportHarvest/ReportHarvest';
import { AchievementUnlocks } from '../AchievementUnlocks/AchievementUnlocks';

const render = (node: ReactNode) => renderToStaticMarkup(createElement(I18nProvider, null, node));

describe('镇店之宝动效', () => {
  it('已解锁的大徽章、称号签和 22px 头像统一使用流光与星芒', () => {
    expect(render(createElement(AchievementBadge, { id: 'hotpot', large: true }))).toContain('data-icon-effect="aurora"');
    expect(render(createElement(AchievementBadge, { id: 'hotpot', chip: true }))).toContain('data-icon-effect="aurora"');
    expect(render(createElement(AchievementAvatar, { name: 'Bob', equippedTitle: 'hotpot' }))).toContain('data-icon-effect="aurora"');
  });

  const entry = { userId: 'test', name: 'Bob', rank: 1, score: 1000, equippedTitle: 'hotpot' as const };
  it.each([
    ['首页头像', createElement(PlayerMenu, { name: 'Bob', userId: 'test', equippedTitle: 'hotpot', onClockOut: () => {} })],
    ['排行榜头像', createElement(LeaderboardRow, { entry, isMe: true, tied: false })],
    ['领奖台头像', createElement(Podium, { entries: [entry], viewerTitles: ['hotpot'] })],
    ['名片称号签', createElement(PlayerProfileBadge, { id: 'hotpot', chip: true })],
    ['名片徽章', createElement(PlayerProfileBadge, { id: 'hotpot' })],
    ['结算收获', createElement(ReportHarvest, { pets: [], achievements: ['hotpot'] })],
    ['新解锁展示', createElement(AchievementUnlocks, { ids: ['hotpot'] })],
  ])('%s 包含完整动效', (_name, node) => {
    const html = render(node);
    expect(html).toContain('data-icon-effect="aurora"');
    expect(html).not.toContain('data-icon-effect="glint"');
  });

  it('未解锁或隐藏的徽章保持静态，普通徽章不增加动效', () => {
    expect(render(createElement(AchievementBadge, { id: 'hotpot', locked: true }))).not.toContain('data-icon-effect');
    expect(render(createElement(AchievementBadge, { id: 'hotpot', hidden: true }))).not.toContain('data-icon-effect');
    expect(render(createElement(AchievementBadge, { id: 'cats' }))).not.toContain('data-icon-effect');
  });
});
