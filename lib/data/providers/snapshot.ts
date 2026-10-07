/**
 * Real-data provider: the UFC snapshot written by scripts/import-ufc.mts
 * (UFCStats box scores + Wikidata + Wikipedia), plus the licensed photos
 * prepared by scripts/fetch-photos.mts and scripts/process-photos.py.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { gunzipSync } from "node:zlib";
import type { Championship, Event, Fight, Fighter } from "../../domain/types";
import type { DatasetInfo, Universe } from "../build";
import { orgById } from "../../domain/reference";
import { buildLineage } from "../lineage";
import { applyAlias, dedupeFighters } from "../dedupe";

interface Snapshot {
  meta: { asOf: string; lastEvent?: string; sources: DatasetInfo["sources"] };
  fighters: Fighter[];
  fights: Fight[];
  events: Event[];
  championships: Championship[];
}
interface PhotoMeta { file: string; license: string; licenseUrl: string | null; author: string; sourceUrl: string }

const dir = join(process.cwd(), "data", "snapshot");
const readJson = <T,>(file: string, fallback: T): T => (existsSync(join(dir, file)) ? (JSON.parse(readFileSync(join(dir, file), "utf8")) as T) : fallback);

export function loadUniverseFromSnapshot(): Universe {
  const snap = JSON.parse(gunzipSync(readFileSync(join(dir, "ufc.json.gz"))).toString("utf8")) as Snapshot;
  // Other organizations: ESPN results (scripts/import-espn-orgs.mts) and, for ONE
  // and KSW/RIZIN after 2024, Wikipedia (scripts/import-wiki-orgs.mts). Fighters
  // already known keep one career; the rest are added.
  const known = new Set(snap.fighters.map((f) => f.id));
  for (const file of ["orgs.json.gz", "wiki-orgs.json.gz"]) {
    if (!existsSync(join(dir, file))) continue;
    const extra = JSON.parse(gunzipSync(readFileSync(join(dir, file))).toString("utf8")) as Pick<Snapshot, "fighters" | "fights" | "events">;
    for (const f of extra.fighters) if (!known.has(f.id)) { snap.fighters.push(f); known.add(f.id); }
    snap.fights.push(...extra.fights);
    snap.events.push(...extra.events);
  }
  // Sources are imported one after another: for a while a bout can point to a
  // fighter that another source no longer has. Such bouts are left out.
  const ids = new Set(snap.fighters.map((f) => f.id));
  const orphan = new Set(snap.fights.filter((f) => !ids.has(f.redId) || !ids.has(f.blueId)).map((f) => f.id));
  if (orphan.size) {
    snap.fights = snap.fights.filter((f) => !orphan.has(f.id));
    for (const e of snap.events) e.fightIds = e.fightIds.filter((id) => !orphan.has(id));
    snap.events = snap.events.filter((e) => e.fightIds.length || e.status === "upcoming");
  }
  // One person, one record across sources (lib/data/dedupe.ts).
  const dd = dedupeFighters(snap.fighters, snap.fights);
  snap.fighters = applyAlias(dd.alias, snap.fighters, snap.fights, snap.championships);
  const aliasesOf = new Map<string, string[]>();
  for (const [from, into] of dd.alias) aliasesOf.set(into, [...(aliasesOf.get(into) ?? []), from]);
  /** A per-fighter extra keyed by id, falling back to a merged record's. */
  const pick = <T,>(m: Record<string, T>, id: string): T | undefined => m[id] ?? (aliasesOf.get(id) ?? []).map((a) => m[a]).find(Boolean);
  // Organization, division and status follow the latest bout when it's outside the UFC.
  const latest = new Map<string, { date: string; orgId: string; div: string }>();
  for (const f of snap.fights) {
    if (f.status !== "completed") continue;
    for (const id of [f.redId, f.blueId]) if ((latest.get(id)?.date ?? "") < f.date) latest.set(id, { date: f.date, orgId: f.orgId, div: f.divisionId });
  }
  const recent = new Date(Date.parse(snap.meta.asOf) - 730 * 86_400_000).toISOString().slice(0, 10);
  for (const f of snap.fighters) {
    const l = latest.get(f.id);
    if (!l || l.orgId === "ufc") continue;
    f.orgId = l.orgId;
    if (l.div !== "CATCH" && l.div !== "OPEN") f.divisionId = l.div;
    if (f.status !== "retired") f.status = l.date >= recent ? "active" : "inactive";
  }
  // Title lineage of every organization except UFC, across sources.
  snap.championships = [...snap.championships.filter((c) => c.orgId === "ufc"), ...buildLineage(snap.fights, snap.meta.asOf)];
  const extra = readJson<Record<string, { team: string | null; style: string | null }>>("espn-extra.json", {});
  const places = readJson<Record<string, { city: string; country: string | null }>>("wiki-extra.json", {});
  for (const f of snap.fighters) {
    const x = pick(extra, f.id);
    if (x) { f.team ??= x.team; f.style ??= x.style; }
    if (!f.birthPlace) f.birthPlace = pick(places, f.id) ?? f.birthPlace;
  }
  const meta = readJson<Record<string, PhotoMeta>>("photo-meta.json", {});
  const processed = readJson<Record<string, { slug: string }>>("photo-processed.json", {});
  // Official UFC studio portraits (via ESPN) are © UFC; Wikimedia Commons photos are
  // only used with PHOTO_SOURCE=free (the option for publishing without a licence).
  const free = process.env.PHOTO_SOURCE === "free";
  const official = readJson<Record<string, { slug: string; page: string; team: string | null; style: string | null }>>("photo-official-processed.json", {});
  for (const f of snap.fighters) {
    const o = pick(official, f.id);
    if (o) {
      f.team = o.team;
      f.style = o.style;
    }
    if (o && !free) {
      const owner = orgById.get(f.orgId)?.short ?? "UFC";
      f.photo = { src: `/photos/official/${o.slug}.png`, kind: "official", updated: snap.meta.asOf, author: owner, license: `© ${owner}`, licenseUrl: null, sourceUrl: o.page, credit: `Retrato oficial © ${owner} · vía ESPN` };
      continue;
    }
    if (!free) {
      f.photo = { src: "", kind: "none", credit: "Sin foto oficial", updated: snap.meta.asOf };
      continue;
    }
    const p = processed[f.id] ? meta[f.id] : undefined;
    f.photo = p
      ? {
          src: `/photos/${processed[f.id].slug}.png`, kind: "licensed", updated: snap.meta.asOf,
          author: p.author, license: p.license, licenseUrl: p.licenseUrl, sourceUrl: p.sourceUrl,
          credit: `Foto: ${p.author} · ${p.license} · Wikimedia Commons · recortada y sin fondo`,
        }
      : { src: "", kind: "none", credit: "Sin fotografía con licencia libre", updated: snap.meta.asOf };
  }
  // Chronological order is part of the provider contract (pages slice "next"/"latest").
  snap.events.sort((a, b) => a.date.localeCompare(b.date) || a.name.localeCompare(b.name));
  return {
    fighters: snap.fighters, fights: snap.fights, events: snap.events, championships: snap.championships,
    dataset: { kind: "ufc", asOf: snap.meta.asOf, lastEvent: snap.meta.lastEvent, sources: snap.meta.sources },
  };
}
