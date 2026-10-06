import "server-only";
/**
 * Read API used by pages. Returns view models only — UI never touches the
 * store directly, so a real backend can implement this same surface.
 */
import { cache } from "react";
import { countryByCode, divisionById, DIVISIONS, HISTORY, orgById, ORGANIZATIONS } from "../domain/reference";
import type { Division, Event, Fight, Fighter, FighterBout, Outcome, StrikeStats } from "../domain/types";
import { computeRating, strength01, type RatingResult } from "../rating/model";
import { buildInsights } from "../analytics/insights";
import { scoutingReport } from "../analytics/report";
import { careerStats, roundProfile, type CareerStats, recordOf } from "../analytics/career";
import { ATTRIBUTES } from "../analytics/attributes";
import { finishRounds, roundLines, styleOf, vsStyles, zoneEdges, STYLE_LABEL } from "../analytics/scout";
import { interactions } from "../analytics/matchup";
import { DATASET, store, TODAY } from "./store";

export { DATASET, TODAY };

/** Provenance tag for facts in the active dataset, and how the UI names it. */
export const IS_DEMO = DATASET.kind === "demo";
export const SRC: "demo" | "imported" = IS_DEMO ? "demo" : "imported";
export const DATA_LABEL = IS_DEMO ? "Datos de demostración" : "Datos reales de UFC y otras 12 organizaciones";

export interface FighterSummary {
  id: string;
  slug: string;
  name: string;
  firstName: string;
  lastName: string;
  nickname: string | null;
  country: string | null;
  countryName: string | null;
  divisionId: string;
  division: string;
  divisionShort: string;
  org: string;
  orgName: string;
  status: Fighter["status"];
  age: number | null;
  /** Professional record when the total is known; otherwise the covered (UFC) record. */
  record: { w: number; l: number; d: number; nc: number };
  recordScope: "pro" | "covered";
  rating: number;
  band: number;
  provisional: boolean;
  rank: number | null;
  champion: boolean;
  /** Current title, when champion. */
  title: { org: string; division: string; since: string; defenses: number } | null;
  form: Outcome[];
  photo: Fighter["photo"];
  /** Every covered outcome, oldest first (feeds the dossier barcode). */
  career: Outcome[];
  lastFight: string | null;
  bouts: number;
  /** Bouts with a box score; scouting tools need at least three. */
  statBouts: number;
}

const ageOn = (birth: string | null, on: string) => {
  if (!birth) return null;
  const b = new Date(birth), d = new Date(on);
  let a = d.getUTCFullYear() - b.getUTCFullYear();
  if (d.getUTCMonth() < b.getUTCMonth() || (d.getUTCMonth() === b.getUTCMonth() && d.getUTCDate() < b.getUTCDate())) a--;
  return a;
};

export const fullName = (f: Pick<Fighter, "firstName" | "lastName">) => `${f.firstName} ${f.lastName}`.trim();

const DAY = 86_400_000;
const daysBefore = (date: string, days: number) => new Date(Date.parse(date) - days * DAY).toISOString().slice(0, 10);

function completed(id: string): FighterBout[] {
  return store().bouts.get(id)!.filter((b) => b.fight.status === "completed");
}

/** Ranking eligibility at a date: ≥3 bouts, active in the last 540 days, not retired before it. */
function eligible(f: Fighter, asOf: string) {
  const b = completed(f.id).filter((x) => x.fight.date <= asOf && x.outcome !== "NC");
  if (b.length < 3) return false;
  const last = b[b.length - 1].fight.date;
  if (Date.parse(asOf) - Date.parse(last) > 540 * DAY) return false;
  if (asOf === TODAY && f.status !== "active") return false;
  return true;
}

// Memoised per store, not with React's cache(): route handlers (the search
// index) run outside a request scope, where cache() does not memoise.
const rankingMemo = new WeakMap<object, Map<string, Map<string, { id: string; rating: RatingResult }[]>>>();
const divisionRankings = (asOf: string) => {
  const s = store();
  let byDate = rankingMemo.get(s);
  if (!byDate) rankingMemo.set(s, (byDate = new Map()));
  const hit = byDate.get(asOf);
  if (hit) return hit;
  const out = new Map<string, { id: string; rating: RatingResult }[]>();
  for (const d of DIVISIONS) {
    const rows = s.fighters
      .filter((f) => f.divisionId === d.id && eligible(f, asOf))
      .map((f) => ({ id: f.id, rating: asOf === TODAY ? s.rating.get(f.id)! : computeRating(s.bouts.get(f.id)!, asOf, { isChampion: false }) }))
      .sort((a, b) => b.rating.value - a.rating.value);
    out.set(d.id, rows);
  }
  byDate.set(asOf, out);
  return out;
};

function rankOf(id: string, divisionId: string): number | null {
  const rows = divisionRankings(TODAY).get(divisionId) ?? [];
  const i = rows.findIndex((r) => r.id === id);
  return i >= 0 ? i + 1 : null;
}

export function summary(id: string): FighterSummary {
  const s = store();
  const f = s.fighterById.get(id)!;
  const st = s.stats.get(id)!;
  const r = s.rating.get(id)!;
  const div = divisionById.get(f.divisionId)!;
  const org = orgById.get(f.orgId)!;
  const b = completed(id);
  return {
    id, slug: f.slug, name: fullName(f), firstName: f.firstName, lastName: f.lastName, nickname: f.nickname,
    country: f.country, countryName: f.country ? countryByCode.get(f.country)?.name ?? f.country : null,
    divisionId: div.id, division: div.name, divisionShort: div.short, org: org.short, orgName: org.name,
    status: f.status, age: ageOn(f.birthDate, TODAY),
    record: {
      w: st.record.w + (f.priorRecord?.w ?? 0),
      l: st.record.l + (f.priorRecord?.l ?? 0),
      d: st.record.d + (f.priorRecord?.d ?? 0),
      nc: st.record.nc,
    },
    recordScope: f.priorRecord ? "pro" : "covered",
    rating: r.value, band: r.band, provisional: r.provisional,
    rank: rankOf(id, f.divisionId),
    champion: s.champions.has(id),
    title: (() => {
      const c = s.champions.get(id);
      return c ? { org: orgById.get(c.orgId)!.short, division: divisionById.get(c.divisionId)!.name, since: c.from, defenses: c.defenses } : null;
    })(),
    form: b.slice(-5).map((x) => x.outcome!).filter(Boolean),
    career: b.map((x) => x.outcome!).filter(Boolean),
    photo: f.photo,
    lastFight: b.at(-1)?.fight.date ?? null,
    bouts: st.bouts,
    statBouts: st.statBouts,
  };
}

