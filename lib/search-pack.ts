/**
 * Wire format for the search index. The real dataset has ~9,000 fights and
 * ~2,800 fighters; sending ids and event names once and referencing them by
 * position cuts the payload to a fraction. pack() runs on the server,
 * unpack() in the search dialog.
 */
import type { SearchDoc, SearchFight } from "./data/repository";

export interface SearchIndexData { docs: SearchDoc[]; fights: SearchFight[]; names: Record<string, string> }

type FightTuple = [id: string, a: number, b: number, e: number, d: string, m: string, w: number];
/** Fighter doc: id and title come from ids/names, href and portrait from the slug. */
type FighterTuple = [i: number, slug: string, sub: string, k: string, r: number | null, p: number | string, c: string | null];
/** Event doc: title shared with the fights' event table, href from the slug. */
type EventTuple = [id: string, slug: string, e: number, sub: string, k: string, rel: number[]];
type LooseDoc = Omit<SearchDoc, "rel"> & { rel?: number[] };
export interface PackedIndex { v: 2; ids: string[]; names: string[]; events: string[]; fighters: FighterTuple[]; evs: EventTuple[]; docs: LooseDoc[]; fights: FightTuple[] }

const PHOTO = (slug: string) => ["", `/photos/official/${slug}.png`, `/photos/${slug}.png`];

export function pack(idx: SearchIndexData): PackedIndex {
  const ids = Object.keys(idx.names);
  const pos = new Map(ids.map((id, i) => [id, i]));
  const events: string[] = [];
  const ePos = new Map<string, number>();
  const ev = (name: string) => {
    if (!ePos.has(name)) { ePos.set(name, events.length); events.push(name); }
    return ePos.get(name)!;
  };
  const rel = (r: string[]) => [...new Set(r)].map((id) => pos.get(id) ?? -1).filter((i) => i >= 0);
  const fighters: FighterTuple[] = [], evs: EventTuple[] = [], docs: LooseDoc[] = [];
  for (const d of idx.docs) {
    const fSlug = d.href.startsWith("/fighters/") ? d.href.slice(10) : null;
    const eSlug = d.href.startsWith("/events/") ? d.href.slice(8) : null;
    if (d.t === "fighter" && fSlug && pos.has(d.id) && idx.names[d.id] === d.title && !d.rel) {
      const pc = PHOTO(fSlug).indexOf(d.p ?? "");
      fighters.push([pos.get(d.id)!, fSlug, d.sub, d.k, d.r ?? null, pc >= 0 ? pc : d.p!, d.c ?? null]);
    } else if (d.t === "event" && eSlug && d.r === undefined && d.p === undefined && d.c === undefined) {
      evs.push([d.id, eSlug, ev(d.title), d.sub, d.k, rel(d.rel ?? [])]);
    } else {
      docs.push(d.rel ? { ...d, rel: rel(d.rel) } : (d as LooseDoc));
    }
  }
  return {
    v: 2, ids, names: ids.map((id) => idx.names[id]), events, fighters, evs, docs,
    fights: idx.fights.map((f) => [f.id, pos.get(f.a) ?? -1, pos.get(f.b) ?? -1, ev(f.e), f.d, f.m, f.w ? pos.get(f.w) ?? -1 : -1]),
  };
}

export function unpack(p: PackedIndex): SearchIndexData {
  const names = Object.fromEntries(p.ids.map((id, i) => [id, p.names[i]]));
  const fighterDocs: SearchDoc[] = p.fighters.map(([i, slug, sub, k, r, pc, c]) => {
    const d: SearchDoc = { t: "fighter", id: p.ids[i], title: p.names[i], sub, href: `/fighters/${slug}`, k };
    if (r !== null) d.r = r;
    const photo = typeof pc === "number" ? PHOTO(slug)[pc] : pc;
    if (photo || pc !== 0) d.p = photo;
    if (c !== null) d.c = c;
    return d;
  });
  const eventDocs: SearchDoc[] = p.evs.map(([id, slug, e, sub, k, rel]) => ({ t: "event", id, title: p.events[e], sub, href: `/events/${slug}`, k, rel: rel.map((i) => p.ids[i]) }));
  return {
    names,
    docs: [...fighterDocs, ...eventDocs, ...(p.docs.map((d) => (d.rel ? { ...d, rel: d.rel.map((i) => p.ids[i]) } : d)) as SearchDoc[])],
    fights: p.fights.map(([id, a, b, e, d, m, w]) => ({ id, a: p.ids[a], b: p.ids[b], e: p.events[e], d, m, w: w >= 0 ? p.ids[w] : null })),
  };
}
