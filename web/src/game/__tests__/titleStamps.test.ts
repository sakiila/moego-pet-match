import { describe, expect, it } from 'vitest';
import { translate } from '../../i18n';
import { TITLE_STAMP, titleStampUrl } from '../titleStamps';
import type { TitleKey } from '../report';

const titles = Object.keys(TITLE_STAMP) as TitleKey[];

describe('称号章', () => {
  it('六个称号各对应一款不同的章，中英文图片都存在', () => {
    expect(titles).toHaveLength(6);
    expect(new Set(Object.values(TITLE_STAMP)).size).toBe(6);
    for (const title of titles) {
      expect(titleStampUrl(title, 'zh'), `${title} zh`).toMatch(new RegExp(`${TITLE_STAMP[title]}-zh`));
      expect(titleStampUrl(title, 'en'), `${title} en`).toMatch(new RegExp(`${TITLE_STAMP[title]}-en`));
    }
  });

  it('称号文案与章上的字一致', () => {
    expect(translate('zh', 'title.chain_lead')).toBe('我手都松开了');
    expect(translate('en', 'title.cleanup_chief')).toBe('Poof. All gone.');
    expect(translate('zh', 'title.pet_officer')).toBe('这班没白上');
  });
});