export const listFighters = cache((): FighterSummary[] => store().fighters.map((f) => summary(f.id)));

export function getFighterBySlug(slug: string) {
  return store().fighterBySlug.get(slug) ?? null;
}

export function allFighterSlugs() {
  return store().fighters.map((f) => f.slug);
}

/** Profiles rendered at build time: active fighters and anyone who held a belt. The rest render on first request. */
export function prerenderFighterSlugs() {
  const s = store();
  const belt = new Set(s.championships.map((c) => c.fighterId));
  return s.fighters.filter((f) => f.status === "active" || belt.has(f.id)).map((f) => f.slug);
}

/* ─────────────────────────── Fights & events ─────────────────────────── */

export interface FightView {
  fight: Fight;
  event: Event;
  eventOrg: string;
  division: Division;
  red: FighterSummary;
  blue: FighterSummary;
}

export function fightView(fight: Fight): FightView {
  const s = store();
  return {
    fight,
    event: s.eventById.get(fight.eventId)!,
    eventOrg: orgById.get(fight.orgId)!.short,
    division: divisionById.get(fight.divisionId)!,
    red: summary(fight.redId),
    blue: summary(fight.blueId),
  };
}

export function getFight(id: string) {
  const f = store().fightById.get(id);
  return f ? fightView(f) : null;
}

export function fightRoundProfile(fight: Fight) {
  return fight.rounds;
}

export interface EventView {
  event: Event;
  org: { id: string; short: string; name: string };
  countryName: string;
  fights: FightView[];
}

export function eventView(e: Event): EventView {
  const s = store();
  const org = orgById.get(e.orgId)!;
  return {
    event: e,
    org: { id: org.id, short: org.short, name: org.name },
    countryName: countryByCode.get(e.country)?.name ?? e.country,
    fights: e.fightIds.map((id) => fightView(s.fightById.get(id)!)),
  };
}

export function getEventBySlug(slug: string) {
  const e = store().eventBySlug.get(slug);
  return e ? eventView(e) : null;
}

export function upcomingEvents(limit = 6): EventView[] {
  return store().events.filter((e) => e.status === "upcoming").slice(0, limit).map(eventView);
}

export function recentEvents(limit = 12): EventView[] {
  return store().events.filter((e) => e.status === "completed").slice(-limit).reverse().map(eventView);
}

export function listEvents() {
  return store().events.map((e) => ({
    ...e,
    orgShort: orgById.get(e.orgId)!.short,
    countryName: countryByCode.get(e.country)?.name ?? e.country,
    main: e.fightIds[0] ? (() => {
      const f = store().fightById.get(e.fightIds[0])!;
      return { id: f.id, red: store().fighterById.get(f.redId)!.lastName, blue: store().fighterById.get(f.blueId)!.lastName, title: f.titleFight };
    })() : null,
  }));
}

export function recentResults(limit = 8): FightView[] {
  const s = store();
  return [...s.fights]
    .filter((f) => f.status === "completed")
    .sort((a, b) => b.date.localeCompare(a.date) || a.order - b.order)
    .filter((f) => f.slot === "main" || f.slot === "co-main" || f.titleFight)
    .slice(0, limit)
    .map(fightView);
}

/** Featured fight: next scheduled bout with the highest combined rating. */
export function featuredFight(): FightView | null {
  const s = store();
  const next = s.fights.filter((f) => f.status === "scheduled");
  if (!next.length) return null;
  const best = next.sort((a, b) => {
    const score = (f: Fight) => (s.rating.get(f.redId)!.value + s.rating.get(f.blueId)!.value) + (f.titleFight ? 40 : 0);
    return score(b) - score(a);
  })[0];
  return fightView(best);
}

/* ─────────────────────────── Rankings ─────────────────────────── */

export interface RankingRow {
  rank: number;
  previous: number | null;
  movement: "up" | "down" | "same" | "new";
  delta: number;
  fighter: FighterSummary;
  rating: number;
  band: number;
}

export const RANKING_LOOKBACK_DAYS = 120;

export function divisionRanking(divisionId: string, limit = 15): RankingRow[] {
  const now = divisionRankings(TODAY).get(divisionId) ?? [];
  const before = divisionRankings(daysBefore(TODAY, RANKING_LOOKBACK_DAYS)).get(divisionId) ?? [];
  return now.slice(0, limit).map((r, i) => {
    const p = before.findIndex((x) => x.id === r.id);
    const previous = p >= 0 ? p + 1 : null;
    const rank = i + 1;
    return {
      rank, previous,
      movement: previous === null ? "new" : previous > rank ? "up" : previous < rank ? "down" : "same",
      delta: previous === null ? 0 : previous - rank,
      fighter: summary(r.id), rating: r.rating.value, band: r.rating.band,
    };
  });
}

export function poundForPound(sex: "M" | "F" = "M", limit = 15): RankingRow[] {
  const flat = (asOf: string) => DIVISIONS.filter((d) => d.sex === sex)
    .flatMap((d) => divisionRankings(asOf).get(d.id) ?? [])
    .sort((a, b) => b.rating.value - a.rating.value);
  const now = flat(TODAY);
  const before = flat(daysBefore(TODAY, RANKING_LOOKBACK_DAYS));
  return now.slice(0, limit).map((r, i) => {
    const p = before.findIndex((x) => x.id === r.id);
    const previous = p >= 0 ? p + 1 : null;
    return {
      rank: i + 1, previous,
      movement: previous === null ? "new" : previous > i + 1 ? "up" : previous < i + 1 ? "down" : "same",
      delta: previous === null ? 0 : previous - (i + 1),
      fighter: summary(r.id), rating: r.rating.value, band: r.rating.band,
    };
  });
}

export function currentChampions() {
  const s = store();
  return [...s.champions.values()].map((c) => ({
    ...c,
    org: orgById.get(c.orgId)!.short,
    division: divisionById.get(c.divisionId)!,
    fighter: summary(c.fighterId),
  })).sort((a, b) => a.org.localeCompare(b.org) || a.division.order - b.division.order);
}

/* ─────────────────────────── Style signature ─────────────────────────── */

export const STYLE_DIMS = [
  { key: "distance", label: "Golpeo a distancia", basis: "Golpes sig. por minuto a distancia" },
  { key: "clinch", label: "Clinch", basis: "Golpes sig. por minuto en clinch" },
  { key: "takedowns", label: "Derribos", basis: "Derribos por 15 minutos" },
  { key: "control", label: "Control arriba", basis: "% del tiempo en posición de control" },
  { key: "submissions", label: "Sumisiones", basis: "Intentos de sumisión por 15 minutos" },
  { key: "gnp", label: "Ground & pound", basis: "Golpes sig. por minuto en el suelo" },
  { key: "legs", label: "Trabajo de piernas", basis: "Golpes sig. a la pierna por minuto" },
  { key: "pace", label: "Ritmo", basis: "Golpes sig. intentados por minuto" },
] as const;
export type StyleKey = (typeof STYLE_DIMS)[number]["key"];

