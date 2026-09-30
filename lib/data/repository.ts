import "server-only";
/**
 * Read API used by pages. Returns view models only — UI never touches the
 * store directly, so a real backend can implement this same surface.
 */
import { cache } from "react";
import { countryByCode, divisionById, DIVISIONS, HISTORY, orgById, ORGANIZATIONS } from "../domain/reference";
import type { Division, Event, Fight, Fighter, FighterBout, Outcome } from "../domain/types";
import { computeRating, strength01, type RatingResult } from "../rating/model";
import { buildInsights } from "../analytics/insights";
import { careerStats, roundProfile, type CareerStats, recordOf } from "../analytics/career";
import { ATTRIBUTES } from "../analytics/attributes";
import { store, TODAY } from "./store";

export { TODAY };

export interface FighterSummary {
  id: string;
  slug: string;
  name: string;
  firstName: string;
  lastName: string;
  nickname: string | null;
  country: string;
  countryName: string;
  divisionId: string;
  division: string;
  divisionShort: string;
  org: string;
  orgName: string;
  status: Fighter["status"];
  age: number;
  record: { w: number; l: number; d: number; nc: number };
  rating: number;
  band: number;
  provisional: boolean;
  rank: number | null;
  champion: boolean;
  form: Outcome[];
  /** Every covered outcome, oldest first (feeds the dossier barcode). */
  career: Outcome[];
  lastFight: string | null;
  bouts: number;
}

const ageOn = (birth: string, on: string) => {
  const b = new Date(birth), d = new Date(on);
  let a = d.getUTCFullYear() - b.getUTCFullYear();
  if (d.getUTCMonth() < b.getUTCMonth() || (d.getUTCMonth() === b.getUTCMonth() && d.getUTCDate() < b.getUTCDate())) a--;
  return a;
};

export const fullName = (f: Pick<Fighter, "firstName" | "lastName">) => `${f.firstName} ${f.lastName}`;

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
  if (asOf === TODAY && f.status === "retired") return false;
  return true;
}

const divisionRankings = cache((asOf: string) => {
  const s = store();
  const out = new Map<string, { id: string; rating: RatingResult }[]>();
  for (const d of DIVISIONS) {
    const rows = s.fighters
      .filter((f) => f.divisionId === d.id && eligible(f, asOf))
      .map((f) => ({ id: f.id, rating: asOf === TODAY ? s.rating.get(f.id)! : computeRating(s.bouts.get(f.id)!, asOf, { isChampion: false }) }))
      .sort((a, b) => b.rating.value - a.rating.value);
    out.set(d.id, rows);
  }
  return out;
});

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
    country: f.country, countryName: countryByCode.get(f.country)?.name ?? f.country,
    divisionId: div.id, division: div.name, divisionShort: div.short, org: org.short, orgName: org.name,
    status: f.status, age: ageOn(f.birthDate, TODAY),
    record: {
      w: st.record.w + f.priorRecord.w,
      l: st.record.l + f.priorRecord.l,
      d: st.record.d + f.priorRecord.d,
      nc: st.record.nc,
    },
    rating: r.value, band: r.band, provisional: r.provisional,
    rank: rankOf(id, f.divisionId),
    champion: s.champions.has(id),
    form: b.slice(-5).map((x) => x.outcome!).filter(Boolean),
    career: b.map((x) => x.outcome!).filter(Boolean),
    lastFight: b.at(-1)?.fight.date ?? null,
    bouts: st.bouts,
  };
}

export const listFighters = cache((): FighterSummary[] => store().fighters.map((f) => summary(f.id)));

export function getFighterBySlug(slug: string) {
  return store().fighterBySlug.get(slug) ?? null;
}

