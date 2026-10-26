import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { ApiError } from '../../api/client';
import type { ColleagueResult } from '../../api/types';
import { useI18n } from '../../i18n';
import { Button } from '../../ui/primitives/Button';
import { PinInput } from '../../ui/primitives/PinInput';
import { ColleagueCard } from '../ColleagueCard/ColleagueCard';
import { StatusMessage } from '../StatusMessage/StatusMessage';
import styles from './PinLogin.module.css';

const noop = () => {};

export interface PinLoginProps {
  colleague: ColleagueResult;
  loadState: (id: string, signal: AbortSignal) => Promise<ColleagueResult & { hasPin: boolean }>;
  submit: (id: string, pin: string, confirmation?: string) => Promise<unknown>;
  onSuccess: (colleague: ColleagueResult) => void;
  onBack: () => void;
}

export function PinLogin({ colleague, loadState, submit, onSuccess, onBack }: PinLoginProps) {
  const { t } = useI18n();
  const [hasPin, setHasPin] = useState<boolean | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [pin, setPin] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const [invalidField, setInvalidField] = useState<'pin' | 'confirmation' | null>(null);
  const errorId = useId();
  const [busy, setBusy] = useState(false);
  const sending = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    setFailed(false);
    setHasPin(null);
    loadState(colleague.userId, controller.signal).then(state => {
      if (!controller.signal.aborted) setHasPin(state.hasPin);
    }).catch(() => {
      if (!controller.signal.aborted) setFailed(true);
    });
    return () => controller.abort();
  }, [colleague.userId, loadState, attempt]);

  async function signIn(event: FormEvent) {
    event.preventDefault();
    if (sending.current || hasPin === null) return;
    if (!/^[0-9]{4}$/.test(pin)) {
      setInvalidField('pin');
      return setError(t('auth.invalid_pin'));
    }
    if (!hasPin && pin !== confirmation) {
      setInvalidField('confirmation');
      return setError(t('auth.pin_mismatch'));
    }
    sending.current = true;
    setBusy(true);
    setError('');
    setInvalidField(null);
    try {
      await submit(colleague.userId, pin, hasPin ? undefined : confirmation);
      onSuccess(colleague);
    } catch (failure) {
      const detail = failure instanceof ApiError ? failure.detail : undefined;
      if (detail === 'wrong_pin' || detail === 'locked') setInvalidField('pin');
      if (detail === 'pin_exists' || detail === 'pin_required') {
        setPin('');
        setConfirmation('');
        setAttempt(value => value + 1);
      }
      setError(t(detail === 'wrong_pin' ? 'auth.wrong_pin' : detail === 'locked' ? 'auth.locked' : detail === 'pin_exists' ? 'auth.pin_exists' : 'auth.failed'));
    } finally {
      sending.current = false;
      setBusy(false);
    }
  }

  const ready = /^[0-9]{4}$/.test(pin) && (hasPin || /^[0-9]{4}$/.test(confirmation));
  return (
    <section className={styles.wrap}>
      <ColleagueCard userId={colleague.userId} name={colleague.name} selected onSelect={busy ? noop : onBack} />
      {hasPin === null ? (
        <StatusMessage text={t(failed ? 'auth.failed' : 'auth.loading')} tone={failed ? 'error' : undefined}
          actionLabel={failed ? t('action.retry') : undefined} onAction={failed ? () => setAttempt(value => value + 1) : undefined} />
      ) : (
        <form className={styles.form} onSubmit={signIn} aria-busy={busy}>
          <div>
            <h2 className={styles.title}>{t(hasPin ? 'auth.login_title' : 'auth.setup_title')}</h2>
            <p className={styles.hint}>{t(hasPin ? 'auth.login_hint' : 'auth.setup_hint')}</p>
          </div>
          <PinInput label={t('auth.pin_label')} autoComplete={hasPin ? 'current-password' : 'new-password'}
            autoFocus value={pin} disabled={busy} invalid={invalidField === 'pin'} describedBy={invalidField === 'pin' ? errorId : undefined}
            onChange={value => { setPin(value); setError(''); setInvalidField(null); }} />
          {!hasPin && <PinInput label={t('auth.confirm_label')} autoComplete="new-password" value={confirmation} disabled={busy}
            invalid={invalidField === 'confirmation'} describedBy={invalidField === 'confirmation' ? errorId : undefined}
            onChange={value => { setConfirmation(value); setError(''); setInvalidField(null); }} />}
          {error && <div id={errorId} role="alert"><StatusMessage tone="error" text={error} /></div>}
          <Button type="submit" size="lg" block disabled={busy || !ready} iconName="open-shop-white">
            {t(busy ? 'auth.submitting' : hasPin ? 'auth.login' : 'auth.setup')}
          </Button>
          <p className={styles.hint}>{t('auth.forgot')}</p>
        </form>
      )}
      <Button variant="secondary" block disabled={busy} onClick={onBack}>{t('auth.change_player')}</Button>
    </section>
  );
}
