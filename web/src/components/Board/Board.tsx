import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import { TIMING, type Move, type Pos } from '../../engine';
import { INPUT, resolveDrag, resolveTap } from '../../game/input';
import type { PetInfo } from '../../game/pets';
import type { Frame, Popup, Sweep } from '../../game/playback';
import { useI18n } from '../../i18n';
import { ParticleLayer, type Burst } from '../ParticleLayer/ParticleLayer';
import { PetTile } from '../PetTile/PetTile';
import { ToolPiece } from '../ToolPiece/ToolPiece';
import styles from './Board.module.css';

export interface BoardProps {
  frame: Frame;
  /** kind 下标 → 宠物。 */
  pets: PetInfo[];
  interactive: boolean;
  hint?: Move | null;
  popups?: Popup[];
  /** 手势指向相邻目标但未触发时的直接范围预览。 */
  getPreview?: (from: Pos, to: Pos) => Pos[] | null;
  /** 尝试交换；返回是否被受理。 */
  onSwap?: (from: Pos, to: Pos) => boolean;
  onDraggingChange?: (dragging: boolean) => void;
  /** 陈列页用：固定显示的选中格与预览。 */
  staticSelected?: Pos | null;
  staticPreview?: Pos[] | null;
}

interface Drag {
  pointerId: number;
  origin: Pos;
  x: number;
  y: number;
  moved: boolean;
  consumed: boolean;
}

const same = (a: Pos | null | undefined, b: Pos) => !!a && a.r === b.r && a.c === b.c;

function sweepRects(s: Sweep, size: number): { r0: number; c0: number; rows: number; cols: number }[] {
  const row = (r: number) => ({ r0: r, c0: 0, rows: 1, cols: size });
  const col = (c: number) => ({ r0: 0, c0: c, rows: size, cols: 1 });
  if (s.kind === 'tool') {
    if (s.tool === 'combH') return [row(s.at.r)];
    if (s.tool === 'combV') return [col(s.at.c)];
    return [row(s.at.r), col(s.at.c)];
  }
  const combs = s.tools.filter((t) => t !== 'scissors').length;
  if (combs === 2) return [row(s.center.r), col(s.center.c)];
  if (combs === 0) return [{ r0: 0, c0: 0, rows: size, cols: size }];
  const r0 = Math.max(0, s.center.r - 1);
  const c0 = Math.max(0, s.center.c - 1);
  return [
    { r0, c0: 0, rows: Math.min(size, s.center.r + 2) - r0, cols: size },
    { r0: 0, c0, rows: size, cols: Math.min(size, s.center.c + 2) - c0 },
  ];
}

