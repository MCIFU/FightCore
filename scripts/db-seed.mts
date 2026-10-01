/**
 * Recreates the schema and loads a dataset into PostgreSQL. Facts come from
 * the UFC snapshot (default) or the demo universe (SEED_SOURCE=demo);
 * calculated ratings are written too so external consumers can query them.
 *   DATABASE_URL=postgres://user:pass@host/db npm run db:seed
 * Destructive: drops the FIGHTCORE tables first.
 */
import { readFileSync } from "node:fs";
import pg from "pg";
import { buildStore, type Universe } from "../lib/data/build.ts";
import { loadUniverseFromSnapshot } from "../lib/data/providers/snapshot.ts";
import { buildDemoUniverse } from "../lib/demo/simulate.ts";
import { BOUT_WEIGHTS, COUNTRIES, DIVISIONS, HISTORY, ORGANIZATIONS } from "../lib/domain/reference.ts";
import { FCR_VERSION } from "../lib/rating/model.ts";

const url = process.env.DATABASE_URL;
if (!url) { console.error("Set DATABASE_URL"); process.exit(1); }

const client = new pg.Client({ connectionString: url });
await client.connect();

/** Multi-row insert in chunks. */
async function insert(table: string, cols: string[], rows: unknown[][]) {
  for (let i = 0; i < rows.length; i += 500) {
    const chunk = rows.slice(i, i + 500);
    const values: unknown[] = [];
    const tuples = chunk.map((r) => `(${r.map((v) => { values.push(v); return `$${values.length}`; }).join(",")})`);
    await client.query(`INSERT INTO ${table} (${cols.join(",")}) VALUES ${tuples.join(",")}`, values);
  }
}

const t0 = Date.now();
await client.query("DROP TABLE IF EXISTS fighter_ratings, championships, rounds, fight_stats, fights, events, fighters, historical_events, organizations, divisions, countries, dataset_meta CASCADE");
await client.query(readFileSync("db/schema.sql", "utf8"));
const u: Universe = process.env.SEED_SOURCE === "demo"
  ? buildDemoUniverse()
  : loadUniverseFromSnapshot();
const store = buildStore(u);
const AS_OF = u.dataset.asOf;

await client.query("BEGIN");
await insert("countries", ["code", "name", "lat", "lon"], COUNTRIES.map((c) => [c.code, c.name, c.lat, c.lon]));
await insert("organizations", ["id", "slug", "name", "short", "country", "region", "active_from", "active_to", "status", "grp", "note", "provenance"],
  ORGANIZATIONS.map((o) => [o.id, o.slug, o.name, o.short, o.country, o.region, o.activeFrom, o.activeTo, o.status, o.group, o.note, o.provenance]));
await insert("divisions", ["id", "slug", "name", "short", "sex", "limit_lb", "limit_kg", "ord"], [...DIVISIONS, ...BOUT_WEIGHTS].map((d) => [d.id, d.slug, d.name, d.short, d.sex, d.limitLb, d.limitKg, d.order]));
await insert("historical_events", ["year", "date", "title", "body", "org_id", "kind", "provenance"], HISTORY.map((h) => [h.year, h.date, h.title, h.body, h.orgId, h.kind, h.provenance]));
await insert("fighters", ["id", "slug", "first_name", "last_name", "nickname", "country", "sex", "birth_date", "height_cm", "reach_cm", "stance", "division_id", "org_id", "status", "prior_w", "prior_l", "prior_d", "wikidata", "photo_src", "photo_kind", "photo_credit", "photo_updated", "photo_author", "photo_license", "photo_license_url", "photo_source_url", "provenance"],
  u.fighters.map((f) => [f.id, f.slug, f.firstName, f.lastName, f.nickname, f.country, f.sex, f.birthDate, f.heightCm, f.reachCm, f.stance, f.divisionId, f.orgId, f.status, f.priorRecord?.w ?? null, f.priorRecord?.l ?? null, f.priorRecord?.d ?? null, f.wikidata ?? null, f.photo.src, f.photo.kind, f.photo.credit, f.photo.updated, f.photo.author ?? null, f.photo.license ?? null, f.photo.licenseUrl ?? null, f.photo.sourceUrl ?? null, f.provenance]));