const styleSignatures = cache(() => {
  const s = store();
  const pop = s.fighters.filter((f) => s.stats.get(f.id)!.statBouts >= 3).map((f) => {
    const c = s.stats.get(f.id)!;
    const raw: Record<StyleKey, number> = {
      distance: c.slpm * c.position.distance, clinch: c.slpm * c.position.clinch, takedowns: c.tdAvg, control: c.ctrlShare,
      submissions: c.subAvg, gnp: c.slpm * c.position.ground, legs: c.slpm * c.target.leg, pace: c.sigAttPerMin,
    };
    return { id: f.id, raw };
  });
  const out = new Map<string, Record<StyleKey, number>>();
  for (const d of STYLE_DIMS) {
    const sorted = pop.map((p) => p.raw[d.key]).sort((a, b) => a - b);
    for (const p of pop) {
      const rank = sorted.findIndex((v) => v >= p.raw[d.key]);
      const cur = out.get(p.id) ?? ({} as Record<StyleKey, number>);
      cur[d.key] = Math.round((rank / Math.max(1, sorted.length - 1)) * 100);
      out.set(p.id, cur);
    }
  }
  return out;
});

/* ─────────────────────────── Fighter profile ─────────────────────────── */

export interface BoutRow {
  fightId: string;
  date: string;
  event: { slug: string; name: string; org: string; city: string };
  opponent: FighterSummary;
  outcome: Outcome | null;
  method: string | null;
  submission: string | null;
  round: number | null;
  time: number | null;
  title: boolean;
  slot: Fight["slot"];
  division: string;
  ratingBefore: number | null;
  ratingAfter: number | null;
  sigFor: number | null;
  sigAgainst: number | null;
  tdFor: number | null;
  oppStrength: number;
}

export function fighterProfile(slug: string) {
  const s = store();
  const f = s.fighterBySlug.get(slug);
  if (!f) return null;
  const me = summary(f.id);
  const bouts = s.bouts.get(f.id)!;
  const done = bouts.filter((b) => b.fight.status === "completed");
  const hist = s.ratingHistory.get(f.id)!;
  const st = s.stats.get(f.id)!;

  const rows: BoutRow[] = done.map((b, i) => ({
    fightId: b.fight.id,
    date: b.fight.date,
    event: { slug: b.event.slug, name: b.event.name, org: orgById.get(b.fight.orgId)!.short, city: b.event.city },
    opponent: summary(b.opponentId),
    outcome: b.outcome,
    method: b.fight.method,
    submission: b.fight.submission,
    round: b.fight.round,
    time: b.fight.time,
    title: b.fight.titleFight,
    slot: b.fight.slot,
    division: divisionById.get(b.fight.divisionId)!.short,
    ratingBefore: i > 0 ? hist[i - 1]?.value ?? null : null,
    ratingAfter: hist[i]?.value ?? null,
    sigFor: b.own?.sigLanded ?? null,
    sigAgainst: b.opp?.sigLanded ?? null,
    tdFor: b.own?.tdLanded ?? null,
    oppStrength: Math.round(strength01(b.oppStrengthPre) * 100),
  }));

  const orgBouts = done.filter((b) => b.fight.orgId === f.orgId);
  const divBouts = done.filter((b) => b.fight.divisionId === f.divisionId);
  const upcoming = bouts.filter((b) => b.fight.status === "scheduled").map((b) => fightView(b.fight));

  // Division baseline: mean career stats of ranked-eligible peers.
  const peers = s.fighters.filter((p) => p.divisionId === f.divisionId && (s.stats.get(p.id)?.statBouts ?? 0) >= 3).map((p) => s.stats.get(p.id)!);
  const last5 = done.slice(-5);

  // Opponents' own career averages — "how good were the people he did this against?"
  const oppStats = [...new Set(done.map((b) => b.opponentId))].map((id) => s.stats.get(id)!).filter((x) => x.statBouts >= 3);

  // Division attribute baseline.
  const divPeers = s.fighters.filter((p) => p.divisionId === f.divisionId && s.attributes.has(p.id)).map((p) => s.attributes.get(p.id)!);
  const divisionAttributes = divPeers.length
    ? (Object.fromEntries(ATTRIBUTES.map((a) => [a.key, Math.round(divPeers.reduce((acc, x) => acc + x[a.key], 0) / divPeers.length)])) as Record<(typeof ATTRIBUTES)[number]["key"], number>)
    : null;

  // Evolution: rolling three-bout form of key outputs.
  const evolution = done.map((b, i) => {
    const win = done.slice(Math.max(0, i - 2), i + 1);
    const cs = careerStats(win);
    const last24 = done.filter((x) => x.fight.date <= b.fight.date && Date.parse(b.fight.date) - Date.parse(x.fight.date) <= 730 * DAY).length;
    return {
      date: b.fight.date,
      fightId: b.fight.id,
      outcome: b.outcome,
      opponent: fullName(s.fighterById.get(b.opponentId)!),
      rating: hist[i]?.value ?? 0,
      slpm: cs.slpm,
      strAcc: cs.strAcc * 100,
      strDef: cs.strDef * 100,
      tdAvg: cs.tdAvg,
      ctrl: cs.ctrlShare * 100,
      finish: cs.finishRate * 100,
      activity: last24,
    };
  });

  const orgIds = [...new Set(done.map((b) => b.fight.orgId))];
  const numbersStyle = (() => { const t = styleOf(s.attributes.get(f.id)); return t ? { striker: "Golpeador", wrestler: "Luchador (wrestling)", grappler: "Especialista en suelo", balanced: "Completo" }[t] : null; })();
  const ranked = divisionRankings(TODAY).get(f.divisionId) ?? [];
  const report = scoutingReport({
    name: fullName(f), lastName: f.lastName, division: divisionById.get(f.divisionId)!.name,
    stats: st, division_: peers.length >= 5 ? averageStats(peers) : null,
    opponentQuality: s.rating.get(f.id)!.factors.opponentQuality,
    ratingTrend: hist.length >= 4 ? hist[hist.length - 1].value - hist[hist.length - 4].value : null,
    rank: me.rank, divisionSize: ranked.length,
    daysSinceLast: me.lastFight ? (Date.parse(TODAY) - Date.parse(me.lastFight)) / DAY : null,
    styleLabel: numbersStyle,
    statOrgs: orgIds.filter((id) => done.some((b) => b.fight.orgId === id && b.own)).map((id) => orgById.get(id)!.short),
    resultOnlyOrgs: orgIds.filter((id) => !done.some((b) => b.fight.orgId === id && b.own)).map((id) => orgById.get(id)!.short),
  });

  const peak = hist.reduce<{ value: number; date: string } | null>((m, p) => (!m || p.value > m.value ? { value: p.value, date: p.date } : m), null);

  return {
    fighter: f,
    summary: me,
    rating: s.rating.get(f.id)!,
    ratingHistory: hist,
    peak,
    attributes: s.attributes.get(f.id) ?? null,
    stats: st,
    baselines: {
      division: averageStats(peers),
      last5: careerStats(last5),
      opponents: averageStats(oppStats),
    },
    divisionAttributes,
    evolution,
    style: styleSignatures().get(f.id) ?? null,
    divisionSize: ranked.length,
    rivalsToCompare: ranked.filter((r) => r.id !== f.id).slice(0, 3).map((r) => summary(r.id)),
    records: {
      career: me.record,
      prior: f.priorRecord,
      covered: st.record,
      org: { org: orgById.get(f.orgId)!.short, ...recordOf(orgBouts) },
      division: { division: divisionById.get(f.divisionId)!.name, ...recordOf(divBouts) },
    },
    bouts: rows,
    upcoming,
    insights: buildInsights(done),
    rounds: roundProfile(done),
    champion: s.champions.get(f.id) ?? null,
    titleHistory: s.championships.filter((c) => c.fighterId === f.id).map((c) => ({ ...c, org: orgById.get(c.orgId)!.short })),
    orgsFought: [...new Set(done.map((b) => orgById.get(b.fight.orgId)!.short))],
    /** Record per organisation, in order of first appearance. */
    orgRecords: [...new Set(done.map((b) => b.fight.orgId))].map((id) => ({ org: orgById.get(id)!.short, orgName: orgById.get(id)!.name, ...recordOf(done.filter((b) => b.fight.orgId === id)) })),
    /** Style read from the numbers (striker / wrestler / grappler / complete), when there are stats. */
    numbersStyle,
    report,
    debut: done[0] ? { date: done[0].fight.date, org: orgById.get(done[0].fight.orgId)!.short } : null,
    birthCountryName: f.birthPlace?.country ? countryByCode.get(f.birthPlace.country)?.name ?? f.birthPlace.country : null,
    /** Division means of height and reach, for "x cm above average". */
    divisionBody: (() => {
      const mates = s.fighters.filter((p) => p.divisionId === f.divisionId && p.status === "active");
      const mean = (xs: number[]) => (xs.length >= 5 ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : null);
      return { height: mean(mates.flatMap((p) => (p.heightCm ? [p.heightCm] : []))), reach: mean(mates.flatMap((p) => (p.reachCm ? [p.reachCm] : []))) };
    })(),
  };
}

