/**
 * FIGHTCORE Rating (FCR) — model v0.1
 *
 * A transparent, weighted composite of eight factors, each scored 0–100.
 * Inputs are completed bouts only. The model never sees hidden simulation
 * attributes: it works from results and box-score statistics, exactly like it
 * would with real data. See /methodology for the public explanation.
 */
import type { FighterBout } from "../domain/types";

export const FCR_VERSION = "0.1";

export type FactorKey =
  | "performance" | "opponentQuality" | "winQuality" | "recentForm"
  | "championship" | "finishing" | "defense" | "activity";

export interface FactorDef {
  key: FactorKey;
  label: string;
  weight: number;
  description: string;
}

export const FACTORS: FactorDef[] = [
  { key: "performance", label: "Performance", weight: 0.2, description: "Dominio estadístico por combate: diferencial de golpes significativos, derribos, control y knockdowns." },
  { key: "opponentQuality", label: "Calidad de rivales", weight: 0.2, description: "Fuerza media de los rivales en el momento de cada combate, según un índice de resultados." },
  { key: "winQuality", label: "Calidad de victorias", weight: 0.15, description: "Victorias ponderadas por la fuerza del rival y el método (finalización > unánime > dividida)." },
  { key: "recentForm", label: "Forma reciente", weight: 0.15, description: "Últimos cinco combates con decaimiento temporal y ajuste por rival." },
  { key: "championship", label: "Campeonato", weight: 0.1, description: "Combates por título ganados y perdidos, defensas y victorias en main event." },
  { key: "finishing", label: "Finalización", weight: 0.08, description: "Proporción de victorias antes del límite, suavizada según el tamaño de la muestra." },
  { key: "defense", label: "Defensa", weight: 0.07, description: "Defensa de golpeo y de derribo, y frecuencia con la que ha sido finalizado." },
  { key: "activity", label: "Actividad", weight: 0.05, description: "Combates en los últimos 24 meses y penalización por inactividad prolongada." },
];

export interface RatingResult {
  value: number;
  /** Half-width of the uncertainty band, in rating points. */
  band: number;
  provisional: boolean;
  sample: number;
  factors: Record<FactorKey, number>;
  /** Points each factor contributes to `value` (sums to value). */
  contributions: Record<FactorKey, number>;
}

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const scale = (v: number, lo: number, hi: number) => clamp01((v - lo) / (hi - lo));

/** Results-based strength index (Elo-like) → 0..1. */
export const strength01 = (elo: number) => scale(elo, 1450, 1700);

const DAY = 86_400_000;
const daysBetween = (a: string, b: string) => (Date.parse(b) - Date.parse(a)) / DAY;

