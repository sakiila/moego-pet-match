import type { PetDetail, PlayerPet } from '../../api/types';
import { silhouetteUrl, stickerUrl } from '../../game/pets';

export const playerPets: PlayerPet[] = [
  { petId: 'pet_644053d683e0', name: 'Maodu 毛肚', collected: true },
  { petId: 'pet_2f55c03f6968', name: 'Boluo 菠萝', collected: false },
];
export const playerPetCards = playerPets.map(pet => ({ ...pet, stickerSrc: stickerUrl(pet.petId, 512), silhouetteSrc: silhouetteUrl(pet.petId, 512) }));
export const loadPlayerPetsPreview = async () => playerPets;
export async function loadPlayerPetDetailPreview(petId: string, viewerId: string): Promise<PetDetail> {
  const pet = playerPets.find(pet => pet.petId === petId)!;
  const own = viewerId === 'U_TEST_BOB';
  const full = own || pet.collected;
  return { ...pet, own, owner: full ? { userId: 'U_TEST_BOB', name: 'Bob' } : null,
    quote: full ? 'Gallery preview — sample pet profile.' : null, hasPhoto: false, listed: true, knownBy: null };
}
