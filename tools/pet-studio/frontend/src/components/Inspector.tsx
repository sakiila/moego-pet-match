import { Download, LoaderCircle, Sparkles } from 'lucide-react';
import type { Asset, Engine, Result, Settings, Style } from '../types';

type Props = {
  asset: Asset; settings: Settings; result: Result | null; stale: boolean;
  engine: Engine | null; disabled: boolean; processing: boolean;
  onChange: (settings: Settings) => void; onProcess: () => void; onDownload: () => void; downloading: boolean;
};

const styles: { value: Style; label: string; detail: string }[] = [
  { value: 'natural', label: '真实抠图', detail: '保留毛发与真实质感' },
  { value: 'sticker', label: 'MoeGo贴纸', detail: '白色描边，轻盈可爱' },
  { value: 'soft', label: '轻插画', detail: '柔和色彩滤镜，保留真实花纹' },
];

export default function Inspector({ asset, settings, result, stale, engine, disabled, processing, onChange, onProcess, onDownload, downloading }: Props) {
  const patch = (value: Partial<Settings>) => onChange({ ...settings, ...value });
  const thumbnail = result?.cutout_url || asset.thumbnail_url || asset.original_url;
  const ready = !!engine?.ready;
  return <aside className="inspector" aria-label="制作设置">
    <h2>制作设置</h2>
    <fieldset className="style-fieldset" disabled={disabled}>
      <legend><span className="step-number">1</span>选择风格</legend>
      <div className="style-options">{styles.map(style => <button key={style.value} type="button" className={`style-option ${settings.style === style.value ? 'is-selected' : ''}`} onClick={() => patch({ style: style.value })} aria-pressed={settings.style === style.value} title={style.detail}>
        <span className={`style-thumbnail thumb-${style.value} ${result ? 'has-cutout' : ''}`}><img src={thumbnail} alt="" /></span><span className="style-label">{style.label}</span>
      </button>)}</div>
    </fieldset>
    <div className="inspector-section control-section">
      <label className="slider-label" htmlFor="subject-scale">主体大小 <output>{Math.round(settings.subject_scale * 100)}%</output></label>
      <input id="subject-scale" className="range-input" type="range" min={55} max={95} step={1} value={Math.round(settings.subject_scale * 100)} disabled={disabled} onChange={event => patch({ subject_scale: Number(event.target.value) / 100 })} style={{ backgroundSize: `${(settings.subject_scale - .55) / .4 * 100}% 100%` }} />
      <label className="slider-label border-label" htmlFor="border-size">白描边 <output>{settings.border} <span>px</span></output></label>
      <input id="border-size" className="range-input" type="range" min={0} max={24} step={1} value={settings.border} disabled={disabled || settings.style === 'natural'} onChange={event => patch({ border: Number(event.target.value) })} style={{ backgroundSize: `${settings.border / 24 * 100}% 100%` }} />
      {settings.style === 'natural' && <p className="setting-help">描边仅用于贴纸 / 轻插画风格</p>}
      <label className="toggle-label" htmlFor="shadow-toggle"><span>柔和阴影</span><span className="switch"><input id="shadow-toggle" type="checkbox" checked={settings.shadow} disabled={disabled} onChange={event => patch({ shadow: event.target.checked })} /><span className="switch-track" /></span></label>
    </div>
    <fieldset className="inspector-section size-fieldset" disabled={disabled}>
      <legend>导出尺寸</legend>
      <div className="size-options">{([512, 1024] as const).map(size => <button key={size} type="button" aria-pressed={settings.output_size === size} className={settings.output_size === size ? 'is-selected' : ''} onClick={() => patch({ output_size: size })}>{size}</button>)}</div>
    </fieldset>
    <div className="inspector-actions">
      <button className="primary-button" disabled={disabled || !ready} onClick={onProcess}>{processing ? <LoaderCircle size={18} className="spin" /> : <Sparkles size={18} />}<span>{processing ? '正在制作，请稍候…' : '一键抠图并生成'}</span></button>
      <button className="outline-button" disabled={disabled || !result || stale || downloading} onClick={onDownload}>{downloading ? <LoaderCircle size={18} className="spin" /> : <Download size={18} />}<span>{downloading ? '正在导出…' : '导出透明 PNG'}</span></button>
      <p className="filter-note">轻插画为柔和滤镜处理，保留真实花纹。</p>
      {!ready && <div className="engine-notice" role="status"><span className="pending-dot" /><span>{engine?.message || '正在连接本机抠图引擎…'}</span></div>}
      {ready && <p className="engine-ready"><span className="engine-dot" />本机抠图引擎已就绪</p>}
    </div>
  </aside>;
}
