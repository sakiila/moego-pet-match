import { useEffect, useState } from 'react';
import { api } from '../api/client';
import type { ColleagueResult } from '../api/types';
import { BrandHeader } from '../components/BrandHeader/BrandHeader';
import { ColleagueCard } from '../components/ColleagueCard/ColleagueCard';
import { InfoSummary } from '../components/InfoSummary/InfoSummary';
import { PinLogin } from '../components/PinLogin/PinLogin';
import { PageLinks } from '../components/PageLinks/PageLinks';
import { StatusMessage } from '../components/StatusMessage/StatusMessage';
import { useI18n } from '../i18n';
import { Button } from '../ui/primitives/Button';
import { SearchInput } from '../ui/primitives/SearchInput';
import styles from './Screen.module.css';

type SearchState = { kind: 'idle' } | { kind: 'ok'; results: ColleagueResult[] } | { kind: 'failed' };

export interface IdentityScreenProps {
  onConfirm: (colleague: ColleagueResult) => void;
  /** 打开信息使用说明（带当前选中的同事）；removal 为 true 时直接展开删除申请。 */
  onInfo?: (selected: ColleagueResult | null, removal: boolean) => void;
  /** 陈列页用：跳过请求直接展示。 */
  search?: (q: string, signal: AbortSignal) => Promise<ColleagueResult[]>;
  initialQuery?: string;
}

/** 直接搜索并选择同事身份；未找到与读取失败分开提示；确认后进入门店，不开始计时。 */
export function IdentityScreen({ onConfirm, onInfo, search = api.searchRoster, initialQuery = '' }: IdentityScreenProps) {
  const { t } = useI18n();
  const [query, setQuery] = useState(initialQuery);
  const [state, setState] = useState<SearchState>({ kind: 'idle' });
  const [selected, setSelected] = useState<ColleagueResult | null>(null);
  const [signingIn, setSigningIn] = useState<ColleagueResult | null>(null);
  const [attempt, setAttempt] = useState(0);
  // 输入后到结果回来之间（含 250 ms 防抖）都算搜索中；新结果回来前旧结果保留，列表不闪
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setState({ kind: 'idle' });
      setSearching(false);
      return;
    }
    const controller = new AbortController();
    setSearching(true);
    const timer = setTimeout(() => {
      search(q, controller.signal)
        .then((results) => {
          setState({ kind: 'ok', results });
          setSearching(false);
        })
        .catch(() => {
          if (!controller.signal.aborted) {
            setState({ kind: 'failed' });
            setSearching(false);
          }
        });
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, search, attempt]);

  const results = state.kind === 'ok' ? state.results : [];

  if (signingIn) return (
    <main className={styles.screen}>
      <BrandHeader title="game" tagline="access.subtitle" />
      <PinLogin key={signingIn.userId} colleague={signingIn} loadState={api.getLoginState} submit={api.signIn}
        onSuccess={onConfirm} onBack={() => setSigningIn(null)} />
      <InfoSummary />
    </main>
  );

  return (
    <main className={styles.screen}>
      <BrandHeader title="game" tagline="access.subtitle" />
      <section className={styles.stack}>
        <h2 className={styles.sectionTitle}>{t('identity.title')}</h2>
        <p className={styles.muted}>{t('identity.hint')}</p>
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder={t('identity.search')}
          aria-label={t('identity.search')}
          clearLabel={t('action.cancel')}
          loading={searching}
          autoComplete="off"
          data-testid="identity-search"
        />
        {state.kind === 'failed' && !searching && (
          <StatusMessage tone="error" text={t('identity.load_failed')} actionLabel={t('action.retry')} actionIcon="retry" onAction={() => setAttempt((n) => n + 1)} />
        )}
        {state.kind === 'ok' && results.length === 0 && !searching && <StatusMessage text={t('identity.not_found')} />}
        <div className={styles.colleagues}>
          {results.map((c) => (
            <ColleagueCard key={c.userId} userId={c.userId} name={c.name} selected={selected?.userId === c.userId} onSelect={() => setSelected(c)} />
          ))}
        </div>
        {selected && <SelectedLine name={selected.name} template={t('identity.selected', { playerName: '\u0000' })} />}
      </section>
      <div className={styles.grow} />
      <InfoSummary />
      <Button size="lg" block iconName="open-shop-white" disabled={!selected} onClick={() => selected && setSigningIn(selected)} data-testid="identity-confirm">
        {selected ? t('identity.confirm', { playerName: selected.name }) : t('identity.choose_first')}
      </Button>
      {onInfo && (
        <PageLinks
          links={[
            { label: t('info.use_link'), onClick: () => onInfo(null, false), testId: 'link-info' },
          ]}
        />
      )}
    </main>
  );
}

/** 「当前选择：名字」，名字用品牌色强调（mobile-identity-v2）；名字保留原文。 */
function SelectedLine({ name, template }: { name: string; template: string }) {
  const [before, after = ''] = template.split('\u0000');
  return (
    <p className={styles.selected}>
      {before}
      <em>{name}</em>
      {after}
    </p>
  );
}
