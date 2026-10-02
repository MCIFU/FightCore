/**
 * FIGHTCORE Rating (FCR) — model v0.2
 *
 * A transparent, weighted composite of eight factors, each scored 0–100.
 * Inputs are completed bouts only, and only those before the date asked for.
 *
 * v0.2 (October 2026), calibrated on 3,372 UFC fights from 2012 on with
 * scripts/eval-rating.mts — every change below had to explain results better:
 *  · Recency by date (half-life 2.5 years), not by number of fights: a fighter
 *    with a long layoff no longer keeps old form "fresh".
 *  · Performance is opponent-adjusted: dominating a strong rival counts more.
 *  · Weights moved to the factors that explain results (win quality,
 *    performance, form, defense); championship and finishing, which explain
 *    almost nothing, keep a small weight as context.
 *  · Small samples are pulled toward the average (shrinkage) instead of
 *    swinging on one or two fights; the uncertainty band still shows it.
 *  · The strength index behind opponent quality is now margin-aware
 *    (lib/rating/strength.ts).
 * See /methodology for the public explanation.
 */
import type { FighterBout } from "../domain/types";

export const FCR_VERSION = "0.2";

/**
 * Out-of-sample check (scripts/eval-rating.mts, run 2 Oct 2026): fights since
 * 2012 in every covered organisation (UFC plus the ESPN results of PFL,
 * Bellator, RIZIN, KSW, Cage Warriors, LFA…) between fighters with ≥3 earlier
 * covered bouts, rating taken the day before. "Acierto" = the higher-rated
 * fighter won. strength = the Elo-style index alone.
 */
export const VALIDATION = { fights: 6196, accuracy: 61.6, accuracyBigGap: 71.7, bigGap: 10, strength: 60.2, baseline: 57.7 } as const;

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
  { key: "winQuality", label: "Calidad de victorias", weight: 0.24, description: "A quién ha ganado y cómo: victorias ponderadas por la fuerza del rival en ese momento, el método y lo recientes que son." },
  { key: "performance", label: "Dominio", weight: 0.22, description: "Cuánto domina cada combate (golpes significativos, derribos, control, knockdowns), ajustado al nivel del rival." },
  { key: "recentForm", label: "Forma reciente", weight: 0.16, description: "Últimos cinco combates, el más reciente con más peso, ajustados por el nivel del rival." },
  { key: "defense", label: "Defensa", weight: 0.12, description: "Defensa de golpeo y de derribo, y frecuencia con la que ha sido finalizado." },
  { key: "opponentQuality", label: "Calidad de rivales", weight: 0.12, description: "Nivel medio de los rivales en el momento de cada combate, con más peso para los recientes." },
  { key: "activity", label: "Actividad", weight: 0.06, description: "Combates en los últimos 24 meses; penaliza la inactividad prolongada." },
  { key: "championship", label: "Títulos", weight: 0.05, description: "Combates por el título ganados y perdidos y victorias en main event. Contexto: apenas predice resultados." },
  { key: "finishing", label: "Finalización", weight: 0.03, description: "Proporción de victorias antes del límite, suavizada por tamaño de muestra. Describe estilo más que nivel." },
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

/** Strength index (lib/rating/strength.ts) → 0..1. */
export const strength01 = (elo: number) => scale(elo, 1440, 1720);

const DAY = 86_400_000;
const daysBetween = (a: string, b: string) => (Date.parse(b) - Date.parse(a)) / DAY;
const HALF_LIFE_DAYS = 2.5 * 365.25;
/** Weight of a bout by its age: 1 today, ½ after 2.5 years. */
const ageWeight = (date: string, asOf: string) => Math.pow(0.5, Math.max(0, daysBetween(date, asOf)) / HALF_LIFE_DAYS);
/** Pulls a 0..1 factor toward a neutral value when the sample is small. */
const shrink = (v: number, n: number, prior = 0.4, k = 2) => (n * v + k * prior) / (n + k);

export function computeRating(allBouts: FighterBout[], asOf: string, opts: { isChampion?: boolean } = {}): RatingResult {
  const bouts = allBouts.filter((b) => b.fight.status === "completed" && b.fight.date <= asOf && b.outcome !== "NC");
  const n = bouts.length;
  const recent = [...bouts].reverse();

  // Dominance per bout, opponent-adjusted, weighted by age.
  let pNum = 0, pDen = 0, pN = 0;
  for (const b of recent) {
    if (!b.own || !b.opp) continue;
    const vol = 15 + 0.2 * (b.own.sigLanded + b.opp.sigLanded);
    const finished = b.fight.method === "KO/TKO" || b.fight.method === "SUB";
    const x = (b.own.sigLanded - b.opp.sigLanded) / vol
      + (b.own.tdLanded - b.opp.tdLanded) * 0.18
      + (b.own.ctrlSec - b.opp.ctrlSec) / 240
      + (b.own.kd - b.opp.kd) * 0.45
      + (finished ? (b.outcome === "W" ? 0.35 : -0.35) : 0);
    const opp = strength01(b.oppStrengthPre);
    // Same dominance is worth more against a strong rival and less against a weak one.
    const adj = 0.5 + 0.5 * Math.tanh(x) + 0.25 * (opp - 0.5);
    const w = ageWeight(b.fight.date, asOf);
    pNum += w * adj; pDen += w; pN++;
  }
  // No box scores (other organisations): neutral prior, not zero.
  const performance = pDen ? shrink(scale(pNum / pDen, 0.3, 0.92), pN) : 0.4;

  // Opponent quality, weighted by age.
  let oNum = 0, oDen = 0;
  for (const b of recent) { const w = ageWeight(b.fight.date, asOf); oNum += w * strength01(b.oppStrengthPre); oDen += w; }
  const opponentQuality = oDen ? shrink(scale(oNum / oDen, 0.1, 0.75), n) : 0;

  // Win quality: wins weighted by rival strength, method and age.
  const methodFactor = (m: string | null) => (m === "KO/TKO" || m === "SUB" ? 1 : m === "U-DEC" ? 0.85 : m === "M-DEC" ? 0.75 : 0.65);
  let wNum = 0, wDen = 0;
  for (const b of recent) {
    const w = ageWeight(b.fight.date, asOf);
    wDen += w * 0.7;
    if (b.outcome === "W") wNum += w * (0.35 + 0.65 * strength01(b.oppStrengthPre)) * methodFactor(b.fight.method);
    if (b.outcome === "D") wNum += w * 0.25 * strength01(b.oppStrengthPre);
  }
  const winQuality = wDen ? shrink(clamp01(wNum / wDen), n) : 0;

  // Recent form — last five, rival-adjusted.
  let fNum = 0, fDen = 0;
  recent.slice(0, 5).forEach((b, k) => {
    const w = 0.8 ** k;
    const s = strength01(b.oppStrengthPre);
    fNum += w * (b.outcome === "W" ? 0.6 + 0.4 * s : b.outcome === "D" ? 0.35 : 0.12 * s);
    fDen += w;
  });
  const recentForm = fDen ? shrink(scale(fNum / fDen, 0.05, 0.95), Math.min(n, 5)) : 0;

  // Titles.
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
  const defense = shrink(clamp01(0.5 * scale(strDef, 0.45, 0.72) + 0.3 * scale(tdDef, 0.35, 0.95) + 0.2 * clamp01(1 - finishedRate * 2.5)), n, 0.5);

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
