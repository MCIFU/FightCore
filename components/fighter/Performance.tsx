"use client";

import { useState } from "react";
import { BulletRow } from "@/components/charts/Bars";
import s from "./Profile.module.css";

type Key = "slpm" | "sapm" | "strAcc" | "strDef" | "tdAvg" | "tdAcc" | "tdDef" | "subAvg" | "kdAvg" | "ctrlShare";
type Baseline = Record<Key, number>;

const METRICS: { key: Key; label: string; note: string; pct?: boolean; max: number; better?: "lower"; digits?: number }[] = [
  { key: "slpm", label: "Golpes sig. conectados", note: "por minuto", max: 9 },
  { key: "sapm", label: "Golpes sig. encajados", note: "por minuto · menos es mejor", max: 9, better: "lower" },
  { key: "strAcc", label: "Precisión de golpeo", note: "golpes sig. conectados / intentados", pct: true, max: 1 },
  { key: "strDef", label: "Defensa de golpeo", note: "golpes sig. del rival evitados", pct: true, max: 1 },
  { key: "tdAvg", label: "Derribos", note: "por 15 minutos", max: 6, digits: 2 },
  { key: "tdAcc", label: "Precisión de derribo", note: "derribos conseguidos / intentados", pct: true, max: 1 },
  { key: "tdDef", label: "Defensa de derribo", note: "derribos del rival evitados", pct: true, max: 1 },
  { key: "subAvg", label: "Intentos de sumisión", note: "por 15 minutos", max: 3, digits: 2 },
  { key: "kdAvg", label: "Knockdowns", note: "por 15 minutos", max: 1.5, digits: 2 },
  { key: "ctrlShare", label: "Tiempo de control", note: "% del tiempo de combate", pct: true, max: 0.6 },
];

const BASES = [
  { id: "division", label: "Media de división" },
  { id: "last5", label: "Últimos 5 combates" },
  { id: "opponents", label: "Media de sus rivales" },
] as const;

/**
 * Career outputs with a switchable reference. The bar is the career value; the
 * Ember tick is the chosen baseline. Numbers never appear without that context.
 */
export function Performance({ career, baselines }: { career: Baseline; baselines: Record<(typeof BASES)[number]["id"], Baseline> }) {
  const [base, setBase] = useState<(typeof BASES)[number]["id"]>("division");
  const ref = baselines[base];
  const fmt = (m: (typeof METRICS)[number], v: number) => (m.pct ? `${Math.round(v * 100)}%` : v.toFixed(m.digits ?? 1).replace(".", ","));
  return (
    <div className={s.perf}>
      <fieldset className={s.segmented}>
        <legend className="label">Comparar la carrera con</legend>
        <div className={s.segOptions}>
          {BASES.map((b) => (
            <label key={b.id} className={s.segOption}>
              <input type="radio" name="perf-base" value={b.id} checked={base === b.id} onChange={() => setBase(b.id)} />
              <span>{b.label}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <div className={s.perfLegend} aria-hidden>
        <span><i className={s.lgBar} /> Carrera</span>
        <span><i className={s.lgTick} /> {BASES.find((b) => b.id === base)!.label}</span>
        <span className={s.lgDelta}>Δ = diferencia relativa</span>
      </div>
      <div role="list" aria-label="Métricas de rendimiento">
        {METRICS.map((m) => (
          <div role="listitem" key={m.key}>
            <BulletRow
              label={m.label}
              note={`${m.note} · ref. ${fmt(m, ref[m.key])}`}
              value={career[m.key]}
              display={fmt(m, career[m.key])}
              reference={ref[m.key]}
              refLabel={BASES.find((b) => b.id === base)!.label}
              max={m.max}
              better={m.better ?? "higher"}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
