import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../api/client';
import type { AchievementId, AchievementView } from '../api/types';
import { AchievementShelf } from '../components/AchievementShelf/AchievementShelf';

export function AchievementOverlay({ playerId, onEquipped, onClose }: { playerId: string; onEquipped: (id: AchievementId | null) => void; onClose: () => void }) {
  const [view, setView] = useState<AchievementView | null>(null);
  const [failed, setFailed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  const request = useRef(0);
  const load = useCallback(async () => {
    const current = ++request.current;
    setFailed(false);
    try { const data = await api.getAchievements(playerId); if (current === request.current) { setView(data); onEquipped(data.equippedTitle); } }
    catch { if (current === request.current) setFailed(true); }
  }, [playerId, onEquipped]);
  useEffect(() => { void load(); return () => { request.current++; }; }, [load]);
  const select = async (id: AchievementId | null) => {
    if (saving) return;
    const current = ++request.current;
    setSaving(true); setSaveFailed(false);
    try {
      const data = await api.equipTitle(playerId, id);
      if (current === request.current) setView(data);
      onEquipped(data.equippedTitle);
    } catch { if (current === request.current) setSaveFailed(true); }
    finally { if (current === request.current) setSaving(false); }
  };
  return <AchievementShelf view={view} failed={failed} saving={saving} saveFailed={saveFailed} onRetry={load} onSelect={id => void select(id)} onClose={onClose} />;
}
