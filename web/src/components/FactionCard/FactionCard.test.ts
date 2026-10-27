import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { FactionState } from '../../api/types';
import { I18nProvider, type Locale } from '../../i18n';
import { catShare } from '../FactionTugBar/FactionTugBar';
import { FactionCard } from './FactionCard';
import { FACTION_SAMPLES as S } from './factionFixtures';
import { formatEventDay } from './factionFormat';

afterEach(() => vi.unstubAllGlobals());
const noop = () => {};
function render(state: FactionState | null, locale: Locale = 'zh') {
  vi.stubGlobal('localStorage', { getItem: () => locale });
  return renderToStaticMarkup(createElement(I18nProvider, null, createElement(FactionCard, { state, onJoin: noop, onOpen: noop })));
}

describe('阵营周首页卡', () => {
  it('未读到或不在活动期时不占位置', () => {
    expect(render(null)).toBe('');
    expect(render({ phase: 'hidden' })).toBe('');
  });
  it('未报名显示选边站；已报名显示本期积分和今天剩余局数', () => {
    expect(render(S.notJoined)).toContain('data-testid="faction-join"');
    const cat = render(S.cat);
    expect(cat).not.toContain('faction-join');
    expect(cat).toContain('我在喵派 · 本期 1,284 分');
    expect(cat).toContain('今天还能计 3 局');
    expect(render(S.dogFull, 'en')).toContain("Today&#x27;s points are maxed");
  });
  it('迷雾期不出现数字，只说领先程度', () => {
    const html = render(S.fog);
    expect(html).toContain('汪派小幅领先');
    for (const n of ['12,483', '11,760', '10,950']) expect(html).not.toContain(n);
  });
  it('收官后显示胜方与本人徽章', () => {
    expect(render(S.endedWin)).toContain('喵派获胜！');
    expect(render(S.endedWin)).toContain('你获得了限时传奇徽章');
    expect(render(S.endedLose)).toContain('这期没拿到徽章');
    expect(render(S.endedTie, 'en')).toContain("It&#x27;s a tie!");
  });
});

describe('拔河条与日期', () => {
  it('按调整后总分定位绳结，两端至少留 10%', () => {
    expect(catShare({ cat: { adjusted: 300 }, dog: { adjusted: 100 } }, { leader: 'cat', level: 'clear' })).toBe(0.75);
    expect(catShare({ cat: { adjusted: 0 }, dog: { adjusted: 0 } }, { leader: null, level: 'even' })).toBe(0.5);
    expect(catShare({ cat: { adjusted: 1 }, dog: { adjusted: 999 } }, { leader: 'dog', level: 'clear' })).toBe(0.1);
    expect(catShare({ cat: { adjusted: null }, dog: { adjusted: null } }, { leader: 'dog', level: 'slight' })).toBeCloseTo(0.44);
  });
  it('中英文日期', () => {
    expect(formatEventDay('2026-11-02', 'zh')).toBe('11 月 2 日');
    expect(formatEventDay('2026-11-02', 'en')).toBe('Nov 2');
  });
});
