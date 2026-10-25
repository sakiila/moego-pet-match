import type { MessageKey } from '../i18n';
import { HOTPOT_PETS } from './achievementRules';

/**
 * 开发者彩蛋（2026-10-25）：Bob 家的两只猫 Maodu 毛肚（pet_644053d683e0）与 Boluo 菠萝（pet_2f55c03f6968）。
 * 只改文案与装饰：团聚贴纸换专属台词、当店长时换店长梗、当 MVP 时小票与分享卡多盖一枚「开发者家的认证」章；
 * 不影响分数、收集、阵容与排行。隐藏称号「火锅搭子」的判定在 achievementRules。
 */
const [MAODU, BOLUO] = HOTPOT_PETS;

/** 两只的名录 id（毛肚在前），首页页尾等处按此顺序放小头像。 */
export const DEVELOPER_PETS: readonly string[] = HOTPOT_PETS;

export const isDeveloperPet = (petId: string) => petId === MAODU || petId === BOLUO;

/** 今日店长的宣言：毛肚、菠萝各有一句店长梗，其他宠物用通用模板台词。 */
export function managerLineKey(petId: string): MessageKey {
  if (petId === MAODU) return 'home.manager_line_maodu';
  if (petId === BOLUO) return 'home.manager_line_boluo';
  return 'home.manager_line';
}

/** 双宠团聚贴纸：毛肚与菠萝同框时用火锅台词，其他家庭用通用台词。 */
export function reunionKey(pets: readonly string[]): MessageKey {
  return pets.includes(MAODU) && pets.includes(BOLUO) ? 'board.reunion_hotpot' : 'board.reunion';
}
