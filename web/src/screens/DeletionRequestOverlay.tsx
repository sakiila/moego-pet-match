import { DeletionRequestSheet } from '../components/DeletionRequestSheet/DeletionRequestSheet';
import { stickerUrl } from '../game/pets';
import type { DeletionTarget } from '../game/useDeletionRequest';

/** 把申请对象换成弹层需要的展示信息（宠物贴纸经 /img 代理）。 */
export function DeletionRequestOverlay({ target, onSubmit, onClose }: { target: DeletionTarget | null; onSubmit: (note: string) => Promise<unknown>; onClose: () => void }) {
  if (!target) return null;
  const pet = target.kind === 'pet' ? { name: target.name, stickerSrc: stickerUrl(target.petId, 512), ownerName: target.ownerName } : null;
  return <DeletionRequestSheet open pet={pet} onSubmit={onSubmit} onClose={onClose} />;
}