await insert("events", ["id", "slug", "name", "org_id", "date", "city", "country", "venue", "status", "provenance"],
  u.events.map((e) => [e.id, e.slug, e.name, e.orgId, e.date, e.city, e.country || null, e.venue, e.status, e.provenance]));
const liveFights = u.fights.filter((f) => u.events.some((e) => e.id === f.eventId));
await insert("fights", ["id", "event_id", "date", "org_id", "division_id", "red_id", "blue_id", "status", "winner_id", "method", "submission", "end_round", "end_time_sec", "scheduled_rounds", "title_fight", "interim", "referee", "slot", "card_order", "scorecards", "red_strength_pre", "blue_strength_pre", "provenance"],
  liveFights.map((f) => [f.id, f.eventId, f.date, f.orgId, f.divisionId, f.redId, f.blueId, f.status, f.winnerId, f.method, f.submission, f.round, f.time, f.scheduledRounds, f.titleFight, !!f.interim, f.referee ?? null, f.slot, f.order, f.scorecards, f.redStrengthPre, f.blueStrengthPre, f.provenance]));
const statRow = (id: string, corner: string, s: NonNullable<(typeof liveFights)[number]["red"]>) => [id, corner, s.sigLanded, s.sigAttempted, s.totalLanded, s.totalAttempted, s.head, s.body, s.leg, s.distance, s.clinch, s.ground, s.kd, s.tdLanded, s.tdAttempted, s.subAttempts, s.ctrlSec];
await insert("fight_stats", ["fight_id", "corner", "sig_landed", "sig_attempted", "total_landed", "total_attempted", "head", "body", "leg", "distance", "clinch", "ground", "kd", "td_landed", "td_attempted", "sub_attempts", "ctrl_sec"],
  liveFights.flatMap((f) => (f.red && f.blue ? [statRow(f.id, "red", f.red), statRow(f.id, "blue", f.blue)] : [])));
await insert("rounds", ["fight_id", "round", "corner", "sig_landed", "sig_attempted", "td_landed", "ctrl_sec", "kd"],
  liveFights.flatMap((f) => f.rounds.flatMap((r) => (["red", "blue"] as const).map((c) => [f.id, r.round, c, r[c].sigLanded, r[c].sigAttempted, r[c].tdLanded, r[c].ctrlSec, r[c].kd]))));
await insert("championships", ["org_id", "division_id", "fighter_id", "won_fight_id", "date_from", "date_to", "defenses", "interim"],
  u.championships.map((c) => [c.orgId, c.divisionId, c.fighterId, c.wonFightId, c.from, c.to, c.defenses, !!c.interim]));
await insert("fighter_ratings", ["fighter_id", "model_version", "seq", "as_of", "after_fight", "value", "band", "factors"],
  u.fighters.flatMap((f) => [
    ...store.ratingHistory.get(f.id)!.map((h, i) => [f.id, FCR_VERSION, i, h.date, h.fightId, h.value, h.band, null]),
    [f.id, FCR_VERSION, -1, AS_OF, null, store.rating.get(f.id)!.value, store.rating.get(f.id)!.band, JSON.stringify(store.rating.get(f.id)!.factors)],
  ]));
await insert("dataset_meta", ["key", "value"], [["dataset", u.dataset.kind], ["as_of", AS_OF], ["last_event", u.dataset.lastEvent ?? ""], ["sources", JSON.stringify(u.dataset.sources)], ["fcr_version", FCR_VERSION], ["seeded_at", new Date().toISOString()]]);
await client.query("COMMIT");

const counts = await client.query("SELECT (SELECT count(*) FROM fighters) f, (SELECT count(*) FROM fights) fi, (SELECT count(*) FROM events) e, (SELECT count(*) FROM rounds) r, (SELECT count(*) FROM fighter_ratings) ra");
console.log(`Seeded in ${Date.now() - t0} ms`, counts.rows[0]);
await client.end();
