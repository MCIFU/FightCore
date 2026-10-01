/**
 * Career aggregation: turns a list of bouts into records, per-minute rates and
 * position/target distributions. Pure functions — no data access here.
 */
import type { FighterBout, Method, StrikeStats } from "../domain/types";

export interface RecordLine { w: number; l: number; d: number; nc: number }

export interface MethodSplit { ko: number; sub: number; dec: number }

export interface CareerStats {
  bouts: number;
  minutes: number;
  record: RecordLine;
  winsBy: MethodSplit;
  lossesBy: MethodSplit;
  slpm: number;
  sapm: number;
  strAcc: number;
  strDef: number;
  tdAvg: number;
  tdAcc: number;
  tdDef: number;
  subAvg: number;
  kdAvg: number;
  ctrlShare: number;
  sigAttPerMin: number;
  position: { distance: number; clinch: number; ground: number };
  target: { head: number; body: number; leg: number };
  totals: StrikeStats;
  oppTotals: StrikeStats;
  finishRate: number;
  koLosses: number;
  titleRecord: { w: number; l: number };
  longestWinStreak: number;
  currentStreak: { kind: "W" | "L" | "D" | null; n: number };
}

export const methodBucket = (m: Method | null): keyof MethodSplit | null =>
  m === "KO/TKO" ? "ko" : m === "SUB" ? "sub" : m && m.endsWith("DEC") ? "dec" : null;

export const boutSeconds = (b: FighterBout) =>
  b.fight.round && b.fight.time !== null ? (b.fight.round - 1) * 300 + b.fight.time : 0;

const zero = (): StrikeStats => ({ sigLanded: 0, sigAttempted: 0, totalLanded: 0, totalAttempted: 0, head: 0, body: 0, leg: 0, distance: 0, clinch: 0, ground: 0, kd: 0, tdLanded: 0, tdAttempted: 0, subAttempts: 0, ctrlSec: 0 });

const ratio = (a: number, b: number, fallback = 0) => (b > 0 ? a / b : fallback);

export function emptyRecord(): RecordLine {
  return { w: 0, l: 0, d: 0, nc: 0 };
}

export function recordOf(bouts: FighterBout[]): RecordLine {
  const r = emptyRecord();
  for (const b of bouts) {
    if (b.outcome === "W") r.w++;
    else if (b.outcome === "L") r.l++;
    else if (b.outcome === "D") r.d++;
    else if (b.outcome === "NC") r.nc++;
  }
  return r;
}

export function careerStats(all: FighterBout[]): CareerStats {
  const bouts = all.filter((b) => b.fight.status === "completed");
  const totals = zero();
  const oppTotals = zero();
  let seconds = 0;
  // Per-minute rates only use bouts that have box scores (early UFC events don't).
  let statSeconds = 0;
  const winsBy: MethodSplit = { ko: 0, sub: 0, dec: 0 };
  const lossesBy: MethodSplit = { ko: 0, sub: 0, dec: 0 };
  let longest = 0, run = 0;
  for (const b of bouts) {
    seconds += boutSeconds(b);
    if (b.own && b.opp) {
      statSeconds += boutSeconds(b);
      (Object.keys(totals) as (keyof StrikeStats)[]).forEach((k) => {
        totals[k] += b.own![k];
        oppTotals[k] += b.opp![k];
      });
    }
    const bucket = methodBucket(b.fight.method);
    if (b.outcome === "W" && bucket) winsBy[bucket]++;
    if (b.outcome === "L" && bucket) lossesBy[bucket]++;
    if (b.outcome === "W") { run++; longest = Math.max(longest, run); } else if (b.outcome !== "NC") run = 0;
  }
  const minutes = seconds / 60;
  const statMinutes = statSeconds / 60;
  const record = recordOf(bouts);
  const wins = record.w;
  let cur: CareerStats["currentStreak"] = { kind: null, n: 0 };
  for (let i = bouts.length - 1; i >= 0; i--) {
    const o = bouts[i].outcome;
    if (o === "NC" || !o) continue;
    if (cur.kind === null) cur = { kind: o, n: 1 };
    else if (cur.kind === o) cur.n++;
    else break;
  }
  const sig = totals.sigLanded || 1;
  return {
    bouts: bouts.length,
    minutes,
    record,
    winsBy,
    lossesBy,
    slpm: ratio(totals.sigLanded, statMinutes),
    sapm: ratio(oppTotals.sigLanded, statMinutes),
    strAcc: ratio(totals.sigLanded, totals.sigAttempted),
    strDef: 1 - ratio(oppTotals.sigLanded, oppTotals.sigAttempted, 0.45),
    tdAvg: ratio(totals.tdLanded, statMinutes) * 15,
    tdAcc: ratio(totals.tdLanded, totals.tdAttempted),
    tdDef: 1 - ratio(oppTotals.tdLanded, oppTotals.tdAttempted, 0.3),
    subAvg: ratio(totals.subAttempts, statMinutes) * 15,
    kdAvg: ratio(totals.kd, statMinutes) * 15,
    ctrlShare: ratio(totals.ctrlSec, statSeconds),
    sigAttPerMin: ratio(totals.sigAttempted, statMinutes),
    position: { distance: totals.distance / sig, clinch: totals.clinch / sig, ground: totals.ground / sig },
    target: { head: totals.head / sig, body: totals.body / sig, leg: totals.leg / sig },
    totals,
    oppTotals,
    finishRate: ratio(winsBy.ko + winsBy.sub, wins),
    koLosses: lossesBy.ko,
    titleRecord: {
      w: bouts.filter((b) => b.fight.titleFight && b.outcome === "W").length,
      l: bouts.filter((b) => b.fight.titleFight && b.outcome === "L").length,
    },
    longestWinStreak: longest,
    currentStreak: cur,
  };
}

/** Round-by-round output averaged across all bouts that reached each round. */
export function roundProfile(bouts: FighterBout[]) {
  const acc: { round: number; landed: number; attempted: number; oppLanded: number; n: number }[] = [];
  for (const b of bouts) {
    if (b.fight.status !== "completed") continue;
    for (const r of b.fight.rounds) {
      const own = b.corner === "red" ? r.red : r.blue;
      const opp = b.corner === "red" ? r.blue : r.red;
      // Only count full rounds so a 20-second finish doesn't distort the curve.
      const full = !(r.round === b.fight.round && (b.fight.time ?? 300) < 300);
      if (!full) continue;
      let row = acc.find((x) => x.round === r.round);
      if (!row) { row = { round: r.round, landed: 0, attempted: 0, oppLanded: 0, n: 0 }; acc.push(row); }
      row.landed += own.sigLanded; row.attempted += own.sigAttempted; row.oppLanded += opp.sigLanded; row.n++;
    }
  }
  return acc.sort((a, b) => a.round - b.round).map((r) => ({
    round: r.round,
    n: r.n,
    landed: r.landed / r.n,
    attempted: r.attempted / r.n,
    oppLanded: r.oppLanded / r.n,
  }));
}
