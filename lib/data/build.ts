/**
 * In-memory store built from the active data provider. Today the provider is
 * the deterministic demo universe; swapping it for PostgreSQL means replacing
 * `loadProvider()` — every derived structure below is provider-agnostic.
 */
import { DEMO_TODAY } from "../demo/simulate";
import type { Championship, Event, Fight, Fighter, FighterBout, Outcome } from "../domain/types";
import { computeRating, strength01, type RatingResult } from "../rating/model";
import { careerStats, roundProfile, type CareerStats } from "../analytics/career";
import { computeAttributes, type AttributeKey } from "../analytics/attributes";

export const TODAY = DEMO_TODAY;

export interface RatingPoint { date: string; value: number; band: number; fightId: string; outcome: Outcome | null }

export interface Store {
  fighters: Fighter[];
  fights: Fight[];
  events: Event[];
  championships: Championship[];
  fighterById: Map<string, Fighter>;
  fighterBySlug: Map<string, Fighter>;
  fightById: Map<string, Fight>;
  eventById: Map<string, Event>;
  eventBySlug: Map<string, Event>;
  bouts: Map<string, FighterBout[]>;
  rating: Map<string, RatingResult>;
  ratingHistory: Map<string, RatingPoint[]>;
  stats: Map<string, CareerStats>;
  attributes: Map<string, Record<AttributeKey, number>>;
  champions: Map<string, Championship>; // fighterId → current reign
}

/** The facts a provider must supply. Everything else is derived here. */
export interface Universe {
  fighters: Fighter[];
  fights: Fight[];
  events: Event[];
  championships: Championship[];
}

function outcomeFor(f: Fight, id: string): Outcome | null {
  if (f.status !== "completed") return null;
  if (f.method === "NC") return "NC";
  if (!f.winnerId) return "D";
  return f.winnerId === id ? "W" : "L";
}

function build(u: Universe): Store {
  const fighterById = new Map(u.fighters.map((f) => [f.id, f]));
  const fighterBySlug = new Map(u.fighters.map((f) => [f.slug, f]));
  const fightById = new Map(u.fights.map((f) => [f.id, f]));
  const eventById = new Map(u.events.map((e) => [e.id, e]));
  const eventBySlug = new Map(u.events.map((e) => [e.slug, e]));

  const bouts = new Map<string, FighterBout[]>();
  for (const f of u.fighters) bouts.set(f.id, []);
  const sortedFights = [...u.fights].sort((a, b) => a.date.localeCompare(b.date) || a.order - b.order);
  for (const fight of sortedFights) {
    const event = eventById.get(fight.eventId)!;
    for (const corner of ["red", "blue"] as const) {
      const id = corner === "red" ? fight.redId : fight.blueId;
      const oppId = corner === "red" ? fight.blueId : fight.redId;
      bouts.get(id)!.push({
        fight, event, corner, opponentId: oppId,
        outcome: outcomeFor(fight, id),
        own: corner === "red" ? fight.red : fight.blue,
        opp: corner === "red" ? fight.blue : fight.red,
        ownStrengthPre: corner === "red" ? fight.redStrengthPre : fight.blueStrengthPre,
        oppStrengthPre: corner === "red" ? fight.blueStrengthPre : fight.redStrengthPre,
      });
    }
  }

  const champions = new Map<string, Championship>();
  for (const c of u.championships) if (!c.to) champions.set(c.fighterId, c);
  const wasChampionAt = (id: string, date: string) =>
    u.championships.some((c) => c.fighterId === id && c.from <= date && (!c.to || c.to > date));

  const rating = new Map<string, RatingResult>();
  const ratingHistory = new Map<string, RatingPoint[]>();
  const stats = new Map<string, CareerStats>();
  for (const f of u.fighters) {
    const b = bouts.get(f.id)!;
    rating.set(f.id, computeRating(b, TODAY, { isChampion: champions.has(f.id) }));
    stats.set(f.id, careerStats(b));
    const hist: RatingPoint[] = [];
    b.forEach((bout) => {
      if (bout.fight.status !== "completed") return;
      const r = computeRating(b, bout.fight.date, { isChampion: wasChampionAt(f.id, bout.fight.date) });
      hist.push({ date: bout.fight.date, value: r.value, band: r.band, fightId: bout.fight.id, outcome: bout.outcome });
    });
    ratingHistory.set(f.id, hist);
  }

  const pop = u.fighters
    .filter((f) => (stats.get(f.id)?.bouts ?? 0) >= 3)
    .map((f) => {
      const b = bouts.get(f.id)!.filter((x) => x.fight.status === "completed");
      // Adaptation: how the per-round striking differential moves after R1.
      const diffs: number[] = [];
      for (const x of b) {
        const rs = x.fight.rounds;
        if (rs.length < 2) continue;
        const d = (r: (typeof rs)[number]) => (x.corner === "red" ? r.red.sigLanded - r.blue.sigLanded : r.blue.sigLanded - r.red.sigLanded);
        const later = rs.slice(1).map(d);
        diffs.push(later.reduce((a, c) => a + c, 0) / later.length - d(rs[0]));
      }
      const adaptationRaw = diffs.length ? diffs.reduce((a, c) => a + c, 0) / diffs.length : 0;
      const opponentStrength = b.reduce((a, x) => a + strength01(x.oppStrengthPre), 0) / Math.max(1, b.length);
      return { id: f.id, stats: stats.get(f.id)!, adaptationRaw, opponentStrength };
    });
  const attributes = computeAttributes(pop);

  return {
    fighters: u.fighters, fights: u.fights, events: u.events, championships: u.championships,
    fighterById, fighterBySlug, fightById, eventById, eventBySlug, bouts,
    rating, ratingHistory, stats, attributes, champions,
  };
}

export const buildStore = build;
export { roundProfile };
