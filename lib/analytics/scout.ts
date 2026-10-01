/**
 * Scouting analytics. Everything here is derived from box-score data and
 * reports its sample. Questions the data cannot answer are returned as
 * `null` so the UI can say so instead of guessing.
 */
import type { FighterBout, Outcome } from "../domain/types";
import type { AttributeKey } from "./attributes";
import { careerStats, methodBucket } from "./career";

export type StyleType = "striker" | "wrestler" | "grappler" | "balanced";

export const STYLE_LABEL: Record<StyleType, string> = {
  striker: "Golpeadores",
  wrestler: "Luchadores (wrestling)",
  grappler: "Especialistas en suelo",
  balanced: "Completos",
};

/** Classifies a fighter by their dominant attribute percentile. */
export function styleOf(a: Record<AttributeKey, number> | undefined | null): StyleType | null {
  if (!a) return null;
  const top = [["striker", a.striking], ["wrestler", a.wrestling], ["grappler", a.grappling]] as [StyleType, number][];
  top.sort((x, y) => y[1] - x[1]);
  if (top[0][1] - top[1][1] < 12) return "balanced";
  return top[0][0];
}

const done = (b: FighterBout[]) => b.filter((x) => x.fight.status === "completed" && x.outcome !== "NC");

export interface RoundLine { round: number; n: number; att: number; landed: number; oppLanded: number; diff: number; td: number; oppTd: number; ctrl: number }

/** Per-round averages over rounds that were actually fought in full. */
export function roundLines(bouts: FighterBout[]): RoundLine[] {
  const acc = new Map<number, { n: number; att: number; landed: number; opp: number; td: number; oppTd: number; ctrl: number }>();
  for (const b of done(bouts)) {
    for (const r of b.fight.rounds) {
      const full = !(r.round === b.fight.round && (b.fight.time ?? 300) < 300);
      if (!full) continue;
      const own = b.corner === "red" ? r.red : r.blue;
      const opp = b.corner === "red" ? r.blue : r.red;
      const row = acc.get(r.round) ?? { n: 0, att: 0, landed: 0, opp: 0, td: 0, oppTd: 0, ctrl: 0 };
      row.n++; row.att += own.sigAttempted; row.landed += own.sigLanded; row.opp += opp.sigLanded;
      row.td += own.tdLanded; row.oppTd += opp.tdLanded; row.ctrl += own.ctrlSec;
      acc.set(r.round, row);
    }
  }
  return [...acc.entries()].sort((a, b) => a[0] - b[0]).map(([round, r]) => ({
    round, n: r.n, att: r.att / r.n, landed: r.landed / r.n, oppLanded: r.opp / r.n,
    diff: (r.landed - r.opp) / r.n, td: r.td / r.n, oppTd: r.oppTd / r.n, ctrl: r.ctrl / r.n,
  }));
}

export interface FinishRounds { ko: number[]; sub: number[] }

/** Round in which finishes happen (index 0 = R1). */
export function finishRounds(bouts: FighterBout[], outcome: Outcome): FinishRounds {
  const out: FinishRounds = { ko: [0, 0, 0, 0, 0], sub: [0, 0, 0, 0, 0] };
  for (const b of done(bouts)) {
    if (b.outcome !== outcome || !b.fight.round) continue;
    const k = methodBucket(b.fight.method);
    if (k === "ko") out.ko[b.fight.round - 1]++;
    if (k === "sub") out.sub[b.fight.round - 1]++;
  }
  return out;
}

export interface ZoneEdge { zone: "distance" | "clinch" | "ground"; label: string; own: number; opp: number; perMinOwn: number; perMinOpp: number }

/** Where the striking exchange is won or lost. */
export function zoneEdges(bouts: FighterBout[]): ZoneEdge[] {
  const st = careerStats(done(bouts));
  const m = Math.max(1, st.minutes);
  return ([["distance", "Distancia"], ["clinch", "Clinch"], ["ground", "Suelo"]] as const).map(([zone, label]) => ({
    zone, label, own: st.totals[zone], opp: st.oppTotals[zone], perMinOwn: st.totals[zone] / m, perMinOpp: st.oppTotals[zone] / m,
  }));
}

export interface VsStyle { style: StyleType; label: string; w: number; l: number; d: number; n: number; sigDiff: number }

/** Record and striking differential against each opponent style. */
export function vsStyles(bouts: FighterBout[], oppStyle: (id: string) => StyleType | null): VsStyle[] {
  const acc = new Map<StyleType, VsStyle>();
  for (const b of done(bouts)) {
    const st = oppStyle(b.opponentId);
    if (!st) continue;
    const row = acc.get(st) ?? { style: st, label: STYLE_LABEL[st], w: 0, l: 0, d: 0, n: 0, sigDiff: 0 };
    row.n++;
    if (b.outcome === "W") row.w++; else if (b.outcome === "L") row.l++; else row.d++;
    row.sigDiff += (b.own?.sigLanded ?? 0) - (b.opp?.sigLanded ?? 0);
    acc.set(st, row);
  }
  return [...acc.values()].map((r) => ({ ...r, sigDiff: r.sigDiff / r.n })).sort((a, b) => b.n - a.n);
}
