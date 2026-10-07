import assert from "node:assert/strict";
import { test } from "node:test";
import { buildStore } from "../data/build.ts";
import { buildDemoUniverse } from "../demo/simulate.ts";
import { FACTORS, computeRating } from "./model.ts";

const store = buildStore(buildDemoUniverse());

test("weights sum to 1", () => {
  assert.equal(Math.round(FACTORS.reduce((a, f) => a + f.weight, 0) * 1000), 1000);
});

test("contributions sum to today's composite score", () => {
  for (const f of store.fighters.slice(0, 40)) {
    const r = store.rating.get(f.id)!;
    const sum = Object.values(r.contributions).reduce((a, b) => a + b, 0);
    assert.ok(Math.abs(sum - r.composite) < 0.06, `${f.slug}: ${sum} vs ${r.composite}`);
  }
});

test("one fight moves the published rating by at most 3 points", () => {
  for (const h of store.ratingHistory.values())
    for (let i = 1; i < h.length; i++) assert.ok(Math.abs(h[i].value - h[i - 1].value) <= 3.05, `${h[i].fightId}: ${h[i - 1].value} → ${h[i].value}`);
});

test("ratings stay on the 50–100 scale and band shrinks with sample", () => {
  for (const r of store.rating.values()) assert.ok(r.value >= 50 && r.value <= 100, String(r.value));
  const bouts = store.bouts.get(store.fighters[0].id)!;
  const early = computeRating(bouts.slice(0, 2), "2030-01-01");
  const late = computeRating(bouts, "2030-01-01");
  assert.ok(early.band > late.band);
  assert.equal(early.provisional, true);
});

test("the demo universe is deterministic", () => {
  const again = buildStore(buildDemoUniverse());
  assert.equal(again.fights.length, store.fights.length);
  assert.equal(again.rating.get(store.fighters[5].id)!.value, store.rating.get(store.fighters[5].id)!.value);
});

test("every fight references existing fighters and events", () => {
  for (const f of store.fights) {
    assert.ok(store.fighterById.has(f.redId) && store.fighterById.has(f.blueId));
    assert.ok(store.eventById.has(f.eventId));
    if (f.status === "completed") assert.ok(f.method !== null);
  }
});
