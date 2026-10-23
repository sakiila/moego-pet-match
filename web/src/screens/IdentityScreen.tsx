import { useEffect, useState } from 'react';
import { api } from '../api/client';
import type { ColleagueResult } from '../api/types';
import { BrandHeader } from '../components/BrandHeader/BrandHeader';
import { ColleagueCard } from '../components/ColleagueCard/ColleagueCard';
import { InfoSummary } from '../components/InfoSummary/InfoSummary';
import { PageLinks } from '../components/PageLinks/PageLinks';
import { StatusMessage } from '../components/StatusMessage/StatusMessage';
import { useI18n } from '../i18n';
import { Button } from '../ui/primitives/Button';
import { SearchInput } from '../ui/primitives/SearchInput';
import styles from './Screen.module.css';

type SearchState = { kind: 'idle' } | { kind: 'loading' } | { kind: 'ok'; results: ColleagueResult[] } | { kind: 'failed' };

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
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setState({ kind: 'idle' });
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setState({ kind: 'loading' });
      search(q, controller.signal)
        .then((results) => setState({ kind: 'ok', results }))
        .catch(() => {
          if (!controller.signal.aborted) setState({ kind: 'failed' });
        });
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, search, attempt]);

  const results = state.kind === 'ok' ? state.results : [];

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
          autoComplete="off"
          data-testid="identity-search"
        />
        {state.kind === 'failed' && (
          <StatusMessage tone="error" text={t('identity.load_failed')} actionLabel={t('action.retry')} onAction={() => setAttempt((n) => n + 1)} />
        )}
        {state.kind === 'ok' && results.length === 0 && <StatusMessage text={t('identity.not_found')} />}
        <div className={styles.list}>
          {results.map((c) => (
            <ColleagueCard key={c.userId} userId={c.userId} name={c.name} selected={selected?.userId === c.userId} onSelect={() => setSelected(c)} />
          ))}
        </div>
        {selected && <p className={styles.selected}>{t('identity.selected', { playerName: selected.name })}</p>}
      </section>
      <div className={styles.grow} />
      <InfoSummary />
      <Button size="lg" block disabled={!selected} onClick={() => selected && onConfirm(selected)} data-testid="identity-confirm">
        🐾 {selected ? t('identity.confirm', { playerName: selected.name }) : t('identity.title')}
      </Button>
      {onInfo && (
        <PageLinks
          links={[
            { label: t('info.use_link'), onClick: () => onInfo(selected, false), testId: 'link-info' },
            // 删除申请需要知道是谁提交的：选中同事后才能以该身份提交
            { label: t('info.removal_link'), onClick: () => onInfo(selected, true), disabled: !selected, testId: 'link-removal' },
          ]}
        />
      )}
    </main>
  );
}