function averageStats(list: CareerStats[]) {
  const keys = ["slpm", "sapm", "strAcc", "strDef", "tdAvg", "tdAcc", "tdDef", "subAvg", "kdAvg", "ctrlShare", "sigAttPerMin", "finishRate"] as const;
  const out = {} as Record<(typeof keys)[number], number>;
  for (const k of keys) out[k] = list.length ? list.reduce((a, s) => a + s[k], 0) / list.length : 0;
  return out;
}

export type FighterProfile = NonNullable<ReturnType<typeof fighterProfile>>;

/* ─────────────────────────── Compare ─────────────────────────── */

export function compareData(slugs: string[]) {
  const s = store();
  return slugs
    .map((slug) => s.fighterBySlug.get(slug))
    .filter((f): f is Fighter => Boolean(f))
    .slice(0, 4)
    .map((f) => {
      const st = s.stats.get(f.id)!;
      const done = completed(f.id);
      return {
        summary: summary(f.id),
        rating: s.rating.get(f.id)!,
        history: s.ratingHistory.get(f.id)!.map((p) => ({ date: p.date, value: p.value })),
        attributes: s.attributes.get(f.id) ?? null,
        stats: {
          slpm: st.slpm, sapm: st.sapm, strAcc: st.strAcc, strDef: st.strDef, tdAvg: st.tdAvg, tdAcc: st.tdAcc,
          tdDef: st.tdDef, subAvg: st.subAvg, kdAvg: st.kdAvg, ctrlShare: st.ctrlShare, finishRate: st.finishRate,
          winsBy: st.winsBy, lossesBy: st.lossesBy, minutes: st.minutes, titleRecord: st.titleRecord,
          longestWinStreak: st.longestWinStreak,
        },
        activity: done.filter((b) => Date.parse(TODAY) - Date.parse(b.fight.date) <= 730 * DAY).length,
        opponentQuality: Math.round(done.reduce((a, b) => a + strength01(b.oppStrengthPre), 0) / Math.max(1, done.length) * 100),
        heightCm: f.heightCm, reachCm: f.reachCm, stance: f.stance,
        opponents: done.map((b) => {
          const o = s.fighterById.get(b.opponentId)!;
          return { id: b.opponentId, outcome: b.outcome, name: fullName(o), slug: o.slug };
        }),
      };
    });
}

export type CompareEntry = ReturnType<typeof compareData>[number];

/** Suggested comparison: the top two of a division. */
export function defaultCompareSlugs(): string[] {
  const p4p = poundForPound("M", 2);
  return p4p.map((r) => r.fighter.slug);
}

/* ─────────────────────────── Records ─────────────────────────── */

export interface RecordItem {
  id: string;
  category: string;
  label: string;
  value: string;
  unit: string;
  holder: FighterSummary;
  context: string;
  href: string;
}

const fmtTime = (sec: number) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;

export type RecordScope = { kind: "global" } | { kind: "org"; id: string } | { kind: "division"; id: string };

export function parseRecordScope(raw: string | undefined): RecordScope {
  if (raw?.startsWith("org:") && orgById.has(raw.slice(4))) return { kind: "org", id: raw.slice(4) };
  if (raw?.startsWith("division:") && divisionById.has(raw.slice(9))) return { kind: "division", id: raw.slice(9) };
  return { kind: "global" };
}

