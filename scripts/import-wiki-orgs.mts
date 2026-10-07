/**
 * Results of organisations that ESPN doesn't cover (ONE Championship) or
 * stopped covering (KSW and RIZIN after 2024), from English Wikipedia
 * (CC BY-SA 4.0): the yearly "YYYY in <promotion>" pages and, for events that
 * have their own article, that article.
 *
 *   npx tsx scripts/import-wiki-orgs.mts      (npm run import:wiki-orgs)
 *
 * · Only mixed martial arts bouts: Muay Thai, kickboxing, grappling,
 *   exhibitions and "special rules" bouts are left out.
 * · Fighters are matched to existing records (UFC + ESPN organisations) by
 *   exact normalised name when the match is unique; otherwise a new record.
 * · Writes data/snapshot/wiki-orgs.json.gz (same shape as orgs.json.gz).
 * · Cache in data/.cache/wiki: pages of the last two years are refetched
 *   after 5 days (results and cards change); older pages are kept.
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { gunzipSync, gzipSync } from "node:zlib";

const require = createRequire(import.meta.url);
const iso = require("i18n-iso-countries") as { getAlpha3Code: (n: string, l: string) => string | undefined; alpha3ToAlpha2: (c: string) => string | undefined; registerLocale: (x: unknown) => void };
iso.registerLocale(require("i18n-iso-countries/langs/en.json"));

const AS_OF = new Date().toISOString().slice(0, 10);
const YEAR = +AS_OF.slice(0, 4);
const CACHE = "data/.cache/wiki";
mkdirSync(CACHE, { recursive: true });

/** Promotion → yearly page title and the years to take (ESPN covers KSW/RIZIN up to 2024). */
const SOURCES: { orgId: string; page: (y: number) => string; from: number }[] = [
  { orgId: "one", page: (y) => `${y} in ONE Championship`, from: 2011 },
  { orgId: "ksw", page: (y) => `${y} in Konfrontacja Sztuk Walki`, from: 2025 },
  { orgId: "rizin", page: (y) => `${y} in Rizin Fighting Federation`, from: 2025 },
];

