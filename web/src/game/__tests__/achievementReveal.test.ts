import { describe, expect, it } from 'vitest';
import { conditionRevealed } from '../achievementRules';
import { translate } from '../../i18n';

describe('隐藏称号的解锁条件', () => {
  it('普通称号的条件对所有人可见', () => {
    expect(conditionRevealed('cats', [])).toBe(true);
  });

  it('隐藏称号只在看的人自己解锁后才露出真实条件', () => {
    expect(conditionRevealed('hotpot', [])).toBe(false);
    expect(conditionRevealed('hotpot', ['cats', 'dogs'])).toBe(false);
    expect(conditionRevealed('hotpot', ['hotpot'])).toBe(true);
  });

  it('占位文案是喵喵喵加颜文字，不透露毛肚与菠萝', () => {
    for (const locale of ['zh', 'en'] as const) {
      const text = translate(locale, 'achievement.hidden_condition');
      expect(text).toMatch(/喵|[Mm]e?ow/);
      expect(text).toContain('(=^･ω･^=)');
      expect(text).not.toMatch(/毛肚|菠萝|Maodu|Boluo/);
    }
  });
});
