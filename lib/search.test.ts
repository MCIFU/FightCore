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
    docs: [{ t: "event" as const, id: "e1", title: "UFC 1", sub: "", href: "/events/ufc-1", k: "", rel: ["a1", "b2", "a1"] }],
    fights: [{ id: "f1", a: "a1", b: "b2", e: "UFC 1", d: "1993-11-12", m: "SUB · R1", w: "a1" }, { id: "f2", a: "b2", b: "a1", e: "UFC 1", d: "1993-11-12", m: "Programado", w: null }],
  };
  const back = unpack(JSON.parse(JSON.stringify(pack(idx))));
  assert.deepEqual(back.fights, idx.fights);
  assert.deepEqual(back.names, idx.names);
  assert.deepEqual(back.docs[0].rel, ["a1", "b2"]);
});