// ───────── polite fetch with cache ─────────
const UA = "FIGHTCORE-importer/1.0 (https://github.com/mcifu/fightcore)";
let last = 0;
async function raw(title: string, volatile: boolean): Promise<string | null> {
  const file = `${CACHE}/${createHash("sha1").update(title).digest("hex")}.txt`;
  if (existsSync(file) && (!volatile || Date.now() - statSync(file).mtimeMs < 5 * 86_400_000)) {
    const t = readFileSync(file, "utf8");
    return t === "\u0000missing" ? null : t;
  }
  for (const wait of [0, 5_000, 20_000, 60_000]) {
    if (wait) await new Promise((r) => setTimeout(r, wait));
    const gap = 1100 - (Date.now() - last);
    if (gap > 0) await new Promise((r) => setTimeout(r, gap));
    last = Date.now();
    try {
      const r = await fetch(`https://en.wikipedia.org/w/index.php?title=${encodeURIComponent(title.replace(/ /g, "_"))}&action=raw`, { headers: { "User-Agent": UA } });
      if (r.status === 404) { writeFileSync(file, "\u0000missing"); return null; }
      if (!r.ok) continue;
      let t = await r.text();
      const redirect = t.match(/^#REDIRECT\s*\[\[([^\]|#]+)/i);
      if (redirect) t = (await raw(redirect[1], volatile)) ?? "";
      writeFileSync(file, t);
      return t;
    } catch { /* retry */ }
  }
  return null;
}

// ───────── wikitext helpers ─────────
const stripRefs = (s: string) => s.replace(/<ref[^>]*\/>/g, "").replace(/<ref[^>]*>[\s\S]*?<\/ref>/g, "").replace(/<!--[\s\S]*?-->/g, "");
/** Text of a cell; wikilink targets kept separately for identity. */
function cellText(c: string): { text: string; link: string | null; flag: string | null } {
  const flag = c.match(/\{\{\s*flag(?:icon|athlete)?\s*\|\s*([^|}]+)/i)?.[1]?.trim() ?? null;
  const link = c.match(/\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|[^\]]*)?\]\]/)?.[1]?.trim() ?? null;
  const text = c
    .replace(/\{\{\s*flag(?:icon|athlete)?\s*\|[^}]*\}\}/gi, "")
    .replace(/\{\{\s*(?:sortname)\s*\|([^|}]*)\|([^|}]*)[^}]*\}\}/gi, "$1 $2")
    .replace(/\{\{[^}]*\}\}/g, "")
    .replace(/\[\[(?:[^\]|]*\|)?([^\]]*)\]\]/g, "$1")
    .replace(/'''?/g, "").replace(/&nbsp;/g, " ").replace(/<[^>]+>/g, "")
    .replace(/^\s*(?:align|style|rowspan|colspan)=[^|]*\|/i, "")
    .replace(/\s+/g, " ").trim();
  return { text, link, flag };
}

const IOC: Record<string, string> = {
  GER: "DEU", NED: "NLD", SUI: "CHE", PHI: "PHL", POR: "PRT", CRO: "HRV", DEN: "DNK", GRE: "GRC", INA: "IDN", MAS: "MYS", MGL: "MNG",
  RSA: "ZAF", UAE: "ARE", KSA: "SAU", TPE: "TWN", VIE: "VNM", LAT: "LVA", BUL: "BGR", CHI: "CHL", SLO: "SVN", IRI: "IRN", ALG: "DZA",
  NGR: "NGA", ZIM: "ZWE", MYA: "MMR", CAM: "KHM", BAH: "BHS", PUR: "PRI", GUA: "GTM", HON: "HND", CRC: "CRI", ESA: "SLV", NCA: "NIC",
  PAR: "PRY", URU: "URY", LIB: "LBN", KUW: "KWT", SRI: "LKA", NEP: "NPL", BAN: "BGD", ENG: "GBR", SCO: "GBR", WAL: "GBR", NIR: "GBR",
  TAN: "TZA", ANG: "AGO", MAD: "MDG", HAI: "HTI", TRI: "TTO", FIJ: "FJI", SAM: "WSM", TGA: "TON", BRU: "BRN", BHU: "BTN", OMA: "OMN",
  KOS: "XKX", LBA: "LBY", SUD: "SDN", ZAM: "ZMB", BOT: "BWA", GAM: "GMB", GUI: "GIN", TOG: "TGO", BUR: "BFA", CGO: "COG", COD: "COD",
};
function country(flag: string | null): string | null {
  if (!flag) return null;
  const f = flag.trim();
  if (/^[A-Z]{3}$/.test(f)) return IOC[f] ?? (iso.alpha3ToAlpha2(f) ? f : null);
  if (/^(england|scotland|wales|northern ireland|united kingdom)$/i.test(f)) return "GBR";
  if (/^(usa|united states)$/i.test(f)) return "USA";
  if (/^russia$/i.test(f)) return "RUS";
  if (/^south korea$/i.test(f)) return "KOR";
  return iso.getAlpha3Code(f, "en") ?? null;
}

const NON_MMA = /muay ?thai|kick ?boxing|kickboxing|grappling|submission (?:grappling|only)|\bboxing\b|shoot ?boxing|lethwei|exhibition|special rules|standing bout|k-1 rules/i;
/** ONE's limits differ from the Unified Rules ones: map them by weight. */
/**
 * ONE's classes are ~4.5 kg heavier than the Unified Rules ones with the same
 * name, but fans and ONE itself use the names: ONE Flyweight champion =
 * "Peso mosca". Men's strawweight (ONE only) goes to flyweight; women's
 * atomweight to strawweight.
 */
const ONE_DIV: Record<string, string> = { strawweight: "M-FLY" };
const ONE_W: Record<string, string> = { atomweight: "W-SW" };
const ANY_W: Record<string, string> = { atomweight: "W-SW" };
const STD: Record<string, string> = {
  flyweight: "FLY", bantamweight: "BW", featherweight: "FW", lightweight: "LW", welterweight: "WW", middleweight: "MW",
  "light heavyweight": "LHW", heavyweight: "HW", strawweight: "SW", atomweight: "SW",
};
function division(text: string, orgId: string): string {
  const t = text.toLowerCase().replace(/\bmma\b/g, "").replace(/\(?\d+(?:\.\d+)?\s*(kg|lbs?|lb)\b.*$/, "").replace(/^w\.\s*/, "women's ").trim();
  // Atomweight and super atomweight are women's classes (RIZIN, ONE).
  const women = /women/.test(t) || /atomweight/.test(t);
  const w = t.replace(/women'?s\s*/, "").replace(/^super atomweight$/, "atomweight").trim();
  if (/catch|open|super heavy/.test(w)) return /open|super heavy/.test(w) ? "OPEN" : "CATCH";
  const one = orgId === "one" ? (women ? ONE_W[w] : ONE_DIV[w]) : undefined;
  if (one) return one;
  if (women && ANY_W[w]) return ANY_W[w];
  const d = STD[w];
  if (!d) return "CATCH";
  if (women) return d === "SW" ? "W-SW" : d === "FLY" ? "W-FLY" : d === "BW" ? "W-BW" : d === "FW" ? "W-FW" : "CATCH";
  return d === "SW" ? "CATCH" : `M-${d}`;
}
function method(m: string): { method: string | null; sub: string | null } {
  const s = m.toLowerCase();
  if (/no contest|overturned/.test(s)) return { method: "NC", sub: null };
  if (/\bdraw\b/.test(s)) return { method: "DRAW", sub: null };
  if (/disqualif|\bdq\b/.test(s)) return { method: "DQ", sub: null };
  if (/submission/.test(s)) return { method: "SUB", sub: m.match(/\(([^)]+)\)/)?.[1] ?? null };
  if (/split/.test(s)) return { method: "S-DEC", sub: null };
  if (/majority/.test(s)) return { method: "M-DEC", sub: null };
  if (/decision/.test(s)) return { method: "U-DEC", sub: null };
  if (/ko|tko|stoppage|retire|corner|doctor|injur/.test(s)) return { method: "KO/TKO", sub: null };
  return { method: null, sub: null };
}
const MONTHS = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
function dateOf(text: string): string | null {
  const m = text.match(/\{\{\s*(?:start date|dts|date)\s*\|\s*(\d{4})\s*\|\s*([A-Za-z]+|\d{1,2})\s*\|\s*(\d{1,2})/i);
  if (!m) {
    // Plain text: "January 25, 2025" or "25 January 2025".
    const us = text.match(/\b([A-Z][a-z]+)\s+(\d{1,2}),?\s+(\d{4})\b/), eu = text.match(/\b(\d{1,2})\s+([A-Z][a-z]+)\s+(\d{4})\b/);
    const [mon, day, yr] = us && MONTHS.includes(us[1].toLowerCase()) ? [us[1], us[2], us[3]] : eu && MONTHS.includes(eu[2].toLowerCase()) ? [eu[2], eu[1], eu[3]] : [];
    if (!mon) return null;
    return `${yr}-${String(MONTHS.indexOf(mon.toLowerCase()) + 1).padStart(2, "0")}-${String(+day).padStart(2, "0")}`;
  }
  const mo = /^\d+$/.test(m[2]) ? +m[2] : MONTHS.indexOf(m[2].toLowerCase()) + 1;
  return mo ? `${m[1]}-${String(mo).padStart(2, "0")}-${String(+m[3]).padStart(2, "0")}` : null;
}
const infobox = (t: string, k: string) => t.match(new RegExp(`\\|\\s*${k}\\s*=\\s*([^\\n]*)`, "i"))?.[1]?.trim() ?? "";

interface Row { div: string; a: ReturnType<typeof cellText>; b: ReturnType<typeof cellText>; res: string; method: string; round: string; time: string; notes: string; card: string }

/** Bout rows of a results section, in card order, both formats. */
function rows(section: string): Row[] {
  const out: Row[] = [];
  const s = stripRefs(section);
  // Template format: {{MMAevent card|…}} {{MMAevent bout|div|a|def.|b|method|round|time|notes}}
  let card = "";
  const re = /\{\{\s*MMAevent card\s*\|([^}|]*)[^}]*\}\}|\{\{\s*MMAevent bout\s*\n?([\s\S]*?)\n?\}\}(?=\s*(?:\{\{|\n|$))/gi;
  for (const m of s.matchAll(re)) {
    if (m[1] !== undefined) { card = m[1]; continue; }
    const cells = splitTemplateArgs(m[2]);
    if (cells.length < 4) continue;
    out.push({ div: cellText(cells[0]).text, a: cellText(cells[1]), res: cellText(cells[2]).text, b: cellText(cells[3]), method: cellText(cells[4] ?? "").text, round: cellText(cells[5] ?? "").text, time: cellText(cells[6] ?? "").text, notes: cellText(cells[7] ?? "").text, card });
  }
  if (out.length) return out;
  // Table format: rows separated by |-, header rows with ! colspan=8 give the card.
  card = "";
  for (const block of s.split(/\n\|-[^\n]*/)) {
    const head = block.match(/!\s*colspan="?8"?[^|]*\|\s*([^\n]*)/i);
    if (head) { card = cellText(head[1]).text; continue; }
    const cells = block.split("\n").filter((l) => l.startsWith("|") && !l.startsWith("|}") && !l.startsWith("|+")).map((l) => l.slice(1));
    if (cells.length < 7) continue;
    const res = cellText(cells[2]).text.toLowerCase();
    if (!/^(def\.?|vs\.?|draw|nc|no contest)$/.test(res)) continue;
    out.push({ div: cellText(cells[0]).text, a: cellText(cells[1]), res, b: cellText(cells[3]), method: cellText(cells[4]).text, round: cellText(cells[5]).text, time: cellText(cells[6]).text, notes: cellText(cells[7] ?? "").text, card });
  }
  return out;
}
function splitTemplateArgs(body: string): string[] {
  const out: string[] = [];
  let depth = 0, cur = "";
  for (let i = 0; i < body.length; i++) {
    const two = body.slice(i, i + 2);
    if (two === "{{" || two === "[[") { depth++; cur += two; i++; continue; }
    if (two === "}}" || two === "]]") { depth--; cur += two; i++; continue; }
    if (body[i] === "|" && depth === 0) { out.push(cur.trim()); cur = ""; continue; }
    cur += body[i];
  }
  out.push(cur.trim());
  return out.filter((x, i) => i > 0 || x !== "");
}

// ───────── existing records, for linking and unique slugs ─────────
const nameKey = (x: string) => x.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\([^)]*\)/g, "").replace(/[^a-z0-9 ]+/g, " ").split(/\s+/).filter(Boolean).sort().join(" ");
const slugify = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
type F = { id: string; slug: string; firstName: string; lastName: string };
const ufc = JSON.parse(gunzipSync(readFileSync("data/snapshot/ufc.json.gz")).toString()) as { fighters: F[]; events: { slug: string }[] };
const orgs = existsSync("data/snapshot/orgs.json.gz") ? JSON.parse(gunzipSync(readFileSync("data/snapshot/orgs.json.gz")).toString()) as { fighters: F[]; events: { slug: string }[] } : { fighters: [], events: [] };
const existing = new Map<string, string[]>();
for (const f of [...ufc.fighters, ...orgs.fighters]) { const k = nameKey(`${f.firstName} ${f.lastName}`); existing.set(k, [...(existing.get(k) ?? []), f.id]); }
const usedSlugs = new Set<string>([...ufc.fighters, ...orgs.fighters].map((f) => `f:${f.slug}`).concat([...ufc.events, ...orgs.events].map((e) => e.slug)));

// ───────── collect ─────────
interface EventOut { id: string; slug: string; name: string; orgId: string; date: string; city: string; country: string; venue: string | null; status: string; fightIds: string[]; provenance: string }
const events: EventOut[] = [], fights: Record<string, unknown>[] = [];
const people = new Map<string, { id: string; name: string; link: string | null; country: string | null; bouts: { date: string; orgId: string; div: string }[] }>();
const id = (p: string, s: string) => `${p}${createHash("sha1").update(s).digest("hex").slice(0, 14)}`;
const titleCase = (s: string) => s.trim();

function person(c: ReturnType<typeof cellText>) {
  const name = c.text.replace(/\((?:c|ic|ac)\)/gi, "").replace(/\s+/g, " ").trim();
  if (!name || /^tba|^tbd/i.test(name)) return null;
  const key = c.link ? `L:${c.link}` : `N:${nameKey(name)}`;
  let p = people.get(key);
  if (!p) {
    // Link to an existing record only on a unique exact name match.
    const ex = existing.get(nameKey(name)) ?? (c.link ? existing.get(nameKey(c.link.replace(/\s*\(.*\)$/, ""))) : undefined);
    p = { id: ex && ex.length === 1 ? ex[0] : id("w", key), name: titleCase(name), link: c.link, country: country(c.flag), bouts: [] };
    people.set(key, p);
  }
  if (!p.country) p.country = country(c.flag);
  return p;
}

let skippedNonMma = 0, skippedNoResult = 0;
const catchTexts = new Map<string, number>();
async function parseEvent(orgId: string, name: string, body: string, volatile: boolean) {
  let text = body;
  const main = body.match(/\{\{\s*Main\s*\|\s*([^}|]+)/i)?.[1]?.trim();
  if (main && !/MMAevent bout|\n\|\s*def\.|\n\|\s*vs\.?\s*\n/i.test(body)) text = (await raw(main, volatile)) ?? body;
  const date = dateOf(infobox(text, "date")) ?? dateOf(text);
  if (!date) return;
  const evName = cellText(infobox(text, "name")).text || name;
  const venue = cellText(infobox(text, "venue")).text || null;
  const cityRaw = cellText(infobox(text, "city")).text;
  const [city, ...rest] = cityRaw.split(",").map((x) => x.trim());
  const ctry = country(rest.at(-1) ?? null) ?? country(cellText(infobox(text, "city")).flag) ?? "";
  const resultsAt = text.search(/(?:=+|;)\s*(?:Results|Fight card|Announced bouts)\s*=*/i);
  const rs = rows(resultsAt >= 0 ? text.slice(resultsAt) : text);
  const evId = id("w-e", `${orgId}|${evName}|${date}`);
  const fightIds: string[] = [];
  rs.forEach((r, i) => {
    if (NON_MMA.test(`${r.div} ${r.card} ${r.notes}`)) { skippedNonMma++; return; }
    const a = person(r.a), b = person(r.b);
    if (!a || !b || a.id === b.id) return;
    // A past bout listed as "vs." never happened (cancelled) or has no result: leave it out.
    if (date <= AS_OF && !/def|draw|nc|no contest/.test(r.res)) { skippedNoResult++; return; }
    const completed = date <= AS_OF;
    const m = completed ? method(r.method) : { method: null, sub: null };
    if (completed && !m.method && !/draw|nc/.test(r.res)) { skippedNoResult++; return; }
    const meth = /draw/.test(r.res) ? "DRAW" : /nc|no contest/.test(r.res) ? "NC" : m.method;
    const div = division(r.div, orgId);
    if (div === "CATCH") catchTexts.set(r.div, (catchTexts.get(r.div) ?? 0) + 1);
    const [mm, ss] = r.time.split(":").map(Number);
    const fid = id("w-f", `${evId}|${a.name}|${b.name}|${i}`);
    const title = /championship|title/i.test(r.notes) && !/tournament|grand prix|eliminator|contender/i.test(r.notes) && /\bfor the\b|\(c\)|\(ic\)/i.test(`${r.notes} ${r.a.text} ${r.b.text}`);
    fights.push({
      id: fid, eventId: evId, date, orgId, divisionId: div, redId: a.id, blueId: b.id,
      status: completed ? "completed" : "scheduled", winnerId: completed && meth !== "DRAW" && meth !== "NC" ? a.id : null,
      method: meth, submission: m.sub, round: completed && +r.round ? +r.round : null, time: completed && !isNaN(mm) && !isNaN(ss) ? mm * 60 + ss : null,
      scheduledRounds: title ? 5 : 3, titleFight: title, interim: /interim/i.test(r.notes) || undefined, referee: null,
      slot: "main-card", order: i, red: null, blue: null, rounds: [], scorecards: null, redStrengthPre: 1500, blueStrengthPre: 1500, provenance: "imported",
    });
    for (const p of [a, b]) p.bouts.push({ date, orgId, div });
    fightIds.push(fid);
  });
  if (!fightIds.length) return;
  // Card order: first row = main event.
  fightIds.forEach((fid, i) => { const f = fights.find((x) => x.id === fid)!; f.order = i; f.slot = i === 0 ? "main" : i === 1 ? "co-main" : "main-card"; });
  let slug = slugify(evName) || `evento-${evId}`;
  if (usedSlugs.has(slug)) slug = `${slug}-${date.slice(0, 4)}`;
  if (usedSlugs.has(slug)) slug = `${slug}-${evId.slice(-6)}`;
  usedSlugs.add(slug);
  events.push({ id: evId, slug, name: evName, orgId, date, city: city ?? "", country: ctry, venue, status: date > AS_OF ? "upcoming" : "completed", fightIds, provenance: "imported" });
}

for (const src of SOURCES.filter((x) => !process.env.ONLY || x.orgId === process.env.ONLY)) {
  for (let y = +(process.env.FROM ?? src.from); y <= +(process.env.TO ?? YEAR + 1); y++) {
    const page = await raw(src.page(y), y >= YEAR - 1);
    if (!page) continue;
    const sections = page.split(/\n==(?!=)\s*([^=\n]+?)\s*==(?!=)\s*\n/);
    let n = 0;
    for (let i = 1; i < sections.length; i += 2) {
      const title = sections[i], body = sections[i + 1] ?? "";
      if (/^(events list|list of events|title fights|tournament|awards|see also|references|external links|notes|fight of|knockout of|submission of|\d{4} .*awards)/i.test(title)) continue;
      if (!/\{\{\s*(?:Infobox MMA event|Main)\s*[|}]|MMAevent bout|\n\|\s*(?:align=center\|)?def\./i.test(body)) { if (process.env.DEBUG) console.log("  · skip", title); continue; }
      const before = events.length;
      await parseEvent(src.orgId, title, body, y >= YEAR - 1);
      if (process.env.DEBUG && events.length === before) console.log("  ✗", title, "| infobox:", /Infobox MMA event/i.test(body), "| date:", dateOf(infobox(body, "date")) ?? dateOf(body), "| rows:", rows(body).length);
      n += events.length - before;
    }
    // Early years are a single event's page: the whole page is the event.
    if (!n && /Infobox MMA event/i.test(page)) { const before = events.length; await parseEvent(src.orgId, src.page(y), page.split(/\n==\s*(?:See also|References|External links)\s*==/i)[0], y >= YEAR - 1); n = events.length - before; }
    console.log(`${src.page(y)}: ${n} eventos`);
  }
}

// ───────── fighters ─────────
const dedupe = new Map(events.map((e) => [`${e.orgId}|${e.date}|${nameKey(e.name)}`, e]));
const keptEvents = [...dedupe.values()];
const keptIds = new Set(keptEvents.flatMap((e) => e.fightIds));
const keptFights = fights.filter((f) => keptIds.has(f.id as string));
const known = new Set([...ufc.fighters, ...orgs.fighters].map((f) => f.id));
const outFighters: unknown[] = [];
for (const p of people.values()) {
  if (known.has(p.id) || !p.bouts.length) continue;
  const bouts = p.bouts.sort((a, b) => a.date.localeCompare(b.date));
  const parts = p.name.split(" ");
  let slug = slugify(p.name) || `luchador-${p.id}`;
  if (usedSlugs.has(`f:${slug}`)) slug = `${slug}-${p.id.slice(-5)}`;
  usedSlugs.add(`f:${slug}`);
  const lastDiv = [...bouts].reverse().find((b) => b.div !== "CATCH" && b.div !== "OPEN")?.div;
  outFighters.push({
    id: p.id, slug, firstName: parts.length > 1 ? parts.slice(0, -1).join(" ") : "", lastName: parts.at(-1) ?? p.name, nickname: null,
    country: p.country, sex: lastDiv?.startsWith("W-") ? "F" : "M", birthDate: null, heightCm: null, reachCm: null, stance: null,
    divisionId: lastDiv ?? "M-LW", orgId: bouts.at(-1)!.orgId,
    status: bouts.at(-1)!.date >= new Date(Date.parse(AS_OF) - 730 * 86_400_000).toISOString().slice(0, 10) ? "active" : "inactive",
    priorRecord: null, team: null, style: null, wikipedia: p.link,
    photo: { src: "", kind: "none", credit: "Sin foto oficial", updated: AS_OF }, provenance: "imported",
  });
}

if (process.env.DEBUG) console.log("división no reconocida:", [...catchTexts].sort((a, b) => b[1] - a[1]).slice(0, 30));
if (process.env.ONLY || process.env.FROM || process.env.TO) { console.log("Ejecución parcial: no se escribe el snapshot."); process.exit(0); }
writeFileSync("data/snapshot/wiki-orgs.json.gz", gzipSync(JSON.stringify({ meta: { asOf: AS_OF, source: "Wikipedia (CC BY-SA 4.0)" }, fighters: outFighters, fights: keptFights, events: keptEvents })));
const per: Record<string, number> = {};
for (const f of keptFights) per[f.orgId as string] = (per[f.orgId as string] ?? 0) + 1;
console.log(`eventos ${keptEvents.length} · combates MMA ${keptFights.length} ${JSON.stringify(per)} · luchadores nuevos ${outFighters.length} · enlazados a fichas existentes ${[...people.values()].filter((p) => known.has(p.id)).length} · no-MMA descartados ${skippedNonMma} · sin resultado ${skippedNoResult}`);
