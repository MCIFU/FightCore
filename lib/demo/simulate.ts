/**
 * FIGHTCORE demo universe.
 *
 * A deterministic, round-by-round simulation of a fictional MMA ecosystem
 * (2013 → end of 2026). It exists so charts, rankings, ratings and timelines
 * can be exercised against internally consistent data. Everything produced
 * here carries provenance "demo" and must never be presented as real.
 */
import { CITIES, NAME_POOLS, NICKNAMES, SUBMISSIONS } from "./names";
import { Rng } from "./rng";
import { DIVISIONS } from "../domain/reference";
import type {
  Championship, Event, Fight, Fighter, Method, RoundStats, Sex, Stance, StrikeStats,
} from "../domain/types";

export const DEMO_TODAY = "2026-09-30";
const SEED = 20260930;

interface Hidden {
  striking: number; strDef: number; power: number; wrestling: number; tdDef: number;
  grappling: number; subDef: number; cardio: number; chin: number; pace: number; adapt: number;
  legKicks: number; bodyWork: number;
}

type Archetype = "pressure" | "counter" | "kickboxer" | "wrestler" | "grappler" | "wrestleboxer" | "brawler" | "complete";

const ARCHETYPES: Record<Archetype, Omit<Hidden, "adapt" | "legKicks" | "bodyWork"> & { legKicks: number; bodyWork: number }> = {
  pressure:     { striking: 72, strDef: 58, power: 70, wrestling: 52, tdDef: 64, grappling: 46, subDef: 56, cardio: 82, chin: 70, pace: 86, legKicks: 0.18, bodyWork: 0.2 },
  counter:      { striking: 78, strDef: 78, power: 66, wrestling: 40, tdDef: 68, grappling: 42, subDef: 56, cardio: 66, chin: 60, pace: 50, legKicks: 0.14, bodyWork: 0.14 },
  kickboxer:    { striking: 80, strDef: 70, power: 62, wrestling: 36, tdDef: 56, grappling: 36, subDef: 50, cardio: 72, chin: 62, pace: 72, legKicks: 0.3, bodyWork: 0.2 },
  wrestler:     { striking: 52, strDef: 56, power: 56, wrestling: 86, tdDef: 82, grappling: 66, subDef: 66, cardio: 82, chin: 68, pace: 70, legKicks: 0.08, bodyWork: 0.14 },
  grappler:     { striking: 46, strDef: 50, power: 46, wrestling: 62, tdDef: 56, grappling: 88, subDef: 86, cardio: 66, chin: 60, pace: 56, legKicks: 0.08, bodyWork: 0.12 },
  wrestleboxer: { striking: 67, strDef: 64, power: 66, wrestling: 76, tdDef: 77, grappling: 58, subDef: 62, cardio: 76, chin: 70, pace: 72, legKicks: 0.1, bodyWork: 0.18 },
  brawler:      { striking: 64, strDef: 42, power: 85, wrestling: 40, tdDef: 50, grappling: 35, subDef: 44, cardio: 56, chin: 78, pace: 74, legKicks: 0.1, bodyWork: 0.12 },
  complete:     { striking: 72, strDef: 68, power: 64, wrestling: 70, tdDef: 72, grappling: 68, subDef: 70, cardio: 74, chin: 66, pace: 68, legKicks: 0.16, bodyWork: 0.16 },
};

interface SimFighter {
  f: Fighter;
  hidden: Hidden;
  debut: number; // month index
  birthMonth: number;
  elo: number;
  nextAvailable: number; // month index
  tier: 1 | 2;
  lastOpp: string | null;
  results: ("W" | "L" | "D")[];
  orgWins: number;
  fights: number;
  retired: boolean;
  koLosses: number;
}

// month index: 0 = 2013-01
const START_YEAR = 2013;
const END_MONTH = (2026 - START_YEAR) * 12 + 11; // 2026-12
const monthToYM = (m: number) => ({ y: START_YEAR + Math.floor(m / 12), mo: (m % 12) + 1 });
const pad = (n: number) => String(n).padStart(2, "0");

function saturdayOf(y: number, mo: number, week: number): string {
  const d = new Date(Date.UTC(y, mo - 1, 1));
  const firstSat = 1 + ((6 - d.getUTCDay() + 7) % 7);
  const day = Math.min(firstSat + 7 * week, new Date(Date.UTC(y, mo, 0)).getUTCDate());
  return `${y}-${pad(mo)}-${pad(day)}`;
}

const slugify = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

