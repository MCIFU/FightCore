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
  const meta = readJson<Record<string, PhotoMeta>>("photo-meta.json", {});
  const processed = readJson<Record<string, { slug: string }>>("photo-processed.json", {});
  for (const f of snap.fighters) {
    const p = processed[f.id] ? meta[f.id] : undefined;
    f.photo = p
      ? {
          src: `/photos/${processed[f.id].slug}.webp`, kind: "licensed", updated: snap.meta.asOf,
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
