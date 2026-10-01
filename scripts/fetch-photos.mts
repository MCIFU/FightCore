/**
 * Step 2 of the photo pipeline. For every fighter matched to a Wikidata
 * image (data/snapshot/photo-queue.json, written by import-ufc), reads the
 * Wikimedia Commons file page, keeps it only when it carries a free licence,
 * records author + licence, and downloads an 800 px rendition.
 *
 *   npm run photos:fetch     (≈1 request/s; cached in data/.cache)
 *
 * Output: data/snapshot/photo-meta.json and data/.cache/photos/<slug>.<ext>.
 * Step 3 (scripts/process-photos.py) crops the head and removes the background.
 */
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";

const UA = "FIGHTCORE-importer/0.2 (mcifuentesramos@gmail.com)";
const CACHE = "data/.cache/commons";
const PHOTOS = "data/.cache/photos";
mkdirSync(CACHE, { recursive: true });
mkdirSync(PHOTOS, { recursive: true });

const FREE = /^(CC0|CC BY(-SA)? \d|CC BY(-SA)?$|Public domain|PD|GFDL|FAL|Attribution|No restrictions)/i;
let last = 0;
/** Paced at ~1.5 s per request; Wikimedia answers bursts with HTTP 429, so back off and retry. */
function curl(url: string, out: string, retries = [0, 8, 30, 90]) {
  for (const backoff of retries) {
    if (backoff) execFileSync("sleep", [String(backoff)]);
    const wait = 1500 - (Date.now() - last);
    if (wait > 0) execFileSync("sleep", [String(wait / 1000)]);
    last = Date.now();
    try {
      execFileSync("curl", ["-sS", "-L", "--fail", "-m", "90", "-A", UA, "-o", out, url], { stdio: ["ignore", "ignore", "pipe"] });
      return;
    } catch (e) {
      if (backoff === retries.at(-1)) throw e;
    }
  }
}
const text = (html: string) =>
  html.replace(/<style[\s\S]*?<\/style>/g, "").replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&#95;/g, "_").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();

interface Meta { file: string; license: string; licenseUrl: string | null; author: string; sourceUrl: string; ext: string }
const queue = [
  ...JSON.parse(readFileSync("data/snapshot/photo-queue.json", "utf8")),
  // Matches found by searching Commons (scripts/find-commons-photos.mts).
  ...(existsSync("data/snapshot/photo-queue-extra.json") ? JSON.parse(readFileSync("data/snapshot/photo-queue-extra.json", "utf8")).map((q: object) => ({ ...q, search: true })) : []),
] as { id: string; slug: string; file: string; search?: boolean }[];
/** A file found by name search must say it is about combat sports: namesakes are common. */
/** The file sits in the fighter's own person category, and that category is about combat sports. */
function personCategoryIsMma(html: string, slug: string): boolean {
  const cats = [...html.matchAll(/href="\/wiki\/(Category:[^"#?]+)"/g)].map((m) => decodeURIComponent(m[1]));
  const want = slug.replace(/-\d{4}$/, "").replace(/-/g, " ");
  const cat = cats.find((c) => c.slice(9).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[_-]+/g, " ") === want);
  if (!cat) return false;
  const file = `${CACHE}/${createHash("sha1").update(cat).digest("hex")}.cat.html`;
  try {
    if (!existsSync(file)) curl(`https://commons.wikimedia.org/wiki/${encodeURIComponent(cat)}`, file);
    return MMA_CONTEXT.test(text(readFileSync(file, "utf8")));
  } catch { return false; }
}
const MMA_CONTEXT = /\b(UFC|mixed martial|MMA|Bellator|PFL|Strikeforce|ONE Championship|Cage Warriors|K-1|kickbox|jiu.jitsu|grappl|lutador|luchador|artes marciales mixtas|Kampfsport|octagon|weigh.in|fight night)\b/i;
const out: Record<string, Meta> = existsSync("data/snapshot/photo-meta.json") ? JSON.parse(readFileSync("data/snapshot/photo-meta.json", "utf8")) : {};
let ok = 0, nonFree = 0, failed = 0, offTopic = 0;
for (const [i, q] of queue.entries()) {
  const pageUrl = `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(q.file.replace(/ /g, "_"))}`;
  const cached = `${CACHE}/${createHash("sha1").update(q.file).digest("hex")}.html`;
  try {
    if (!existsSync(cached)) curl(pageUrl, cached);
    const html = readFileSync(cached, "utf8").replace(/&#95;/g, "_");
    const short = html.match(/class="licensetpl_short"[^>]*>([^<]*)/)?.[1]?.trim();
    const link = html.match(/class="licensetpl_link"[^>]*>([^<]*)/)?.[1]?.trim() || null;
    if (!short || !FREE.test(short)) { nonFree++; delete out[q.id]; continue; }
    if (q.search && !MMA_CONTEXT.test(text(html)) && !personCategoryIsMma(html, q.slug)) {
      if (out[q.id]?.file === q.file) delete out[q.id];
      offTopic++;
      continue;
    }
    const autCell = html.match(/id="fileinfotpl_aut"[^>]*>[\s\S]*?<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>/)?.[1];
    const p170 = html.match(/author name string[^<]*<\/[^>]+>\s*(?:<[^>]+>\s*)*:\s*([^<]+)/)?.[1];
    let author = autCell ? text(autCell) : p170 ? p170.trim() : "";
    author = author.replace(/\s*\(talk\)|\s*Wikidata.*$/i, "").slice(0, 160) || "Autor no indicado en Commons";
    const ext = (q.file.match(/\.(jpe?g|png|webp|tiff?)$/i)?.[1] ?? "jpg").toLowerCase().replace("jpeg", "jpg");
    const img = `${PHOTOS}/${q.slug}.${ext === "tif" || ext === "tiff" ? "jpg" : ext}`;
    // A different source file for the same fighter (search fallback) replaces the cached image.
    if (out[q.id] && out[q.id].file !== q.file && existsSync(img)) rmSync(img);
    if (!existsSync(img)) {
      // Thumbnails come from thumb.wikimedia.org; a width at or above the original
      // redirects to the original file, which is rate-limited — so step down.
      let got = false;
      for (const w of [1024, 800, 640, 500, 400, 330, 250]) {
        try { curl(`https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(q.file)}?width=${w}`, img, [0]); got = true; break; } catch { /* next size */ }
      }
      if (!got) throw new Error("no downloadable rendition");
    }
    out[q.id] = { file: q.file, license: short, licenseUrl: link, author, sourceUrl: pageUrl, ext };
    ok++;
  } catch (e) {
    failed++;
    console.warn(`✗ ${q.file}: ${(e as Error).message.split("\n")[0]}`);
  }
  if (i % 25 === 0) {
    writeFileSync("data/snapshot/photo-meta.json", JSON.stringify(out, null, 1));
    console.log(`${i + 1}/${queue.length} · ok ${ok} · non-free ${nonFree} · failed ${failed}`);
  }
}
writeFileSync("data/snapshot/photo-meta.json", JSON.stringify(out, null, 1));
console.log(`done · ok ${ok} · non-free ${nonFree} · off-topic ${offTopic} · failed ${failed}`);