/** Records computed over the fights in a scope. Each record links to its evidence. */
export const recordsFor = cache((key: string): RecordItem[] => {
  const scope = parseRecordScope(key);
  const s = store();
  const inScope = (f: Fight) => scope.kind === "global" || (scope.kind === "org" ? f.orgId === scope.id : f.divisionId === scope.id);
  const done = s.fights.filter((f) => f.status === "completed" && inScope(f));
  if (!done.length) return [];
  const items: RecordItem[] = [];
  const ev = (f: Fight) => s.eventById.get(f.eventId)!;
  const secs = (f: Fight) => (f.round! - 1) * 300 + f.time!;

  const fastestOf = (method: string, id: string, label: string) => {
    const f = done.filter((x) => x.method === method && x.winnerId).sort((a, b) => secs(a) - secs(b))[0];
    if (f) items.push({ id, category: "Tiempo", label, value: fmtTime(secs(f)), unit: `R${f.round}`, holder: summary(f.winnerId!), context: `${f.submission ?? f.method} · ${ev(f).name}`, href: `/fights/${f.id}` });
  };
  fastestOf("KO/TKO", "fastest-ko", "KO/TKO más rápido");
  fastestOf("SUB", "fastest-sub", "Sumisión más rápida");

  // Per-fighter tallies within scope.
  const tally = new Map<string, { w: number; fin: number; ko: number; sub: number; titleW: number; streak: number; best: number }>();
  for (const f of [...done].sort((a, b) => a.date.localeCompare(b.date))) {
    for (const id of [f.redId, f.blueId]) {
      const t = tally.get(id) ?? { w: 0, fin: 0, ko: 0, sub: 0, titleW: 0, streak: 0, best: 0 };
      if (f.method === "NC") { tally.set(id, t); continue; }
      if (f.winnerId === id) {
        t.w++; t.streak++; t.best = Math.max(t.best, t.streak);
        if (f.method === "KO/TKO") { t.ko++; t.fin++; }
        if (f.method === "SUB") { t.sub++; t.fin++; }
        if (f.titleFight) t.titleW++;
      } else t.streak = 0;
      tally.set(id, t);
    }
  }
  const top = (k: "w" | "fin" | "ko" | "sub" | "titleW" | "best") => [...tally.entries()].sort((a, b) => b[1][k] - a[1][k])[0];
  const push = (k: "w" | "fin" | "ko" | "sub" | "titleW" | "best", id: string, category: string, label: string, unit: string, context: string) => {
    const t = top(k);
    if (t && t[1][k] > 0) items.push({ id, category, label, value: String(t[1][k]), unit, holder: summary(t[0]), context, href: `/fighters/${s.fighterById.get(t[0])!.slug}` });
  };
  push("w", "wins", "Carrera", "Más victorias", "victorias", "Combates registrados en este ámbito");
  push("fin", "finishes", "Carrera", "Más finalizaciones", "finalizaciones", "KO/TKO + sumisión");
  push("best", "streak", "Carrera", "Racha de victorias más larga", "seguidas", "Sin derrota ni empate entre medias");
  push("titleW", "titles", "Títulos", "Más victorias por el título", "victorias", "Combates por el título ganados");
  push("ko", "kos", "Golpeo", "Más victorias por KO/TKO", "KO/TKO", "Victorias antes del límite por golpes");
  push("sub", "subs", "Grappling", "Más victorias por sumisión", "sumisiones", "Victorias por sumisión");

  const best = (get: (st: StrikeStats) => number, id: string, category: string, label: string, unit: string, fmt = (v: number) => String(v)) => {
    let rec = { v: -1, f: done[0], who: "" };
    for (const f of done) {
      if (f.red && get(f.red) > rec.v) rec = { v: get(f.red), f, who: f.redId };
      if (f.blue && get(f.blue) > rec.v) rec = { v: get(f.blue), f, who: f.blueId };
    }
    if (rec.v > 0) items.push({ id, category, label, value: fmt(rec.v), unit, holder: summary(rec.who), context: `${ev(rec.f).name} · ${rec.f.scheduledRounds} rounds`, href: `/fights/${rec.f.id}` });
  };
  best((x) => x.sigLanded, "sig", "Golpeo", "Golpes significativos en un combate", "conectados");
  best((x) => x.kd, "kd", "Golpeo", "Knockdowns en un combate", "knockdowns");
  best((x) => x.tdLanded, "td", "Grappling", "Derribos en un combate", "derribos");
  best((x) => x.subAttempts, "subatt", "Grappling", "Intentos de sumisión en un combate", "intentos");
  best((x) => x.ctrlSec, "ctrl", "Grappling", "Tiempo de control en un combate", "control", (v) => fmtTime(v));

  const reigns = s.championships.filter((c) => scope.kind === "global" || (scope.kind === "org" ? c.orgId === scope.id : c.divisionId === scope.id)).sort((a, b) => b.defenses - a.defenses)[0];
  if (reigns && reigns.defenses > 0) items.push({ id: "defenses", category: "Títulos", label: "Defensas de título en un reinado", value: String(reigns.defenses), unit: "defensas", holder: summary(reigns.fighterId), context: `${orgById.get(reigns.orgId)!.short} · ${divisionById.get(reigns.divisionId)!.name}`, href: `/fighters/${s.fighterById.get(reigns.fighterId)!.slug}` });
  return items;
});

/** Headline records used on the home page (global scope). */
export const records = cache((): RecordItem[] => {
  const all = recordsFor("global");
  const pick = ["fastest-ko", "wins", "streak", "sig"];
  return pick.map((id) => all.find((r) => r.id === id)).filter((r): r is RecordItem => Boolean(r)).concat(all.filter((r) => !pick.includes(r.id)));
});

/* ─────────────────────────── Home helpers ─────────────────────────── */

export function trending(limit = 5) {
  const s = store();
  return s.fighters
    .map((f) => {
      const h = s.ratingHistory.get(f.id)!;
      const recent = h.filter((p) => Date.parse(TODAY) - Date.parse(p.date) <= 200 * DAY);
      // Needs an established rating before the window: debut jumps aren't a trend.
      if (!recent.length || h.length - recent.length < 3) return null;
      const before = h[h.length - recent.length - 1].value;
      return { fighter: summary(f.id), delta: Math.round((h[h.length - 1].value - before) * 10) / 10 };
    })
    .filter((x): x is { fighter: FighterSummary; delta: number } => x !== null && x.fighter.status === "active")
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    .slice(0, limit);
}

/** Divisions that currently have a FIGHTCORE ranking (a retired division has no eligible fighters). */
export function rankedDivisions() {
  return DIVISIONS.filter((d) => (divisionRankings(TODAY).get(d.id) ?? []).length > 0);
}

