import type { GameSummary } from '../engine';
import type { PetInfo } from './pets';

/** 收工致谢只展示本局实际服务过的贴纸，排序沿用 MVP 的稳定判定。 */
export function selectFarewellPets(summary: GameSummary, pets: readonly PetInfo[]): PetInfo[] {
  const displayPets = new Map(pets.filter((pet) => pet.id && pet.imageBase).map((pet) => [pet.id, pet]));
  return summary.pets
    .filter((pet) => pet.served > 0 && pet.id && displayPets.has(pet.id))
    .sort((a, b) => b.served - a.served || (a.firstServedSeq ?? Infinity) - (b.firstServedSeq ?? Infinity) || a.order - b.order)
    .slice(0, 3)
    .map((pet) => displayPets.get(pet.id)!);
}
