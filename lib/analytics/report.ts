/**
 * Written scouting report: a short reading of a fighter built only from
 * explicit rules over covered data. Every sentence states its numbers, and a
 * line only appears when the sample supports it.
 *
 * Two depths:
 *  · with box scores (≥3 bouts with stats): output compared with the division;
 *  · results only (other organisations): record, finishes, rivals and trend.
 */
import type { CareerStats } from "./career";

type Baseline = Pick<CareerStats, "slpm" | "sapm" | "strAcc" | "strDef" | "tdAvg" | "tdAcc" | "tdDef" | "subAvg" | "kdAvg" | "ctrlShare" | "finishRate">;

export interface ReportPoint {
  label: string;
  /** The fighter's value, formatted. */
  value: string;
  /** The division mean, formatted (null for results-based points). */
  ref: string | null;
  note: string;
}

export interface ScoutingReport {
  depth: "stats" | "results";
  /** Two to four sentences. */
  summary: string[];
  strengths: ReportPoint[];
  weaknesses: ReportPoint[];
  /** "Cómo gana" / "Cómo pierde" in words. */
  wins: string | null;
  losses: string | null;
  sample: { bouts: number; statBouts: number };
}

export interface ReportInput {
  name: string;
  lastName: string;
  division: string;
  stats: CareerStats;
  division_: Baseline | null;
  /** Rating factors, 0–100. */
  opponentQuality: number;
  ratingTrend: number | null;
  rank: number | null;
  divisionSize: number;
  daysSinceLast: number | null;
  styleLabel: string | null;
  statOrgs: string[];
  resultOnlyOrgs: string[];
}

const pct = (v: number) => `${Math.round(v * 100)} %`;
const num = (v: number) => v.toLocaleString("es-ES", { maximumFractionDigits: 1, minimumFractionDigits: 1 });

interface Metric {
  key: keyof Baseline;
  label: string;
  fmt: (v: number) => string;
  /** Higher is better? */
  up: boolean;
  /** Minimum gap to say anything: relative for rates, absolute for shares. */
  gap: number;
  kind: "rel" | "abs";
  good: string;
  bad: string;
  /** Label when it is a strength, if it reads differently. */
  goodLabel?: string;
}

const METRICS: Metric[] = [
  { key: "slpm", label: "Volumen de golpeo", fmt: (v) => `${num(v)}/min`, up: true, gap: 0.2, kind: "rel", good: "Conecta más golpes significativos por minuto que la media", bad: "Conecta pocos golpes significativos por minuto" },
  { key: "strAcc", label: "Precisión de golpeo", fmt: pct, up: true, gap: 0.05, kind: "abs", good: "Golpea con más precisión que la media", bad: "Precisión de golpeo baja" },
  { key: "sapm", label: "Golpes encajados", goodLabel: "Pocos golpes encajados", fmt: (v) => `${num(v)}/min`, up: false, gap: 0.2, kind: "rel", good: "Encaja menos golpes por minuto que la media", bad: "Encaja más golpes por minuto que la media" },
  { key: "strDef", label: "Defensa de golpeo", fmt: pct, up: true, gap: 0.05, kind: "abs", good: "Evita más golpes que la media", bad: "Evita menos golpes que la media" },
  { key: "tdAvg", label: "Derribos", fmt: (v) => `${num(v)}/15 min`, up: true, gap: 0.5, kind: "rel", good: "Derriba mucho más que la media", bad: "Apenas busca el derribo" },
  { key: "tdDef", label: "Defensa de derribo", fmt: pct, up: true, gap: 0.1, kind: "abs", good: "Muy difícil de llevar al suelo", bad: "Le derriban con facilidad" },
  { key: "ctrlShare", label: "Control", fmt: pct, up: true, gap: 0.08, kind: "abs", good: "Controla una parte grande del tiempo de combate", bad: "Apenas controla posiciones" },
  { key: "subAvg", label: "Amenaza de sumisión", fmt: (v) => `${num(v)}/15 min`, up: true, gap: 0.6, kind: "rel", good: "Intenta sumisiones con frecuencia", bad: "" },
  { key: "kdAvg", label: "Pegada", fmt: (v) => `${num(v)}/15 min`, up: true, gap: 0.5, kind: "rel", good: "Derriba rivales de un golpe más a menudo que la media", bad: "" },
];

/** "a, b y c" */
const list = (xs: string[]) => (xs.length < 2 ? xs.join("") : `${xs.slice(0, -1).join(", ")} y ${xs.at(-1)}`);

const methodWord = { ko: "KO/TKO", sub: "sumisión", dec: "decisión" } as const;

function split(m: CareerStats["winsBy"], total: number) {
  if (!total) return null;
  const parts = (Object.keys(m) as (keyof typeof m)[]).filter((k) => m[k] > 0).sort((a, b) => m[b] - m[a]);
  return parts.map((k) => `${m[k]} por ${methodWord[k]} (${Math.round((m[k] / total) * 100)} %)`).join(", ");
}

