import { ChevronRight, ImagePlus, Search, ShieldCheck, X } from 'lucide-react';
import { useState } from 'react';
import type { Asset } from '../types';

type Props = { items: Asset[]; selectedId?: string; disabled: boolean; loading: boolean; onSelect: (id: string) => void };

export default function PhotoLibrary({ items, selectedId, disabled, loading, onSelect }: Props) {
  const [query, setQuery] = useState('');
  const normalized = query.trim().toLocaleLowerCase();
  const filtered = items.filter(item => [item.name, item.owner, item.label].some(value => value?.toLocaleLowerCase().includes(normalized)));
  return <aside className="library-panel" aria-label="照片库">
    <div className="library-heading"><h2>照片库</h2><span className="library-count">{items.length}</span></div>
    <label className="library-search"><Search size={18} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="搜索宠物或主人" aria-label="搜索宠物或主人" />
      {query && <button type="button" aria-label="清空搜索" onClick={() => setQuery('')}><X size={14} /></button>}
    </label>
    <div className="photo-list" aria-busy={loading}>
      {loading ? <div className="library-empty">正在读取照片…</div> : filtered.length ? filtered.map(item => <button key={item.id} className={`photo-row ${selectedId === item.id ? 'is-selected' : ''}`} aria-pressed={selectedId === item.id} disabled={disabled} onClick={() => onSelect(item.id)} title={`${item.name} · ${item.owner || '未填写主人'}`}>
        <img src={item.thumbnail_url || item.original_url} alt="" loading="lazy" />
        <span className="photo-info"><span className="photo-name">{item.name || item.label || '未命名宠物'}</span><span className="photo-owner">{item.owner || (item.source === 'upload' ? '本机上传' : '未填写主人')}</span></span>
        <ChevronRight className="photo-chevron" size={18} />
      </button>) : <div className="library-empty"><ImagePlus size={25} /><span>{query ? '没有找到匹配的照片' : '还没有照片'}</span><small>{query ? '试试宠物名或主人名' : '上传一张照片，开始制作'}</small></div>}
    </div>
    <div className="library-footer"><ShieldCheck size={18} /><span>本机处理 · 原图保留</span></div>
  </aside>;
}
