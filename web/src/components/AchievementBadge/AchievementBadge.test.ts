import { createElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { I18nProvider } from '../../i18n';
import { AchievementBadge } from './AchievementBadge';
import { AchievementAvatar } from '../AchievementAvatar/AchievementAvatar';

const render = (node: ReactNode) => renderToStaticMarkup(createElement(I18nProvider, null, node));

describe('镇店之宝动效', () => {
  it('已解锁的大徽章与称号签使用流光，22px 头像只轻闪', () => {
    expect(render(createElement(AchievementBadge, { id: 'hotpot', large: true }))).toContain('data-icon-effect="aurora"');
    expect(render(createElement(AchievementBadge, { id: 'hotpot', chip: true }))).toContain('data-icon-effect="glint"');
    expect(render(createElement(AchievementAvatar, { name: 'Bob', equippedTitle: 'hotpot' }))).toContain('data-icon-effect="glint"');
  });

  it('未解锁或隐藏的徽章保持静态，普通徽章不增加动效', () => {
    expect(render(createElement(AchievementBadge, { id: 'hotpot', locked: true }))).not.toContain('data-icon-effect');
    expect(render(createElement(AchievementBadge, { id: 'hotpot', hidden: true }))).not.toContain('data-icon-effect');
    expect(render(createElement(AchievementBadge, { id: 'cats' }))).not.toContain('data-icon-effect');
  });
});
