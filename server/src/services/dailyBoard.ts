import { createHash } from 'node:crypto';
import type { GameMode } from '../../../web/src/api/types.ts';

/**
 * 每日同盘：同一北京自然日、同一模式全员同一个种子，由日期派生，不含密钥。
 * 棋盘形状与补落序列因此一致；阵容仍按个人规则抽样，所以是「同一盘棋、不同的宠物」。
 * 取 sha256 前 4 字节并清掉符号位，落在引擎接受的 31 位非负整数内。
 */
export function dailySeed(mode: GameMode, date: string): number {
  const digest = createHash('sha256').update(`pet-match:${mode}:${date}`).digest();
  return digest.readUInt32BE(0) & 0x7fffffff;
}
