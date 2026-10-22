import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, PointerEvent } from 'react';
import type { Asset, Crop } from '../types';

type Handle = 'move' | 'nw' | 'ne' | 'se' | 'sw';
type Drag = { handle: Handle; startX: number; startY: number; crop: Crop; pointerId: number };
type Props = { asset: Asset; crop: Crop; active: boolean; disabled: boolean; onChange: (crop: Crop) => void };
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const minimum = .08;

export default function CropEditor({ asset, crop, active, disabled, onChange }: Props) {
  const stage = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const drag = useRef<Drag | null>(null);
  const [size, setSize] = useState({ width: 400, height: 400 });
  const ratio = asset.width / asset.height || 1;

  useEffect(() => {
    if (!stage.current) return;
    const observer = new ResizeObserver(([entry]) => {
      const width = Math.min(entry.contentRect.width, entry.contentRect.height * ratio);
      setSize({ width, height: width / ratio });
    });
    observer.observe(stage.current);
    return () => observer.disconnect();
  }, [ratio]);

  const pointerDown = (event: PointerEvent<HTMLDivElement>, handle: Handle) => {
    if (!active || disabled || !frame.current) return;
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { handle, startX: event.clientX, startY: event.clientY, crop: { ...crop }, pointerId: event.pointerId };
  };

  const pointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!drag.current || !frame.current) return;
    const initial = drag.current;
    const bounds = frame.current.getBoundingClientRect();
    const dx = (event.clientX - initial.startX) / bounds.width;
    const dy = (event.clientY - initial.startY) / bounds.height;
    const start = initial.crop;
    if (initial.handle === 'move') {
      onChange({ ...start, x: clamp(start.x + dx, 0, 1 - start.width), y: clamp(start.y + dy, 0, 1 - start.height) });
      return;
    }
    let left = start.x;
    let top = start.y;
    let right = start.x + start.width;
    let bottom = start.y + start.height;
    if (initial.handle.includes('w')) left = clamp(left + dx, 0, right - minimum);
    if (initial.handle.includes('e')) right = clamp(right + dx, left + minimum, 1);
    if (initial.handle.includes('n')) top = clamp(top + dy, 0, bottom - minimum);
    if (initial.handle.includes('s')) bottom = clamp(bottom + dy, top + minimum, 1);
    onChange({ x: left, y: top, width: right - left, height: bottom - top });
  };

  const adjustValue = (key: keyof Crop, value: number) => {
    if (!Number.isFinite(value)) return;
    const next = { ...crop };
    if (key === 'x') next.x = clamp(value / 100, 0, 1 - crop.width);
    if (key === 'y') next.y = clamp(value / 100, 0, 1 - crop.height);
    if (key === 'width') next.width = clamp(value / 100, minimum, 1 - crop.x);
    if (key === 'height') next.height = clamp(value / 100, minimum, 1 - crop.y);
    onChange(next);
  };

  return <div className="crop-editor">
    <div className="crop-stage" ref={stage}>
      <div className={`image-frame ${active ? 'is-cropping' : ''}`} ref={frame} style={{ width: size.width, height: size.height }}>
        <img className="crop-original" src={asset.original_url} alt={`${asset.name}的原始照片`} draggable={false} />
        {active && <div className="crop-rectangle" style={{ left: `${crop.x * 100}%`, top: `${crop.y * 100}%`, width: `${crop.width * 100}%`, height: `${crop.height * 100}%` } as CSSProperties} onPointerDown={event => pointerDown(event, 'move')} onPointerMove={pointerMove} onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }}>
          <div className="crop-grid" aria-hidden="true"><i /><i /><i /><i /></div>
          {(['nw', 'ne', 'se', 'sw'] as Handle[]).map(handle => <div key={handle} className={`crop-handle handle-${handle}`} onPointerDown={event => pointerDown(event, handle)} aria-hidden="true" />)}
          <span className="crop-tag">保留区域</span>
        </div>}
      </div>
    </div>
    {active && <div className="crop-controls">
      <p>拖动选框移动，拖动四角裁切。也可输入百分比。</p>
      <div className="crop-values">{([['x', '左'], ['y', '上'], ['width', '宽'], ['height', '高']] as const).map(([key, label]) => <label key={key}>{label}<input type="number" min={key === 'x' || key === 'y' ? 0 : 8} max={100} step={1} value={Math.round(crop[key] * 100)} disabled={disabled} onChange={event => adjustValue(key, event.target.valueAsNumber)} aria-label={`裁切${label}百分比`} /><span>%</span></label>)}</div>
    </div>}
  </div>;
}
