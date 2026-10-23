import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';
import type { CollectionView, PetDetail, PlayerView } from '../api/types';
import { BrandHeader } from '../components/BrandHeader/BrandHeader';
import { CollectionProgress } from '../components/CollectionProgress/CollectionProgress';
import { PetCard } from '../components/PetCard/PetCard';
import { StatusMessage } from '../components/StatusMessage/StatusMessage';
import { browseCollection, type CollectionFilter } from '../game/collection';
import { avatarUrl, silhouetteUrl, stickerUrl } from '../game/pets';
import { usePetDetail } from '../game/usePetDetail';
import { useI18n } from '../i18n';
import { Button } from '../ui/primitives/Button';
import { SearchInput } from '../ui/primitives/SearchInput';
import { Tabs } from '../ui/primitives/Tabs';
import { PetDetailOverlay } from './PetDetailOverlay';
import styles from './Screen.module.css';

export interface PetdexScreenProps {
  player: PlayerView;
  onBack: () => void;
  onOpenShop: () => void;
  /** 添加我家毛孩子（上传）。 */
  onUpload: () => void;
  /** 陈列页用：替换数据来源。 */
  load?: (playerId: string) => Promise<CollectionView>;
  loadDetail?: (petId: string, playerId: string) => Promise<PetDetail>;
}

/** 宠物图鉴：完成度、单个搜索框、三个筛选、两列卡片；点卡片看详情。查看不改变收集或阵容。 */
export function PetdexScreen({ player, onBack, onOpenShop, onUpload, load = api.getCollection, loadDetail = api.getPetDetail }: PetdexScreenProps) {
  const { t } = useI18n();
  const [data, setData] = useState<CollectionView | null>(null);
  const [failed, setFailed] = useState(false);
  const [filter, setFilter] = useState<CollectionFilter>('all');
  const [query, setQuery] = useState('');
  const detail = usePetDetail(player.userId, loadDetail);

  const fetchCollection = useCallback(async () => {
    setFailed(false);
    try {
      setData(await load(player.userId));
    } catch {
      setFailed(true);
    }
  }, [load, player.userId]);

  useEffect(() => {
    void fetchCollection();
  }, [fetchCollection]);

  const pets = useMemo(() => (data ? browseCollection(data.pets, filter, query) : []), [data, filter, query]);
  const empty = data && pets.length === 0 ? (query.trim() ? 'collection.search_empty' : 'collection.empty') : null;

  return (
    <main className={styles.screen}>
      <BrandHeader heading={t('nav.collection')} onBack={onBack} />
      <div className={styles.titleRow}>
        {data ? <CollectionProgress collected={data.collected} total={data.total} /> : <span />}
        <Button variant="secondary" onClick={onUpload} data-testid="add-pet">
          🐾 {t('my_pets.add')}
        </Button>
      </div>
      <SearchInput value={query} onChange={setQuery} clearLabel={t('action.cancel')} placeholder={t('collection.search')} aria-label={t('collection.search')} />
      <p className={styles.muted}>{t('collection.search_scope')}</p>
      <Tabs
        value={filter}
        onChange={setFilter}
        label={t('nav.collection')}
        options={[
          { value: 'all', label: t('collection.filter_all') },
          { value: 'collected', label: t('collection.filter_collected') },
          { value: 'uncollected', label: t('collection.filter_uncollected') },
        ]}
      />
      {failed && (
        <Button variant="secondary" onClick={fetchCollection}>
          {t('action.retry')}
        </Button>
      )}
      {empty && <StatusMessage text={t(empty)} />}
      <div className={styles.cardGrid} data-testid="petdex-grid">
        {pets.map((p) => (
          <PetCard
            key={p.petId}
            name={p.name}
            collected={p.collected}
            imageSrc={p.collected ? stickerUrl(p.petId, 512) : silhouetteUrl(p.petId, 512)}
            owner={p.collected && p.owner ? { ...p.owner, avatarSrc: avatarUrl(p.owner.userId) } : null}
            onOpen={() => void detail.show(p.petId, p.name)}
          />
        ))}
      </div>
      <PetDetailOverlay pet={detail.open} playerId={player.userId} onClose={detail.close} onRetry={detail.show} onOpenShop={onOpenShop} />
    </main>
  );
}
