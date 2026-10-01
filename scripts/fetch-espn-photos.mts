/**
 * Official UFC studio portraits and profile extras, via ESPN's athlete data.
 *
 * ESPN publishes the UFC's official studio headshots (transparent PNG) and,
 * per athlete, team ("association"), fighting style and birth date. For each
 * fighter: search by name → keep MMA athletes with the exact same name → if a
 * birth date is known on both sides it must match (namesakes are common) →
 * download the headshot.
 *
 * ⚠ The portraits are © UFC. Fine for private use; publishing them needs
 * permission. PHOTO_SOURCE=free switches the app back to Wikimedia Commons.
 *
 *   npm run photos:espn [-- --all]     (active fighters + champions; --all = everyone)
 *   npm run photos:process
 *
 * Output: data/snapshot/espn.json, data/.cache/espn/<slug>.png
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import type { Championship, Fighter } from "../lib/domain/types.ts";

const CACHE = "data/.cache/espn";
mkdirSync(`${CACHE}/json`, { recursive: true });
const UA = "Mozilla/5.0 (FIGHTCORE data importer)";
const ALL = process.argv.includes("--all");

const snap = JSON.parse(gunzipSync(readFileSync("data/snapshot/ufc.json.gz")).toString()) as { fighters: Fighter[]; championships: Championship[] };
const belt = new Set(snap.championships.map((c) => c.fighterId));
const targets = snap.fighters.filter((f) => ALL || f.status === "active" || belt.has(f.id));

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

let last = 0;
async function getJson(url: string, key: string): Promise<unknown> {
  const file = `${CACHE}/json/${key}.json`;
  if (existsSync(file)) return JSON.parse(readFileSync(file, "utf8"));
  const wait = 300 - (Date.now() - last);
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  last = Date.now();
  const r = await fetch(url, { headers: { "User-Agent": UA } });
  if (!r.ok) return null;
  const j = await r.json();
  writeFileSync(file, JSON.stringify(j));
  return j;
}

/** ESPN shows "d/m/yyyy" or "m/d/yyyy" depending on locale: accept either reading. */
function sameBirth(display: string | undefined, iso: string | null): boolean | null {
  if (!display || !iso) return null;
  const m = display.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  const [, a, b, y] = m;
  const pad = (x: string) => x.padStart(2, "0");
  return iso === `${y}-${pad(b)}-${pad(a)}` || iso === `${y}-${pad(a)}-${pad(b)}`;
}

interface Hit { espnId: string; headshot: string; team: string | null; style: string | null; nickname: string | null; page: string }
const outPath = "data/snapshot/espn.json";
const out: Record<string, Hit & { slug: string }> = existsSync(outPath) ? JSON.parse(readFileSync(outPath, "utf8")) : {};
let found = 0, none = 0, ambiguous = 0;

for (const [i, f] of targets.entries()) {
  const name = `${f.firstName} ${f.lastName}`.trim();
  const search = (await getJson(`https://site.web.api.espn.com/apis/common/v3/search?query=${encodeURIComponent(name)}&limit=10&type=player&sport=mma`, `s-${f.slug}`)) as { items?: { id: string; displayName: string; sport?: string; headshot?: { href: string } }[] } | null;
  const cands = (search?.items ?? []).filter((x) => x.sport === "mma" && norm(x.displayName) === norm(name));
  const checked: (Hit & { dobMatch: boolean | null })[] = [];
  for (const c of cands) {
    const d = (await getJson(`https://site.web.api.espn.com/apis/common/v3/sports/mma/athletes/${c.id}`, `a-${c.id}`)) as { athlete?: Record<string, unknown> } | null;
    const a = d?.athlete as { displayDOB?: string; headshot?: { href: string }; association?: { name: string }; displayFightingStyle?: string; nickname?: string } | undefined;
    if (!a?.headshot?.href) continue;
    checked.push({
      espnId: c.id, headshot: a.headshot.href, team: a.association?.name ?? null, style: a.displayFightingStyle ?? null, nickname: a.nickname ?? null,
      page: `https://www.espn.com/mma/fighter/_/id/${c.id}`, dobMatch: sameBirth(a.displayDOB, f.birthDate),
    });
  }
  // A birth date that contradicts ours rules a candidate out; with namesakes, only a confirmed match counts.
  const ok = checked.filter((c) => c.dobMatch !== false);
  const pick = ok.length === 1 ? ok[0] : ok.filter((c) => c.dobMatch === true).length === 1 ? ok.find((c) => c.dobMatch === true)! : null;
  if (!pick) { if (ok.length > 1) ambiguous++; else none++; continue; }

  const img = `${CACHE}/${f.slug}.png`;
  if (!existsSync(img)) {
    const r = await fetch(pick.headshot, { headers: { "User-Agent": UA } });
    if (!r.ok) { none++; continue; }
    writeFileSync(img, Buffer.from(await r.arrayBuffer()));
  }
  const { dobMatch: _, ...hit } = pick;
  out[f.id] = { slug: f.slug, ...hit };
  found++;
  if (i % 50 === 0) {
    writeFileSync(outPath, JSON.stringify(out, null, 1));
    console.log(`${i + 1}/${targets.length} · con foto ${found} · sin foto ${none} · homónimos dudosos ${ambiguous}`);
  }
}
writeFileSync(outPath, JSON.stringify(out, null, 1));
console.log(`hecho · con foto ${found} · sin foto ${none} · homónimos dudosos ${ambiguous}`);