export function allFighterSlugs() {
  return store().fighters.map((f) => f.slug);
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
  const pop = s.fighters.filter((f) => s.stats.get(f.id)!.bouts >= 3).map((f) => {
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
  const peers = s.fighters.filter((p) => p.divisionId === f.divisionId && (s.stats.get(p.id)?.bouts ?? 0) >= 3).map((p) => s.stats.get(p.id)!);
  const last5 = done.slice(-5);

  // Opponents' own career averages — "how good were the people he did this against?"
  const oppStats = [...new Set(done.map((b) => b.opponentId))].map((id) => s.stats.get(id)!).filter((x) => x.bouts >= 3);

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
    divisionSize: (divisionRankings(TODAY).get(f.divisionId) ?? []).length,
    rivalsToCompare: (divisionRankings(TODAY).get(f.divisionId) ?? []).filter((r) => r.id !== f.id).slice(0, 3).map((r) => summary(r.id)),
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

export const records = cache((): RecordItem[] => {
  const s = store();
  const done = s.fights.filter((f) => f.status === "completed");
  const items: RecordItem[] = [];
  const finishes = done.filter((f) => (f.method === "KO/TKO" || f.method === "SUB") && f.round === 1 && f.winnerId);
  const fastest = [...finishes].sort((a, b) => (a.time ?? 999) - (b.time ?? 999))[0];
  if (fastest) {
    const ev = s.eventById.get(fastest.eventId)!;
    items.push({ id: "fastest", category: "Tiempo", label: "Finalización más rápida", value: fmtTime(fastest.time!), unit: "R1", holder: summary(fastest.winnerId!), context: `${fastest.method} · ${ev.name}`, href: `/fights/${fastest.id}` });
  }
  const mostWins = [...s.fighters].sort((a, b) => s.stats.get(b.id)!.record.w - s.stats.get(a.id)!.record.w)[0];
  items.push({ id: "wins", category: "Carrera", label: "Más victorias en cobertura", value: String(s.stats.get(mostWins.id)!.record.w), unit: "victorias", holder: summary(mostWins.id), context: "Combates registrados por FIGHTCORE", href: `/fighters/${mostWins.slug}` });
  const streak = [...s.fighters].sort((a, b) => s.stats.get(b.id)!.longestWinStreak - s.stats.get(a.id)!.longestWinStreak)[0];
  items.push({ id: "streak", category: "Carrera", label: "Racha de victorias más larga", value: String(s.stats.get(streak.id)!.longestWinStreak), unit: "seguidas", holder: summary(streak.id), context: "Victorias consecutivas sin derrota ni empate", href: `/fighters/${streak.slug}` });
  let bestSig = { v: 0, f: done[0], id: "" };
  for (const f of done) {
    if (f.red && f.red.sigLanded > bestSig.v) bestSig = { v: f.red.sigLanded, f, id: f.redId };
    if (f.blue && f.blue.sigLanded > bestSig.v) bestSig = { v: f.blue.sigLanded, f, id: f.blueId };
  }
  items.push({ id: "sig", category: "Golpeo", label: "Golpes significativos en un combate", value: String(bestSig.v), unit: "conectados", holder: summary(bestSig.id), context: `${s.eventById.get(bestSig.f.eventId)!.name} · ${bestSig.f.scheduledRounds} rounds`, href: `/fights/${bestSig.f.id}` });
  let bestTd = { v: 0, f: done[0], id: "" };
  for (const f of done) {
    if (f.red && f.red.tdLanded > bestTd.v) bestTd = { v: f.red.tdLanded, f, id: f.redId };
    if (f.blue && f.blue.tdLanded > bestTd.v) bestTd = { v: f.blue.tdLanded, f, id: f.blueId };
  }
  items.push({ id: "td", category: "Grappling", label: "Derribos en un combate", value: String(bestTd.v), unit: "derribos", holder: summary(bestTd.id), context: s.eventById.get(bestTd.f.eventId)!.name, href: `/fights/${bestTd.f.id}` });
  const defenses = [...s.championships].sort((a, b) => b.defenses - a.defenses)[0];
  if (defenses) items.push({ id: "defenses", category: "Títulos", label: "Defensas de título en un reinado", value: String(defenses.defenses), unit: "defensas", holder: summary(defenses.fighterId), context: `${orgById.get(defenses.orgId)!.short} · ${divisionById.get(defenses.divisionId)!.name}`, href: `/fighters/${s.fighterById.get(defenses.fighterId)!.slug}` });
  return items;
});

/* ─────────────────────────── Home helpers ─────────────────────────── */

export function trending(limit = 5) {
  const s = store();
  return s.fighters
    .map((f) => {
      const h = s.ratingHistory.get(f.id)!;
      const recent = h.filter((p) => Date.parse(TODAY) - Date.parse(p.date) <= 200 * DAY);
      if (!recent.length) return null;
      const before = h[h.length - recent.length - 1]?.value ?? h[0].value;
      return { fighter: summary(f.id), delta: Math.round((h[h.length - 1].value - before) * 10) / 10 };
    })
    .filter((x): x is { fighter: FighterSummary; delta: number } => x !== null && x.fighter.status !== "retired")
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    .slice(0, limit);
}

export function spotlight(): FighterSummary[] {
  // One champion, one rising prospect, one veteran — a deliberate spread.
  const all = listFighters().filter((f) => f.status === "active" && !f.provisional);
  const champ = [...all].filter((f) => f.champion).sort((a, b) => b.rating - a.rating)[0];
  const prospect = [...all].filter((f) => f.age <= 27 && !f.champion).sort((a, b) => b.rating - a.rating)[0];
  const vet = [...all].filter((f) => f.age >= 33 && !f.champion && f.id !== prospect?.id).sort((a, b) => b.rating - a.rating)[0];
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
    rounds: s.fights.reduce((a, f) => a + f.rounds.length, 0),
    countries: new Set(s.fighters.map((f) => f.country)).size,
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
}

export interface SearchFight { id: string; a: string; b: string; e: string; d: string; m: string; w: string | null }

export const searchIndex = cache(() => {
  const s = store();
  const docs: SearchDoc[] = [];
  for (const f of s.fighters) {
    const sm = summary(f.id);
    docs.push({ t: "fighter", id: f.id, title: sm.name, sub: `${sm.divisionShort} · ${sm.org} · ${sm.record.w}-${sm.record.l}-${sm.record.d}`, href: `/fighters/${f.slug}`, k: [f.nickname, sm.countryName, sm.org, sm.division].filter(Boolean).join(" "), r: sm.rating });
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
