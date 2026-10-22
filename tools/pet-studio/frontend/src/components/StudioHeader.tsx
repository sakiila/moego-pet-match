import { Check, LoaderCircle, Upload, CloudOff } from 'lucide-react';
import { useRef } from 'react';
import type { SaveState } from '../types';

type Props = {
  saveState: SaveState;
  savedAt: string | null;
  uploading: boolean;
  disabled: boolean;
  onUpload: (file: File) => void;
  onRetry: () => void;
};

const saveLabels: Record<SaveState, string> = {
  loading: '正在读取本机素材', saved: '已保存到本机', dirty: '有修改待保存', saving: '正在保存…', error: '尚未保存', conflict: '保存版本冲突',
};

export default function StudioHeader({ saveState, savedAt, uploading, disabled, onUpload, onRetry }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const failed = saveState === 'error' || saveState === 'conflict';
  return <header className="studio-header">
    <a className="brand" href="/" aria-label="MoeGo 宠物素材工作台首页">
      <svg className="brand-paw" viewBox="0 0 44 44" aria-hidden="true">
        <ellipse cx="10" cy="15" rx="5" ry="7" transform="rotate(-24 10 15)" />
        <ellipse cx="20" cy="8" rx="5" ry="7" transform="rotate(-7 20 8)" />
        <ellipse cx="31" cy="9" rx="5" ry="7" transform="rotate(14 31 9)" />
        <ellipse cx="38" cy="20" rx="4.5" ry="6.5" transform="rotate(25 38 20)" />
        <path d="M13.1 26.2c3-4 4.4-7.6 9-7.6s6.6 4.5 9.7 8.3c3 3.8 3.8 8.2.7 10.5-3.3 2.5-6.7-.8-10.4-.8-3.5 0-6.9 2.9-10.4.9-3.4-2-2.5-7.1 1.4-11.3Z" />
      </svg>
      <span className="brand-name">MoeGo</span><span className="brand-divider" /><span className="brand-title">宠物素材工作台</span>
    </a>
    <div className="header-actions">
      <div className={`save-status ${failed ? 'is-error' : ''}`} role="status" title={savedAt && saveState === 'saved' ? `服务已确认保存：${new Date(savedAt).toLocaleString('zh-CN')}` : undefined}>
        {saveState === 'saving' || saveState === 'loading' ? <LoaderCircle size={15} className="spin" /> : failed ? <CloudOff size={16} /> : saveState === 'saved' ? <span className="saved-dot"><Check size={9} /></span> : <span className="pending-dot" />}
        <span>{saveLabels[saveState]}</span>
        {failed && <button className="text-button" onClick={onRetry} disabled={disabled}>重试</button>}
      </div>
      <input ref={input} className="visually-hidden" type="file" accept="image/png,image/jpeg,image/webp" aria-label="选择宠物照片上传" onChange={event => {
        const file = event.currentTarget.files?.[0];
        if (file) onUpload(file);
        event.currentTarget.value = '';
      }} />
      <button className="upload-button" disabled={disabled || uploading} onClick={() => input.current?.click()}>
        {uploading ? <LoaderCircle size={19} className="spin" /> : <Upload size={19} />}<span>{uploading ? '正在导入…' : '上传照片'}</span>
      </button>
    </div>
  </header>;
}
