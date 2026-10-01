import assert from "node:assert/strict";
import { test } from "node:test";
import { buildDemoUniverse } from "../demo/simulate.ts";
import { buildStore } from "./build.ts";
import { loadUniverseFromPostgres } from "./providers/postgres.ts";

const url = process.env.DATABASE_URL;

test("PostgreSQL provider reproduces the demo store exactly", { skip: !url && "DATABASE_URL not set" }, async () => {
  const fromDb = buildStore(await loadUniverseFromPostgres(url!));
  const demo = buildStore(buildDemoUniverse());
  assert.equal(fromDb.fighters.length, demo.fighters.length);
  assert.equal(fromDb.fights.filter((f) => f.status === "completed").length, demo.fights.filter((f) => f.status === "completed" && demo.eventById.has(f.eventId)).length);
  assert.equal(fromDb.championships.length, demo.championships.length);
  for (const f of demo.fighters) {
    const a = demo.rating.get(f.id)!, b = fromDb.rating.get(f.id)!;
    assert.ok(Math.abs(a.value - b.value) < 0.05, `${f.slug}: ${a.value} vs ${b.value}`);
    assert.deepEqual(fromDb.stats.get(f.id)!.record, demo.stats.get(f.id)!.record, f.slug);
  }
});
