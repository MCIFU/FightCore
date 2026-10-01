/**
 * Wire format for the search index. The real dataset has ~9,000 fights and
 * ~2,800 fighters; sending ids and event names once and referencing them by
 * position cuts the payload to a fraction. pack() runs on the server,
 * unpack() in the search dialog.
 */
import type { SearchDoc, SearchFight } from "./data/repository";

export interface SearchIndexData { docs: SearchDoc[]; fights: SearchFight[]; names: Record<string, string> }

type FightTuple = [id: string, a: number, b: number, e: number, d: string, m: string, w: number];
export interface PackedIndex { v: 1; ids: string[]; names: string[]; events: string[]; docs: (Omit<SearchDoc, "rel"> & { rel?: number[] })[]; fights: FightTuple[] }

export function pack(idx: SearchIndexData): PackedIndex {
  const ids = Object.keys(idx.names);
  const pos = new Map(ids.map((id, i) => [id, i]));
  const events: string[] = [];
  const ePos = new Map<string, number>();
  const ev = (name: string) => {
    if (!ePos.has(name)) { ePos.set(name, events.length); events.push(name); }
    return ePos.get(name)!;
  };
  return {
    v: 1, ids, names: ids.map((id) => idx.names[id]), events,
    docs: idx.docs.map((d) => (d.rel ? { ...d, rel: [...new Set(d.rel)].map((id) => pos.get(id) ?? -1).filter((i) => i >= 0) } : d)) as PackedIndex["docs"],
    fights: idx.fights.map((f) => [f.id, pos.get(f.a) ?? -1, pos.get(f.b) ?? -1, ev(f.e), f.d, f.m, f.w ? pos.get(f.w) ?? -1 : -1]),
  };
}

export function unpack(p: PackedIndex): SearchIndexData {
  const names = Object.fromEntries(p.ids.map((id, i) => [id, p.names[i]]));
  return {
    names,
    docs: p.docs.map((d) => (d.rel ? { ...d, rel: d.rel.map((i) => p.ids[i]) } : d)) as SearchDoc[],
    fights: p.fights.map(([id, a, b, e, d, m, w]) => ({ id, a: p.ids[a], b: p.ids[b], e: p.events[e], d, m, w: w >= 0 ? p.ids[w] : null })),
  };
}