const TIER1 = ["ufc", "pfl", "one"] as const;
const TIER1_WEIGHTS: [string, number][] = [["ufc", 0.62], ["pfl", 0.2], ["one", 0.18]];
/** Event cadence per org, in months. */
const CADENCE: Record<string, number> = { ufc: 2, pfl: 4, one: 4, rizin: 6 };

function regionalOrg(country: string, sex: Sex, rng: Rng): string {
  if (sex === "F" && ["USA", "CAN", "MEX", "BRA"].includes(country)) return "invicta";
  switch (country) {
    case "ESP": return rng.pick(["wowfc", "warmma", "cw"]);
    case "POL": return "ksw";
    case "CZE": return "oktagon";
    case "GBR": case "IRL": return "cw";
    case "USA": case "CAN": case "MEX": return rng.pick(["lfa", "cffc"]);
    case "JPN": case "KOR": case "CHN": return "rizin";
    case "FRA": case "CMR": case "NGA": return "ares";
    case "BRA": case "ARG": return rng.pick(["lfa", "brave"]);
    default: return rng.pick(["cw", "brave", "ksw", "oktagon"]);
  }
}

function emptyStats(): StrikeStats {
  return { sigLanded: 0, sigAttempted: 0, totalLanded: 0, totalAttempted: 0, head: 0, body: 0, leg: 0, distance: 0, clinch: 0, ground: 0, kd: 0, tdLanded: 0, tdAttempted: 0, subAttempts: 0, ctrlSec: 0 };
}

function effective(sf: SimFighter, month: number): Hidden {
  const age = (month - sf.birthMonth) / 12;
  const h = { ...sf.hidden };
  const growth = age < 28 ? -(28 - age) * 1.4 : 0;
  const decline = age > 32 ? (age - 32) * 2.2 : 0;
  const exp = Math.min(sf.fights, 12) * 0.5;
  h.striking += growth + exp - decline * 0.5;
  h.strDef += growth + exp - decline;
  h.wrestling += growth + exp - decline * 0.4;
  h.grappling += growth + exp;
  h.cardio -= decline;
  h.chin -= decline * 1.2 + sf.koLosses * 2.5;
  h.pace -= decline * 0.6;
  return h;
}

interface Side { h: Hidden; dmg: number; stats: StrikeStats }