export function scoutingReport(i: ReportInput): ScoutingReport {
  const st = i.stats;
  const r = st.record;
  const decided = r.w + r.l + r.d;
  const depth: ScoutingReport["depth"] = st.statBouts >= 3 && i.division_ ? "stats" : "results";
  const summary: string[] = [];
  const strengths: ReportPoint[] = [];
  const weaknesses: ReportPoint[] = [];

  // 1 · Identity and results.
  if (decided) {
    const winPct = r.w / decided;
    const fin = r.w ? (st.winsBy.ko + st.winsBy.sub) / r.w : 0;
    const main = st.winsBy.ko >= st.winsBy.sub ? "ko" : "sub";
    summary.push(
      `${i.name}${i.styleLabel ? `, ${i.styleLabel.toLowerCase()} del ${i.division.toLowerCase()},` : ""} gana el ${pct(winPct)} de sus ${decided} combates en cobertura`
      + (r.w ? `, el ${pct(fin)} antes del límite${fin > 0 && st.winsBy[main] > 0 ? ` (sobre todo por ${methodWord[main]})` : ""}.` : "."),
    );
  }

  // 2 · Level of opposition and position.
  const oq = i.opponentQuality;
  const level = oq >= 65 ? "alto" : oq >= 45 ? "medio-alto" : oq >= 30 ? "medio" : "bajo";
  summary.push(
    `El nivel medio de sus rivales es ${level} (${Math.round(oq)}/100 en el FCR)`
    + (i.rank ? ` y hoy es el nº ${i.rank} de ${i.divisionSize} en los FC Rankings de su división.` : "."),
  );

  // 3 · Output against the division.
  if (depth === "stats" && i.division_) {
    const scored = METRICS.map((m) => {
      const v = st[m.key] as number, ref = i.division_![m.key] as number;
      const d = m.kind === "rel" ? (ref > 0 ? (v - ref) / ref : 0) : v - ref;
      const signed = m.up ? d : -d;
      return { m, v, ref, score: signed / m.gap };
    });
    for (const x of scored.filter((x) => x.score >= 1).sort((a, b) => b.score - a.score).slice(0, 3)) {
      strengths.push({ label: x.m.goodLabel ?? x.m.label, value: x.m.fmt(x.v), ref: x.m.fmt(x.ref), note: x.m.good });
    }
    for (const x of scored.filter((x) => x.score <= -1 && x.m.bad).sort((a, b) => a.score - b.score).slice(0, 3)) {
      weaknesses.push({ label: x.m.label, value: x.m.fmt(x.v), ref: x.m.fmt(x.ref), note: x.m.bad });
    }
    if (strengths[0]) summary.push(`Frente a la media de su división destaca en ${list(strengths.map((s) => s.label.toLowerCase()))}${weaknesses[0] ? `; su punto flojo relativo es ${weaknesses[0].label.toLowerCase()}` : ""}.`);
    else if (weaknesses[0]) summary.push(`Sus números están cerca de la media de la división; el aspecto más flojo es ${weaknesses[0].label.toLowerCase()}.`);
    else summary.push("Sus números de golpeo y lucha están cerca de la media de su división en todo: perfil sin extremos.");
  }

  // 4 · Results-based points (everybody).
  const losses = r.l;
  if (st.lossesBy.ko >= 2 && decided >= 6 && st.lossesBy.ko / decided >= 0.15) {
    weaknesses.push({ label: "Durabilidad", value: `${st.lossesBy.ko} KO/TKO en contra`, ref: null, note: `Ha perdido por KO/TKO en ${pct(st.lossesBy.ko / decided)} de sus combates.` });
  } else if (decided >= 8 && st.lossesBy.ko === 0) {
    strengths.push({ label: "Durabilidad", value: "0 KO/TKO en contra", ref: null, note: `Nunca le han noqueado en ${decided} combates en cobertura.` });
  }
  if (r.w >= 5 && st.finishRate >= 0.7) strengths.push({ label: "Finalizador", value: pct(st.finishRate), ref: null, note: "De cada diez victorias, siete o más llegan antes del límite." });
  if (st.longestWinStreak >= 5) strengths.push({ label: "Racha", value: `${st.longestWinStreak} seguidas`, ref: null, note: "Su mejor racha de victorias en cobertura." });
  if (oq >= 60 && r.w > losses) strengths.push({ label: "Nivel de rivales", value: `${Math.round(oq)}/100`, ref: null, note: "Gana más de lo que pierde contra rivales de nivel alto." });
  if (oq < 30 && decided >= 4) weaknesses.push({ label: "Nivel de rivales", value: `${Math.round(oq)}/100`, ref: null, note: "Aún no se ha medido a rivales fuertes: el récord pesa menos." });

  // 5 · Trend and activity.
  const trend = i.ratingTrend;
  const bits: string[] = [];
  if (trend !== null && Math.abs(trend) >= 1.5) bits.push(`su rating ${trend > 0 ? "sube" : "baja"} ${num(Math.abs(trend))} puntos en sus tres últimos combates`);
  if (st.currentStreak.kind === "W" && st.currentStreak.n >= 3) bits.push(`llega con ${st.currentStreak.n} victorias seguidas`);
  if (st.currentStreak.kind === "L" && st.currentStreak.n >= 2) bits.push(`llega con ${st.currentStreak.n} derrotas seguidas`);
  if (i.daysSinceLast !== null && i.daysSinceLast > 540) bits.push(`lleva ${Math.round(i.daysSinceLast / 30.4)} meses sin pelear`);
  if (bits.length) summary.push(bits[0][0].toUpperCase() + bits.join(" y ").slice(1) + ".");

  if (i.resultOnlyOrgs.length) {
    summary.push(depth === "stats"
      ? `Sus combates en ${list(i.resultOnlyOrgs)} cuentan en el récord y el rating, pero no tienen estadísticas de golpeo publicadas.`
      : `Sus combates en ${list(i.resultOnlyOrgs)} no tienen estadísticas de golpeo publicadas: esta lectura se basa solo en resultados y rivales.`);
  }

  return {
    depth,
    summary,
    strengths: strengths.slice(0, 4),
    weaknesses: weaknesses.slice(0, 3),
    wins: split(st.winsBy, r.w),
    losses: split(st.lossesBy, r.l),
    sample: { bouts: st.bouts, statBouts: st.statBouts },
  };
}
