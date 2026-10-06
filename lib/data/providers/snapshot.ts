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
  // Other organizations (scripts/import-espn-orgs.mts): their events and bouts, and
  // the fighters who never fought in the UFC. UFC fighters keep one career.
  if (existsSync(join(dir, "orgs.json.gz"))) {
    const orgs = JSON.parse(gunzipSync(readFileSync(join(dir, "orgs.json.gz"))).toString("utf8")) as Pick<Snapshot, "fighters" | "fights" | "events"> & { championships?: Snapshot["championships"] };
    const known = new Set(snap.fighters.map((f) => f.id));
    snap.fighters.push(...orgs.fighters.filter((f) => !known.has(f.id)));
    snap.fights.push(...orgs.fights);
    snap.events.push(...orgs.events);
    snap.championships.push(...(orgs.championships ?? []));
    // A UFC fighter whose latest bout is elsewhere now belongs to that organization.
    const latest = new Map<string, { date: string; orgId: string }>();
    for (const f of orgs.fights) for (const id of [f.redId, f.blueId]) if ((latest.get(id)?.date ?? "") < f.date) latest.set(id, { date: f.date, orgId: f.orgId });
    const lastUfc = new Map<string, string>();
    for (const f of snap.fights) if (f.orgId === "ufc") for (const id of [f.redId, f.blueId]) if ((lastUfc.get(id) ?? "") < f.date) lastUfc.set(id, f.date);
    for (const f of snap.fighters) {
      const l = latest.get(f.id);
      if (l && known.has(f.id) && l.date > (lastUfc.get(f.id) ?? "")) f.orgId = l.orgId;
    }
  }
  const extra = readJson<Record<string, { team: string | null; style: string | null }>>("espn-extra.json", {});
  const places = readJson<Record<string, { city: string; country: string | null }>>("wiki-extra.json", {});
  for (const f of snap.fighters) {
    const x = extra[f.id];
    if (x) { f.team ??= x.team; f.style ??= x.style; }
    if (!f.birthPlace && places[f.id]) f.birthPlace = places[f.id];
  }
  const meta = readJson<Record<string, PhotoMeta>>("photo-meta.json", {});
  const processed = readJson<Record<string, { slug: string }>>("photo-processed.json", {});
  // Official UFC studio portraits (via ESPN) are © UFC; Wikimedia Commons photos are
  // only used with PHOTO_SOURCE=free (the option for publishing without a licence).
  const free = process.env.PHOTO_SOURCE === "free";
  const official = readJson<Record<string, { slug: string; page: string; team: string | null; style: string | null }>>("photo-official-processed.json", {});
  for (const f of snap.fighters) {
    const o = official[f.id];
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
