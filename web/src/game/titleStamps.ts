import type { Locale } from '../i18n';
import type { TitleKey } from './report';

/**
 * 称号 → 趣味称号章（assets/icons/report-title-stamps-original-v1，2026-10-24 接入）。
 * 触发条件与优先级不变（GAME_FLOW「MVP 与称号判定规则」），每款有中英文两版，随界面语言选择。
 */
export const TITLE_STAMP: Record<TitleKey, string> = {
  'title.cleanup_chief': '02-all-gone',
  'title.chain_lead': '01-hands-off',
  'title.scheduling_pro': '03-got-this',
  'title.tool_pro': '04-tools-work-harder',
  'title.last_second': '05-almost-clocked-out',
  'title.pet_officer': '06-counts-as-work',
};

const URLS = import.meta.glob<string>('../ui/art/stamps/*.webp', { eager: true, query: '?url', import: 'default' });

/** 称号章图片地址；找不到时返回 null（调用方退回文字）。 */
export function titleStampUrl(title: TitleKey, locale: Locale): string | null {
  return URLS[`../ui/art/stamps/${TITLE_STAMP[title]}-${locale}.webp`] ?? null;
}