function simulateFight(rng: Rng, A: Hidden, B: Hidden, rounds: 3 | 5) {
  const a: Side = { h: A, dmg: 0, stats: emptyStats() };
  const b: Side = { h: B, dmg: 0, stats: emptyStats() };
  const roundStats: RoundStats[] = [];
  const judgeTotals = [[0, 0], [0, 0], [0, 0]];
  let finish: { winner: "a" | "b"; method: Method; round: number; time: number; submission: string | null } | null = null;

  for (let r = 1; r <= rounds && !finish; r++) {
    const ra = emptyStats();
    const rb = emptyStats();
    // Fatigue and adaptation between rounds.
    const fat = (h: Hidden) => clamp(1 - (r - 1) * (100 - h.cardio) / 100 * 0.16, 0.55, 1.05);
    const adj = (h: Hidden) => 1 + (r - 1) * (h.adapt - 60) / 1400;
    const fa = fat(A) * adj(A);
    const fb = fat(B) * adj(B);

    // Wrestling exchanges.
    const tdAtt = (x: Hidden, f: number) => rng.poisson(Math.max(0, (x.wrestling - 38) / 20) * f);
    const tdP = (x: Hidden, y: Hidden) => clamp(0.34 + (x.wrestling - y.tdDef) / 90, 0.06, 0.82);
    ra.tdAttempted = tdAtt(A, fa); ra.tdLanded = rng.binomial(ra.tdAttempted, tdP(A, B));
    rb.tdAttempted = tdAtt(B, fb); rb.tdLanded = rng.binomial(rb.tdAttempted, tdP(B, A));
    const ctrl = (x: Hidden, y: Hidden, tds: number) =>
      tds * rng.range(35, 95) * clamp(0.6 + (x.grappling - y.grappling) / 120 + (x.wrestling - y.tdDef) / 200, 0.25, 1.5);
    ra.ctrlSec = ctrl(A, B, ra.tdLanded);
    rb.ctrlSec = ctrl(B, A, rb.tdLanded);
    const groundCap = 270;
    const groundTotal = ra.ctrlSec + rb.ctrlSec;
    if (groundTotal > groundCap) {
      ra.ctrlSec *= groundCap / groundTotal;
      rb.ctrlSec *= groundCap / groundTotal;
    }
    ra.ctrlSec = Math.round(ra.ctrlSec);
    rb.ctrlSec = Math.round(rb.ctrlSec);
    const clinchSec = Math.round(300 * rng.range(0.05, 0.2));
    const distanceSec = Math.max(0, 300 - ra.ctrlSec - rb.ctrlSec - clinchSec);

    const strike = (s: StrikeStats, x: Hidden, y: Hidden, f: number, ownCtrl: number) => {
      const acc = clamp(0.33 + (x.striking - y.strDef) / 210, 0.2, 0.64) * clamp(f, 0.8, 1.05);
      const distAtt = rng.poisson((distanceSec / 60) * (2.4 + x.pace / 15) * f);
      const clAtt = rng.poisson((clinchSec / 60) * 2.2 * f);
      const grAtt = rng.poisson((ownCtrl / 60) * (1.8 + (x.power + x.grappling) / 70));
      const dist = rng.binomial(distAtt, acc);
      const cl = rng.binomial(clAtt, clamp(acc + 0.14, 0, 0.8));
      const gr = rng.binomial(grAtt, clamp(acc + 0.22, 0, 0.85));
      s.sigAttempted = distAtt + clAtt + grAtt;
      s.distance = dist; s.clinch = cl; s.ground = gr;
      s.sigLanded = dist + cl + gr;
      s.leg = Math.round(dist * x.legKicks * rng.range(0.7, 1.3));
      s.body = Math.round(s.sigLanded * x.bodyWork * rng.range(0.7, 1.3));
      s.head = Math.max(0, s.sigLanded - s.leg - s.body);
      const nonSigAtt = rng.poisson((ownCtrl / 60) * 3 + clinchSec / 60 * 1.5 + 2);
      s.totalAttempted = s.sigAttempted + nonSigAtt;
      s.totalLanded = s.sigLanded + rng.binomial(nonSigAtt, 0.72);
      s.subAttempts = rng.poisson((ownCtrl / 60) * 0.3 * (x.grappling / 65) ** 2.2);
    };
    strike(ra, A, B, fa, ra.ctrlSec);
    strike(rb, B, A, fb, rb.ctrlSec);

    const kd = (s: StrikeStats, x: Hidden, y: Hidden) =>
      rng.poisson(s.head * 0.011 * (x.power / 64) ** 2.2 * (64 / Math.max(30, y.chin)) ** 1.6);
    ra.kd = kd(ra, A, B);
    rb.kd = kd(rb, B, A);
    a.dmg += ra.head * (A.power / 65) + ra.body * 0.4 + ra.kd * 12;
    b.dmg += rb.head * (B.power / 65) + rb.body * 0.4 + rb.kd * 12;

    // Finish checks (who finishes first is random order weighted by threat).
    const koP = (att: Side, s: StrikeStats, def: Hidden) =>
      1 - Math.exp(-(s.kd * 0.5 + Math.max(0, att.dmg - 26) / 120) * (68 / Math.max(30, def.chin)) ** 1.5);
    const subP = (s: StrikeStats, x: Hidden, y: Hidden) =>
      1 - (1 - clamp(0.2 + (x.grappling - y.subDef) / 110, 0.03, 0.55)) ** s.subAttempts;
    const checks: { w: "a" | "b"; method: Method; p: number }[] = [
      { w: "a", method: "KO/TKO", p: koP(a, ra, B) },
      { w: "b", method: "KO/TKO", p: koP(b, rb, A) },
      { w: "a", method: "SUB", p: subP(ra, A, B) },
      { w: "b", method: "SUB", p: subP(rb, B, A) },
    ];
    rng.shuffle(checks);
    for (const c of checks) {
      if (rng.chance(c.p)) {
        const time = Math.round(rng.range(20, 295));
        const k = time / 300;
        for (const s of [ra, rb]) {
          (Object.keys(s) as (keyof StrikeStats)[]).forEach((key) => {
            if (key === "kd" || key === "subAttempts" || key === "tdLanded" || key === "tdAttempted") return;
            s[key] = Math.round(s[key] * k);
          });
        }
        const w = c.w === "a" ? ra : rb;
        if (c.method === "KO/TKO" && w.head === 0) { w.head = 3; w.sigLanded += 3; w.sigAttempted += 4; w.distance += 3; w.totalLanded += 3; w.totalAttempted += 4; }
        if (c.method === "SUB" && w.subAttempts === 0) w.subAttempts = 1;
        finish = { winner: c.w, method: c.method, round: r, time, submission: c.method === "SUB" ? rng.pick(SUBMISSIONS) : null };
        break;
      }
    }

    for (const [side, rs] of [[a, ra], [b, rb]] as const) {
      (Object.keys(rs) as (keyof StrikeStats)[]).forEach((k) => (side.stats[k] += rs[k]));
    }
    roundStats.push({
      round: r,
      red: { sigLanded: ra.sigLanded, sigAttempted: ra.sigAttempted, tdLanded: ra.tdLanded, ctrlSec: ra.ctrlSec, kd: ra.kd },
      blue: { sigLanded: rb.sigLanded, sigAttempted: rb.sigAttempted, tdLanded: rb.tdLanded, ctrlSec: rb.ctrlSec, kd: rb.kd },
    });

    if (!finish) {
      const score = (s: StrikeStats) => s.sigLanded + s.kd * 9 + s.tdLanded * 2.5 + s.ctrlSec / 45 + s.subAttempts * 1.5;
      const diff = score(ra) - score(rb);
      for (const j of judgeTotals) {
        const d = diff + rng.normal(0, 2.6);
        const big = Math.abs(diff) > 22 || ra.kd + rb.kd >= 2;
        if (d >= 0) { j[0] += 10; j[1] += big ? 8 : 9; } else { j[1] += 10; j[0] += big ? 8 : 9; }
      }
    }
  }

  if (finish) return { a: a.stats, b: b.stats, rounds: roundStats, ...finish, scorecards: null as string[] | null };

  const cards = judgeTotals.map(([x, y]) => `${x}-${y}`);
  const aVotes = judgeTotals.filter(([x, y]) => x > y).length;
  const bVotes = judgeTotals.filter(([x, y]) => y > x).length;
  let winner: "a" | "b" | null;
  let method: Method;
  if (aVotes === 3 || bVotes === 3) { winner = aVotes === 3 ? "a" : "b"; method = "U-DEC"; }
  else if (aVotes === 2 && bVotes === 1) { winner = "a"; method = "S-DEC"; }
  else if (bVotes === 2 && aVotes === 1) { winner = "b"; method = "S-DEC"; }
  else if (aVotes === 2 || bVotes === 2) { winner = aVotes === 2 ? "a" : "b"; method = "M-DEC"; }
  else { winner = null; method = "DRAW"; }
  return { a: a.stats, b: b.stats, rounds: roundStats, winner, method, round: rounds, time: 300, submission: null, scorecards: cards };
}

