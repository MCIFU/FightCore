/**
 * Strength index (Elo variant) — FCR v0.2 input for opponent quality.
 *
 * Changes from plain Elo, each kept because it improved out-of-sample
 * prediction on UFC 2012–2026 (scripts/eval-rating.mts):
 *  · Margin of victory: in a decision the score blends the result (65 %) with
 *    the share of the fight each won (strikes, takedowns, control, knockdowns).
 *  · Experience-scaled K: newcomers move fast (K 80), veterans settle (K ≥ 40).
 *  · Split/majority decisions count half.
 *  · Title fights weigh a third more.
 *  · Layoffs of more than 18 months pull the index 20 %/year back to average.
 * Fights are processed in date order; each fight stores both indexes as they
 * were *before* it, so nothing uses information from the future.
 */
import type { Fight } from "../domain/types";

export const STRENGTH = { base: 1500, scale: 250, k0: 80, kMin: 40, decay: 0.95, mov: 0.35, split: 0.5, title: 1.33, layoffYears: 1.5, regress: 0.2 } as const;

function dominance(f: Fight): number | null {
  if (!f.red || !f.blue) return null;
  const v = (x: NonNullable<Fight["red"]>) => x.sigLanded + 4 * x.tdLanded + x.ctrlSec / 30 + 8 * x.kd;
  const a = v(f.red), b = v(f.blue);
  return a + b > 0 ? a / (a + b) : 0.5;
}

/** Recomputes redStrengthPre / blueStrengthPre on every fight, in place. */
export function computeStrength(fights: Fight[]): void {
  const P = STRENGTH;
  const r = new Map<string, number>(), n = new Map<string, number>(), last = new Map<string, string>();
  const ordered = [...fights].sort((a, b) => a.date.localeCompare(b.date) || b.order - a.order);
  const current = (id: string, date: string) => {
    const v = r.get(id) ?? P.base;
    const l = last.get(id);
    if (!l) return v;
    const years = (Date.parse(date) - Date.parse(l)) / 31_557_600_000;
    return years > P.layoffYears ? P.base + (v - P.base) * Math.pow(1 - P.regress, years - P.layoffYears) : v;
  };
  for (const f of ordered) {
    const ra = current(f.redId, f.date), rb = current(f.blueId, f.date);
    f.redStrengthPre = Math.round(ra);
    f.blueStrengthPre = Math.round(rb);
    if (f.status !== "completed" || f.method === "NC") continue;
    const ea = 1 / (1 + 10 ** ((rb - ra) / P.scale));
    let sa = f.winnerId === f.redId ? 1 : f.winnerId === f.blueId ? 0 : 0.5;
    const finished = f.method === "KO/TKO" || f.method === "SUB";
    const dom = dominance(f);
    if (!finished && dom !== null) sa = (1 - P.mov) * sa + P.mov * dom;
    const w = (f.method === "S-DEC" || f.method === "M-DEC" ? P.split : 1) * (f.titleFight ? P.title : 1);
    const k = (id: string) => Math.max(P.kMin, P.k0 * Math.pow(P.decay, n.get(id) ?? 0)) * w;
    r.set(f.redId, ra + k(f.redId) * (sa - ea));
    r.set(f.blueId, rb + k(f.blueId) * (ea - sa));
    for (const id of [f.redId, f.blueId]) { n.set(id, (n.get(id) ?? 0) + 1); last.set(id, f.date); }
  }
}
