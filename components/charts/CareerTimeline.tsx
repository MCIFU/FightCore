"use client";

import { useState } from "react";
import { fmtDate, METHOD_SHORT, OUTCOME_LABEL } from "@/lib/format";
import s from "./CareerTimeline.module.css";
import { useWidth } from "./useWidth";

export interface TimelineBout {
  fightId: string;
  date: string;
  outcome: "W" | "L" | "D" | "NC" | null;
  opponent: string;
  method: string | null;
  round: number | null;
  org: string;
  event: string;
  title: boolean;
  /** 0–100 opponent strength at the time. */
  oppStrength: number;
  ratingAfter: number | null;
}

/**
 * Career timeline. Wins rise above the axis, losses drop below; stem length is
 * opponent strength, so "big wins" literally stand out. Organisation periods
 * run along the axis. Every bout is a focusable link to its fight page.
 */
export function CareerTimeline({ bouts, titleWins }: { bouts: TimelineBout[]; titleWins: string[] }) {
  const [active, setActive] = useState<number | null>(null);
  const [boxRef, boxW] = useWidth<HTMLDivElement>(900);
  if (!bouts.length) return null;
  const W = Math.max(boxW, bouts.length * 34);
  const H = 290;
  const axis = 142;
  const t0 = Date.parse(bouts[0].date) - 120 * 86400000;
  const t1 = Date.parse(bouts[bouts.length - 1].date) + 120 * 86400000;
  const x = (d: string) => 30 + ((Date.parse(d) - t0) / (t1 - t0)) * (W - 60);
  const stem = (str: number) => 22 + (str / 100) * 92;

  // Organisation periods.
  const periods: { org: string; from: string; to: string }[] = [];
  for (const b of bouts) {
    const last = periods[periods.length - 1];
    if (last && last.org === b.org) last.to = b.date;
    else periods.push({ org: b.org, from: b.date, to: b.date });
  }
  const years: number[] = [];
  for (let y = new Date(t0).getUTCFullYear() + 1; y <= new Date(t1).getUTCFullYear(); y++) years.push(y);

  const a = active !== null ? bouts[active] : null;
  return (
    <div className={s.wrap}>
      <div className={s.scroller} ref={boxRef}>
        <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} className={s.svg} aria-label={`Línea de carrera con ${bouts.length} combates. Victorias por encima del eje, derrotas por debajo; la altura indica la fuerza del rival.`} role="group">
          {years.map((y) => {
            const xx = x(`${y}-01-01`);
            return (
              <g key={y}>
                <line x1={xx} x2={xx} y1={22} y2={H - 6} className={s.yearLine} />
                <text x={xx + 4} y={12} className={s.year}>{y}</text>
              </g>
            );
          })}
          {periods.map((p, i) => (
            <g key={`${p.org}-${p.from}`}>
              <rect x={x(p.from) - 8} y={axis - 3} width={Math.max(16, x(p.to) - x(p.from) + 16)} height={6} className={i % 2 ? s.periodAlt : s.period} />
              <text x={x(p.from) - 8} y={axis + 20} className={s.periodLabel}>{p.org}</text>
            </g>
          ))}
          {bouts.map((b, i) => {
            const xx = x(b.date);
            const up = b.outcome === "W";
            const flat = b.outcome === "D" || b.outcome === "NC";
            const len = flat ? 12 : stem(b.oppStrength);
            const y2 = up ? axis - len : axis + len;
            const isTitleWin = titleWins.includes(b.fightId);
            return (
              <a
                key={b.fightId}
                href={`/fights/${b.fightId}`}
                className={s.bout}
                onMouseEnter={() => setActive(i)}
                onMouseLeave={() => setActive(null)}
                onFocus={() => setActive(i)}
                onBlur={() => setActive(null)}
                aria-label={`${fmtDate(b.date)}: ${b.outcome ? OUTCOME_LABEL[b.outcome] : "Programado"} contra ${b.opponent}, ${b.method ?? ""}${b.round ? ` en el round ${b.round}` : ""}, ${b.event}${b.title ? ", combate por el título" : ""}`}
              >
                <line x1={xx} x2={xx} y1={axis} y2={y2} className={up ? s.stemW : s.stemL} />
                <rect x={xx - 6} y={y2 - 6} width={12} height={12} className={`${s.mark} ${s[`m_${b.outcome ?? "NC"}`]} ${active === i ? s.markActive : ""}`} />
                {b.title && <rect x={xx - 10} y={y2 - 10} width={20} height={20} className={isTitleWin ? s.titleRingWin : s.titleRing} />}
                <rect x={xx - 14} y={22} width={28} height={H - 28} className={s.hit} />
              </a>
            );
          })}
          <line x1={10} x2={W - 10} y1={axis} y2={axis} className={s.axis} />
        </svg>
      </div>
      <div className={s.readout} aria-live="polite">
        {a ? (
          <>
            <span className={`${s.readOutcome} ${s[`r_${a.outcome}`]}`}>{a.outcome ? OUTCOME_LABEL[a.outcome] : "—"}</span>
            <span className={s.readMain}>vs {a.opponent}</span>
            <span className={s.readMeta}>{a.method ? METHOD_SHORT[a.method] : ""}{a.round ? ` · R${a.round}` : ""} · {fmtDate(a.date)} · {a.event}</span>
            <span className={s.readMeta}>Fuerza del rival {a.oppStrength}/100{a.ratingAfter !== null ? ` · FCR después ${a.ratingAfter.toFixed(1)}` : ""}{a.title ? " · Combate por el título" : ""}</span>
          </>
        ) : (
          <span className={s.readHint}>Pasa el cursor o recorre con Tab los combates. Altura = fuerza del rival. Recuadro = combate por el título.</span>
        )}
      </div>
    </div>
  );
}
