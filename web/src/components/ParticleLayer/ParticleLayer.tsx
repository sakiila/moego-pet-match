import { useEffect, useRef } from 'react';

export interface Burst {
  key: number;
  /** 以格为单位的中心点。 */
  cells: { r: number; c: number }[];
  /** 每格泡泡数，按强度等级分级；缺省 3。 */
  perCell?: number;
}

interface Bubble {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  born: number;
}

const LIFE_MS = 520;
const PER_CELL = 3;
const MAX_BUBBLES = 160;

/** 泡泡粒子层：盖在棋盘上，不拦截触摸；减少动态效果时不绘制。 */
export function ParticleLayer({ bursts, cellPx, size }: { bursts: Burst[]; cellPx: number; size: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bubbles = useRef<Bubble[]>([]);
  const seen = useRef(new Set<number>());
  const reduced = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    if (reduced) return;
    const now = performance.now();
    for (const burst of bursts) {
      if (seen.current.has(burst.key)) continue;
      seen.current.add(burst.key);
      for (const cell of burst.cells) {
        for (let i = 0; i < (burst.perCell ?? PER_CELL) && bubbles.current.length < MAX_BUBBLES; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = 0.04 + Math.random() * 0.08;
          bubbles.current.push({
            x: (cell.c + 0.5) * cellPx,
            y: (cell.r + 0.5) * cellPx,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 0.05,
            r: cellPx * (0.06 + Math.random() * 0.08),
            born: now,
          });
        }
      }
    }
  }, [bursts, cellPx, reduced]);

  useEffect(() => {
    if (reduced) return;
    let raf = 0;
    const draw = () => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (canvas && ctx) {
        const dpr = window.devicePixelRatio || 1;
        const px = cellPx * size;
        if (canvas.width !== Math.round(px * dpr)) {
          canvas.width = Math.round(px * dpr);
          canvas.height = Math.round(px * dpr);
        }
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, px, px);
        const now = performance.now();
        bubbles.current = bubbles.current.filter((b) => now - b.born < LIFE_MS);
        for (const b of bubbles.current) {
          const t = (now - b.born) / LIFE_MS;
          const dt = now - b.born;
          ctx.globalAlpha = 1 - t;
          ctx.beginPath();
          ctx.arc(b.x + b.vx * dt, b.y + b.vy * dt, b.r * (0.6 + t * 0.6), 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255,255,255,0.85)';
          ctx.strokeStyle = 'rgba(74,143,224,0.7)';
          ctx.lineWidth = 1.5;
          ctx.fill();
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [cellPx, size, reduced]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 3 }}
    />
  );
}
