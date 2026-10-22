import { useState } from 'react';
import { AlertCircle, ImagePlus, LoaderCircle, RefreshCw, X } from 'lucide-react';
import StudioHeader from './components/StudioHeader';
import PhotoLibrary from './components/PhotoLibrary';
import Preview from './components/Preview';
import Inspector from './components/Inspector';
import { useStudio } from './hooks/useStudio';

export default function App() {
  const studio = useStudio();
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState('');
  const busy = studio.processing || studio.switching || studio.uploading || downloading;

  const download = async () => {
    if (!studio.result || !studio.settings || studio.stale || studio.dirty) return;
    setDownloading(true);
    setDownloadError('');
    try {
      const response = await fetch(`/api/downloads/${encodeURIComponent(studio.result.job_id)}?size=${studio.settings.output_size}`);
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(typeof body?.detail === 'string' ? body.detail : `导出失败（${response.status}），请重试。`);
      }
      const blob = await response.blob();
      if (!blob.size || !blob.type.includes('image/png')) throw new Error('服务返回的文件不是有效 PNG，请重新生成后再试。');
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `${(studio.asset?.name || 'pet').replace(/[/\\?%*:|"<>]/g, '-')}-${studio.settings.output_size}.png`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 30000);
    } catch (cause) {
      setDownloadError(cause instanceof Error ? cause.message : '无法导出素材，请确认本机服务正在运行。');
    } finally { setDownloading(false); }
  };

  return <div className="studio-app">
    <StudioHeader saveState={studio.saveState} savedAt={studio.asset?.saved_at ?? null} uploading={studio.uploading} disabled={busy} onUpload={file => void studio.upload(file)} onRetry={() => void studio.retrySave()} />
    <div className="studio-layout">
      <PhotoLibrary items={studio.items} selectedId={studio.asset?.id} disabled={busy} loading={studio.loading} onSelect={id => void studio.select(id)} />
      <div className="workspace-area">
        {(studio.saveError || studio.error || downloadError || studio.draftWarning || studio.notice) && <div className="feedback-area">
          {studio.saveError && <div className="feedback feedback-error" role="alert"><AlertCircle size={18} /><div><p>{studio.saveError}</p>{studio.saveState === 'conflict' && <p className="feedback-detail">此操作会将服务端设置更新为你当前的草稿。</p>}<button className="text-button" disabled={busy || studio.saveState === 'saving'} onClick={() => void studio.retrySave()}>{studio.saveState === 'conflict' ? '保留当前修改并重新保存' : '重试保存'}</button></div></div>}
          {(studio.error || downloadError) && <div className="feedback feedback-error" role="alert"><AlertCircle size={18} /><p>{downloadError || studio.error}</p><button className="dismiss-button" aria-label="关闭错误提示" onClick={() => { studio.clearError(); setDownloadError(''); }}><X size={16} /></button></div>}
          {studio.draftWarning && <div className="feedback feedback-warning" role="alert"><AlertCircle size={18} /><p>{studio.draftWarning}</p></div>}
          {studio.notice && !studio.saveError && <div className="feedback feedback-info" role="status"><p>{studio.notice}</p></div>}
        </div>}
        {studio.loading ? <main className="workspace-empty" aria-busy="true"><LoaderCircle className="spin" size={30} /><h1>正在打开宠物工作台</h1><p>读取本机照片与已保存的设置…</p></main> : studio.asset && studio.settings ? <Preview asset={studio.asset} crop={studio.settings.crop} result={studio.result} stale={studio.stale} disabled={busy} processing={studio.processing} job={studio.job} onCropChange={crop => studio.changeSettings({ ...studio.settings!, crop })} /> : <main className="workspace-empty"><ImagePlus size={42} /><h1>{studio.error ? '暂时无法打开照片库' : '让可爱，成为专属素材'}</h1><p>{studio.error ? '检查本机服务后，重新加载照片库。' : '上传宠物照片，制作透明抠图与 MoeGo 贴纸。'}</p>{studio.error && <button className="outline-button reload-button" onClick={() => void studio.reload()}><RefreshCw size={16} />重新加载</button>}</main>}
      </div>
      {studio.asset && studio.settings ? <Inspector asset={studio.asset} settings={studio.settings} result={studio.result} stale={studio.stale || studio.dirty} engine={studio.engine} disabled={busy} processing={studio.processing} onChange={studio.changeSettings} onProcess={() => void studio.process()} onDownload={() => void download()} downloading={downloading} /> : <aside className="inspector inspector-placeholder"><h2>制作设置</h2><p>选择一张照片，开始制作。</p></aside>}
    </div>
  </div>;
}