export interface DemoUniverse {
  fighters: Fighter[];
  fights: Fight[];
  events: Event[];
  championships: Championship[];
  /** Hidden style label, exposed only for QA/tests — never shown in UI. */
  archetypes: Map<string, Archetype>;
}

export function buildDemoUniverse(): DemoUniverse {
  const rng = new Rng(SEED);
  const sims: SimFighter[] = [];
  const archetypes = new Map<string, Archetype>();
  const usedNames = new Set<string>();
  const countries = Object.keys(NAME_POOLS);
  const countryWeights: [string, number][] = countries.map((c) => [c, ["USA", "BRA", "RUS"].includes(c) ? 5 : ["ESP", "POL", "GBR", "IRL", "GEO", "MEX", "FRA", "JPN"].includes(c) ? 2.4 : 1]);
  const nicknames = rng.shuffle([...NICKNAMES]);

  let fid = 0;
  for (const div of DIVISIONS) {
    const count = div.sex === "M" ? 21 : 14;
    for (let i = 0; i < count; i++) {
      let country = rng.weighted(countryWeights);
      let pool = NAME_POOLS[country];
      if (div.sex === "F" && pool.f.length === 0) { country = "USA"; pool = NAME_POOLS.USA; }
      let first = "", last = "", tries = 0;
      do {
        first = rng.pick(div.sex === "M" ? pool.m : pool.f);
        last = rng.pick(pool.last);
        tries++;
      } while (usedNames.has(`${first} ${last}`) && tries < 40);
      if (usedNames.has(`${first} ${last}`)) {
        const second = rng.pick(pool.last.filter((l) => l !== last));
        last = `${last}-${second}`;
      }
      usedNames.add(`${first} ${last}`);

      const arch = rng.pick(Object.keys(ARCHETYPES) as Archetype[]);
      const base = ARCHETYPES[arch];
      const talent = rng.normal(0, 7.5);
      const jitter = () => rng.normal(0, 6);
      const hidden: Hidden = {
        striking: clamp(base.striking + talent + jitter(), 25, 97),
        strDef: clamp(base.strDef + talent + jitter(), 25, 97),
        power: clamp(base.power + talent * 0.5 + jitter() + (div.order >= 7 && div.sex === "M" ? 8 : 0), 25, 98),
        wrestling: clamp(base.wrestling + talent + jitter(), 20, 97),
        tdDef: clamp(base.tdDef + talent + jitter(), 25, 97),
        grappling: clamp(base.grappling + talent + jitter(), 20, 97),
        subDef: clamp(base.subDef + talent + jitter(), 25, 97),
        cardio: clamp(base.cardio + talent * 0.4 + jitter() - (div.order >= 7 && div.sex === "M" ? 10 : 0), 30, 97),
        chin: clamp(base.chin + jitter(), 30, 95),
        pace: clamp(base.pace + jitter() - (div.order >= 7 && div.sex === "M" ? 12 : 0) + (div.order <= 2 ? 6 : 0), 25, 98),
        adapt: clamp(60 + talent * 0.8 + rng.normal(0, 10), 25, 97),
        legKicks: base.legKicks,
        bodyWork: base.bodyWork,
      };
      const debut = rng.int(0, 126); // up to mid-2023
      const debutAge = rng.range(21, 28);
      const birthMonth = Math.round(debut - debutAge * 12 - rng.int(0, 11));
      const birthYear = START_YEAR + Math.floor(birthMonth / 12);
      const birthDate = `${birthYear}-${pad((((birthMonth % 12) + 12) % 12) + 1)}-${pad(rng.int(1, 28))}`;

      const heightBase = 150 + div.limitKg * 0.34 + (div.sex === "F" ? -2 : 0);
      const heightCm = Math.round(heightBase + rng.normal(0, 4));
      const reachCm = Math.round(heightCm + rng.normal(2, 5));
      const stance: Stance = rng.weighted([["Orthodox", 0.7], ["Southpaw", 0.22], ["Switch", 0.08]]);
      const tier: 1 | 2 = rng.chance(0.2) ? 1 : 2;
      const orgId = tier === 1 ? rng.weighted(TIER1_WEIGHTS) : regionalOrg(country, div.sex, rng);
      const id = `ftr-${String(++fid).padStart(3, "0")}`;
      let slug = slugify(`${first} ${last}`);
      if (sims.some((s) => s.f.slug === slug)) slug = `${slug}-${fid}`;
      const nickname = rng.chance(0.45) && nicknames.length ? nicknames.pop()! : null;
      const prior = { w: rng.int(tier === 1 ? 7 : 3, tier === 1 ? 13 : 8), l: rng.int(0, 2), d: rng.chance(0.08) ? 1 : 0 };

      const f: Fighter = {
        id, slug, firstName: first, lastName: last, nickname, country, sex: div.sex, birthDate,
        heightCm, reachCm, stance, divisionId: div.id, orgId, status: "active", priorRecord: prior, provenance: "demo",
        photo: { src: `/portraits/${slug}.png`, kind: "illustration", credit: "Retrato ilustrado por FIGHTCORE", updated: DEMO_TODAY },
      };
      archetypes.set(id, arch);
      sims.push({ f, hidden, debut, birthMonth, elo: 1500 + prior.w * 6 - prior.l * 10 + (tier === 1 ? 40 : 0), nextAvailable: debut, tier, lastOpp: null, results: [], orgWins: 0, fights: 0, retired: false, koLosses: 0 });
    }
  }

  const byId = new Map(sims.map((s) => [s.f.id, s]));
  const fights: Fight[] = [];
  const eventsByKey = new Map<string, Event>();
  const eventCountByOrg = new Map<string, number>();
  const champions = new Map<string, { fighterId: string; since: number; lastDefense: number; champ: Championship }>();
  const championships: Championship[] = [];
  let fightSeq = 0;

  const eventFor = (orgId: string, month: number): Event => {
    const cadence = CADENCE[orgId] ?? 6;
    const period = Math.floor(month / cadence);
    const key = `${orgId}:${period}`;
    let ev = eventsByKey.get(key);
    if (!ev) {
      const lastMonth = Math.min(period * cadence + cadence - 1, END_MONTH);
      const { y, mo } = monthToYM(lastMonth);
      const orgIdx = orgId.charCodeAt(0) + orgId.length;
      const date = saturdayOf(y, mo, (orgIdx + period) % 4);
      const n = (eventCountByOrg.get(orgId) ?? 0) + 1;
      eventCountByOrg.set(orgId, n);
      const rngE = new Rng(SEED ^ (period * 7919 + orgIdx * 104729));
      const place = orgId === "ksw" ? { city: "Varsovia", country: "POL" }
        : orgId === "oktagon" ? { city: "Praga", country: "CZE" }
        : orgId === "rizin" ? { city: "Tokio", country: "JPN" }
        : orgId === "one" ? rngE.pick([{ city: "Singapur", country: "SGP" }, { city: "Bangkok", country: "THA" }, { city: "Tokio", country: "JPN" }])
        : orgId === "brave" ? rngE.pick([{ city: "Manama", country: "BHR" }, { city: "Abu Dabi", country: "ARE" }])
        : ["wowfc", "warmma"].includes(orgId) ? rngE.pick([{ city: "Madrid", country: "ESP" }, { city: "Barcelona", country: "ESP" }, { city: "Bilbao", country: "ESP" }])
        : orgId === "cw" ? rngE.pick([{ city: "Londres", country: "GBR" }, { city: "Glasgow", country: "GBR" }, { city: "Dublín", country: "IRL" }])
        : rngE.pick(CITIES);
      const org = orgId.toUpperCase();
      const label = { wowfc: "WOW FC", warmma: "WAR MMA", cw: "Cage Warriors", oktagon: "OKTAGON", invicta: "Invicta" }[orgId] ?? org;
      ev = {
        id: `evt-${orgId}-${n}`,
        slug: slugify(`${label} demo ${n} ${place.city}`),
        name: `${label} Demo ${n}`,
        orgId, date, city: place.city, country: place.country, venue: null,
        status: date <= DEMO_TODAY ? "completed" : "upcoming",
        fightIds: [], provenance: "demo",
      };
      eventsByKey.set(key, ev);
    }
    return ev;
  };

  const ageAt = (s: SimFighter, month: number) => (month - s.birthMonth) / 12;

  const makeFight = (red: SimFighter, blue: SimFighter, month: number, orgId: string, title: boolean) => {
    const ev = eventFor(orgId, month);
    const rounds: 3 | 5 = title ? 5 : 3;
    const id = `fgt-${String(++fightSeq).padStart(5, "0")}`;
    const base: Fight = {
      id, eventId: ev.id, date: ev.date, orgId, divisionId: red.f.divisionId, redId: red.f.id, blueId: blue.f.id,
      status: ev.status === "completed" ? "completed" : "scheduled",
      winnerId: null, method: null, submission: null, round: null, time: null, scheduledRounds: rounds,
      titleFight: title, slot: "prelims", order: 0, red: null, blue: null, rounds: [], scorecards: null,
      redStrengthPre: Math.round(red.elo), blueStrengthPre: Math.round(blue.elo), provenance: "demo",
    };
    ev.fightIds.push(id);
    const [ey, em] = ev.date.split("-").map(Number);
    const evMonth = (ey - START_YEAR) * 12 + (em - 1);
    red.nextAvailable = evMonth + rng.int(3, 7);
    blue.nextAvailable = evMonth + rng.int(3, 7);
    red.lastOpp = blue.f.id;
    blue.lastOpp = red.f.id;

    if (base.status === "completed") {
      const res = simulateFight(rng, effective(red, evMonth), effective(blue, evMonth), rounds);
      base.red = res.a; base.blue = res.b; base.rounds = res.rounds;
      base.method = res.method; base.round = res.round; base.time = res.time; base.submission = res.submission;
      base.scorecards = res.scorecards;
      base.winnerId = res.winner === "a" ? red.f.id : res.winner === "b" ? blue.f.id : null;
      // Rare no-contests keep the data honest about edge cases.
      if (rng.chance(0.008)) { base.method = "NC"; base.winnerId = null; }

      const sa = base.winnerId === red.f.id ? 1 : base.winnerId === blue.f.id ? 0 : 0.5;
      const ea = 1 / (1 + 10 ** ((blue.elo - red.elo) / 400));
      const k = (title ? 48 : 36) * (base.method === "KO/TKO" || base.method === "SUB" ? 1.15 : 1);
      if (base.method !== "NC") {
        red.elo += k * (sa - ea);
        blue.elo += k * (1 - sa - (1 - ea));
      }
      for (const [s, o] of [[red, "red"], [blue, "blue"]] as const) {
        s.fights++;
        if (base.method === "NC") continue;
        const won = base.winnerId === s.f.id;
        const draw = base.winnerId === null;
        s.results.push(won ? "W" : draw ? "D" : "L");
        if (won && s.tier === 1) s.orgWins++;
        if (!won && !draw && base.method === "KO/TKO") { s.koLosses++; s.nextAvailable += 2; }
        void o;
      }

      if (title) {
        const key = `${orgId}:${red.f.divisionId}`;
        const cur = champions.get(key);
        const winner = base.winnerId ? byId.get(base.winnerId)! : null;
        if (winner && (!cur || cur.fighterId !== winner.f.id)) {
          if (cur) cur.champ.to = ev.date;
          const champ: Championship = { orgId, divisionId: red.f.divisionId, fighterId: winner.f.id, wonFightId: id, from: ev.date, to: null, defenses: 0 };
          championships.push(champ);
          champions.set(key, { fighterId: winner.f.id, since: evMonth, lastDefense: evMonth, champ });
        } else if (winner && cur) {
          cur.champ.defenses++;
          cur.lastDefense = evMonth;
        } else if (cur) {
          cur.lastDefense = evMonth;
        }
      }

      // Career movement: promotion, release, retirement.
      for (const s of [red, blue]) {
        const last4 = s.results.slice(-4);
        const streak = (() => { let n = 0; for (let i = s.results.length - 1; i >= 0 && s.results[i] === "W"; i--) n++; return n; })();
        const holdsRegionalBelt = [...champions.values()].some((c) => c.fighterId === s.f.id && c.champ.defenses < 1);
        if (s.tier === 2 && !holdsRegionalBelt && (streak >= 3 || (s.fights >= 4 && streak >= 2 && s.elo > 1560))) {
          vacateIfChampion(s, ev.date); // a regional belt is left behind on promotion
          s.tier = 1;
          s.f.orgId = pickTier1(s);
          s.orgWins = 0;
        } else if (s.tier === 1 && last4.length >= 4 && last4.filter((r) => r === "L").length >= 3) {
          vacateIfChampion(s, ev.date);
          s.tier = 2;
          s.f.orgId = regionalOrg(s.f.country, s.f.sex, rng);
        }
        const age = ageAt(s, evMonth);
        const recentLosses = s.results.slice(-3).filter((r) => r === "L").length;
        if ((age > 37 && rng.chance(0.4)) || (age > 34 && recentLosses >= 2 && rng.chance(0.45)) || s.fights > 26 || (s.koLosses >= 4 && rng.chance(0.5))) {
          s.retired = true;
          s.f.status = "retired";
          vacateIfChampion(s, ev.date);
        }
      }
    }
    fights.push(base);
    return base;
  };

  const vacateIfChampion = (s: SimFighter, date: string) => {
    for (const [key, cur] of champions) {
      if (cur.fighterId === s.f.id) {
        cur.champ.to = date;
        champions.delete(key);
      }
    }
  };

  /** Signing: majors compete for talent, so thin rosters are more likely to sign. */
  function pickTier1(s: SimFighter): string {
    const weights: [string, number][] = TIER1.map((o) => {
      const roster = sims.filter((x) => !x.retired && x.tier === 1 && x.f.orgId === o && x.f.divisionId === s.f.divisionId).length;
      const base = o === "ufc" ? 1.5 : 1;
      return [o, base / (1 + roster * 0.9)];
    });
    return rng.weighted(weights);
  }

  // Tier-1 fighters who sit idle too long in a thin roster sign where the division is deepest.
  const rebalance = (month: number) => {
    for (const s of sims) {
      if (s.retired || s.tier !== 1 || month < s.debut) continue;
      if (month - s.nextAvailable > 12 && ![...champions.values()].some((c) => c.fighterId === s.f.id)) {
        const mates = (o: string) => sims.filter((x) => x !== s && !x.retired && x.tier === 1 && x.f.orgId === o && x.f.divisionId === s.f.divisionId).length;
        if (mates(s.f.orgId) >= 2) continue;
        const target = [...TIER1].sort((a, b) => mates(b) - mates(a))[0];
        if (target === s.f.orgId) continue;
        vacateIfChampion(s, `${monthToYM(month).y}-${pad(monthToYM(month).mo)}-01`);
        s.f.orgId = target;
      }
    }
  };

  for (let month = 0; month <= END_MONTH; month++) {
    if (month % 3 === 0) rebalance(month);
    for (const div of DIVISIONS) {
      const available = sims.filter((s) => !s.retired && s.f.divisionId === div.id && month >= s.debut && month >= s.nextAvailable);
      if (available.length < 2) continue;
      // Group by matchmaking pool: tier-1 by org, tier-2 as a shared regional circuit.
      const pools = new Map<string, SimFighter[]>();
      for (const s of available) {
        const key = s.tier === 1 ? s.f.orgId : "regional";
        if (!pools.has(key)) pools.set(key, []);
        pools.get(key)!.push(s);
      }
      for (const [poolKey, pool] of pools) {
        const taken = new Set<string>();
        // Regional belts: title fights between fighters of the same regional promotion.
        if (poolKey === "regional" && month >= 18) {
          const byOrg = new Map<string, SimFighter[]>();
          for (const s of pool) { if (!byOrg.has(s.f.orgId)) byOrg.set(s.f.orgId, []); byOrg.get(s.f.orgId)!.push(s); }
          for (const [orgId, members] of byOrg) {
            const key = `${orgId}:${div.id}`;
            const cur = champions.get(key);
            const contenders = members.filter((s) => s.fights >= 2 && s.results.at(-1) === "W" && !taken.has(s.f.id)).sort((x, y) => y.elo - x.elo);
            if (cur) {
              const champ = members.find((s) => s.f.id === cur.fighterId);
              const challenger = contenders.find((c) => c.f.id !== cur.fighterId && c.f.id !== champ?.lastOpp);
              if (champ && challenger && month - cur.lastDefense >= 5 && rng.chance(0.7)) {
                makeFight(champ, challenger, month, orgId, true);
                taken.add(champ.f.id); taken.add(challenger.f.id);
              }
            } else if (contenders.length >= 2 && rng.chance(0.45)) {
              makeFight(contenders[0], contenders[1], month, orgId, true);
              taken.add(contenders[0].f.id); taken.add(contenders[1].f.id);
            }
          }
        }
        // Title fights first.
        if (poolKey !== "regional" && month >= 12) {
          const key = `${poolKey}:${div.id}`;
          const cur = champions.get(key);
          const contenders = pool.filter((s) => s.orgWins >= 1 && s.results.at(-1) === "W").sort((x, y) => y.elo - x.elo);
          if (cur) {
            const champ = pool.find((s) => s.f.id === cur.fighterId);
            const challenger = contenders.find((c) => c.f.id !== cur.fighterId && c.f.id !== champ?.lastOpp);
            if (champ && challenger && month - cur.lastDefense >= 5) {
              makeFight(champ, challenger, month, poolKey, true);
              taken.add(champ.f.id); taken.add(challenger.f.id);
            }
          } else if (contenders.length >= 2 && rng.chance(0.8)) {
            makeFight(contenders[0], contenders[1], month, poolKey, true);
            taken.add(contenders[0].f.id); taken.add(contenders[1].f.id);
          }
        }
        const rest = pool.filter((s) => !taken.has(s.f.id) && !Array.from(champions.values()).some((c) => c.fighterId === s.f.id) && rng.chance(0.62));
        rest.sort((x, y) => y.elo + rng.normal(0, 60) - (x.elo + rng.normal(0, 60)));
        for (let i = 0; i + 1 < rest.length; i += 2) {
          const x = rest[i];
          let j = i + 1;
          if (x.lastOpp === rest[j].f.id && j + 1 < rest.length) { [rest[j], rest[j + 1]] = [rest[j + 1], rest[j]]; }
          const y = rest[j];
          const [red, blue] = x.elo >= y.elo ? [x, y] : [y, x];
          const orgId = poolKey === "regional" ? (rng.chance(0.5) ? red.f.orgId : blue.f.orgId) : poolKey;
          makeFight(red, blue, month, orgId, false);
        }
      }
    }
  }

  // Inactivity status.
  const todayMonth = (2026 - START_YEAR) * 12 + 8;
  for (const s of sims) {
    if (s.retired) continue;
    const last = fights.filter((f) => f.status === "completed" && (f.redId === s.f.id || f.blueId === s.f.id)).at(-1);
    const upcoming = fights.some((f) => f.status === "scheduled" && (f.redId === s.f.id || f.blueId === s.f.id));
    if (!last && !upcoming) continue;
    if (last && !upcoming) {
      const [y, m] = last.date.split("-").map(Number);
      if (todayMonth - ((y - START_YEAR) * 12 + m - 1) > 18) s.f.status = "inactive";
    }
  }

  // Card order: title fights and strongest pairings headline.
  const events = Array.from(eventsByKey.values()).filter((e) => e.fightIds.length > 0).sort((a, b) => a.date.localeCompare(b.date));
  const fightById = new Map(fights.map((f) => [f.id, f]));
  for (const ev of events) {
    const card = ev.fightIds.map((id) => fightById.get(id)!);
    card.sort((a, b) => Number(b.titleFight) - Number(a.titleFight) || b.redStrengthPre + b.blueStrengthPre - (a.redStrengthPre + a.blueStrengthPre));
    card.forEach((f, i) => {
      f.order = i + 1;
      f.slot = i === 0 ? "main" : i === 1 ? "co-main" : i < 5 ? "main-card" : "prelims";
    });
    ev.fightIds = card.map((f) => f.id);
  }

  // Current division/org reflect the latest bout.
  for (const s of sims) {
    const last = fights.filter((f) => f.redId === s.f.id || f.blueId === s.f.id).at(-1);
    if (last && s.tier === 1) s.f.orgId = last.orgId;
  }

  return { fighters: sims.map((s) => s.f), fights, events, championships, archetypes };
}
