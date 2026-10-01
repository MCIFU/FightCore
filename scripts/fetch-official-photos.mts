/**
 * Official UFC athlete photos (ufc.com / ufcespanol.com).
 *
 * ⚠ These images are © UFC. Fine for private use; publishing them (public
 * web, Google Play) needs UFC's permission. The app shows them only when
 * PHOTO_SOURCE is not "free" — see lib/data/providers/snapshot.ts.
 *
 * ufc.com blocks datacenter IPs, so run this from your own connection:
 *   npm run photos:official            (≈1 request/s, cached in data/.cache/official)
 *   npm run photos:process             (crops the head, keeps the PNG transparency)
 *
 * Output: data/snapshot/photo-official.json and data/.cache/official/<slug>.png
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import type { Championship, Fighter } from "../lib/domain/types.ts";

const CACHE = "data/.cache/official";
mkdirSync(`${CACHE}/pages`, { recursive: true });
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36";
const HOSTS = ["https://www.ufc.com", "https://www.ufcespanol.com"];

const snap = JSON.parse(gunzipSync(readFileSync("data/snapshot/ufc.json.gz")).toString()) as { fighters: Fighter[]; championships: Championship[] };
const belt = new Set(snap.championships.map((c) => c.fighterId));
const ALL = process.argv.includes("--all");
const targets = snap.fighters.filter((f) => ALL || f.status === "active" || belt.has(f.id));

let last = 0;
async function get(url: string): Promise<Response | null> {
  const wait = 1000 - (Date.now() - last);
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  last = Date.now();
  try {
    const r = await fetch(url, { headers: { "User-Agent": UA, "Accept-Language": "es-ES,es;q=0.9,en;q=0.8" }, redirect: "follow" });
    return r.ok ? r : null;
  } catch { return null; }
}

/** The athlete page's main photo: hero image, then the full-body style, then og:image. */
function photoUrl(html: string): string | null {
  const hero = html.match(/<img[^>]+class="[^"]*hero-profile__image[^"]*"[^>]*>/)?.[0] ?? html.match(/<img[^>]*src="[^"]+"[^>]*class="[^"]*hero-profile__image/)?.[0];
  const src = hero?.match(/src="([^"]+)"/)?.[1]
    ?? html.match(/https:\/\/[^"' ]+athlete_bio_full_body[^"' ]+\.png[^"' ]*/)?.[0]
    ?? html.match(/<meta property="og:image" content="([^"]+)"/)?.[1];
  if (!src || /no-profile-image|silhouette/i.test(src)) return null;
  return src.startsWith("http") ? src : `https://www.ufc.com${src}`;
}

const slugs = (f: Fighter) => {
  const base = f.slug.replace(/-\d+$/, "");
  return [...new Set([f.slug, base, `${base}-0`])];
};

const outPath = "data/snapshot/photo-official.json";
const out: Record<string, { slug: string; src: string; page: string }> = existsSync(outPath) ? JSON.parse(readFileSync(outPath, "utf8")) : {};
let found = 0, missing = 0;
for (const [i, f] of targets.entries()) {
  const img = `${CACHE}/${f.slug}.png`;
  if (out[f.id] && existsSync(img)) { found++; continue; }
  let hit: { src: string; page: string } | null = null;
  outer: for (const host of HOSTS) {
    for (const s of slugs(f)) {
      const page = `${host}/athlete/${s}`;
      const cached = `${CACHE}/pages/${createHash("sha1").update(page).digest("hex")}.html`;
      let html = existsSync(cached) ? readFileSync(cached, "utf8") : null;
      if (html === null) {
        const r = await get(page);
        if (!r) continue;
        html = await r.text();
        writeFileSync(cached, html);
      }
      // A page for a namesake would show a different record; the name must at least match.
      const title = html.match(/<h1[^>]*hero-profile__name[^>]*>([^<]+)</)?.[1]?.trim().toLowerCase() ?? "";
      if (title && !title.includes(f.lastName.toLowerCase().split(" ").at(-1)!)) continue;
      const src = photoUrl(html);
      if (src) { hit = { src, page }; break outer; }
    }
  }
  if (!hit) { missing++; continue; }
  const r = await get(hit.src);
  if (!r) { missing++; continue; }
  writeFileSync(img, Buffer.from(await r.arrayBuffer()));
  out[f.id] = { slug: f.slug, ...hit };
  found++;
  if (i % 25 === 0) {
    writeFileSync(outPath, JSON.stringify(out, null, 1));
    console.log(`${i + 1}/${targets.length} · con foto ${found} · sin foto ${missing}`);
  }
}
writeFileSync(outPath, JSON.stringify(out, null, 1));
console.log(`hecho · con foto ${found} · sin foto ${missing}. Ahora: npm run photos:process`);
