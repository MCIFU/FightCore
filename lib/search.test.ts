import assert from "node:assert/strict";
import { test } from "node:test";
import { score } from "../components/search/match.ts";

test("exact and prefix matches rank highest", () => {
  assert.equal(score("jon jones", "Jon Jones"), 100);
  assert.ok(score("jon", "Jon Jones") > score("jones", "Jon Jones") - 1);
});

test("accent-insensitive", () => {
  assert.ok(score("josue", "Josué Bittencourt") > 0);
});

test("tolerates one typo, including a dropped letter", () => {
  assert.ok(score("bittncourt", "Josué Bittencourt") > 0);
  assert.ok(score("bitencourt", "Josué Bittencourt") > 0);
});

test("every token must match", () => {
  assert.equal(score("bittencourt tokyo", "Josué Bittencourt"), 0);
  assert.equal(score("bittncourt", "Darnell Vance"), 0);
});

test("search index survives pack/unpack", async () => {
  const { pack, unpack } = await import("./search-pack");
  const idx = {
    names: { a1: "Ana Uno", b2: "Bea Dos" },
    docs: [
      { t: "event" as const, id: "e1", title: "UFC 1", sub: "", href: "/events/ufc-1", k: "", rel: ["a1", "b2", "a1"] },
      { t: "fighter" as const, id: "a1", title: "Ana Uno", sub: "FLY · UFC · 3-0-0", href: "/fighters/ana-uno", k: "Uno", r: 61.2, p: "/photos/official/ana-uno.png", c: "Campeón UFC" },
      { t: "fighter" as const, id: "b2", title: "Bea Dos", sub: "BW · PFL · 1-0-0", href: "/fighters/bea-dos", k: "", r: 50 },
      { t: "page" as const, id: "/stats", title: "Stats", sub: "Sección", href: "/stats", k: "stats" },
    ],
    fights: [{ id: "f1", a: "a1", b: "b2", e: "UFC 1", d: "1993-11-12", m: "SUB · R1", w: "a1" }, { id: "f2", a: "b2", b: "a1", e: "UFC 1", d: "1993-11-12", m: "Programado", w: null }],
  };
  const back = unpack(JSON.parse(JSON.stringify(pack(idx))));
  assert.deepEqual(back.fights, idx.fights);
  assert.deepEqual(back.names, idx.names);
  const byId = (id: string) => back.docs.find((d) => d.id === id);
  assert.deepEqual(byId("e1")!.rel, ["a1", "b2"]);
  assert.deepEqual(byId("a1"), idx.docs[1]);
  assert.deepEqual(byId("b2"), idx.docs[2]);
  assert.deepEqual(byId("/stats"), idx.docs[3]);
});
