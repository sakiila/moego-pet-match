import { PetDetailCard } from '../components/PetDetailCard/PetDetailCard';
import { avatarUrl, photoUrl, silhouetteUrl, stickerUrl } from '../game/pets';
import { useDeletionRequest } from '../game/useDeletionRequest';
import type { OpenPet } from '../game/usePetDetail';
import { DeletionRequestOverlay } from './DeletionRequestOverlay';

export interface PetDetailOverlayProps {
  pet: OpenPet | null;
  playerId: string;
  onClose: () => void;
  onRetry: (petId: string, name: string) => void;
  onOpenShop: () => void;
  /** 删除申请提交成功后（如刷新我的宠物的状态）。 */
  onRemovalSubmitted?: () => void;
}

/** 图鉴、报告与我的宠物共用的详情卡：把宠物编号换成经 /img 代理的图片地址；自家宠物可从这里申请移除（申请弹层叠在卡片上方，卡片保持不动）。 */
export function PetDetailOverlay({ pet, playerId, onClose, onRetry, onOpenShop, onRemovalSubmitted }: PetDetailOverlayProps) {
  const removal = useDeletionRequest(playerId, onRemovalSubmitted);
  if (!pet) return null;
  const detail = pet.state.kind === 'ready' ? pet.state.detail : null;
  return (
    <>
      <PetDetailCard
        name={pet.name}
        state={pet.state}
        stickerSrc={stickerUrl(pet.petId, 512)}
        silhouetteSrc={silhouetteUrl(pet.petId, 512)}
        photoSrc={detail?.hasPhoto ? photoUrl(pet.petId, playerId) : null}
        ownerAvatarSrc={detail?.owner ? avatarUrl(detail.owner.userId) : null}
        origin={pet.origin}
        onClose={onClose}
        onRetry={() => onRetry(pet.petId, pet.name)}
        onOpenShop={onOpenShop}
        onRequestRemoval={
          detail?.own && detail.owner ? () => removal.open({ kind: 'pet', petId: pet.petId, name: detail.name, ownerName: detail.owner!.name }) : undefined
        }
      />
      {removal.target && <DeletionRequestOverlay target={removal.target} onSubmit={removal.submit} onClose={removal.close} />}
    </>
  );
}