export function computeRating(allBouts: FighterBout[], asOf: string, opts: { isChampion?: boolean } = {}): RatingResult {
  const bouts = allBouts.filter((b) => b.fight.status === "completed" && b.fight.date <= asOf && b.outcome !== "NC");
  const n = bouts.length;
  const recent = [...bouts].reverse();

  // Performance — statistical dominance per bout, recency weighted.
  let pNum = 0, pDen = 0;
  recent.forEach((b, k) => {
    if (!b.own || !b.opp) return;
    const vol = 15 + 0.2 * (b.own.sigLanded + b.opp.sigLanded);
    const finished = b.fight.method === "KO/TKO" || b.fight.method === "SUB";
    const x = (b.own.sigLanded - b.opp.sigLanded) / vol
      + (b.own.tdLanded - b.opp.tdLanded) * 0.18
      + (b.own.ctrlSec - b.opp.ctrlSec) / 240
      + (b.own.kd - b.opp.kd) * 0.45
      + (finished ? (b.outcome === "W" ? 0.35 : -0.35) : 0);
    const w = 0.88 ** k;
    pNum += w * (0.5 + 0.5 * Math.tanh(x));
    pDen += w;
  });
  const performance = pDen ? scale(pNum / pDen, 0.3, 0.92) : 0;

  // Opponent quality.
  let oNum = 0, oDen = 0;
  recent.forEach((b, k) => { const w = 0.9 ** k; oNum += w * strength01(b.oppStrengthPre); oDen += w; });
  const opponentQuality = oDen ? scale(oNum / oDen, 0.1, 0.75) : 0;

  // Win quality.
  const methodFactor = (m: string | null) => (m === "KO/TKO" || m === "SUB" ? 1 : m === "U-DEC" ? 0.85 : m === "M-DEC" ? 0.75 : 0.65);
  let wNum = 0, wDen = 0;
  recent.forEach((b, k) => {
    const w = 0.9 ** k;
    wDen += w * 0.7;
    if (b.outcome === "W") wNum += w * (0.35 + 0.65 * strength01(b.oppStrengthPre)) * methodFactor(b.fight.method);
    if (b.outcome === "D") wNum += w * 0.25 * strength01(b.oppStrengthPre);
  });
  const winQuality = wDen ? clamp01(wNum / wDen) : 0;

  // Recent form — last five.
  let fNum = 0, fDen = 0;
  recent.slice(0, 5).forEach((b, k) => {
    const w = 0.8 ** k;
    const s = strength01(b.oppStrengthPre);
    fNum += w * (b.outcome === "W" ? 0.6 + 0.4 * s : b.outcome === "D" ? 0.35 : 0.12 * s);
    fDen += w;
  });
  const recentForm = fDen ? scale(fNum / fDen, 0.05, 0.95) : 0;

  // Championship.
  const tw = bouts.filter((b) => b.fight.titleFight && b.outcome === "W").length;
  const tl = bouts.filter((b) => b.fight.titleFight && b.outcome === "L").length;
  const mw = bouts.filter((b) => !b.fight.titleFight && b.fight.slot === "main" && b.outcome === "W").length;
  const championship = clamp01((20 + 17 * tw - 4 * tl + 5 * mw + (opts.isChampion ? 12 : 0)) / 100);

  // Finishing.
  const wins = bouts.filter((b) => b.outcome === "W");
  const fin = wins.filter((b) => b.fight.method === "KO/TKO" || b.fight.method === "SUB").length;
  const finishing = scale((fin + 1) / (wins.length + 3), 0.1, 0.8);

  // Defense.
  let oppL = 0, oppA = 0, oppTdL = 0, oppTdA = 0;
  for (const b of bouts) if (b.opp) { oppL += b.opp.sigLanded; oppA += b.opp.sigAttempted; oppTdL += b.opp.tdLanded; oppTdA += b.opp.tdAttempted; }
  const strDef = oppA ? 1 - oppL / oppA : 0.55;
  const tdDef = oppTdA ? 1 - oppTdL / oppTdA : 0.7;
  const finishedRate = n ? bouts.filter((b) => b.outcome === "L" && (b.fight.method === "KO/TKO" || b.fight.method === "SUB")).length / n : 0;
  const defense = clamp01(0.5 * scale(strDef, 0.45, 0.72) + 0.3 * scale(tdDef, 0.35, 0.95) + 0.2 * clamp01(1 - finishedRate * 2.5));

  // Activity.
  const last24 = bouts.filter((b) => daysBetween(b.fight.date, asOf) <= 730).length;
  const lastGap = n ? daysBetween(bouts[n - 1].fight.date, asOf) : Infinity;
  const activity = clamp01([0.12, 0.55, 0.82, 1][Math.min(3, last24)] - (lastGap > 540 ? 0.25 : 0));

  const factors: Record<FactorKey, number> = {
    performance: performance * 100,
    opponentQuality: opponentQuality * 100,
    winQuality: winQuality * 100,
    recentForm: recentForm * 100,
    championship: championship * 100,
    finishing: finishing * 100,
    defense: defense * 100,
    activity: activity * 100,
  };
  const contributions = {} as Record<FactorKey, number>;
  let value = 0;
  for (const f of FACTORS) {
    contributions[f.key] = factors[f.key] * f.weight;
    value += contributions[f.key];
  }
  for (const k of Object.keys(factors) as FactorKey[]) factors[k] = Math.round(factors[k] * 10) / 10;

  return {
    value: Math.round(value * 10) / 10,
    band: Math.round((16 / Math.sqrt(n + 2)) * 10) / 10,
    provisional: n < 3,
    sample: n,
    factors,
    contributions,
  };
}