export function spotlight(): FighterSummary[] {
  // One champion, one rising prospect, one veteran — a deliberate spread.
  const all = listFighters().filter((f) => f.status === "active" && !f.provisional);
  const champ = [...all].filter((f) => f.champion).sort((a, b) => b.rating - a.rating)[0];
  const prospect = [...all].filter((f) => f.age !== null && f.age <= 27 && !f.champion).sort((a, b) => b.rating - a.rating)[0];
  const vet = [...all].filter((f) => f.age !== null && f.age >= 33 && !f.champion && f.id !== prospect?.id).sort((a, b) => b.rating - a.rating)[0];
  return [champ, prospect, vet].filter(Boolean);
}

export function universeCounts() {
  const s = store();
  return {
    fighters: s.fighters.length,
    active: s.fighters.filter((f) => f.status === "active").length,
    fights: s.fights.filter((f) => f.status === "completed").length,
    events: s.events.length,
    organizations: ORGANIZATIONS.length,
    divisions: DIVISIONS.length,
    divisionsM: DIVISIONS.filter((d) => d.sex === "M").length,
    divisionsF: DIVISIONS.filter((d) => d.sex === "F").length,
    rounds: s.fights.reduce((a, f) => a + f.rounds.length, 0),
    countries: new Set(s.fighters.flatMap((f) => (f.country ? [f.country] : []))).size,
  };
}

export function history() {
  return HISTORY;
}

/* ─────────────────────────── Search ─────────────────────────── */

export interface SearchDoc {
  t: "fighter" | "event" | "org" | "page" | "history";
  id: string;
  title: string;
  sub: string;
  href: string;
  /** Extra tokens that should match (nickname, country, org…). */
  k: string;
  /** Fighter ids involved, used to surface related fights/events. */
  rel?: string[];
  r?: number;
  /** Portrait (fighters only). */
  p?: string;
  /** Current title label (fighters only). */
  c?: string;
}

export interface SearchFight { id: string; a: string; b: string; e: string; d: string; m: string; w: string | null }

export const searchIndex = cache(() => {
  const s = store();
  const docs: SearchDoc[] = [];
  for (const f of s.fighters) {
    const sm = summary(f.id);
    docs.push({ t: "fighter", id: f.id, title: sm.name, sub: `${sm.divisionShort} · ${sm.org} · ${sm.record.w}-${sm.record.l}-${sm.record.d}`, href: `/fighters/${f.slug}`, k: [f.nickname, sm.countryName, sm.org, sm.division, sm.title ? "campeon campeón champion" : ""].filter(Boolean).join(" "), r: sm.rating, p: sm.photo.src, c: sm.title ? `Campeón ${sm.title.org}` : undefined });
  }
  for (const e of s.events) {
    const org = orgById.get(e.orgId)!;
    const fighters = e.fightIds.flatMap((id) => { const f = s.fightById.get(id)!; return [f.redId, f.blueId]; });
    docs.push({ t: "event", id: e.id, title: e.name, sub: `${e.date} · ${e.city}`, href: `/events/${e.slug}`, k: `${org.name} ${org.short} ${e.city}`, rel: fighters });
  }
  for (const o of ORGANIZATIONS) {
    docs.push({ t: "org", id: o.id, title: o.name, sub: `${o.short} · ${o.region}${o.activeFrom ? ` · desde ${o.activeFrom}` : ""}`, href: `/organizations/${o.slug}`, k: `${o.short} ${o.region}` });
  }
  for (const h of HISTORY) {
    docs.push({ t: "history", id: `h-${h.year}-${h.title}`, title: h.title, sub: String(h.year), href: `/history#y${h.year}`, k: `${h.body} ${h.orgId ?? ""}` });
  }
  const pages: [string, string, string][] = [
    ["Rankings FIGHTCORE", "/rankings", "ranking clasificación p4p pound for pound"],
    ["Metodología del FCR", "/methodology", "rating fcr cómo se calcula metodología"],
    ["Comparar luchadores", "/compare", "compare comparar versus vs"],
    ["Base de datos de luchadores", "/fighters", "fighters luchadores base de datos"],
    ["Eventos", "/events", "eventos cartelera events"],
    ["Sistema de marca", "/brand", "brand marca logo tipografía color design system"],
    ["Campeones por división", "/champions", "campeones cinturones títulos belts champions tabla"],
    ["Scout", "/scout", "scout scouting informe análisis cómo gana pierde"],
    ["Style Matchup", "/matchup", "matchup estilos cruce versus análisis"],
    ["Stats", "/stats", "estadísticas líderes stats métricas"],
    ["Mapa del MMA", "/map", "mapa países geografía map"],
  ];
  for (const [title, href, k] of pages) docs.push({ t: "page", id: href, title, sub: "Sección", href, k });

  const fights: SearchFight[] = s.fights.map((f) => ({
    id: f.id, a: f.redId, b: f.blueId, e: s.eventById.get(f.eventId)!.name, d: f.date,
    m: f.status === "completed" ? `${f.method}${f.round ? ` · R${f.round}` : ""}` : "Programado", w: f.winnerId,
  }));
  const names: Record<string, string> = Object.fromEntries(s.fighters.map((f) => [f.id, fullName(f)]));
  return { docs, fights, names };
});

export function divisionsWithRankings() {
  return DIVISIONS.map((d) => ({ ...d, size: (divisionRankings(TODAY).get(d.id) ?? []).length }));
}

export { ATTRIBUTES };

/* ─────────────────────────── Fight detail ─────────────────────────── */

export function fightDetail(id: string) {
  const s = store();
  const fight = s.fightById.get(id);
  if (!fight) return null;
  const v = fightView(fight);
  const ratingAround = (fighterId: string) => {
    const h = s.ratingHistory.get(fighterId)!;
    const i = h.findIndex((p) => p.fightId === id);
    if (i < 0) return { before: h.filter((p) => p.date < fight.date).at(-1)?.value ?? null, after: null };
    return { before: i > 0 ? h[i - 1].value : null, after: h[i].value };
  };
  const common = (() => {
    const a = new Set(completed(fight.redId).filter((b) => b.fight.date < fight.date).map((b) => b.opponentId));
    return completed(fight.blueId).filter((b) => b.fight.date < fight.date && a.has(b.opponentId)).map((b) => fullName(s.fighterById.get(b.opponentId)!));
  })();
  return {
    ...v,
    redRating: ratingAround(fight.redId),
    blueRating: ratingAround(fight.blueId),
    redAttr: s.attributes.get(fight.redId) ?? null,
    blueAttr: s.attributes.get(fight.blueId) ?? null,
    redStats: s.stats.get(fight.redId)!,
    blueStats: s.stats.get(fight.blueId)!,
    commonOpponents: [...new Set(common)],
    redStrength: Math.round(strength01(fight.redStrengthPre) * 100),
    blueStrength: Math.round(strength01(fight.blueStrengthPre) * 100),
  };
}

