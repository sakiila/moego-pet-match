import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError, api } from '../api/client';
import type { RegisteredGame } from '../api/types';

/** 准备页验证与开局请求；私密凭证只留在内存，不写 localStorage 或网址。 */
export function useGameVerification(game: RegisteredGame | null, playerId: string | undefined, onStarted: () => void) {
  const [siteKey, setSiteKey] = useState<string | null>(null);
  const [token, setToken] = useState('');
  const [starting, setStarting] = useState(false);
  const [failed, setFailed] = useState(false);
  const [rateLimited, setRateLimited] = useState(false);
  const [newGameNeeded, setNewGameNeeded] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [configAttempt, setConfigAttempt] = useState(0);
  const identity = useRef('');
  const playToken = useRef('');
  const credentialGame = useRef<string | undefined>(undefined);
  const callback = useRef(onStarted);
  callback.current = onStarted;
  const gameId = game?.gameId;
  const required = !!game?.verificationRequired;
  useEffect(() => {
    identity.current = gameId ?? '';
    if (credentialGame.current !== gameId) {
      playToken.current = Array.from(crypto.getRandomValues(new Uint8Array(32)), x => x.toString(16).padStart(2, '0')).join('');
      credentialGame.current = gameId;
    }
    setSiteKey(null); setToken(''); setStarting(false); setFailed(false); setRateLimited(false); setNewGameNeeded(false);
    let cancelled = false;
    if (required) void api.getGameSecurity().then(config => {
      if (!cancelled) {
        if (!config.enabled || !config.siteKey) setFailed(true);
        else setSiteKey(config.siteKey);
      }
    }).catch(() => { if (!cancelled) setFailed(true); });
    return () => { cancelled = true; identity.current = ''; };
  }, [gameId, required, configAttempt]);
  const onToken = useCallback((value: string) => { setToken(value); if (value) setFailed(false); }, []);
  const retry = useCallback(() => {
    setToken(''); setFailed(false); setStarting(false); setRateLimited(false);
    setAttempt(n => n + 1);
    if (!siteKey) setConfigAttempt(n => n + 1);
  }, [siteKey]);
  const start = useCallback(async () => {
    if (!gameId || !playerId || starting) return;
    if (!required) { callback.current(); return; }
    if (!token) return;
    setStarting(true); setFailed(false);
    try {
      await api.startGame(gameId, playerId, token, playToken.current);
      if (identity.current === gameId) callback.current();
    } catch (error) {
      if (identity.current === gameId) {
        setToken(''); setFailed(true);
        setRateLimited(error instanceof ApiError && error.kind === 'rate_limited');
        setNewGameNeeded(error instanceof ApiError && ['prepare_expired', 'game_invalidated', 'already_started', 'legacy_game'].includes(error.detail ?? ''));
      }
    } finally { if (identity.current === gameId) setStarting(false); }
  }, [gameId, playerId, starting, required, token]);
  return { siteKey, required, token, starting, failed, rateLimited, newGameNeeded, attempt, onToken, retry, start };
}
