"use client";

import { useState } from "react";
import { LineChart } from "@/components/charts/LineChart";
import { fmtDate, OUTCOME_LABEL } from "@/lib/format";
import s from "./Profile.module.css";

export interface EvoPoint {
  date: string; fightId: string; outcome: string | null; opponent: string;
  rating: number; slpm: number; strAcc: number; strDef: number; tdAvg: number; ctrl: number; finish: number; activity: number;
}

const METRICS = [
  { key: "rating", label: "FCR", unit: "puntos", fmt: (v: number) => v.toFixed(1) },
  { key: "slpm", label: "Golpeo", unit: "golpes sig. por minuto (media móvil de 3 combates)", fmt: (v: number) => v.toFixed(2) },
  { key: "strAcc", label: "Precisión", unit: "% precisión de golpeo (media móvil de 3)", fmt: (v: number) => `${Math.round(v)}%` },
  { key: "strDef", label: "Defensa", unit: "% defensa de golpeo (media móvil de 3)", fmt: (v: number) => `${Math.round(v)}%` },
  { key: "tdAvg", label: "Lucha", unit: "derribos por 15 min (media móvil de 3)", fmt: (v: number) => v.toFixed(2) },
  { key: "ctrl", label: "Control", unit: "% del tiempo en control (media móvil de 3)", fmt: (v: number) => `${Math.round(v)}%` },
  { key: "finish", label: "Finalización", unit: "% de victorias por finalización (media móvil de 3)", fmt: (v: number) => `${Math.round(v)}%` },
  { key: "activity", label: "Actividad", unit: "combates en los 24 meses previos", fmt: (v: number) => v.toFixed(0) },
] as const;

export function Evolution({ points, bands, titleDates }: { points: EvoPoint[]; bands: { date: string; lo: number; hi: number }[]; titleDates: { date: string; label: string }[] }) {
  const [metric, setMetric] = useState<(typeof METRICS)[number]["key"]>("rating");
  const m = METRICS.find((x) => x.key === metric)!;
  const pts = points.map((p) => ({
    x: Date.parse(p.date),
    y: p[metric] as number,
    note: `${p.outcome ? OUTCOME_LABEL[p.outcome] : ""} vs ${p.opponent}`,
  }));
  return (
    <div className={s.evo}>
      <div className={s.evoTabs} role="group" aria-label="Métrica de evolución">
        {METRICS.map((x) => (
          <button key={x.key} type="button" aria-pressed={metric === x.key} className={s.evoBtn} onClick={() => setMetric(x.key)}>{x.label}</button>
        ))}
      </div>
      <LineChart
        key={metric}
        series={[{ id: metric, label: m.label, color: "var(--corner-a)", points: pts }]}
        band={metric === "rating" ? bands.map((b) => ({ x: Date.parse(b.date), lo: b.lo, hi: b.hi })) : undefined}
        markers={titleDates.map((t) => ({ x: Date.parse(t.date), label: t.label }))}
        yDomain={metric === "rating" ? [50, 100] : undefined}
        yLabel={m.unit}
        formatX={(x) => fmtDate(new Date(x).toISOString().slice(0, 10))}
        formatY={m.fmt}
        caption={`Evolución de ${m.label.toLowerCase()} tras cada combate`}
      />
    </div>
  );
}