export function Board({
  frame,
  pets,
  interactive,
  hint,
  popups = [],
  getPreview,
  onSwap,
  onDraggingChange,
  staticSelected,
  staticPreview,
}: BoardProps) {
  const { t } = useI18n();
  const size = frame.board.length;
  const boardRef = useRef<HTMLDivElement>(null);
  const [cellPx, setCellPx] = useState(48);
  const [selected, setSelected] = useState<Pos | null>(null);
  const [aim, setAim] = useState<{ target: Pos; preview: Pos[] | null } | null>(null);
  const drag = useRef<Drag | null>(null);

  useLayoutEffect(() => {
    const el = boardRef.current;
    if (!el) return;
    const update = () => setCellPx(el.clientWidth / size);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [size]);

  // 交换、下落或洗牌后不保留旧格子的选中状态
  useEffect(() => {
    setSelected(null);
    setAim(null);
  }, [frame.board]);

  const stable = interactive && !frame.busy;

  const cellAt = (e: PointerEvent): Pos | null => {
    const rect = boardRef.current!.getBoundingClientRect();
    const c = Math.floor(((e.clientX - rect.left) / rect.width) * size);
    const r = Math.floor(((e.clientY - rect.top) / rect.height) * size);
    return r >= 0 && r < size && c >= 0 && c < size ? { r, c } : null;
  };

  const endDrag = () => {
    if (drag.current?.moved) onDraggingChange?.(false);
    drag.current = null;
    setAim(null);
  };

  const onPointerDown = (e: PointerEvent) => {
    if (!interactive) return;
    const cell = cellAt(e);
    if (!cell) return;
    try {
      boardRef.current?.setPointerCapture(e.pointerId);
    } catch {
      // 指针已失效时不捕获，手势仍按棋盘上的事件处理
    }
    drag.current = { pointerId: e.pointerId, origin: cell, x: e.clientX, y: e.clientY, moved: false, consumed: false };
  };

  const onPointerMove = (e: PointerEvent) => {
    const d = drag.current;
    if (!d || d.pointerId !== e.pointerId || d.consumed) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (!d.moved && Math.max(Math.abs(dx), Math.abs(dy)) >= INPUT.tapSlopPx) {
      d.moved = true;
      setSelected(null); // 拖拽开始时清掉旧点选
      onDraggingChange?.(true);
    }
    if (!d.moved) return;
    const { stage, target } = resolveDrag(d.origin, dx, dy, cellPx, size);
    if (stage === 'trigger' && target) {
      // 一次手势只尝试一次交换；忙碌或到时被拒绝则取消本次手势
      d.consumed = true;
      setAim(null);
      onSwap?.(d.origin, target);
      return;
    }
    if (stage === 'aim' && target && !frame.busy) {
      if (!aim || !same(aim.target, target)) setAim({ target, preview: getPreview?.(d.origin, target) ?? null });
    } else if (aim) {
      setAim(null);
    }
  };

  const onPointerUp = (e: PointerEvent) => {
    const d = drag.current;
    if (!d || d.pointerId !== e.pointerId) return;
    if (!d.moved) {
      const cell = cellAt(e) ?? d.origin;
      const tap = resolveTap(selected, cell);
      if (tap.kind === 'select') setSelected(tap.selected);
      else if (tap.kind === 'deselect') setSelected(null);
      else {
        setSelected(null);
        onSwap?.(tap.from, tap.to);
      }
    }
    endDrag();
  };

  const active = drag.current?.moved ? drag.current.origin : (staticSelected ?? selected);
  const preview = staticPreview ?? (stable ? aim?.preview : null);
  const showHint = stable && hint && !aim && !selected;

  const bursts = useMemo<Burst[]>(() => {
    if (frame.phase !== 'clear' || frame.clearing.size === 0) return [];
    const cells: Pos[] = [];
    frame.board.forEach((row, r) => row.forEach((p, c) => p && frame.clearing.has(p.id) && cells.push({ r, c })));
    return [{ key: Math.min(...frame.clearing), cells }];
  }, [frame]);

  const style = {
    '--cell': `${cellPx}px`,
    '--move-ms': `${frame.moveMs}ms`,
    '--fall-ms': `${TIMING.fallMs}ms`,
    '--clear-ms': `${frame.clearMs}ms`,
  } as CSSProperties;

  return (
    <div className={styles.frame}>
      <div
        ref={boardRef}
        className={styles.board}
        style={style}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={endDrag}
        data-testid="board"
        data-busy={frame.busy || undefined}
      >
        {frame.board.flatMap((row, r) =>
          row.map((piece, c) => {
            if (!piece) return null;
            const pos = { r, c };
            const classes = [styles.piece];
            if (same(active, pos)) classes.push(styles.selected);
            if (aim && same(aim.target, pos)) classes.push(styles.target);
            if (frame.clearing.has(piece.id)) classes.push(styles.clearing);
            if (frame.spawnedIds.has(piece.id)) classes.push(styles.spawn);
            const drop = frame.dropRows.get(piece.id);
            if (drop) classes.push(styles.drop);
            if (showHint && same(hint.from, pos)) classes.push(styles.hintFrom);
            if (showHint && same(hint.to, pos)) classes.push(styles.hintTo);
            const pieceStyle = {
              transform: `translate(${c * cellPx}px, ${r * cellPx}px)`,
              '--drop': drop ?? 0,
              '--hint-dx': showHint ? hint.to.c - hint.from.c : 0,
              '--hint-dy': showHint ? hint.to.r - hint.from.r : 0,
            } as CSSProperties;
            return (
              <div key={piece.id} className={classes.join(' ')} style={pieceStyle} data-r={r} data-c={c}>
                <div className={styles.inner}>
                  {piece.type === 'pet' ? (
                    <PetTile pet={pets[piece.kind]} tint={piece.kind} size={cellPx} />
                  ) : (
                    <ToolPiece tool={piece.tool} />
                  )}
                </div>
              </div>
            );
          }),
        )}

        <div className={styles.overlay} aria-hidden>
          {preview?.map((p) => (
            <div
              key={`${p.r},${p.c}`}
              className={styles.previewCell}
              style={{ transform: `translate(${p.c * cellPx}px, ${p.r * cellPx}px)` }}
              data-preview
            />
          ))}
          {frame.phase === 'clear' &&
            frame.sweeps.flatMap((s, i) =>
              sweepRects(s, size).map((rect, j) => (
                <div
                  key={`${i}-${j}`}
                  className={`${styles.sweep} ${rect.rows > rect.cols ? styles.sweepCol : ''}`}
                  style={{
                    left: rect.c0 * cellPx,
                    top: rect.r0 * cellPx,
                    width: rect.cols * cellPx,
                    height: rect.rows * cellPx,
                  }}
                />
              )),
            )}
        </div>

        <ParticleLayer bursts={bursts} cellPx={cellPx} size={size} />

        {popups.map((p) => (
          <div
            key={p.key}
            className={styles.popup}
            style={{
              left: Math.min(Math.max((p.at.c + 0.5) * cellPx, cellPx), (size - 1) * cellPx),
              top: Math.min(Math.max((p.at.r + 0.5) * cellPx, cellPx * 0.9), (size - 0.9) * cellPx),
            }}
            data-popup
          >
            <span className={styles.popupScore}>{t('board.wave_score', { waveScore: p.score })}</span>
            {p.chain >= 2 && <span className={styles.popupChain}>{t('board.chain', { chain: p.chain })}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
