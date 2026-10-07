"use client";

import { useId, useMemo, useRef, useState } from "react";
import s from "./LineChart.module.css";
import { useWidth } from "./useWidth";

export interface Series {
  id: string;
  label: string;
  /** CSS colour token, e.g. var(--corner-a). */
  color: string;
  points: { x: number; y: number; label?: string; note?: string }[];
}

interface Props {
  series: Series[];
  height?: number;
  yDomain?: [number, number];
  yLabel: string;
  formatX: (x: number) => string;
  formatY?: (y: number) => string;
  caption: string;
  /** Optional horizontal band per series (e.g. uncertainty) — drawn for the first series only. */
  band?: { x: number; lo: number; hi: number }[];
  markers?: { x: number; label: string }[];
}


/**
 * Line chart with crosshair tooltip, keyboard stepping and a data-table fallback.
 * One y-axis only. Direct labels at line ends for ≤4 series.
 */
export function LineChart({ series, height = 280, yDomain, yLabel, formatX, formatY = (y) => y.toFixed(1), caption, band, markers }: Props) {
  const id = useId();
  const svgRef = useRef<SVGSVGElement>(null);
  const [hover, setHover] = useState<number | null>(null);
  const [showTable, setShowTable] = useState(false);
  const [plotRef, W] = useWidth<HTMLDivElement>();
  const narrow = W < 560;
  const pad = { t: 16, r: narrow ? 56 : 110, b: 28, l: 36 };
  const H = height;

  const all = series.flatMap((s) => s.points);
  const xs = [...new Set(all.map((p) => p.x))].sort((a, b) => a - b);
  const xMin = xs[0] ?? 0, xMax = xs[xs.length - 1] ?? 1;
  const [yMin, yMax] = useMemo(() => {
    if (yDomain) return yDomain;
    const ys = all.map((p) => p.y);
    const lo = Math.min(...ys), hi = Math.max(...ys);
    const padY = (hi - lo) * 0.12 || 5;
    return [Math.floor((lo - padY) / 5) * 5, Math.ceil((hi + padY) / 5) * 5];
  }, [all, yDomain]);

  const sx = (x: number) => pad.l + ((x - xMin) / Math.max(1, xMax - xMin)) * (W - pad.l - pad.r);
  const sy = (y: number) => pad.t + (1 - (y - yMin) / (yMax - yMin)) * (H - pad.t - pad.b);
  // Round tick values (1, 2, 2.5 or 5 × 10ⁿ), about five of them.
  const ticks = useMemo(() => {
    const raw = (yMax - yMin) / 4;
    const mag = 10 ** Math.floor(Math.log10(raw || 1));
    const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((x) => x >= raw * 0.8) ?? raw;
    const out: number[] = [];
    for (let v = Math.ceil(yMin / step - 1e-9) * step; v <= yMax + 1e-9; v += step) out.push(Math.round(v * 1000) / 1000);
    return out;
  }, [yMin, yMax]);
  const years = useMemo(() => {
    const out: number[] = [];
    const y0 = new Date(xMin).getUTCFullYear(), y1 = new Date(xMax).getUTCFullYear();
    const step = Math.max(1, Math.ceil((y1 - y0 + 1) / 7));
    for (let y = y0 + 1; y <= y1; y += step) out.push(Date.UTC(y, 0, 1));
    return out;
  }, [xMin, xMax]);

  const path = (pts: Series["points"]) => pts.map((p, i) => `${i ? "L" : "M"}${sx(p.x).toFixed(1)},${sy(p.y).toFixed(1)}`).join("");

  const onMove = (e: React.PointerEvent) => {
    const r = svgRef.current!.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * W;
    let best = 0, bd = Infinity;
    xs.forEach((v, i) => { const d = Math.abs(sx(v) - x); if (d < bd) { bd = d; best = i; } });
    setHover(best);
  };
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") { e.preventDefault(); setHover((h) => Math.min(xs.length - 1, (h ?? -1) + 1)); }
    if (e.key === "ArrowLeft") { e.preventDefault(); setHover((h) => Math.max(0, (h ?? xs.length) - 1)); }
    if (e.key === "Escape") setHover(null);
  };

  const hx = hover !== null ? xs[hover] : null;
  const hoverPts = hx !== null ? series.map((s) => ({ s, p: s.points.find((p) => p.x === hx) })).filter((x) => x.p) : [];
  const tipLeft = hx !== null ? (sx(hx) / W) * 100 : 0;

  // Direct labels: last point per series, nudged apart to avoid collisions.
  const ends = series.map((s) => ({ s, p: s.points[s.points.length - 1] })).filter((e) => e.p)
    .map((e) => ({ ...e, y: sy(e.p.y) })).sort((a, b) => a.y - b.y);
  for (let i = 1; i < ends.length; i++) if (ends[i].y - ends[i - 1].y < 16) ends[i].y = ends[i - 1].y + 16;

  return (
    <figure className={s.fig}>
      <div className={s.plot} ref={plotRef}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          width={W}
          height={H}
          className={s.svg}
          role="img"
          aria-labelledby={`${id}-cap`}
          tabIndex={0}
          onPointerMove={onMove}
          onPointerLeave={() => setHover(null)}
          onKeyDown={onKey}
          onBlur={() => setHover(null)}
        >
          {ticks.map((t) => (
            <g key={t}>
              <line x1={pad.l} x2={W - pad.r} y1={sy(t)} y2={sy(t)} className={s.grid} />
              <text x={pad.l - 8} y={sy(t)} className={s.tick} textAnchor="end" dominantBaseline="middle">{Math.round(t)}</text>
            </g>
          ))}
          {years.map((y) => (
            <text key={y} x={sx(y)} y={H - 8} className={s.tick} textAnchor="middle">{new Date(y).getUTCFullYear()}</text>
          ))}
          {markers?.map((m) => (
            <g key={`${m.x}-${m.label}`}>
              <line x1={sx(m.x)} x2={sx(m.x)} y1={pad.t} y2={H - pad.b} className={s.marker} />
              {!narrow && <text x={sx(m.x) + 4} y={pad.t + 8} className={s.markerText}>{m.label}</text>}
            </g>
          ))}
          {band && band.length > 1 && (
            <path
              className={s.band}
              d={`${band.map((b, i) => `${i ? "L" : "M"}${sx(b.x)},${sy(b.hi)}`).join("")}${[...band].reverse().map((b) => `L${sx(b.x)},${sy(b.lo)}`).join("")}Z`}
            />
          )}
          {series.map((se) => (
            <g key={se.id}>
              <path d={path(se.points)} className={s.line} style={{ stroke: se.color }} />
              {se.points.length < 40 && se.points.map((p) => (
                <circle key={p.x} cx={sx(p.x)} cy={sy(p.y)} r={3} className={s.dot} style={{ fill: se.color }} />
              ))}
            </g>
          ))}
          {ends.map((e) => (
            <text key={e.s.id} x={W - pad.r + 10} y={e.y} className={s.endLabel} dominantBaseline="middle">
              <tspan className={s.endValue}>{formatY(e.p.y)}</tspan>
              {series.length > 1 && !narrow && <tspan dx="6" className={s.endName}>{e.s.label.split(" ").slice(-1)[0]}</tspan>}
            </text>
          ))}
          {hx !== null && (
            <g>
              <line x1={sx(hx)} x2={sx(hx)} y1={pad.t} y2={H - pad.b} className={s.cross} />
              {hoverPts.map(({ s: se, p }) => (
                <circle key={se.id} cx={sx(hx)} cy={sy(p!.y)} r={6} className={s.hoverDot} style={{ fill: se.color }} />
              ))}
            </g>
          )}
        </svg>
        {hx !== null && (
          <div className={s.tip} style={{ left: `${tipLeft}%`, transform: `translateX(${tipLeft > 60 ? "calc(-100% - 12px)" : "12px"})` }} role="status" aria-live="polite">
            <p className={s.tipDate}>{formatX(hx)}</p>
            {hoverPts.map(({ s: se, p }) => (
              <p key={se.id} className={s.tipRow}>
                <span className={s.swatch} style={{ background: se.color }} aria-hidden />
                <span className={s.tipName}>{se.label}</span>
                <strong>{formatY(p!.y)}</strong>
              </p>
            ))}
            {hoverPts[0]?.p?.note && <p className={s.tipNote}>{hoverPts[0].p.note}</p>}
          </div>
        )}
      </div>
      <figcaption id={`${id}-cap`} className={s.cap}>
        <span>{caption}. Eje vertical: {yLabel}. Usa ← → para recorrer los puntos.</span>
        <button type="button" className={s.tableBtn} aria-expanded={showTable} onClick={() => setShowTable((v) => !v)}>
          {showTable ? "Ocultar tabla" : "Ver como tabla"}
        </button>
      </figcaption>
      {series.length > 1 && (
        <ul className={s.legend} aria-label="Leyenda">
          {series.map((se) => <li key={se.id}><span className={s.swatch} style={{ background: se.color }} aria-hidden />{se.label}</li>)}
        </ul>
      )}
      {showTable && (
        <div className={s.tableWrap}>
          <table className={s.table}>
            <caption className="visually-hidden">{caption}</caption>
            <thead><tr><th scope="col">Fecha</th>{series.map((se) => <th key={se.id} scope="col">{se.label}</th>)}</tr></thead>
            <tbody>
              {xs.map((x) => (
                <tr key={x}>
                  <th scope="row">{formatX(x)}</th>
                  {series.map((se) => { const p = se.points.find((q) => q.x === x); return <td key={se.id}>{p ? formatY(p.y) : "—"}</td>; })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </figure>
  );
}
