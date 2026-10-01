/**
 * How well does the rating explain results? For every completed UFC fight
 * since 2012 between two fighters with ≥3 earlier bouts, take each fighter's
 * rating the day before the fight and check whether the higher one won.
 * Also reports log-loss of a logistic fit on the rating gap (lower = better).
 *
 *   npx tsx scripts/eval-rating.mts
 */
import { buildStore } from "../lib/data/build.ts";
import { loadUniverseFromSnapshot } from "../lib/data/providers/snapshot.ts";
import { computeRating } from "../lib/rating/model.ts";

const s = buildStore(loadUniverseFromSnapshot());
const dayBefore = (d: string) => new Date(Date.parse(d) - 86_400_000).toISOString().slice(0, 10);
const rows: { gap: number; eloGap: number; redWon: boolean }[] = [];
for (const f of s.fights) {
  if (f.status !== "completed" || !f.winnerId || f.date < "2012-01-01") continue;
  const a = s.bouts.get(f.redId)!, b = s.bouts.get(f.blueId)!;
  const prior = (x: typeof a) => x.filter((y) => y.fight.status === "completed" && y.fight.date < f.date && y.outcome !== "NC").length;
  if (prior(a) < 3 || prior(b) < 3) continue;
  const ra = computeRating(a, dayBefore(f.date)).value, rb = computeRating(b, dayBefore(f.date)).value;
  rows.push({ gap: ra - rb, eloGap: f.redStrengthPre - f.blueStrengthPre, redWon: f.winnerId === f.redId });
}
const acc = (k: "gap" | "eloGap") => rows.filter((r) => r[k] !== 0 && (r[k] > 0) === r.redWon).length / rows.filter((r) => r[k] !== 0).length;
// Best logistic scale by grid search → log-loss.
const logloss = (k: "gap" | "eloGap") => {
  let best = Infinity;
  for (let c = 0.001; c < 0.5; c *= 1.15) {
    let ll = 0;
    for (const r of rows) { const p = 1 / (1 + Math.exp(-c * r[k])); ll -= Math.log(Math.min(1 - 1e-9, Math.max(1e-9, r.redWon ? p : 1 - p))); }
    best = Math.min(best, ll / rows.length);
  }
  return best;
};
const big = rows.filter((r) => Math.abs(r.gap) >= 10);
console.log(`combates evaluados: ${rows.length}`);
console.log(`FCR  acierto ${(acc("gap") * 100).toFixed(1)}% · log-loss ${logloss("gap").toFixed(4)} · con diferencia ≥10: ${(big.filter((r) => (r.gap > 0) === r.redWon).length / big.length * 100).toFixed(1)}% de ${big.length}`);
console.log(`Elo  acierto ${(acc("eloGap") * 100).toFixed(1)}% · log-loss ${logloss("eloGap").toFixed(4)}`);
console.log(`base (siempre gana rojo) ${(rows.filter((r) => r.redWon).length / rows.length * 100).toFixed(1)}%`);
