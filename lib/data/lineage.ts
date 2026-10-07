/**
 * Title lineage of every organisation except UFC (whose lineage comes from the
 * UFC importer, cross-checked with Wikipedia's list of current champions).
 *
 * Built at load time from all title bouts of each organisation, whatever the
 * source (ESPN up to 2024, Wikipedia after), so one lineage spans both.
 * Rules, as for UFC: the winner of a title bout holds the belt until someone
 * else wins one in that division; an undisputed bout ends any interim reign.
 * Sources don't record vacated belts, so a reign stays current only while the
 * holder keeps fighting there: if their latest bout anywhere is elsewhere, the
 * promotion has closed, or it's older than 600 days, the reign is closed at
 * their last bout in it (`toApprox`).
 */
import type { Championship, Fight } from "../domain/types";
import { orgById } from "../domain/reference";

export function buildLineage(fights: Fight[], asOf: string, skipOrg = "ufc"): Championship[] {
  const out: Championship[] = [];
  const byOrg = new Map<string, Fight[]>();
  for (const f of fights) if (f.orgId !== skipOrg && f.titleFight && f.status === "completed") byOrg.set(f.orgId, [...(byOrg.get(f.orgId) ?? []), f]);
  for (const list of byOrg.values()) {
    const holder = new Map<string, Championship>(), interimHolder = new Map<string, Championship>();
    for (const f of list.sort((a, b) => a.date.localeCompare(b.date) || b.order - a.order)) {
      if (f.divisionId === "CATCH" || f.divisionId === "OPEN" || !f.winnerId) continue;
      const track = f.interim ? interimHolder : holder;
      const cur = track.get(f.divisionId);
      if (cur && cur.fighterId === f.winnerId) { cur.defenses++; continue; }
      if (cur) cur.to = f.date;
      const reign: Championship = { orgId: f.orgId, divisionId: f.divisionId, fighterId: f.winnerId, wonFightId: f.id, from: f.date, to: null, defenses: 0, interim: f.interim || undefined };
      out.push(reign);
      track.set(f.divisionId, reign);
      if (!f.interim) { const ir = interimHolder.get(f.divisionId); if (ir) { ir.to = f.date; interimHolder.delete(f.divisionId); } }
    }
  }
  const lastAny = new Map<string, { date: string; orgId: string }>();
  const lastIn = new Map<string, string>();
  for (const f of fights) {
    if (f.status !== "completed") continue;
    for (const id of [f.redId, f.blueId]) {
      if ((lastAny.get(id)?.date ?? "") < f.date) lastAny.set(id, { date: f.date, orgId: f.orgId });
      const k = `${id}|${f.orgId}`;
      if ((lastIn.get(k) ?? "") < f.date) lastIn.set(k, f.date);
    }
  }
  const staleBefore = new Date(Date.parse(asOf) - 600 * 86_400_000).toISOString().slice(0, 10);
  for (const r of out) {
    if (r.to) continue;
    const last = lastAny.get(r.fighterId);
    const closed = orgById.get(r.orgId)?.activeTo != null;
    if (closed || !last || last.orgId !== r.orgId || last.date < staleBefore) {
      r.to = lastIn.get(`${r.fighterId}|${r.orgId}`) ?? r.from;
      r.toApprox = true;
    }
  }
  return out;
}