export function allFightIds() {
  return store().fights.map((f) => f.id);
}

/* ─────────────────────────── Organizations ─────────────────────────── */

export function organizationsOverview() {
  const s = store();
  return ORGANIZATIONS.map((o) => ({
    ...o,
    countryName: o.country ? countryByCode.get(o.country)?.name ?? o.country : null,
    events: s.events.filter((e) => e.orgId === o.id).length,
    fighters: s.fighters.filter((f) => f.orgId === o.id && f.status !== "retired").length,
  }));
}

export function organizationDetail(slug: string) {
  const s = store();
  const o = ORGANIZATIONS.find((x) => x.slug === slug);
  if (!o) return null;
  const events = s.events.filter((e) => e.orgId === o.id);
  const fights = s.fights.filter((f) => f.orgId === o.id && f.status === "completed");
  const finishes = fights.filter((f) => f.method === "KO/TKO" || f.method === "SUB").length;
  const roster = s.fighters.filter((f) => f.orgId === o.id && f.status !== "retired").map((f) => summary(f.id)).sort((a, b) => b.rating - a.rating);
  const champions = currentChampions().filter((c) => c.orgId === o.id);
  const titleHistory = s.championships.filter((c) => c.orgId === o.id).sort((a, b) => a.from.localeCompare(b.from)).map((c) => ({
    ...c, fighter: fullName(s.fighterById.get(c.fighterId)!), slug: s.fighterById.get(c.fighterId)!.slug, division: divisionById.get(c.divisionId)!.name,
  }));
  return {
    org: o,
    countryName: o.country ? countryByCode.get(o.country)?.name ?? o.country : null,
    stats: { events: events.length, fights: fights.length, finishRate: fights.length ? finishes / fights.length : 0 },
    upcoming: events.filter((e) => e.status === "upcoming").map(eventView),
    recent: events.filter((e) => e.status === "completed").slice(-6).reverse().map(eventView),
    roster: roster.slice(0, 12),
    champions,
    titleHistory,
    milestones: HISTORY.filter((h) => h.orgId === o.id),
  };
}

/* ─────────────────────────── Champions table ─────────────────────────── */

export interface ChampionCell {
  /** unknown: the source stops recording the belt (no vacancy or new champion on file). */
  state: "champion" | "vacant" | "unknown" | "historic" | "none";
  fighter: FighterSummary | null;
  since: string | null;
  defenses: number;
  reigns: number;
  lastChampion: string | null;
  lastSlug: string | null;
  lastUntil: string | null;
}

/** Division × organization grid of current titles, plus the FCR #1 as a separate reference. */
export const championsTable = cache(() => {
  const s = store();
  const orgIds = [...new Set(s.championships.map((c) => c.orgId))].sort((a, b) => (a === "ufc" ? -1 : b === "ufc" ? 1 : a.localeCompare(b)));
  const orgs = orgIds.map((id) => ({ id, short: orgById.get(id)!.short, name: orgById.get(id)!.name, slug: orgById.get(id)!.slug }));
  const rows = DIVISIONS.map((d) => {
    const cells: Record<string, ChampionCell> = {};
    for (const o of orgIds) {
      const reigns = s.championships.filter((c) => c.orgId === o && c.divisionId === d.id).sort((a, b) => a.from.localeCompare(b.from));
      const cur = reigns.find((c) => !c.to);
      const last = reigns.at(-1);
      cells[o] = {
        state: cur ? "champion" : !reigns.length ? "none" : orgById.get(o)!.activeTo ? "historic" : last?.toApprox ? "unknown" : "vacant",
        fighter: cur ? summary(cur.fighterId) : null,
        since: cur?.from ?? null,
        defenses: cur?.defenses ?? 0,
        reigns: reigns.length,
        lastChampion: !cur && last ? fullName(s.fighterById.get(last.fighterId)!) : null,
        lastSlug: !cur && last ? s.fighterById.get(last.fighterId)!.slug : null,
        lastUntil: !cur && last ? last.to : null,
      };
    }
    const top = (divisionRankings(TODAY).get(d.id) ?? [])[0];
    return { division: d, cells, fcrTop: top ? summary(top.id) : null };
  });
  const count = rows.reduce((a, r) => a + Object.values(r.cells).filter((c) => c.state === "champion").length, 0);
  return { orgs, rows, count };
});

/* ─────────────────────────── Scout ─────────────────────────── */


export function scoutReport(slug: string) {
  const s = store();
  const f = s.fighterBySlug.get(slug);
  if (!f) return null;
  const bouts = completed(f.id);
  const st = s.stats.get(f.id)!;
  const oppStyle = (id: string) => styleOf(s.attributes.get(id));
  const rounds = roundLines(bouts);
  const r1 = rounds.find((r) => r.round === 1);
  return {
    summary: summary(f.id),
    style: styleOf(s.attributes.get(f.id)),
    stats: st,
    insights: buildInsights(bouts),
    winRounds: finishRounds(bouts, "W"),
    lossRounds: finishRounds(bouts, "L"),
    zones: zoneEdges(bouts),
    rounds,
    paceDrop: r1 ? rounds.map((r) => ({ round: r.round, n: r.n, rel: r.att / Math.max(1, r1.att) })) : [],
    vsStyles: vsStyles(bouts, oppStyle),
    submissions: bouts.filter((b) => b.outcome === "W" && b.fight.submission).reduce<Record<string, number>>((a, b) => { a[b.fight.submission!] = (a[b.fight.submission!] ?? 0) + 1; return a; }, {}),
    sample: bouts.length,
  };
}

export type ScoutReport = NonNullable<ReturnType<typeof scoutReport>>;

