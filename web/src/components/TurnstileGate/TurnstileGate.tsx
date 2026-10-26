import { useEffect, useRef, useState } from 'react';
import { useI18n } from '../../i18n';
import { Button } from '../../ui/primitives/Button';
import styles from './TurnstileGate.module.css';

interface TurnstileApi {
  render(container: HTMLElement, options: Record<string, unknown>): string;
  remove(id: string): void;
}
declare global { interface Window { turnstile?: TurnstileApi } }
let loading: Promise<TurnstileApi> | undefined;
function loadWidget(): Promise<TurnstileApi> {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (loading) return loading;
  loading = new Promise<TurnstileApi>((resolve, reject) => {
    const script = document.createElement('script');
    const timer = setTimeout(() => { script.remove(); reject(new Error('verification_unavailable')); }, 10_000);
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.setAttribute('data-cfasync', 'false');
    script.onload = () => { clearTimeout(timer); if (window.turnstile) resolve(window.turnstile); else reject(new Error('verification_unavailable')); };
    script.onerror = () => { clearTimeout(timer); script.remove(); reject(new Error('verification_unavailable')); };
    document.head.append(script);
  }).catch(error => { loading = undefined; throw error; });
  return loading;
}

export interface TurnstileGateProps {
  siteKey: string | null;
  gameId: string;
  onToken: (token: string) => void;
  failed?: boolean;
  rateLimited?: boolean;
  onRetry: () => void;
  /** 陈列页只展示状态，不加载真实验证脚本。 */
  preview?: 'checking' | 'verified' | 'failed';
}

export function TurnstileGate({ siteKey, gameId, onToken, failed, rateLimited, onRetry, preview }: TurnstileGateProps) {
  const { t, locale } = useI18n();
  const container = useRef<HTMLDivElement>(null);
  const callback = useRef(onToken); callback.current = onToken;
  const [status, setStatus] = useState<'checking' | 'verified' | 'failed'>('checking');
  useEffect(() => {
    if (preview || !siteKey || !container.current) return;
    let cancelled = false;
    let widget: { api: TurnstileApi; id: string } | undefined;
    setStatus('checking');
    callback.current('');
    void loadWidget().then(api => {
      if (cancelled || !container.current) return;
      const id = api.render(container.current, {
        sitekey: siteKey, action: 'start_game', cData: gameId, theme: 'light', size: 'flexible', language: locale,
        appearance: 'interaction-only', retry: 'never',
        callback: (token: string) => { if (!cancelled) { setStatus('verified'); callback.current(token); } },
        'expired-callback': () => { if (!cancelled) { setStatus('checking'); callback.current(''); } },
        'error-callback': () => { if (!cancelled) { setStatus('failed'); callback.current(''); } },
        'timeout-callback': () => { if (!cancelled) { setStatus('failed'); callback.current(''); } },
      });
      widget = { api, id };
    }).catch(() => { if (!cancelled) { setStatus('failed'); callback.current(''); } });
    return () => { cancelled = true; if (widget) widget.api.remove(widget.id); };
  }, [siteKey, gameId, locale, preview]);
  const current = preview ?? (failed ? 'failed' : status);
  return <section className={styles.gate} aria-label={t('security.title')}>
    <div ref={container} />
    <p role="status">{t(current === 'failed' && rateLimited ? 'security.rate_limited' : `security.${current}`)}</p>
    {current === 'failed' && <Button variant="secondary" onClick={onRetry}>{t('action.retry')}</Button>}
  </section>;
}
