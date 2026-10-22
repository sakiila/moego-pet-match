// Key 与 UI_COPY.md 对应；随页面接入逐步补齐。
export const zh = {
  'app.title': '毛孩子全明星',
  'nav.home': '门店',
  'nav.collection': '宠物图鉴',
  'nav.leaderboard': '排行榜',
  'nav.my_pets': '我的宠物',
  'nav.settings': '设置',
  'action.open_shop': '开始营业',
  'action.play_again': '再开一局',
  'action.keep_playing': '继续游玩',
  'action.back_to_shop': '回门店',
  'action.retry': '重试',
  'action.cancel': '取消',
  'action.close': '关闭',
  'settings.language': '语言',
  'settings.chinese': '中文',
  'settings.english': 'English',
} as const;

export type MessageKey = keyof typeof zh;
