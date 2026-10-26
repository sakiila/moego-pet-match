import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { I18nProvider, type Locale } from '../../i18n';
import { PetCard, type PetCardProps } from './PetCard';

const owner = { name: 'Alice', userId: 'U_TEST_ALICE', avatarSrc: '/alice.png' };
afterEach(() => vi.unstubAllGlobals());

function render(props: Partial<PetCardProps> = {}, locale: Locale = 'zh') {
  vi.stubGlobal('localStorage', { getItem: () => locale });
  return renderToStaticMarkup(createElement(I18nProvider, null, createElement(PetCard, {
    name: 'Shiliu', collected: true, imageSrc: '/shiliu.png', onOpen: () => {}, ...props,
  })));
}

describe('图鉴卡片收集状态', () => {
  it.each([null, undefined])('已收集但缺少主人资料（%s）时仍显示已收集', (missingOwner) => {
    const html = render({ owner: missingOwner });
    expect(html).toContain('data-collected="true"');
    expect(html).toContain('已收集');
    expect(html).not.toContain('未收集');
  });

  it('已收集且有主人时继续显示主人资料', () => {
    const html = render({ owner });
    expect(html).toContain('主人');
    expect(html).toContain('Alice');
    expect(html).not.toContain('未收集');
  });

  it('未收集时显示未收集，即使传入主人也不泄露资料', () => {
    const html = render({ collected: false, owner });
    expect(html).toContain('data-collected="false"');
    expect(html).toContain('未收集');
    expect(html).not.toContain('Alice');
  });

  it('英文缺少主人资料时使用正确的收集状态', () => {
    expect(render({ owner: null }, 'en')).toContain('>Collected<');
    expect(render({ collected: false }, 'en')).toContain('>Not Collected<');
  });
});
