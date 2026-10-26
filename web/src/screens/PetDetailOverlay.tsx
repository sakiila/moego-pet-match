import { PetDetailCard } from '../components/PetDetailCard/PetDetailCard';
import { useCallback, useEffect, useRef, useState } from 'react';
import { PawBook } from '../components/PawBook/PawBook';
import { PawEntry } from '../components/PawBook/PawEntry';
import { usePawBook } from '../game/usePawBook';
import { isDeveloperPet } from '../game/easterEggs';
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
  aboveSheet?: boolean;
  allowRemoval?: boolean;
  openPaws?: boolean;
}

/** 图鉴、报告与我的宠物共用的详情卡：把宠物编号换成经 /img 代理的图片地址；自家宠物可从这里申请移除（申请弹层叠在卡片上方，卡片保持不动）。 */
export function PetDetailOverlay(props: PetDetailOverlayProps) {
  return props.pet ? <OpenPetDetail key={`${props.playerId}:${props.pet.petId}`} {...props} pet={props.pet} /> : null;
}

function OpenPetDetail({ pet, playerId, onClose, onRetry, onOpenShop, onRemovalSubmitted, aboveSheet, allowRemoval = true, openPaws = false }: PetDetailOverlayProps & { pet: OpenPet }) {
  const removal = useDeletionRequest(playerId, onRemovalSubmitted);
  const detail = pet.state.kind === 'ready' ? pet.state.detail : null;
  const eligible = !!detail && (detail.own || detail.collected);
  const paws = usePawBook(pet.petId, playerId, eligible);
  const [pawOpen, setPawOpen] = useState(false);
  const [cardReady, setCardReady] = useState(false);
  const onCardReady = useCallback(() => setCardReady(true), []);
  const trigger = useRef<HTMLButtonElement | null>(null);
  useEffect(() => { if (eligible && cardReady && openPaws) setPawOpen(true); }, [eligible, cardReady, openPaws]);
  return (
    <>
      <PetDetailCard
        onReady={onCardReady}
        suspended={pawOpen}
        action={detail && <PawEntry buttonRef={trigger} own={detail.own} left={!!paws.state.view?.mine} locked={!eligible}
          loading={paws.state.loading} unavailable={paws.state.unavailable}
          onOpen={() => setPawOpen(true)} />}
        aboveSheet={aboveSheet}
        name={pet.name}
        state={pet.state}
        stickerSrc={stickerUrl(pet.petId, 512)}
        silhouetteSrc={silhouetteUrl(pet.petId, 512)}
        photoSrc={detail?.hasPhoto ? photoUrl(pet.petId, playerId) : null}
        ownerAvatarSrc={detail?.owner ? avatarUrl(detail.owner.userId) : null}
        colleagueAvatarSrc={avatarUrl}
        developer={isDeveloperPet(pet.petId)}
        origin={pet.origin}
        onClose={onClose}
        onRetry={() => onRetry(pet.petId, pet.name)}
        onOpenShop={onOpenShop}
        onRequestRemoval={
          allowRemoval && detail?.own && detail.owner ? () => removal.open({ kind: 'pet', petId: pet.petId, name: detail.name, ownerName: detail.owner!.name }) : undefined
        }
      />
      {pawOpen && <PawBook petName={pet.name} stickerSrc={stickerUrl(pet.petId, 128)} avatarSrc={avatarUrl}
        state={paws.state} onChange={paws.controller.change} onReply={paws.controller.reply} onRead={paws.controller.read}
        onMore={paws.controller.loadMore} onRetry={paws.controller.refresh} returnFocus={trigger.current}
        onClose={() => setPawOpen(false)} />}
      {removal.target && <DeletionRequestOverlay target={removal.target} onSubmit={removal.submit} onClose={removal.close} />}
    </>
  );
}
