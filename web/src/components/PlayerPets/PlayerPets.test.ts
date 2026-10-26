import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { I18nProvider } from '../../i18n';
import { PlayerPets, type PlayerPetsProps } from './PlayerPets';

const noop = () => {};
const pets = [
  { petId: 'cat', name: 'Maodu', collected: true, stickerSrc: '/maodu.png', silhouetteSrc: '/maodu-hidden.png' },
  { petId: 'other', name: 'Sir Fluffington the Third of Shanghai', collected: false, stickerSrc: '/private-face.png', silhouetteSrc: '/hidden.png' },
];
afterEach(() => vi.unstubAllGlobals());
function render(props: Partial<PlayerPetsProps> = {}, locale = 'zh') {
  vi.stubGlobal('localStorage', { getItem: () => locale });
  return renderToStaticMarkup(createElement(I18nProvider, null, createElement(PlayerPets, { pets, onOpen: noop, onRetry: noop, ...props })));
}

describe('玩家家的毛孩子分区', () => {
  it('按查看者状态显示贴纸和剪影，保留完整长名与明确收集进度', () => {
    const html = render();
    expect(html).toContain('TA 家的毛孩子');
    expect(html).toContain('你的收集进度 1 / 2');
    expect(html).toContain('src="/maodu.png"');
    expect(html).toContain('src="/hidden.png"');
    expect(html).not.toContain('src="/private-face.png"');
    expect(html).toContain('Sir Fluffington the Third of Shanghai');
    expect(html).toContain('查看 Maodu 的宠物卡片');
    expect(html).toContain('已收集');
    expect(html).toContain('未收集');
  });
  it('自家未收集仍可看完整贴纸，标记与进度不会变成已收集', () => {
    const html = render({ own: true });
    expect(html).toContain('我家的毛孩子');
    expect(html).toContain('src="/private-face.png"');
    expect(html).toContain('你的收集进度 1 / 2');
    expect(html).toContain('未收集');
    expect(html).not.toContain('删除');
  });
  it('区分加载、读取失败和空列表，失败时可重试', () => {
    expect(render({ pets: null })).toContain('正在找毛孩子');
    const failed = render({ pets: null, error: true });
    expect(failed).toContain('role="alert"');
    expect(failed).toContain('重试');
    expect(failed).not.toContain('暂时没有已上架');
    const empty = render({ pets: [] });
    expect(empty).toContain('暂时没有已上架的毛孩子');
    expect(empty).not.toContain('点卡片');
  });
  it('英文标题与操作无障碍名称正确，显示单只数量', () => {
    const html = render({ pets: [pets[0]] }, 'en');
    expect(html).toContain('Their Pets');
    expect(html).toContain('1 pet');
    expect(html).toContain('Your collection 1 / 1');
    expect(html).toContain('View Maodu');
  });
});
