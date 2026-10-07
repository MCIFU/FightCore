/**
 * One person, one record. The same fighter can arrive from several sources
 * (UFCStats, ESPN, Wikipedia) under different ids. Records are merged when:
 *  · the normalised name is identical (accents, order and punctuation ignored),
 *  · birth dates are compatible: equal, a few days apart, a typical source
 *    error (year off, day and month swapped), or up to 2.5 years apart when
 *    they fought at the same or the next weight class,
 *  · they never fought on the same day, never fought each other, and fought
 *    in nearby weight classes (namesakes are often in different divisions).
 * Anything else stays separate: two different people sharing a name is more
 * common than it seems, and a wrong merge mixes two careers.
 */
import type { Championship, Fight, Fighter } from "../domain/types";
import { divisionById } from "../domain/reference";

export const nameKey = (x: string) => x.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
  .replace(/\([^)]*\)/g, "").replace(/[^a-z0-9 ]+/g, " ").split(/\s+/).filter(Boolean).sort().join(" ");

export function compatibleDob(a: string | null, b: string | null): boolean {
  if (!a || !b) return true;
  if (Math.abs(Date.parse(a) - Date.parse(b)) <= 3 * 86_400_000) return true;
  const [ay, am, ad] = a.split("-"), [by, bm, bd] = b.split("-");
  return (am === bm && ad === bd && Math.abs(+ay - +by) <= 10) || (ay === by && am === bd && ad === bm) || (ay === by && (am === bm || ad === bd));
}

/** Source priority for the surviving record: UFC (hex id) > ESPN ("e123") > Wikipedia ("w…"). */
const rank = (id: string) => (/^e\d+$/.test(id) ? 1 : id.startsWith("w") ? 2 : 0);

export interface DedupeResult { alias: Map<string, string>; merged: { keep: string; drop: string[]; name: string }[]; ambiguous: { name: string; ids: string[] }[] }

export function dedupeFighters(fighters: Fighter[], fights: Fight[]): DedupeResult {
  const bouts = new Map<string, Fight[]>();
  for (const f of fights) for (const id of [f.redId, f.blueId]) bouts.set(id, [...(bouts.get(id) ?? []), f]);
  const groups = new Map<string, Fighter[]>();
  for (const f of fighters) {
    const k = nameKey(`${f.firstName} ${f.lastName}`);
    if (k.length < 5 || !k.includes(" ")) continue; // single names ("Kongchai") are too ambiguous
    groups.set(k, [...(groups.get(k) ?? []), f]);
  }
  const alias = new Map<string, string>();
  const merged: DedupeResult["merged"] = [], ambiguous: DedupeResult["ambiguous"] = [];
  const order = (f: Fighter) => divisionById.get(f.divisionId)?.order ?? 50;

  for (const [, list] of groups) {
    if (list.length < 2) continue;
    // Clusters of records that can be the same person.
    const sorted = [...list].sort((a, b) => rank(a.id) - rank(b.id) || (bouts.get(b.id)?.length ?? 0) - (bouts.get(a.id)?.length ?? 0));
    const clusters: Fighter[][] = [];
    for (const f of sorted) {
      const fits = clusters.filter((c) => c.every((g) => sameish(f, g)));
      if (fits.length === 1) fits[0].push(f);
      else if (fits.length === 0) clusters.push([f]);
      else ambiguous.push({ name: `${f.firstName} ${f.lastName}`, ids: [f.id, ...fits.map((c) => c[0].id)] }); // fits several namesakes: leave it alone
    }
    for (const c of clusters) {
      if (c.length < 2) continue;
      const [keep, ...drop] = c;
      for (const d of drop) alias.set(d.id, keep.id);
      merged.push({ keep: keep.id, drop: drop.map((d) => d.id), name: `${keep.firstName} ${keep.lastName}` });
    }
  }
  return { alias, merged, ambiguous };

  function sameish(a: Fighter, b: Fighter): boolean {
    // Sources disagree on birth dates more than on anything else: a gap of up to
    // 2.5 years is accepted when they fought at the same or the next weight.
    const dobGap = a.birthDate && b.birthDate ? Math.abs(Date.parse(a.birthDate) - Date.parse(b.birthDate)) / (365.25 * 86_400_000) : 0;
    if (!compatibleDob(a.birthDate, b.birthDate) && !(dobGap <= 2.5 && Math.abs(order(a) - order(b)) <= 1)) return false;
    if (a.sex && b.sex && a.sex !== b.sex) return false;
    const ba = bouts.get(a.id) ?? [], bb = bouts.get(b.id) ?? [];
    const daysA = new Set(ba.map((f) => f.date));
    if (bb.some((f) => daysA.has(f.date))) return false; // two bouts the same day: two people
    if (ba.some((f) => f.redId === b.id || f.blueId === b.id)) return false;
    // Nearby weight classes (namesakes are often far apart).
    if (Math.abs(order(a) - order(b)) > 3) return false;
    // Without a birth date on either side, require that careers don't overlap
    // in time, or that they overlap in the same promotion.
    if (!a.birthDate || !b.birthDate) {
      const span = (x: Fight[]) => [x.reduce((m, f) => (f.date < m ? f.date : m), "9999"), x.reduce((m, f) => (f.date > m ? f.date : m), "0000")];
      const [a0, a1] = span(ba), [b0, b1] = span(bb);
      const overlap = a0 <= b1 && b0 <= a1;
      const orgsA = new Set(ba.map((f) => f.orgId));
      if (overlap && !bb.some((f) => orgsA.has(f.orgId))) return false;
    }
    return true;
  }
}

/** Rewrites ids after a merge; the kept record takes missing facts from the dropped ones. */
export function applyAlias(alias: Map<string, string>, fighters: Fighter[], fights: Fight[], championships: Championship[]): Fighter[] {
  if (!alias.size) return fighters;
  const to = (id: string) => alias.get(id) ?? id;
  const byId = new Map(fighters.map((f) => [f.id, f]));
  for (const [from, into] of alias) {
    const a = byId.get(from), k = byId.get(into);
    if (!a || !k) continue;
    k.birthDate ??= a.birthDate; k.country ??= a.country; k.heightCm ??= a.heightCm; k.reachCm ??= a.reachCm;
    k.stance ??= a.stance; k.nickname ??= a.nickname; k.team ??= a.team; k.style ??= a.style; k.birthPlace ??= a.birthPlace;
  }
  for (const f of fights) { f.redId = to(f.redId); f.blueId = to(f.blueId); if (f.winnerId) f.winnerId = to(f.winnerId); }
  for (const c of championships) c.fighterId = to(c.fighterId);
  return fighters.filter((f) => !alias.has(f.id));
}
