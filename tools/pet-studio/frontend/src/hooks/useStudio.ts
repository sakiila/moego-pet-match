import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError, post, request } from '../api';
import type { Asset, AssetList, Engine, Job, SaveState, Settings } from '../types';

const equal = (a: Settings, b: Settings) => JSON.stringify(a) === JSON.stringify(b);
const visualSettings = ({ crop, style, border, shadow, subject_scale }: Settings) =>
  JSON.stringify([crop.x, crop.y, crop.width, crop.height, style, border, shadow, subject_scale]);
const draftKey = (id: string) => `moego-pet-studio:draft:v1:${id}`;
const errorText = (error: unknown) => error instanceof Error ? error.message : '操作未完成，请重试。';

function readDraft(asset: Asset): { settings: Settings; conflict: boolean } | null {
  try {
    const draft = JSON.parse(localStorage.getItem(draftKey(asset.id)) || 'null');
    if (!draft?.settings?.crop || !['natural', 'sticker', 'soft'].includes(draft.settings.style)) return null;
    if (equal(draft.settings, asset.settings)) return null;
    return { settings: draft.settings, conflict: draft.base_revision !== asset.revision };
  } catch { return null; }
}

export function useStudio() {
  const [items, setItems] = useState<Asset[]>([]);
  const [asset, setAsset] = useState<Asset | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [engine, setEngine] = useState<Engine | null>(null);
  const [loading, setLoading] = useState(true);
  const [saveState, setSaveState] = useState<SaveState>('loading');
  const [saveError, setSaveError] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [draftWarning, setDraftWarning] = useState('');
  const [switching, setSwitching] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [starting, setStarting] = useState(false);
  const [job, setJob] = useState<Job | null>(null);
  const assetRef = useRef<Asset | null>(null);
  const draftRef = useRef<Settings | null>(null);
  const saveRef = useRef<Promise<boolean> | null>(null);
  const saveStateRef = useRef<SaveState>('loading');
  const saveUncertainRef = useRef(false);
  const busyRef = useRef(false);

  const markSave = useCallback((value: SaveState) => {
    saveStateRef.current = value;
    setSaveState(value);
  }, []);

  const rememberDraft = useCallback((current: Asset, draft: Settings) => {
    try {
      localStorage.setItem(draftKey(current.id), JSON.stringify({ base_revision: current.revision, settings: draft }));
      setDraftWarning('');
    } catch {
      setDraftWarning('浏览器无法保留草稿；请保存成功后再关闭页面。');
    }
  }, []);

  const replaceItem = useCallback((next: Asset) => {
    setItems(previous => previous.some(item => item.id === next.id)
      ? previous.map(item => item.id === next.id ? next : item)
      : [...previous, next]);
  }, []);

  const openAsset = useCallback((next: Asset) => {
    const recovered = readDraft(next);
    const nextSettings = recovered?.settings ?? next.settings;
    assetRef.current = next;
    draftRef.current = nextSettings;
    saveUncertainRef.current = !!recovered?.conflict;
    setAsset(next);
    setSettings(nextSettings);
    setJob(null);
    setSaveError(recovered?.conflict ? '已恢复本机草稿，但保存版本已更新。请确认后重新保存当前修改。' : '');
    markSave(recovered ? (recovered.conflict ? 'conflict' : 'dirty') : 'saved');
    setNotice(recovered && !recovered.conflict ? '已恢复上次未保存的本机草稿。' : '');
    replaceItem(next);
    try {
      const pendingId = localStorage.getItem(`moego-pet-studio:job:${next.id}`);
      if (pendingId) void request<Job>(`/api/jobs/${encodeURIComponent(pendingId)}`).then(pending => {
        if (assetRef.current?.id !== next.id) return;
        if (pending.status === 'queued' || pending.status === 'processing') setJob(pending);
        else localStorage.removeItem(`moego-pet-studio:job:${next.id}`);
      }).catch(() => { /* Processing can also be resumed with the generate button. */ });
    } catch { /* The normal server flow works without browser storage. */ }
  }, [markSave, replaceItem]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [listResponse, healthResponse] = await Promise.allSettled([
        request<AssetList>('/api/assets'),
        request<{ ok: boolean; engine: Engine }>('/api/health'),
      ]);
      if (listResponse.status === 'rejected') throw listResponse.reason;
      const list = listResponse.value;
      setItems(list.items);
      setEngine(healthResponse.status === 'fulfilled' ? healthResponse.value.engine : list.engine);
      const id = list.items.find(item => item.id === list.selected_id)?.id ?? list.items[0]?.id;
      if (id) openAsset(await request<Asset>(`/api/assets/${encodeURIComponent(id)}`));
      else markSave('saved');
    } catch (cause) {
      setError(errorText(cause));
      markSave('error');
    } finally { setLoading(false); }
  }, [markSave, openAsset]);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    if (!engine || engine.ready) return;
    const timer = window.setInterval(() => {
      void request<{ ok: boolean; engine: Engine }>('/api/health').then(health => setEngine(health.engine)).catch(() => { /* The existing engine notice remains visible. */ });
    }, 5000);
    return () => window.clearInterval(timer);
  }, [engine?.ready]);

  const flush = useCallback(async (resolveConflict = false): Promise<boolean> => {
    if (saveRef.current && !(await saveRef.current)) return false;
    while (assetRef.current && draftRef.current && (saveUncertainRef.current || !equal(assetRef.current.settings, draftRef.current))) {
      if (saveStateRef.current === 'conflict' && !resolveConflict) return false;
      const current = assetRef.current;
      const captured = draftRef.current;
      markSave('saving');
      setSaveError('');
      const saving = (async () => {
        try {
          // A conflict is only rebased after the user explicitly chooses to keep their draft.
          const revision = resolveConflict
            ? (await request<Asset>(`/api/assets/${encodeURIComponent(current.id)}`)).revision
            : current.revision;
          const saved = await request<Asset>(`/api/assets/${encodeURIComponent(current.id)}/settings`, {
            method: 'PUT', body: JSON.stringify({ expected_revision: revision, settings: captured }),
          });
          replaceItem(saved);
          saveUncertainRef.current = false;
          if (assetRef.current?.id === saved.id) {
            assetRef.current = saved;
            setAsset(saved);
            if (draftRef.current && equal(draftRef.current, captured)) {
              draftRef.current = saved.settings;
              setSettings(saved.settings);
              try { localStorage.removeItem(draftKey(saved.id)); } catch { /* The server copy is durable. */ }
              markSave('saved');
              setNotice('');
            } else if (draftRef.current) {
              rememberDraft(saved, draftRef.current);
              markSave('dirty');
            }
          }
          return true;
        } catch (cause) {
          saveUncertainRef.current = true;
          const conflict = cause instanceof ApiError && cause.status === 409;
          markSave(conflict ? 'conflict' : 'error');
          setSaveError(conflict ? '保存版本已变化。你的修改仍在本机草稿中；确认后可用当前修改重新保存。' : errorText(cause));
          return false;
        }
      })();
      saveRef.current = saving;
      const success = await saving;
      saveRef.current = null;
      if (!success) return false;
      resolveConflict = false;
    }
    return true;
  }, [markSave, rememberDraft, replaceItem]);

  const changeSettings = useCallback((next: Settings) => {
    const current = assetRef.current;
    if (!current || busyRef.current) return;
    draftRef.current = next;
    setSettings(next);
    rememberDraft(current, next);
    if (saveStateRef.current !== 'conflict') markSave(!saveUncertainRef.current && equal(current.settings, next) ? 'saved' : 'dirty');
    setNotice('');
  }, [markSave, rememberDraft]);

  useEffect(() => {
    if (saveState !== 'dirty') return;
    const timer = window.setTimeout(() => { void flush(); }, 650);
    return () => window.clearTimeout(timer);
  }, [settings, saveState, flush]);

  useEffect(() => {
    const protectDraft = (event: BeforeUnloadEvent) => {
      if (assetRef.current && draftRef.current && (saveUncertainRef.current || !equal(assetRef.current.settings, draftRef.current))) {
        event.preventDefault();
      }
    };
    window.addEventListener('beforeunload', protectDraft);
    return () => window.removeEventListener('beforeunload', protectDraft);
  }, []);

  const select = async (id: string) => {
    if (id === assetRef.current?.id || busyRef.current) return;
    busyRef.current = true;
    setSwitching(true);
    setError('');
    try {
      if (!(await flush())) {
        setError('当前修改尚未保存，已为你保留。请先重试保存，再切换照片。');
        return;
      }
      const next = await request<Asset>(`/api/assets/${encodeURIComponent(id)}`);
      await post('/api/selection', { asset_id: id });
      openAsset(next);
    } catch (cause) { setError(errorText(cause)); }
    finally { busyRef.current = false; setSwitching(false); }
  };

  const upload = async (file: File) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setUploading(true);
    setError('');
    try {
      if (!(await flush())) {
        setError('请先保存当前修改，然后再上传照片。');
        return;
      }
      const data = new FormData();
      data.append('file', file);
      const uploaded = await request<Asset>('/api/upload', { method: 'POST', body: data });
      replaceItem(uploaded);
      await post('/api/selection', { asset_id: uploaded.id });
      openAsset(uploaded);
      setNotice('照片已导入。可以调整裁切，再生成透明素材。');
    } catch (cause) { setError(errorText(cause)); }
    finally { busyRef.current = false; setUploading(false); }
  };

  const process = async () => {
    if (!assetRef.current || busyRef.current) return;
    busyRef.current = true;
    setStarting(true);
    setError('');
    try {
      if (!(await flush())) { setError('设置保存成功后才能生成，请先处理保存提示。'); return; }
      const current = assetRef.current;
      const created = await post<Job>(`/api/assets/${encodeURIComponent(current.id)}/process`, { expected_revision: current.revision });
      try { localStorage.setItem(`moego-pet-studio:job:${current.id}`, created.id); } catch { /* The running job is stored by the server too. */ }
      setJob(created);
      if (created.status === 'failed') throw new Error(created.message || '生成失败，请重试。');
      if (created.status === 'completed') {
        const updated = await request<Asset>(`/api/assets/${encodeURIComponent(current.id)}`);
        assetRef.current = updated;
        setAsset(updated);
        replaceItem(updated);
      }
    } catch (cause) { setError(errorText(cause)); }
    finally { busyRef.current = false; setStarting(false); }
  };

  useEffect(() => {
    if (!job || !['queued', 'processing'].includes(job.status)) return;
    let cancelled = false;
    let timer = 0;
    busyRef.current = true;
    const poll = async () => {
      try {
        const next = await request<Job>(`/api/jobs/${encodeURIComponent(job.id)}`);
        if (cancelled) return;
        setError('');
        if (next.status === 'completed') {
          const updated = await request<Asset>(`/api/assets/${encodeURIComponent(next.asset_id)}`);
          if (cancelled) return;
          assetRef.current = updated;
          setAsset(updated);
          replaceItem(updated);
          setNotice('透明素材已生成，并已保存到本机。');
        } else if (next.status === 'failed') setError(next.message || '生成失败，请重试。');
        else timer = window.setTimeout(poll, 900);
        setJob(next);
        if (next.status === 'completed' || next.status === 'failed') busyRef.current = false;
        if (next.status === 'completed' || next.status === 'failed') {
          try { localStorage.removeItem(`moego-pet-studio:job:${next.asset_id}`); } catch { /* Optional browser bookkeeping. */ }
        }
      } catch (cause) {
        if (!cancelled) {
          setError(`暂时无法获取进度：${errorText(cause)} 正在继续尝试连接。`);
          timer = window.setTimeout(poll, 2500);
        }
      }
    };
    timer = window.setTimeout(poll, 500);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [job?.id, job?.status, replaceItem]);

  const processing = starting || job?.status === 'queued' || job?.status === 'processing';
  const dirty = !!asset && !!settings && (saveState !== 'saved' || !equal(asset.settings, settings));
  const result = asset?.latest_result ?? null;
  const stale = !!result && !!settings && visualSettings(result.settings) !== visualSettings(settings);

  return {
    items, asset, settings, engine, loading, saveState, saveError, error, notice, draftWarning,
    switching, uploading, processing, job, result, stale, dirty,
    changeSettings, select, upload, process, retrySave: () => flush(saveState === 'conflict'),
    reload: load, clearError: () => setError(''),
  };
}