export function matchupData(a: string, b: string) {
  const s = store();
  const fa = s.fighterBySlug.get(a), fb = s.fighterBySlug.get(b);
  if (!fa || !fb || fa.id === fb.id) return null;
  const A = { name: fa.lastName, stats: s.stats.get(fa.id)!, attr: s.attributes.get(fa.id) };
  const B = { name: fb.lastName, stats: s.stats.get(fb.id)!, attr: s.attributes.get(fb.id) };
  if (!A.attr || !B.attr) return { a: summary(fa.id), b: summary(fb.id), insufficient: true as const };
  const styleA = styleOf(A.attr)!, styleB = styleOf(B.attr)!;
  const oppStyle = (id: string) => styleOf(s.attributes.get(id));
  const aVs = vsStyles(completed(fa.id), oppStyle).find((x) => x.style === styleB) ?? null;
  const bVs = vsStyles(completed(fb.id), oppStyle).find((x) => x.style === styleA) ?? null;
  const rank = (attr: Record<string, number>) => ATTRIBUTES.map((x) => ({ key: x.key, label: x.label, v: attr[x.key] })).filter((x) => x.key !== "adaptation").sort((p, q) => q.v - p.v);
  const aOpp = new Set(completed(fa.id).map((x) => x.opponentId));
  const common = completed(fb.id).filter((x) => aOpp.has(x.opponentId)).map((x) => x.opponentId);
  return {
    a: summary(fa.id), b: summary(fb.id), insufficient: false as const,
    attrA: A.attr, attrB: B.attr,
    styleA: { type: styleA, label: STYLE_LABEL[styleA] }, styleB: { type: styleB, label: STYLE_LABEL[styleB] },
    strengthsA: rank(A.attr).slice(0, 3), weaknessesA: rank(A.attr).slice(-3).reverse(),
    strengthsB: rank(B.attr).slice(0, 3), weaknessesB: rank(B.attr).slice(-3).reverse(),
    interactions: interactions(A as never, B as never),
    history: { aVsStyleB: aVs, bVsStyleA: bVs },
    roundsA: roundLines(completed(fa.id)), roundsB: roundLines(completed(fb.id)),
    common: [...new Set(common)].map((id) => {
      const ra = completed(fa.id).filter((x) => x.opponentId === id).map((x) => x.outcome);
      const rb = completed(fb.id).filter((x) => x.opponentId === id).map((x) => x.outcome);
      return { opponent: summary(id), a: ra, b: rb };
    }),
  };
}

/* ─────────────────────────── Stats ─────────────────────────── */

export const STAT_METRICS = [
  { key: "slpm", label: "Golpes sig. por minuto", fmt: "dec2" },
  { key: "strAcc", label: "Precisión de golpeo", fmt: "pct" },
  { key: "strDef", label: "Defensa de golpeo", fmt: "pct" },
  { key: "tdAvg", label: "Derribos por 15 min", fmt: "dec2" },
  { key: "tdAcc", label: "Precisión de derribo", fmt: "pct" },
  { key: "tdDef", label: "Defensa de derribo", fmt: "pct" },
  { key: "subAvg", label: "Sumisiones por 15 min", fmt: "dec2" },
  { key: "kdAvg", label: "Knockdowns por 15 min", fmt: "dec2" },
  { key: "ctrlShare", label: "Tiempo de control", fmt: "pct" },
  { key: "finishRate", label: "Tasa de finalización", fmt: "pct" },
] as const;
export type StatKey = (typeof STAT_METRICS)[number]["key"];

export const STAT_MIN_BOUTS = 5;
export const STAT_MIN_MINUTES = 45;

export const statsOverview = cache(() => {
  const s = store();
  const pool = s.fighters.filter((f) => {
    const st = s.stats.get(f.id)!;
    return st.statBouts >= STAT_MIN_BOUTS && st.minutes >= STAT_MIN_MINUTES;
  });
  const leaders = Object.fromEntries(STAT_METRICS.map((m) => [m.key, pool
    .map((f) => ({ fighter: summary(f.id), value: s.stats.get(f.id)![m.key] as number, sample: s.stats.get(f.id)!.bouts }))
    .sort((a, b) => b.value - a.value).slice(0, 10)])) as Record<StatKey, { fighter: FighterSummary; value: number; sample: number }[]>;

  const done = s.fights.filter((f) => f.status === "completed" && f.method !== "NC");
  const rate = (all: typeof done) => { const list = all.filter((f) => f.red && f.blue && f.round && f.time !== null); return {
    n: all.length,
    ko: all.filter((f) => f.method === "KO/TKO").length / Math.max(1, all.length),
    sub: all.filter((f) => f.method === "SUB").length / Math.max(1, all.length),
    dec: all.filter((f) => f.method?.endsWith("DEC")).length / Math.max(1, all.length),
    sigPerMin: list.reduce((a, f) => a + (f.red!.sigLanded + f.blue!.sigLanded), 0) / Math.max(1, list.reduce((a, f) => a + ((f.round! - 1) * 300 + f.time!) / 60, 0)),
  }; };
  const byDivision = DIVISIONS.map((d) => ({ division: d, ...rate(done.filter((f) => f.divisionId === d.id)) }));
  const years = [...new Set(done.map((f) => f.date.slice(0, 4)))].sort();
  const byYear = years.map((y) => ({ year: Number(y), ...rate(done.filter((f) => f.date.startsWith(y))) }));
  const orgIds = [...new Set(done.map((f) => f.orgId))];
  const byOrg = orgIds.map((o) => ({ org: orgById.get(o)!.short, slug: orgById.get(o)!.slug, ...rate(done.filter((f) => f.orgId === o)) })).filter((x) => x.n >= 20).sort((a, b) => (b.ko + b.sub) - (a.ko + a.sub));
  return { leaders, byDivision, byYear, byOrg, pool: pool.length, total: rate(done) };
});

/* ─────────────────────────── MMA map ─────────────────────────── */

export function mapData() {
  const s = store();
  const rows = new Map<string, { code: string; name: string; fighters: number; active: number; champions: number; events: number; fights: number; top: FighterSummary | null }>();
  const row = (code: string) => {
    if (!rows.has(code)) rows.set(code, { code, name: countryByCode.get(code)?.name ?? code, fighters: 0, active: 0, champions: 0, events: 0, fights: 0, top: null });
    return rows.get(code)!;
  };
  for (const f of s.fighters) {
    if (!f.country) continue;
    const r = row(f.country);
    r.fighters++;
    if (f.status === "active") r.active++;
    if (s.champions.has(f.id)) r.champions++;
    const sm = summary(f.id);
    if (!r.top || sm.rating > r.top.rating) r.top = sm;
  }
  for (const e of s.events) { if (!e.country) continue; const r = row(e.country); r.events++; r.fights += e.fightIds.length; }
  return [...rows.values()].sort((a, b) => b.fighters - a.fighters || b.events - a.events);
}

/* ─────────────────────────── Credits ─────────────────────────── */

/** Every licensed photograph in use, with what its licence requires us to show. */
export function photoCredits() {
  return store().fighters
    .filter((f) => f.photo.kind === "licensed" || f.photo.kind === "official")
    .map((f) => ({ slug: f.slug, name: fullName(f), src: f.photo.src, author: f.photo.author ?? "", license: f.photo.license ?? "", licenseUrl: f.photo.licenseUrl ?? null, sourceUrl: f.photo.sourceUrl ?? "" }))
    .sort((a, b) => a.name.localeCompare(b.name, "es"));
}
