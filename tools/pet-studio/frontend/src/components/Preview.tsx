import { useEffect, useState } from 'react';
import { ArrowRight, Crop as CropIcon, Info, MoveHorizontal, RotateCcw, Sparkles, LoaderCircle } from 'lucide-react';
import CropEditor from './CropEditor';
import type { Asset, Crop, Job, PreviewMode, Result } from '../types';

type Props = {
  asset: Asset; crop: Crop; result: Result | null; stale: boolean; disabled: boolean;
  processing: boolean; job: Job | null; onCropChange: (crop: Crop) => void;
};

function CroppedSource({ asset, crop }: { asset: Asset; crop: Crop }) {
  const ratio = asset.width * crop.width / (asset.height * crop.height);
  return <div className="source-crop-viewport">
    <div className="source-crop-inner" style={{ aspectRatio: ratio, width: ratio >= 1 ? '100%' : undefined, height: ratio < 1 ? '100%' : undefined }}>
      <img src={asset.original_url} alt={`${asset.name}的原图，应用当前裁切`} style={{ width: `${100 / crop.width}%`, left: `${-100 * crop.x / crop.width}%`, top: `${-100 * crop.y / crop.height}%` }} />
    </div>
  </div>;
}

function ResultImage({ asset, result }: { asset: Asset; result: Result }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => { setFailed(false); }, [result.image_url]);
  return <div className="result-frame checkerboard">{failed ? <div className="result-unavailable"><Info size={24} /><span>预览图片未能加载</span><button className="text-button" onClick={() => setFailed(false)}>重新加载</button></div> : <img src={result.image_url} alt={`${asset.name}的透明素材处理结果`} onError={() => setFailed(true)} />}</div>;
}

export default function Preview({ asset, crop, result, stale, disabled, processing, job, onCropChange }: Props) {
  const [mode, setMode] = useState<PreviewMode>(result ? 'compare' : 'original');
  const [cropping, setCropping] = useState(false);
  useEffect(() => { setMode(result ? 'compare' : 'original'); setCropping(false); }, [asset.id]);
  useEffect(() => { if (result) { setMode('compare'); setCropping(false); } }, [result?.job_id]);

  const selectMode = (next: PreviewMode) => { setMode(next); setCropping(false); };
  const showCrop = () => { setMode('original'); setCropping(value => !value); };
  return <main className="workspace">
    <div className="workspace-topline">
      <div className="pet-heading"><h1>{asset.name || asset.label || '未命名宠物'}</h1><p>主人：{asset.owner || (asset.source === 'upload' ? '本机上传' : '未填写')}</p></div>
      <div className="preview-tabs" role="group" aria-label="预览模式">{([['original', '原图'], ['result', '处理结果'], ['compare', '对比']] as const).map(([value, label]) => <button key={value} className={mode === value ? 'is-active' : ''} aria-pressed={mode === value} onClick={() => selectMode(value)}>{label}</button>)}</div>
    </div>
    <div className="preview-toolbar">
      <button className={cropping ? 'tool-button is-active' : 'tool-button'} onClick={showCrop} disabled={disabled} aria-pressed={cropping}><CropIcon size={18} /><span>{cropping ? '完成裁切' : '调整裁切'}</span></button>
      <button className="tool-button reset-button" onClick={() => onCropChange({ x: 0, y: 0, width: 1, height: 1 })} disabled={disabled || (crop.x === 0 && crop.y === 0 && crop.width === 1 && crop.height === 1)}><RotateCcw size={17} /><span>重置裁切</span></button>
    </div>
    <div className={`preview-surface ${mode === 'compare' && result ? 'is-compare' : ''}`}>
      {mode === 'original' ? <CropEditor asset={asset} crop={crop} active={cropping} disabled={disabled} onChange={onCropChange} /> : result ? mode === 'result' ? <div className="single-result"><ResultImage asset={asset} result={result} /><span className="preview-corner-label">透明处理结果</span></div> : <div className="comparison">
        <div className="comparison-half"><CroppedSource asset={asset} crop={result.settings?.crop ?? crop} /><span className="preview-corner-label">原图 · 生成时裁切</span></div>
        <div className="comparison-divider"><MoveHorizontal size={19} /></div>
        <div className="comparison-half"><ResultImage asset={asset} result={result} /><span className="preview-corner-label">透明处理结果</span></div>
      </div> : <div className="empty-result checkerboard"><span className="empty-result-icon"><Sparkles size={27} /></span><h3>给每一只毛孩子，留住可爱</h3><p>选好风格，点击右侧生成按钮。<br />透明素材会出现在这里。</p><button className="text-button" onClick={() => selectMode('original')}>先看看原图 <ArrowRight size={15} /></button></div>}
      {processing && <div className="processing-overlay" role="status"><div className="processing-card"><span className="processing-spinner"><LoaderCircle size={30} className="spin" /></span><h3>{job?.phase === 'queued' || job?.status === 'queued' ? '照片已就绪，正在排队' : '正在为毛孩子制作素材'}</h3><p>{job?.message || '正在保存设置并准备本机处理…'}</p><small>首次加载模型可能需要一点时间，请保持页面打开。</small></div></div>}
    </div>
    {stale && <div className="stale-notice" role="status"><Info size={17} /><span>设置已更新，当前结果来自上一版。重新生成后可导出最新素材。</span></div>}
    <div className="workspace-note"><Info size={17} /><span>保留耳朵与毛发，照片不用离开这台电脑。</span></div>
    <div className="workspace-meta"><span>{asset.width} × {asset.height} px</span><span>原图始终保留</span>{result && <span>已生成透明 PNG</span>}</div>
  </main>;
}
