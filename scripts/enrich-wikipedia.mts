/**
 * Fills birthplaces Wikidata lacks from each roster fighter's Wikipedia
 * infobox (birth_place). English Wikipedia, CC BY-SA 4.0; ≈1 request/s.
 *   npm run enrich:wiki   → data/snapshot/wiki-extra.json
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { gunzipSync } from "node:zlib";

const require = createRequire(import.meta.url);
const iso = require("i18n-iso-countries");
const UA = "FIGHTCORE-importer/0.2 (mcifuentesramos@gmail.com)";
const CACHE = "data/.cache/wiki-articles";
mkdirSync(CACHE, { recursive: true });

const snap = JSON.parse(gunzipSync(readFileSync("data/snapshot/ufc.json.gz")).toString()) as { fighters: { id: string; birthPlace?: unknown }[] };
const articles: Record<string, string> = JSON.parse(readFileSync("data/snapshot/roster-articles.json", "utf8"));
const missing = snap.fighters.filter((f) => !f.birthPlace && articles[f.id]);
const FIX: Record<string, string> = { "u.s.": "USA", us: "USA", "united states": "USA", england: "GBR", scotland: "GBR", wales: "GBR", "northern ireland": "GBR", russia: "RUS", "soviet union": "RUS", "south korea": "KOR", "czech republic": "CZE", czechoslovakia: "CZE", "republic of ireland": "IRL", "dagestan": "RUS", chechnya: "RUS", "yugoslavia": "SRB", "west germany": "DEU", "east germany": "DEU" };
const code = (n: string) => FIX[n.toLowerCase().trim()] ?? iso.getAlpha3Code(n.trim(), "en") ?? null;
const clean = (x: string) => x.replace(/<ref[\s\S]*?(<\/ref>|\/>)/g, "").replace(/\{\{[^}]*\}\}/g, "").replace(/\[\[(?:[^\]|]*\|)?([^\]]+)\]\]/g, "$1").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();

const out: Record<string, { city: string; country: string | null }> = existsSync("data/snapshot/wiki-extra.json") ? JSON.parse(readFileSync("data/snapshot/wiki-extra.json", "utf8")) : {};
let last = 0;
for (const [i, f] of missing.entries()) {
  const title = articles[f.id];
  const file = `${CACHE}/${title.replace(/[^\w.-]+/g, "_")}.wiki`;
  if (!existsSync(file)) {
    const wait = 1100 - (Date.now() - last);
    if (wait > 0) execFileSync("sleep", [String(wait / 1000)]);
    last = Date.now();
    try { execFileSync("curl", ["-sS", "-L", "--fail", "-m", "40", "-A", UA, "-o", file, `https://en.wikipedia.org/w/index.php?title=${encodeURIComponent(title.replace(/ /g, "_"))}&action=raw`], { stdio: "ignore" }); } catch { continue; }
  }
  const raw = readFileSync(file, "utf8");
  const m = raw.match(/\|\s*birth_place\s*=\s*([^\n]+)/);
  if (!m) continue;
  const parts = clean(m[1]).split(",").map((x) => x.trim()).filter(Boolean);
  if (!parts.length) continue;
  out[f.id] = { city: parts[0], country: code(parts.at(-1)!) };
  if (i % 50 === 0) { writeFileSync("data/snapshot/wiki-extra.json", JSON.stringify(out)); console.log(`${i + 1}/${missing.length}`); }
}
writeFileSync("data/snapshot/wiki-extra.json", JSON.stringify(out));
console.log(`birthplaces from Wikipedia: ${Object.keys(out).length} of ${missing.length}`);
