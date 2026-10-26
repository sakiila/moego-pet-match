import type { DailyManager, GameMode } from '../api/types';
import type { GameSummary } from '../engine';
import type { Locale, MessageKey } from '../i18n';
import { petDisplayName, petImage, stickerUrl, type PetInfo } from './pets';
import { judgeMvp, judgeTitle, pickReview } from './report';
import { developerStampUrl, titleStampUrl } from './titleStamps';
import { isDeveloperPet, managerLineKey } from './easterEggs';

/** 成绩卡上的全部文字与主角图，来自本局冻结结果；分享不重新判定 MVP、称号或评语。 */
export interface ShareCardModel {
  mode: string;
  brand: { lead: string; accent: string };
  /**
   * 主角：本局 MVP；普通局零服务时为今日店长；原 MVP 已下架时为通用 MoeGo 图案（src 为 null）与中性标题，
   * 不另选 MVP；都没有时为 null（只留评语）。
   */
  hero: { src: string | null; label: string; kind: 'mvp' | 'manager' | 'generic' } | null;
  title: string;
  /** 称号章图片（当前语言版本）；为 null 时画文字小章。 */
  titleStamp: string | null;
  /** 开发者认证章（当前语言版本）：普通局 MVP 是毛肚或菠萝且仍上架时盖在主角图左下；否则 null。 */
  developerStamp: string | null;
  review: string;
  scoreLabel: string;
  score: string;
  player: string;
}

export interface ShareCardInput {
  summary: GameSummary;
  /** 本局阵容（按引擎 kind 顺序）。 */
  pets: PetInfo[];
  mode: GameMode;
  /** 原对局玩家（不是当前查看者，也不是 MVP 的主人）。 */
  playerName: string;
  manager: DailyManager | null;
  locale: Locale;
  t: (key: MessageKey, vars?: Record<string, string | number>) => string;
  /** 本局阵容里当前已下架的宠物（结算返回）。 */
  removed?: ReadonlySet<string>;
  /** 本局总分（含猜主人奖励）；缺省为引擎分数。 */
  score?: number;
}

export function shareCardModel({ summary, pets, mode, playerName, manager, locale, t, removed = new Set(), score = summary.score }: ShareCardInput): ShareCardModel {
  const mvpKind = judgeMvp(summary);
  const mvp = mvpKind === null ? null : pets[mvpKind];
  let hero: ShareCardModel['hero'] = null;
  if (mvp && removed.has(mvp.id)) {
    hero = { src: null, label: t('report.generic_title'), kind: 'generic' };
  } else if (mvp) {
    const src = petImage(mvp, 1024);
    const label = mode === 'fish' ? t('fish.report_mvp', { fishColorName: petDisplayName(mvp, locale) }) : t('report.mvp', { petName: mvp.name });
    hero = src ? { src, label, kind: 'mvp' } : null;
  } else if (mode === 'normal' && manager) {
    hero = { src: stickerUrl(manager.pet.petId, 1024), label: `${t('home.manager')} · ${manager.pet.name}`, kind: 'manager' };
  }
  return {
    mode: t(mode === 'fish' ? 'leaderboard.fish' : 'leaderboard.pets'),
    brand: { lead: t('brand.title_lead'), accent: t('brand.title_accent') },
    hero,
    title: t(judgeTitle(summary)),
    titleStamp: titleStampUrl(judgeTitle(summary), locale),
    developerStamp: hero?.kind === 'mvp' && mode === 'normal' && mvp && isDeveloperPet(mvp.id) ? developerStampUrl(locale) : null,
    review: t(pickReview(summary, mode)),
    scoreLabel: t('report.final_score'),
    score: score.toLocaleString(locale === 'zh' ? 'zh-CN' : 'en-US'),
    player: t('share.player', { playerName }),
  };
}

/** 店长小海报：全公司同一只，宣言为游戏模板台词；日期取服务端给出的北京日期，不按本机时区换算。 */
export interface ManagerPosterModel {
  mode: string;
  brand: { lead: string; accent: string };
  tagline: string;
  hero: { src: string; label: string; kind: 'manager' };
  line: string;
  date: string;
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export function managerPosterModel({ manager, locale, t }: { manager: DailyManager } & Pick<ShareCardInput, 'locale' | 't'>): ManagerPosterModel {
  const [year, month, day] = manager.date.split('-').map(Number);
  return {
    mode: t('home.manager'),
    brand: { lead: t('brand.title_lead'), accent: t('brand.title_accent') },
    tagline: t('brand.tagline'),
    hero: { src: stickerUrl(manager.pet.petId, 1024), label: `${t('home.manager')} · ${manager.pet.name}`, kind: 'manager' },
    line: t(managerLineKey(manager.pet.petId)),
    date: t('manager.poster_date', { year, month, day, monthName: locale === 'en' ? MONTHS[month - 1] : '' }),
  };
}
