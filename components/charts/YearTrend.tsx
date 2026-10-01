"use client";

import { LineChart } from "./LineChart";

/** Finish-method shares by year (client wrapper so LineChart can format years). */
export function YearTrend({ rows }: { rows: { year: number; ko: number; sub: number; dec: number; n: number }[] }) {
  const x = (y: number) => Date.UTC(y, 6, 1);
  return (
    <LineChart
      series={[
        { id: "ko", label: "KO/TKO", color: "var(--corner-a)", points: rows.map((r) => ({ x: x(r.year), y: r.ko * 100, note: `${r.n} combates` })) },
        { id: "sub", label: "Sumisión", color: "var(--corner-b)", points: rows.map((r) => ({ x: x(r.year), y: r.sub * 100 })) },
        { id: "dec", label: "Decisión", color: "var(--corner-c)", points: rows.map((r) => ({ x: x(r.year), y: r.dec * 100 })) },
      ]}
      yDomain={[0, 80]}
      yLabel="% de los combates del año"
      formatX={(v) => String(new Date(v).getUTCFullYear())}
      formatY={(v) => `${Math.round(v)}%`}
      caption="Reparto de métodos de resultado por año"
    />
  );
}
