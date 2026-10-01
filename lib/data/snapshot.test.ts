import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { buildStore } from "./build";
import { loadUniverseFromSnapshot } from "./providers/snapshot";
import { divisionById } from "../domain/reference";

const u = loadUniverseFromSnapshot();
const store = buildStore(u);

test("snapshot: every reference resolves", () => {
  const ids = new Set(u.fighters.map((f) => f.id));
  const events = new Set(u.events.map((e) => e.id));
  for (const f of u.fights) {
    assert.ok(ids.has(f.redId) && ids.has(f.blueId), `fight ${f.id} has unknown fighter`);
    assert.ok(events.has(f.eventId), `fight ${f.id} has unknown event`);
    assert.ok(divisionById.has(f.divisionId), `fight ${f.id} has unknown division ${f.divisionId}`);
    if (f.winnerId) assert.ok(f.winnerId === f.redId || f.winnerId === f.blueId);
  }
  for (const c of u.championships) assert.ok(ids.has(c.fighterId));
});

test("snapshot: slugs are unique and names are clean", () => {
  assert.equal(new Set(u.fighters.map((f) => f.slug)).size, u.fighters.length);
  assert.equal(new Set(u.events.map((e) => e.slug)).size, u.events.length);
  for (const f of u.fighters) assert.ok(!/\((c|ic)\)/i.test(f.lastName), `${f.lastName} keeps a champion marker`);
});

test("snapshot: one current undisputed champion per active division at most", () => {
  const open = u.championships.filter((c) => !c.to && !c.interim);
  const per = new Map<string, number>();
  for (const c of open) per.set(c.divisionId, (per.get(c.divisionId) ?? 0) + 1);
  for (const [d, n] of per) assert.equal(n, 1, `${d} has ${n} open reigns`);
  assert.ok(open.length >= 8);
});

test("snapshot: licensed photos carry author, licence and an existing file", () => {
  for (const f of u.fighters) {
    if (f.photo.kind !== "licensed") continue;
    assert.ok(f.photo.author && f.photo.license && f.photo.sourceUrl, `${f.slug} photo lacks attribution`);
    assert.ok(existsSync(join(process.cwd(), "public", f.photo.src)), `${f.photo.src} missing`);
  }
});

test("snapshot: ratings are finite and bounded", () => {
  for (const r of store.rating.values()) assert.ok(Number.isFinite(r.value) && r.value >= 0 && r.value <= 100);
});
