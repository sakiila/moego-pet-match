import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';
import type { CollectionView, PetDetail, PlayerView } from '../api/types';
import { BrandHeader } from '../components/BrandHeader/BrandHeader';
import { CollectionProgress } from '../components/CollectionProgress/CollectionProgress';
import { EmptyState } from '../components/EmptyState/EmptyState';
import { PetCard } from '../components/PetCard/PetCard';
import { StickerSheet } from '../components/StickerSheet/StickerSheet';
import { browseCollection, sheetCollection, type CollectionFilter } from '../game/collection';
import { isDeveloperPet } from '../game/easterEggs';
import { avatarUrl, preloadImage, silhouetteUrl, stickerUrl } from '../game/pets';
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

/** 宠物图鉴：完成度、列表／贴纸册切换；列表有单个搜索框、三个筛选、两列卡片，贴纸册按主人英文名、再宠物英文名一张纸排完；点卡片或贴纸看详情。查看不改变收集或阵容。 */
export function PetdexScreen({ player, onBack, onOpenShop, onUpload, load = api.getCollection, loadDetail = api.getPetDetail }: PetdexScreenProps) {
  const { t } = useI18n();
  const [data, setData] = useState<CollectionView | null>(null);
  const [failed, setFailed] = useState(false);
  const [view, setView] = useState<'list' | 'sheet'>('list');
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
  // 零收集提示只在没有任何已收集宠物时出现（UI_COPY 6），下方照常列出未收集；搜索无结果另用索引卡插图
  const zeroCollected = view === 'list' && !!data && data.collected === 0 && !query.trim();
  const searchEmpty = view === 'list' && !!data && pets.length === 0 && !!query.trim();

  return (
    <main className={styles.screen}>
      <BrandHeader
        heading={t('nav.collection')}
        onBack={onBack}
        headingAction={
          <Button variant="secondary" iconName="open-shop" onClick={onUpload} data-testid="add-pet">
            {t('my_pets.add')}
          </Button>
        }
      />
      {data && <CollectionProgress collected={data.collected} total={data.total} />}
      <Tabs
        value={view}
        onChange={setView}
        label={t('nav.collection')}
        options={[
          { value: 'list', label: t('collection.view_list') },
          { value: 'sheet', label: t('collection.view_sheet') },
        ]}
      />
      {view === 'list' && (
        <>
          <SearchInput value={query} onChange={setQuery} clearLabel={t('action.cancel')} placeholder={t('collection.search')} aria-label={t('collection.search')} />
          <p className={styles.hint}>{t('collection.search_scope')}</p>
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
        </>
      )}
      {failed && (
        <Button variant="secondary" iconName="retry" onClick={fetchCollection}>
          {t('action.retry')}
        </Button>
      )}
      {zeroCollected && <EmptyState icon="empty-collection" layout="row" text={t('collection.empty')} />}
      {searchEmpty && <EmptyState icon="empty-search" text={t('collection.search_empty')} />}
      {view === 'list' ? (
        <div className={styles.cardGrid} data-testid="petdex-grid">
          {pets.map((p) => (
            <PetCard
              key={p.petId}
              name={p.name}
              collected={p.collected}
              imageSrc={p.collected ? stickerUrl(p.petId, 512) : silhouetteUrl(p.petId, 512)}
              owner={p.collected && p.owner ? { ...p.owner, avatarSrc: avatarUrl(p.owner.userId) } : null}
              developer={isDeveloperPet(p.petId)}
              onOpen={(el) => void detail.show(p.petId, p.name, el)}
            />
          ))}
        </div>
      ) : (
        data && (
          <StickerSheet
            playerName={player.name}
            pets={sheetCollection(data.pets, data.sheetOrder).map((p) => ({ ...p, imageSrc: p.collected ? stickerUrl(p.petId, 128) : silhouetteUrl(p.petId, 128), exportSrc: p.collected ? stickerUrl(p.petId, 512) : silhouetteUrl(p.petId, 512) }))}
            onOpen={(p, el) => void detail.show(p.petId, p.name, el)}
            onPreload={(p) => preloadImage(p.collected ? stickerUrl(p.petId, 512) : silhouetteUrl(p.petId, 512))}
            caption={t('collection.sheet_hint')}
          />
        )
      )}
      <PetDetailOverlay pet={detail.open} playerId={player.userId} onClose={detail.close} onRetry={detail.show} onOpenShop={onOpenShop} />
    </main>
  );
}
