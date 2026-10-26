/**
 * 成片字幕。中文只用游戏字体子集里已有的字（web/src/ui/fonts/chars.txt），新增字前先核对，否则会回退成系统字体。
 * 英文口号沿用游戏里已确认的 brand.tagline。
 */
export type Lang = 'zh' | 'en';

export const COPY = {
  zh: {
    home: '在家逆子',
    star: '在外顶流',
    title: '毛孩子全明星',
    subtitle: '90 秒消消乐',
    drag: '拖一下就开工',
    max: '×5 顶格！',
    dryer: '吹风机，吹走整盘！',
    rush: '催单 +1000',
    report: '90 秒，越消越上头',
    nonstop: '连消停不下来',
    tagline: ['在家逆子，', '在外顶流。'],
    url: 'star.baobo.me',
  },
  en: {
    home: 'A menace at home.',
    star: 'A star in the game.',
    title: 'Pet All-Stars',
    subtitle: '90-second match-3',
    drag: 'Drag to start your shift',
    max: 'MAX ×5!',
    dryer: 'The dryer blows the whole board!',
    rush: 'Rush order +1000',
    report: '90 seconds. Totally hooked.',
    nonstop: 'Chains that never stop',
    tagline: ['A menace at home.', 'A star in the game.'],
    url: 'star.baobo.me',
  },
} satisfies Record<Lang, Record<string, string | string[]>>;
