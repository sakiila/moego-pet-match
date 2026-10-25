import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, expect, it, vi } from 'vitest';
import { I18nProvider } from '../i18n';
import { PLACEHOLDER_PETS } from '../game/pets';
import { PrepScreen, type PrepScreenProps } from './PrepScreen';

afterEach(() => vi.unstubAllGlobals());
function render(props: Partial<PrepScreenProps>) {
  vi.stubGlobal('localStorage', { getItem: () => 'zh' });
  return renderToStaticMarkup(createElement(I18nProvider, null,
    createElement(PrepScreen, { pets: PLACEHOLDER_PETS, onStart: () => {}, ...props })));
}
const startButton = (html: string) => html.match(/<button[^>]*data-testid="start"[^>]*>/)?.[0];

it('图片尚未全部就绪时先展示本局宠物，但禁止开始计时', () => {
  const html = render({ loading: true });
  expect(html).toContain('Mochi');
  expect(html).toContain('准备中');
  expect(startButton(html)).toContain('disabled=""');
  expect(startButton(html)).toContain('aria-busy="true"');
});

it('素材全部就绪后允许开始', () => {
  expect(startButton(render({}))).not.toContain('disabled');
});

it('图片准备失败后保留来客名单，显示重试并禁止开始', () => {
  const html = render({ failed: true, onRetry: () => {} });
  expect(html).toContain('Mochi');
  expect(html).toContain('role="alert"');
  expect(startButton(html)).toContain('disabled=""');
});
