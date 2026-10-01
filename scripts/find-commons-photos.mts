/**
 * Step 1b of the photo pipeline. Wikidata links a photo for only part of the
 * roster; for active fighters and former champions still without one, this
 * searches Wikimedia Commons file titles for the fighter's name and queues
 * the best match. The licence check (fetch-photos) and the face checks
 * (process-photos: one clear face, no similar second face) still apply.
 *
 *   npm run photos:find   (≈1 request/s; cached in data/.cache/commons-search)
 *
 * Output: data/snapshot/photo-queue-extra.json
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import type { Championship, Fighter } from "../lib/domain/types.ts";

const UA = "FIGHTCORE-importer/0.2 (mcifuentesramos@gmail.com)";
const CACHE = "data/.cache/commons-search";
mkdirSync(CACHE, { recursive: true });

const snap = JSON.parse(gunzipSync(readFileSync("data/snapshot/ufc.json.gz")).toString()) as { fighters: Fighter[]; championships: Championship[] };
// Fighters already holding a usable photo; a Wikidata photo the face checks rejected
// (e.g. a group shot) doesn't count, and the search may find a better one.
const processed = existsSync("data/snapshot/photo-processed.json") ? JSON.parse(readFileSync("data/snapshot/photo-processed.json", "utf8")) as Record<string, unknown> : {};
const wikidataFile = new Map((JSON.parse(readFileSync("data/snapshot/photo-queue.json", "utf8")) as { id: string; file: string }[]).map((q) => [q.id, q.file]));
const queued = new Set(Object.keys(processed));
const belt = new Set(snap.championships.map((c) => c.fighterId));
const targets = snap.fighters.filter((f) => !queued.has(f.id) && (f.status === "active" || belt.has(f.id)) && f.firstName && f.lastName);

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
// Titles that announce more than one person, or something that isn't a portrait.
const CROWD = /\b(vs|versus|and|with|y|e|und|team|card|poster|logo|signature|autograph|weigh|map|flag|belt only|statue)\b|&/;

let last = 0;
function search(name: string): string {
  const file = `${CACHE}/${norm(name).replace(/ /g, "_")}.html`;
  if (existsSync(file)) return readFileSync(file, "utf8");
  const wait = 1500 - (Date.now() - last);
  if (wait > 0) execFileSync("sleep", [String(wait / 1000)]);
  last = Date.now();
  const url = `https://commons.wikimedia.org/w/index.php?title=Special:Search&ns6=1&fulltext=1&search=${encodeURIComponent(`"${name}"`)}`;
  execFileSync("curl", ["-sS", "-L", "--fail", "-m", "60", "-A", UA, "-o", file, url], { stdio: ["ignore", "ignore", "pipe"] });
  return readFileSync(file, "utf8");
}

// Earlier search matches that passed every check stay queued.
const previous: { id: string; slug: string; file: string }[] = existsSync("data/snapshot/photo-queue-extra.json") ? JSON.parse(readFileSync("data/snapshot/photo-queue-extra.json", "utf8")) : [];
const extra = previous.filter((q) => queued.has(q.id));
for (const [i, f] of targets.entries()) {
  const name = `${f.firstName} ${f.lastName}`;
  let html: string;
  try { html = search(name); } catch { continue; }
  const first = norm(f.firstName), lastN = norm(f.lastName);
  const files = [...new Set([...html.matchAll(/href="\/wiki\/File:([^"]+\.(?:jpe?g|png))"/gi)].map((m) => decodeURIComponent(m[1]).replace(/_/g, " ")))];
  const scored = files
    .filter((file) => file !== wikidataFile.get(f.id))
    .map((file) => {
      const t = norm(file.replace(/\.[a-z]+$/i, ""));
      if (!t.includes(lastN) || CROWD.test(t)) return null;
      const hasFirst = t.includes(first) || t.replace(/ /g, "").includes(`${first}${lastN}`.replace(/ /g, ""));
      if (!hasFirst) return null;
      return { file, score: (/cropped/.test(t) ? 2 : 0) - t.split(" ").length * 0.1 };
    })
    .filter((x): x is { file: string; score: number } => x !== null)
    .sort((a, b) => b.score - a.score);
  if (scored[0]) extra.push({ id: f.id, slug: f.slug, file: scored[0].file });
  if (i % 50 === 0) console.log(`${i + 1}/${targets.length} · found ${extra.length}`);
}
writeFileSync("data/snapshot/photo-queue-extra.json", JSON.stringify(extra));
console.log(`done · ${targets.length} searched · ${extra.length} candidates`);
