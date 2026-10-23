import { PetDetailSheet } from '../components/PetDetailSheet/PetDetailSheet';
import { avatarUrl, photoUrl, silhouetteUrl, stickerUrl } from '../game/pets';
import type { OpenPet } from '../game/usePetDetail';

export interface PetDetailOverlayProps {
  pet: OpenPet | null;
  playerId: string;
  onClose: () => void;
  onRetry: (petId: string, name: string) => void;
  onOpenShop: () => void;
}

/** 图鉴与报告共用的详情弹层：把宠物编号换成经 /img 代理的图片地址。 */
export function PetDetailOverlay({ pet, playerId, onClose, onRetry, onOpenShop }: PetDetailOverlayProps) {
  if (!pet) return null;
  const detail = pet.state.kind === 'ready' ? pet.state.detail : null;
  return (
    <PetDetailSheet
      open
      name={pet.name}
      state={pet.state}
      stickerSrc={stickerUrl(pet.petId, 512)}
      silhouetteSrc={silhouetteUrl(pet.petId, 512)}
      photoSrc={detail?.hasPhoto ? photoUrl(pet.petId, playerId) : null}
      ownerAvatarSrc={detail?.owner ? avatarUrl(detail.owner.userId) : null}
      onClose={onClose}
      onRetry={() => onRetry(pet.petId, pet.name)}
      onOpenShop={onOpenShop}
    />
  );
}
