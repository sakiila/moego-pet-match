import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client';
import type { MyPet, PetDetail, PlayerView } from '../api/types';
import { BrandHeader } from '../components/BrandHeader/BrandHeader';
import { MyPetCard } from '../components/MyPetCard/MyPetCard';
import { StatusMessage } from '../components/StatusMessage/StatusMessage';
import { avatarUrl, stickerUrl } from '../game/pets';
import { useDeletionRequest } from '../game/useDeletionRequest';
import { usePetDetail } from '../game/usePetDetail';
import { useI18n } from '../i18n';
import { Avatar } from '../ui/primitives/Avatar';
import { Button } from '../ui/primitives/Button';
import { DeletionRequestOverlay } from './DeletionRequestOverlay';
import { PetDetailOverlay } from './PetDetailOverlay';
import styles from './Screen.module.css';

export interface MyPetsScreenProps {
  player: PlayerView;
  onBack: () => void;
  onUpload: () => void;
  onOpenShop: () => void;
  /** 陈列页用：替换数据来源。 */
  load?: (playerId: string) => Promise<MyPet[]>;
  loadDetail?: (petId: string, playerId: string) => Promise<PetDetail>;
}

/**
 * 我的宠物：只列当前身份关联的已上架宠物，可看完整资料（不改变收集）、添加新宠物、申请移除。
 * 新提交在人工处理上架后才出现在这里，不显示提交进度。
 */
export function MyPetsScreen({ player, onBack, onUpload, onOpenShop, load = api.getMyPets, loadDetail = api.getPetDetail }: MyPetsScreenProps) {
  const { t } = useI18n();
  const [pets, setPets] = useState<MyPet[] | null>(null);
  const [failed, setFailed] = useState(false);

  const fetchPets = useCallback(async () => {
    setFailed(false);
    try {
      setPets(await load(player.userId));
    } catch {
      setFailed(true);
    }
  }, [load, player.userId]);
  useEffect(() => {
    void fetchPets();
  }, [fetchPets]);

  const detail = usePetDetail(player.userId, loadDetail);
  const removal = useDeletionRequest(player.userId, fetchPets);

  return (
    <main className={styles.screen}>
      <BrandHeader heading={t('nav.my_pets')} onBack={onBack} />
      <div className={styles.titleRow}>
        <span className={styles.who}>
          <Avatar name={player.name} seed={player.userId} src={avatarUrl(player.userId)} size={40} />
          {player.name}
        </span>
        <Button onClick={onUpload} data-testid="add-pet">
          🐾 {t('my_pets.add')}
        </Button>
      </div>
      <p className={styles.muted}>{t('my_pets.list_scope')}</p>
      {failed && (
        <Button variant="secondary" onClick={fetchPets}>
          {t('action.retry')}
        </Button>
      )}
      {pets?.length === 0 && <StatusMessage text={t('my_pets.empty')} />}
      <div className={styles.list}>
        {pets?.map((p) => (
          <MyPetCard
            key={p.petId}
            name={p.name}
            stickerSrc={stickerUrl(p.petId, 512)}
            collected={p.collected}
            request={p.request?.status ?? null}
            onView={() => void detail.show(p.petId, p.name)}
            onRequestRemoval={() => removal.open({ kind: 'pet', petId: p.petId, name: p.name, ownerName: player.name })}
          />
        ))}
      </div>
      <PetDetailOverlay pet={detail.open} playerId={player.userId} onClose={detail.close} onRetry={detail.show} onOpenShop={onOpenShop} onRemovalSubmitted={fetchPets} />
      <DeletionRequestOverlay target={removal.target} onSubmit={removal.submit} onClose={removal.close} />
    </main>
  );
}
