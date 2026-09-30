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
