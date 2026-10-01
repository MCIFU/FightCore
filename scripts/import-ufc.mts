/**
 * Real-data importer → data/snapshot/ufc.json.gz
 *
 * Sources (all public, each fact keeps its provenance):
 *   · UFC results and per-round box scores — UFCStats.com, through the CSV
 *     mirror github.com/Greco1899/scrape_ufc_stats (refreshed daily).
 *   · Nationality, birth date fallback and photo file — Wikidata (CC0).
 *   · Current roster, current champions, full pro records and scheduled
 *     cards — English Wikipedia (CC BY-SA 4.0), read as raw wikitext.
 *
 * Nothing is estimated: a value no source states stays null. Downloads are
 * cached in data/.cache (gitignored); pass --refresh to re-download.
 *
 *   npm run import:ufc
 */
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { gzipSync } from "node:zlib";
import type { Championship, Event, Fight, Fighter, Method, RoundStats, Stance, StrikeStats } from "../lib/domain/types.ts";

const require = createRequire(import.meta.url);
const iso = require("i18n-iso-countries");

const UA = "FIGHTCORE-importer/0.2 (mcifuentesramos@gmail.com)";
const CACHE = "data/.cache";
const REFRESH = process.argv.includes("--refresh");
const AS_OF = new Date().toISOString().slice(0, 10);
mkdirSync(CACHE, { recursive: true });
mkdirSync("data/snapshot", { recursive: true });

// ───────────────────────────── download helpers ─────────────────────────────
let lastWiki = 0;
function get(url: string, file: string, opts: { accept?: string; post?: string; polite?: boolean } = {}): string {
  const path = `${CACHE}/${file}`;
  if (!REFRESH && existsSync(path)) return readFileSync(path, "utf8");
  if (opts.polite) {
    const wait = 1100 - (Date.now() - lastWiki);
    if (wait > 0) execFileSync("sleep", [String(wait / 1000)]);
    lastWiki = Date.now();
  }
  const args = ["-sS", "-L", "--fail", "-m", "180", "-A", UA, "-o", path];
  if (opts.accept) args.push("-H", `Accept: ${opts.accept}`);
  if (opts.post) args.push("--data-urlencode", `query=${opts.post}`);
  execFileSync("curl", [...args, url], { stdio: ["ignore", "ignore", "inherit"] });
  return readFileSync(path, "utf8");
}
const wikiRaw = (title: string) =>
  get(`https://en.wikipedia.org/w/index.php?title=${encodeURIComponent(title.replace(/ /g, "_"))}&action=raw`, `wiki-${title.replace(/[^\w.-]+/g, "_")}.wiki`, { polite: true });

// ───────────────────────────── generic parsing ─────────────────────────────
function csv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [], cell = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) {
      if (ch === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; }
      else cell += ch;
    } else if (ch === '"') q = true;
    else if (ch === ",") { row.push(cell); cell = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cell); rows.push(row); row = []; cell = "";
    } else cell += ch;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const [head, ...body] = rows;
  return body.filter((r) => r.length > 1).map((r) => Object.fromEntries(head.map((h, i) => [h.trim(), (r[i] ?? "").trim()])));
}
/** Accent-, case- and order-insensitive name key ("Zhang Weili" = "Weili Zhang"). */
const TRANSLIT: Record<string, string> = { ł: "l", Ł: "L", ø: "o", Ø: "O", æ: "ae", Æ: "AE", ß: "ss", đ: "d", Đ: "D", ı: "i", œ: "oe", þ: "th", ð: "d" };
const nameKey = (s: string) =>
  s.replace(/[łŁøØæÆßđĐıœþð]/g, (c) => TRANSLIT[c]).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\bjr\b|\bsr\b/g, "").replace(/[^a-z0-9 ]+/g, " ").split(/\s+/).filter(Boolean).sort().join(" ");
const slugify = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const hashId = (s: string) => createHash("sha1").update(s).digest("hex").slice(0, 16);
const idFromUrl = (u: string) => u.split("/").pop()!;
const MONTHS: Record<string, string> = { jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06", jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12" };
function usDate(s: string): string | null {
  const m = s.match(/([A-Za-z]{3})[a-z]*\.? (\d{1,2}), (\d{4})/);
  return m ? `${m[3]}-${MONTHS[m[1].toLowerCase()]}-${m[2].padStart(2, "0")}` : null;
}
const unlink = (s: string) => s.replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, "$2").replace(/\[\[([^\]]+)\]\]/g, "$1").replace(/'''?/g, "").trim();

const COUNTRY_NAME_FIX: Record<string, string> = {
  eng: "GBR", sco: "GBR", wal: "GBR", nir: "GBR", usa: "USA", "u.s.": "USA", us: "USA", "united states": "USA", uk: "GBR", england: "GBR", scotland: "GBR", wales: "GBR", "northern ireland": "GBR",
  "south korea": "KOR", russia: "RUS", "czech republic": "CZE", czechia: "CZE", "republic of ireland": "IRL", "the netherlands": "NLD",
  "united arab emirates": "ARE", "abu dhabi": "ARE", turkey: "TUR", "türkiye": "TUR", macau: "MAC", "hong kong": "HKG", myanmar: "MMR", taiwan: "TWN",
  kyrgyzstan: "KGZ", moldova: "MDA", "bosnia and herzegovina": "BIH", "dr congo": "COD", "democratic republic of the congo": "COD", "puerto rico": "PRI",
};
function countryCode(name: string): string | null {
  const n = name.trim().replace(/\.$/, "");
  if (/^[A-Z]{3}$/.test(n) && iso.alpha3ToAlpha2(n)) return n;
  return COUNTRY_NAME_FIX[n.toLowerCase()] ?? iso.getAlpha3Code(n, "en") ?? null;
}

/** Spanish names for the common techniques; anything else keeps the source wording. */
const SUB_ES: Record<string, string> = {
  "rear naked choke": "Mataleón", "guillotine choke": "Guillotina", armbar: "Palanca de brazo", "arm triangle": "Triángulo de brazo",
  "triangle choke": "Triángulo", "triangle armbar": "Triángulo con palanca", "d'arce choke": "D'Arce", kimura: "Kimura", "anaconda choke": "Anaconda",
  "heel hook": "Gancho de talón", kneebar: "Palanca de rodilla", "neck crank": "Torsión cervical", keylock: "Americana", "ankle lock": "Llave de tobillo",
  "von flue choke": "Von Flue", "north-south choke": "Estrangulación norte-sur", "north south choke": "Estrangulación norte-sur", "ezekiel choke": "Ezequiel",
  "calf slicer": "Calf slicer", "bulldog choke": "Bulldog", "scarf hold": "Kesa-gatame", "forearm choke": "Estrangulación con antebrazo", "injury": "Lesión", "other": "Otra",
  "straight armbar": "Palanca de brazo recta", "inverted triangle": "Triángulo invertido", "flying triangle": "Triángulo volador", twister: "Twister", "suloev stretch": "Suloev stretch",
  "smother choke": "Estrangulación (asfixia)", "verbal submission": "Rendición verbal", "punches": "Rendición por golpes", "rear-naked choke": "Mataleón",
};
const subEs = (x: string | null) => (x ? SUB_ES[x.toLowerCase()] ?? x : null);

// ───────────────────────────── UFCStats CSVs ─────────────────────────────
const GH = "https://raw.githubusercontent.com/Greco1899/scrape_ufc_stats/main";
const load = (f: string) => csv(get(`${GH}/${f}`, f));
const eventsCsv = load("ufc_event_details.csv");
const resultsCsv = load("ufc_fight_results.csv");
const statsCsv = load("ufc_fight_stats.csv");
const detailsCsv = load("ufc_fighter_details.csv");
const tottCsv = load("ufc_fighter_tott.csv");
console.log(`UFCStats: ${eventsCsv.length} events, ${resultsCsv.length} fights, ${tottCsv.length} fighters`);

// ───────────────────────────── Wikidata ─────────────────────────────
const SPARQL = `SELECT ?p ?label ?dob ?img ?iso WHERE {
  ?p wdt:P106 wd:Q11607585 .
  ?p rdfs:label ?label FILTER(lang(?label)="en")
  OPTIONAL { ?p wdt:P569 ?dob }
  OPTIONAL { ?p wdt:P18 ?img }
  OPTIONAL { ?p wdt:P27 ?c . ?c wdt:P298 ?iso }
}`;
const wd = csv(get("https://query.wikidata.org/sparql", "wikidata-mma.csv", { accept: "text/csv", post: SPARQL }));
interface WdPerson { q: string; label: string; dob: string | null; img: string | null; iso: string[] }
const wdByQ = new Map<string, WdPerson>();
for (const r of wd) {
  const q = idFromUrl(r.p);
  const p = wdByQ.get(q) ?? { q, label: r.label, dob: r.dob ? r.dob.slice(0, 10) : null, img: null, iso: [] };
  if (r.img && !p.img) p.img = decodeURIComponent(r.img.split("/Special:FilePath/")[1] ?? "");
  if (r.iso && !p.iso.includes(r.iso)) p.iso.push(r.iso);
  wdByQ.set(q, p);
}
const wdByName = new Map<string, WdPerson[]>();
for (const p of wdByQ.values()) {
  const k = nameKey(p.label);
  wdByName.set(k, [...(wdByName.get(k) ?? []), p]);
}
console.log(`Wikidata: ${wdByQ.size} MMA fighters`);

// ───────────────────────────── Wikipedia roster ─────────────────────────────
const rosterWiki = wikiRaw("List of current UFC fighters");
interface RosterRow { name: string; article: string; iso: string | null; total: { w: number; l: number; d: number } | null; nextEvent: string | null; nextOpp: string | null; sex: "M" | "F" }
const roster = new Map<string, RosterRow>();
{
  const start = rosterWiki.indexOf("==Debuted fighters==");
  const end = rosterWiki.indexOf("==See also==");
  const body = rosterWiki.slice(start, end);
  let sex: "M" | "F" = "M";
  for (const chunk of body.split(/\n\|-/)) {
    const sec = chunk.match(/===([^=]+)===/);
    if (sec) sex = /women/i.test(sec[1]) ? "F" : "M";
    // Name cell: the line after the flag cell — {{sortname}}, a [[link]] or plain text.
    const cell = chunk.match(/\{\{#invoke:flag\|icon\|[^}]+\}\}[^\n]*\n\|\s*([^\n]+)/);
    if (!cell) continue;
    const sn = cell[1].match(/\{\{sortname\|([^|}]*)\|([^|}]*)(?:\|([^|}=]*))?[^}]*\}\}/);
    const ln = cell[1].match(/^\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/);
    const name = sn ? `${sn[1]} ${sn[2]}`.trim() : ln ? (ln[2] ?? ln[1]).trim() : cell[1].replace(/<[^>]+>|\{\{[^}]*\}\}/g, "").trim();
    if (!name) continue;
    const article = sn ? (sn[3] || name).trim() : ln ? ln[1].trim() : name;
    const flag = chunk.match(/\{\{#invoke:flag\|icon\|([^}|]+)\}\}/);
    const records = [...chunk.matchAll(/\{\{ntsh\|[^}]*\}\}\s*(\d+)[–-](\d+)(?:[–-](\d+))?/g)];
    const last = records.at(-1);
    const next = chunk.match(/\n\|\s*\[\[([^\]|]+)(?:\|[^\]]+)?\]\]\s*\([^)]*\)\s*–\s*(?:\[\[([^\]|]+)(?:\|([^\]]+))?\]\]|([^\n/]+))/);
    roster.set(nameKey(name), {
      name, article, iso: flag ? countryCode(flag[1]) : null, sex,
      total: last ? { w: +last[1], l: +last[2], d: +(last[3] ?? 0) } : null,
      nextEvent: next ? next[1].trim() : null,
      nextOpp: next ? (next[3] ?? next[2] ?? next[4] ?? "").trim() || null : null,
    });
  }
}
console.log(`Wikipedia roster: ${roster.size} fighters`);

/** Current champions as listed by Wikipedia ("Current champions" table). */
const wikiChampions: { division: string; name: string; interim: boolean; won: string | null }[] = [];
{
  const s = rosterWiki.indexOf("==Current champions");
  const table = rosterWiki.slice(s, rosterWiki.indexOf("==Debuted fighters==", s));
  let wc = "";
  for (const row of table.split(/\n\|-/)) {
    const w = row.match(/\[\[(?:Strawweight|Flyweight|Bantamweight|Featherweight|Lightweight|Welterweight|Middleweight|Light heavyweight|Heavyweight)[^|]*\|([A-Z]+)\]\]/i);
    if (w) wc = w[1];
    const g = row.match(/\|\s*(?:style="[^"]*"\s*)?\|\s*([MW])\s*\n/) ?? row.match(/\|([MW])\n/);
    const champ = row.match(/style="background:#[0-9A-F]+;?"?\s*\|\s*\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/i);
    if (!champ || !g) continue;
    const wonM = row.match(/\n\|\s*(?:\[\[[^|\]]+\|)?\s*([A-Z][a-z]+ \d{1,2}, \d{4})/);
    const map: Record<string, string> = { FTW: "FW", SW: "SW", FLW: "FLY", FYW: "FLY", BW: "BW", FW: "FW", LW: "LW", WW: "WW", MW: "MW", LHW: "LHW", HW: "HW" };
    const div = `${g[1] === "W" ? "W" : "M"}-${map[wc] ?? wc}`;
    wikiChampions.push({ division: div, name: (champ[2] ?? champ[1]).trim(), interim: /interim/i.test(row), won: wonM ? usDate(wonM[1]) : null });
  }
}
console.log(`Wikipedia current champions: ${wikiChampions.map((c) => `${c.division} ${c.name}${c.interim ? " (i)" : ""}`).join(", ")}`);

// ───────────────────────────── divisions & methods ─────────────────────────────
const DIV: Record<string, string> = {
  flyweight: "M-FLY", bantamweight: "M-BW", featherweight: "M-FW", lightweight: "M-LW", welterweight: "M-WW",
  middleweight: "M-MW", "light heavyweight": "M-LHW", heavyweight: "M-HW",
  "women's strawweight": "W-SW", "women's flyweight": "W-FLY", "women's bantamweight": "W-BW", "women's featherweight": "W-FW",
  "catch weight": "CATCH", catchweight: "CATCH", "open weight": "OPEN", "super heavyweight": "OPEN",
};
function parseWeightClass(raw: string) {
  const s = raw.trim();
  const ufcTitle = /^UFC .*Title Bout$/i.test(s) && !/Superfight/i.test(s);
  const interim = /Interim/i.test(s);
  const base = s.replace(/^UFC /i, "").replace(/Interim /i, "").replace(/ (Title )?Bout$/i, "").replace(/ Championship$/i, "").toLowerCase().trim();
  const division = DIV[base] ?? (/superfight/i.test(s) ? "OPEN" : DIV[base.replace(/^.*?((women's )?[a-z ]*weight)$/, "$1").trim()] ?? "CATCH");
  return { division, title: ufcTitle, interim: ufcTitle && interim, tournamentFinal: /Tournament/i.test(s) };
}
function parseMethod(m: string, outcome: string): Method {
  if (outcome === "NC/NC") return "NC";
  if (outcome === "D/D") return "DRAW";
  if (m.startsWith("Decision - Unanimous")) return "U-DEC";
  if (m.startsWith("Decision - Split")) return "S-DEC";
  if (m.startsWith("Decision - Majority")) return "M-DEC";
  if (m.startsWith("Submission")) return "SUB";
  if (m === "DQ") return "DQ";
  // KO/TKO, doctor's stoppage and "could not continue" (injury) are all stoppages by strikes or injury.
  return "KO/TKO";
}

// ───────────────────────────── fighters ─────────────────────────────
const nickById = new Map(detailsCsv.map((d) => [idFromUrl(d.URL), d.NICKNAME || null]));
const firstLastById = new Map(detailsCsv.map((d) => [idFromUrl(d.URL), { first: d.FIRST, last: d.LAST }]));
const cm = (ft: string) => { const m = ft.match(/(\d+)' (\d+)"/); return m ? Math.round((+m[1] * 12 + +m[2]) * 2.54) : null; };
const inch = (s: string) => { const m = s.match(/^(\d+(?:\.\d+)?)"/); return m ? Math.round(+m[1] * 2.54) : null; };
const lbs = (s: string) => { const m = s.match(/(\d+)/); return m ? +m[1] : null; };

interface Raw { id: string; name: string; first: string; last: string; nickname: string | null; dob: string | null; heightCm: number | null; reachCm: number | null; stance: Stance | null; weightLb: number | null }
const raws: Raw[] = tottCsv.map((t) => {
  const id = idFromUrl(t.URL);
  const fl = firstLastById.get(id) ?? { first: t.FIGHTER.split(" ")[0], last: t.FIGHTER.split(" ").slice(1).join(" ") };
  const st = t.STANCE === "Orthodox" || t.STANCE === "Southpaw" || t.STANCE === "Switch" ? (t.STANCE as Stance) : null;
  const dob = t.DOB && t.DOB !== "--" ? usDate(t.DOB) : null;
  return { id, name: t.FIGHTER, first: fl.first, last: fl.last, nickname: nickById.get(id) ?? null, dob, heightCm: cm(t.HEIGHT), reachCm: inch(t.REACH), stance: st, weightLb: lbs(t.WEIGHT) };
});
const rawById = new Map(raws.map((r) => [r.id, r]));
const idsByName = new Map<string, string[]>();
const idsByKey = new Map<string, string[]>();
for (const r of raws) {
  idsByName.set(r.name.trim(), [...(idsByName.get(r.name.trim()) ?? []), r.id]);
  idsByKey.set(nameKey(r.name), [...(idsByKey.get(nameKey(r.name)) ?? []), r.id]);
}
const LIMIT: Record<string, number> = { "M-FLY": 125, "M-BW": 135, "M-FW": 145, "M-LW": 155, "M-WW": 170, "M-MW": 185, "M-LHW": 205, "M-HW": 265, "W-SW": 115, "W-FLY": 125, "W-BW": 135, "W-FW": 145 };
function resolveFighter(name: string, division: string): string | null {
  const ids = idsByName.get(name.trim()) ?? idsByKey.get(nameKey(name));
  if (!ids) return null;
  if (ids.length === 1) return ids[0];
  // Homonyms (eight in UFC history): pick the one whose listed weight fits the bout.
  const lim = LIMIT[division];
  return [...ids].sort((a, b) => Math.abs((rawById.get(a)!.weightLb ?? 999) - (lim ?? 0)) - Math.abs((rawById.get(b)!.weightLb ?? 999) - (lim ?? 0)))[0];
}

// ───────────────────────────── events & fights ─────────────────────────────
// Wikipedia's past-events table adds venues (UFCStats has none) and dates for the rare event UFCStats lists without one.
const listWiki = wikiRaw("List of UFC events");
interface WikiEvent { date: string; venue: string | null; city: string; country: string | null }
const wikiEvents = new Map<string, WikiEvent>();
const wikiByDate = new Map<string, WikiEvent[]>();
let carry: { venue: string; loc: string } | null = null;
for (const row of listWiki.slice(listWiki.indexOf("==Past events=="), listWiki.indexOf("==Number of events")).split(/\n\|-/)) {
  const cells = row.split("\n").filter((l) => l.startsWith("|")).map((l) => l.slice(1).trim());
  const link = row.match(/\n\|\s*\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/);
  const d = row.match(/\{\{dts\|(\d{4})\|(\w+)\|(\d+)\}\}/);
  if (!link || !d) continue;
  const di = cells.findIndex((c) => c.startsWith("{{dts"));
  const after = cells.slice(di + 1).map((c) => c.replace(/^rowspan="?\d+"?\s*\|/, "").trim());
  // Rows that share a venue with the previous one (rowspan) omit those cells.
  const isAttendance = (c: string | undefined) => !c || /^(\{\{(nts|n\/a|sort)|\d|<ref|—|N\/A)/i.test(c);
  let venueCell: string | null, locCell: string;
  if (!isAttendance(after[1])) { venueCell = after[0]; locCell = after[1]; carry = { venue: venueCell, loc: locCell }; }
  else if (!isAttendance(after[0]) && carry) { venueCell = carry.venue; locCell = after[0]; }
  else { venueCell = carry?.venue ?? null; locCell = carry?.loc ?? ""; }
  const loc = unlink(locCell).split(",").map((x) => x.trim());
  const we: WikiEvent = {
    date: `${d[1]}-${MONTHS[d[2].slice(0, 3).toLowerCase()]}-${d[3].padStart(2, "0")}`,
    venue: venueCell ? unlink(venueCell).replace(/<ref.*$/, "").trim() || null : null,
    city: loc[0] ?? "", country: countryCode(loc.at(-1) ?? ""),
  };
  wikiByDate.set(we.date, [...(wikiByDate.get(we.date) ?? []), we]);
  for (const n of [link[1], link[2]]) if (n) wikiEvents.set(nameKey(n), we);
}
const wikiEventFor = (name: string, date?: string) => {
  const byName = wikiEvents.get(nameKey(name));
  if (byName) return byName;
  const sameDay = date ? wikiByDate.get(date) ?? [] : [];
  return sameDay.length === 1 ? sameDay[0] : null;
};

const events: Event[] = [];
const eventByName = new Map<string, Event>();
const usedEventSlugs = new Set<string>();
const uniqueSlug = (base: string, used: Set<string>, suffix: () => string) => {
  let s = base || "sin-nombre";
  if (used.has(s)) s = `${s}-${suffix()}`;
  let i = 2;
  while (used.has(s)) s = `${base}-${i++}`;
  used.add(s);
  return s;
};
for (const e of eventsCsv) {
  const date = usDate(e.DATE);
  if (!date) continue;
  const parts = e.LOCATION.split(",").map((x) => x.trim());
  const ev: Event = {
    id: idFromUrl(e.URL), slug: uniqueSlug(slugify(e.EVENT), usedEventSlugs, () => date.slice(0, 4)), name: e.EVENT.trim(), orgId: "ufc", date,
    city: parts[0] ?? "", country: countryCode(parts.at(-1) ?? "") ?? "", venue: wikiEventFor(e.EVENT, date)?.venue ?? null,
    status: date <= AS_OF ? "completed" : "upcoming", fightIds: [], provenance: "imported",
  };
  events.push(ev);
  eventByName.set(ev.name, ev);
}
const missingCountry = new Set(events.filter((e) => !e.country).map((e) => e.city));
if (missingCountry.size) console.warn("Event locations without country code:", [...missingCountry]);

const parseOf = (s: string) => { const m = s.match(/(\d+) of (\d+)/); return m ? [+m[1], +m[2]] : [0, 0]; };
const ctrl = (s: string) => { const m = s.match(/(\d+):(\d+)/); return m ? +m[1] * 60 + +m[2] : 0; };
type RoundLine = { round: number; s: StrikeStats };
const statsByBout = new Map<string, Map<string, RoundLine[]>>();
for (const r of statsCsv) {
  if (!r.ROUND) continue;
  const key = `${r.EVENT.trim()}|${r.BOUT.trim().replace(/\s+/g, " ")}`;
  const [sl, sa] = parseOf(r["SIG.STR."]), [tl, ta] = parseOf(r["TOTAL STR."]), [dl, da] = parseOf(r.TD);
  const s: StrikeStats = {
    sigLanded: sl, sigAttempted: sa, totalLanded: tl, totalAttempted: ta,
    head: parseOf(r.HEAD)[0], body: parseOf(r.BODY)[0], leg: parseOf(r.LEG)[0],
    distance: parseOf(r.DISTANCE)[0], clinch: parseOf(r.CLINCH)[0], ground: parseOf(r.GROUND)[0],
    kd: +r.KD || 0, tdLanded: dl, tdAttempted: da, subAttempts: +r["SUB.ATT"] || 0, ctrlSec: ctrl(r.CTRL),
  };
  const byFighter = statsByBout.get(key) ?? new Map<string, RoundLine[]>();
  const nm = r.FIGHTER.trim();
  const round = +(r.ROUND.match(/\d+/)?.[0] ?? 0);
  const lines = byFighter.get(nm) ?? [];
  if (lines.some((l) => l.round === round)) continue; // duplicated rows in the mirror
  byFighter.set(nm, [...lines, { round, s }]);
  statsByBout.set(key, byFighter);
}
const sumStats = (lines: RoundLine[]): StrikeStats => lines.reduce((a, { s }) => {
  for (const k of Object.keys(a) as (keyof StrikeStats)[]) a[k] += s[k];
  return a;
}, { sigLanded: 0, sigAttempted: 0, totalLanded: 0, totalAttempted: 0, head: 0, body: 0, leg: 0, distance: 0, clinch: 0, ground: 0, kd: 0, tdLanded: 0, tdAttempted: 0, subAttempts: 0, ctrlSec: 0 });
const pickRound = (s: StrikeStats) => ({ sigLanded: s.sigLanded, sigAttempted: s.sigAttempted, tdLanded: s.tdLanded, ctrlSec: s.ctrlSec, kd: s.kd });

/** Fighter id by name; people UFCStats has no profile for yet get a stub (facts unknown → null). */
const stubFighters: Raw[] = [];
const stubByKey = new Map<string, Raw>();
function idFor(name: string, division: string): string {
  const exact = resolveFighter(name, division);
  if (exact) return exact;
  const k = nameKey(name);
  const stub = stubByKey.get(k);
  if (stub) return stub.id;
  const parts = name.split(" ");
  const s: Raw = { id: `w${hashId(k)}`, name, first: parts[0], last: parts.slice(1).join(" "), nickname: null, dob: null, heightCm: null, reachCm: null, stance: null, weightLb: LIMIT[division] ?? null };
  stubFighters.push(s);
  stubByKey.set(k, s);
  return s.id;
}
const fights: Fight[] = [];
const seenFights = new Set<string>();
const cardIndex = new Map<string, number>();
const unresolved = new Set<string>();
for (const r of resultsCsv) {
  // The mirror sometimes lists a renamed event twice (same fight URLs): keep the first.
  if (seenFights.has(r.URL)) continue;
  seenFights.add(r.URL);
  let ev = eventByName.get(r.EVENT.trim());
  if (!ev) {
    const we = wikiEventFor(r.EVENT);
    if (!we) { unresolved.add(`${r.EVENT} (no date)`); continue; }
    ev = { id: `w${hashId(r.EVENT.trim())}`, slug: uniqueSlug(slugify(r.EVENT), usedEventSlugs, () => we.date.slice(0, 4)), name: r.EVENT.trim(), orgId: "ufc", date: we.date, city: we.city, country: we.country ?? "", venue: we.venue, status: "completed", fightIds: [], provenance: "imported" };
    events.push(ev);
    eventByName.set(ev.name, ev);
  }
  const bout = r.BOUT.trim().replace(/\s+/g, " ");
  const [redName, blueName] = bout.split(/ vs\. /);
  const wc = parseWeightClass(r.WEIGHTCLASS);
  if (!redName || !blueName) { unresolved.add(bout); continue; }
  const redId = idFor(redName, wc.division), blueId = idFor(blueName, wc.division);
  const idx = cardIndex.get(ev.id) ?? 0;
  cardIndex.set(ev.id, idx + 1);
  const method = parseMethod(r.METHOD.trim(), r.OUTCOME);
  const winnerId = r.OUTCOME === "W/L" ? redId : r.OUTCOME === "L/W" ? blueId : null;
  const st = statsByBout.get(`${ev.name}|${bout}`);
  const redLines = st?.get(redName.trim()) ?? [], blueLines = st?.get(blueName.trim()) ?? [];
  const hasStats = redLines.length > 0 && blueLines.length > 0;
  const rounds: RoundStats[] = hasStats
    ? redLines.map((l) => ({ round: l.round, red: pickRound(l.s), blue: pickRound((blueLines.find((b) => b.round === l.round) ?? blueLines[0]).s) }))
    : [];
  const tf = r["TIME FORMAT"].match(/^(\d+) Rnd/);
  const time = r.TIME.match(/(\d+):(\d+)/);
  const decision = method === "U-DEC" || method === "S-DEC" || method === "M-DEC" || method === "DRAW";
  const cards = decision ? [...r.DETAILS.matchAll(/(\d{2}) - (\d{2})/g)].map((m) => `${m[1]}-${m[2]}`) : [];
  fights.push({
    id: idFromUrl(r.URL), eventId: ev.id, date: ev.date, orgId: "ufc", divisionId: wc.division, redId, blueId,
    status: "completed", winnerId, method,
    // DETAILS glues the technique to an optional note ("Rear Naked ChokeOne-arm RNC"): keep the technique.
    submission: method === "SUB" ? subEs(r.DETAILS.trim().split(/(?<=[a-z)])(?=[A-Z])/)[0].replace(/\s+(From|On|At|In)\s+(Back|Mount|Half Guard|Guard|Side Control|Ground|Distance|Clinch|Standing|Top|Bottom|North South|Back Control|Crucifix)\b.*$/i, "").replace(/\s+(After Drop to .*|From Front Headlock|Standing)$/i, "").trim() || null) : null,
    round: +r.ROUND || null, time: time ? +time[1] * 60 + +time[2] : null,
    scheduledRounds: tf ? +tf[1] : 3, titleFight: wc.title, interim: wc.interim, referee: r.REFEREE || null,
    slot: idx === 0 ? "main" : idx === 1 ? "co-main" : "main-card", order: idx,
    red: hasStats ? sumStats(redLines) : null, blue: hasStats ? sumStats(blueLines) : null,
    rounds, scorecards: cards.length ? cards : null,
    redStrengthPre: 1500, blueStrengthPre: 1500, provenance: "imported",
  });
  ev.fightIds.push(idFromUrl(r.URL));
}
// Events the UFCStats mirror lacks (UFC 1) are read from their Wikipedia page: results only, no box scores.
for (const title of ["UFC 1"]) {
  if ([...eventByName.keys()].some((n) => n === title || n.startsWith(`${title}:`))) continue;
  const page = wikiRaw(title);
  const date = usDate(page.match(/\n\|\s*date\s*=\s*([^\n]+)/)?.[1] ?? "");
  if (!date) continue;
  const cityParts = unlink(page.match(/\|\s*city\s*=\s*([^\n]+)/)?.[1] ?? "").split(",").map((x) => x.trim());
  const fullName = unlink(page.match(/'''([^']*UFC 1[^']*)'''/)?.[1] ?? title);
  const ev: Event = {
    id: `w${hashId(fullName)}`, slug: uniqueSlug(slugify(fullName), usedEventSlugs, () => date.slice(0, 4)), name: fullName, orgId: "ufc", date,
    city: cityParts[0] ?? "", country: countryCode(cityParts.at(-1) ?? "") ?? "USA",
    venue: unlink(page.match(/\|\s*venue\s*=\s*([^\n]+)/)?.[1] ?? "") || null, status: "completed", fightIds: [], provenance: "imported",
  };
  // Normalise wiki links that contain a pipe ([[Patrick Smith (fighter)|Patrick Smith]]) before splitting cells.
  const rows = [...page.matchAll(/\{\{MMAevent bout\|([^\n]*)/g)].map((m) => m[1].replace(/\[\[[^\]|]+\|([^\]]+)\]\]/g, "$1").split("|"));
  rows.forEach((c, i) => {
    const [, a, verb, b, how, rnd, clock] = c.map((x) => unlink(x));
    if (verb !== "def.") return;
    const method: Method = /^Submission/i.test(how) ? "SUB" : /^(T?KO)/i.test(how) ? "KO/TKO" : /^Decision \(unanimous/i.test(how) ? "U-DEC" : /^Decision \(split/i.test(how) ? "S-DEC" : "KO/TKO";
    const redId = idFor(a, "OPEN"), blueId = idFor(b, "OPEN");
    const t = clock?.match(/(\d+):(\d+)/);
    const id = `w${hashId(`${ev.name}|${a}|${b}`)}`;
    fights.push({
      id, eventId: ev.id, date, orgId: "ufc", divisionId: "OPEN", redId, blueId, status: "completed", winnerId: redId, method,
      submission: method === "SUB" ? subEs((how.match(/\(([^)]+)\)/)?.[1] ?? "").replace(/\b\w/g, (c) => c.toUpperCase()).replace(/-(\w)/g, " $1") || null) : null,
      round: +(rnd || 1), time: t ? +t[1] * 60 + +t[2] : null, scheduledRounds: 1, titleFight: false, interim: false, referee: null,
      slot: i === 0 ? "main" : i === 1 ? "co-main" : "main-card", order: i, red: null, blue: null, rounds: [], scorecards: null,
      redStrengthPre: 1500, blueStrengthPre: 1500, provenance: "imported",
    });
    ev.fightIds.push(id);
  });
  if (ev.fightIds.length) { events.push(ev); eventByName.set(ev.name, ev); console.log(`Added from Wikipedia: ${ev.name} (${ev.fightIds.length} bouts)`); }
}

if (unresolved.size) console.warn(`Unresolved bouts: ${unresolved.size}`, [...unresolved].slice(0, 5));

// ───────────────────────────── scheduled cards (Wikipedia) ─────────────────────────────
const sched = listWiki.slice(listWiki.indexOf("==Scheduled events=="), listWiki.indexOf("==Past events=="));
for (const row of sched.split(/\n\|-/)) {
  const link = row.match(/\n\|\s*\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/);
  const d = row.match(/\{\{dts\|(\d{4})\|(\w+)\|(\d+)\}\}/);
  if (!link || !d) continue;
  const date = `${d[1]}-${MONTHS[d[2].slice(0, 3).toLowerCase()]}-${d[3].padStart(2, "0")}`;
  if (date <= AS_OF) continue;
  let page: string;
  try { page = wikiRaw(link[1].trim()); } catch { continue; }
  const redirect = page.match(/^#REDIRECT\s*\[\[([^\]]+)\]\]/i);
  if (redirect) { try { page = wikiRaw(redirect[1]); } catch { continue; } }
  const fullName = unlink((page.match(/'''''([^']+)'''''/) ?? [])[1] ?? link[2] ?? link[1]);
  const venue = page.match(/\|\s*venue\s*=\s*([^\n]+)/);
  const city = page.match(/\|\s*city\s*=\s*([^\n]+)/);
  const cityParts = city ? unlink(city[1]).split(",").map((x) => x.trim()) : [];
  const ev: Event = {
    id: `w${hashId(fullName)}`, slug: uniqueSlug(slugify(fullName), usedEventSlugs, () => date.slice(0, 4)), name: fullName, orgId: "ufc", date,
    city: cityParts[0] ?? "", country: countryCode(cityParts.at(-1) ?? "") ?? "", venue: venue ? unlink(venue[1]).replace(/<ref.*$/, "").trim() || null : null,
    status: "upcoming", fightIds: [], provenance: "imported",
  };
  const bouts: { weight: string; a: string; b: string; notes: string }[] = [];
  for (const m of page.matchAll(/\{\{MMAevent bout\s*\n((?:.|\n)*?)\n\}\}/g)) {
    const cells = m[1].split("\n").map((l) => l.replace(/^\|/, "").trim());
    if (cells.length < 4) continue;
    bouts.push({ weight: cells[0], a: unlink(cells[1]).replace(/\s*\((?:c|ic)\)\s*$/i, ""), b: unlink(cells[3]).replace(/\s*\((?:c|ic)\)\s*$/i, ""), notes: cells.slice(7).join(" ") });
  }
  const announced = page.slice(page.search(/==\s*Announced bouts\s*==/));
  if (/==\s*Announced bouts\s*==/.test(page)) {
    for (const m of announced.matchAll(/^\*\s*([^:\n]+?) bout:\s*(.+?) vs\. (.+?)(?:<ref|$)/gm)) {
      const clean = (x: string) => unlink(x).replace(/\s*\((?:c|ic)\)\s*$/i, "").trim();
      bouts.push({ weight: m[1], a: clean(m[2]), b: clean(m[3]), notes: "" });
    }
  }
  bouts.forEach((b, i) => {
    const w = b.weight.toLowerCase().replace(/ bout$/, "").trim();
    const division = DIV[w] ?? (w.includes("catch") ? "CATCH" : "CATCH");
    const titleFight = /For the (?:interim )?\[\[UFC [^\]]*Championship/i.test(b.notes);
    const redId = idFor(b.a, division), blueId = idFor(b.b, division);
    const id = `w${hashId(`${ev.name}|${b.a}|${b.b}`)}`;
    fights.push({
      id, eventId: ev.id, date, orgId: "ufc", divisionId: division, redId, blueId, status: "scheduled", winnerId: null, method: null, submission: null,
      round: null, time: null, scheduledRounds: titleFight || i === 0 ? 5 : 3, titleFight, interim: titleFight && /interim/i.test(b.notes), referee: null,
      slot: i === 0 ? "main" : i === 1 ? "co-main" : "main-card", order: i, red: null, blue: null, rounds: [], scorecards: null,
      redStrengthPre: 1500, blueStrengthPre: 1500, provenance: "imported",
    });
    ev.fightIds.push(id);
  });
  if (ev.fightIds.length) { events.push(ev); eventByName.set(ev.name, ev); }
}
console.log(`Scheduled: ${events.filter((e) => e.status === "upcoming").length} events, ${fights.filter((f) => f.status === "scheduled").length} bouts, ${stubFighters.length} newcomers`);

// ───────────────────────────── Elo (results-only strength) ─────────────────────────────
const elo = new Map<string, number>();
const ordered = [...fights].sort((a, b) => a.date.localeCompare(b.date) || b.order - a.order); // prelims first
for (const f of ordered) {
  const ra = elo.get(f.redId) ?? 1500, rb = elo.get(f.blueId) ?? 1500;
  f.redStrengthPre = Math.round(ra); f.blueStrengthPre = Math.round(rb);
  if (f.status !== "completed" || f.method === "NC") continue;
  const sa = f.winnerId === f.redId ? 1 : f.winnerId === f.blueId ? 0 : 0.5;
  const ea = 1 / (1 + 10 ** ((rb - ra) / 400));
  const k = (f.titleFight ? 48 : 36) * (f.method === "KO/TKO" || f.method === "SUB" ? 1.15 : 1);
  elo.set(f.redId, ra + k * (sa - ea));
  elo.set(f.blueId, rb - k * (sa - ea));
}

// ───────────────────────────── championships ─────────────────────────────
const championships: Championship[] = [];
const holder = new Map<string, Championship>(); // division → undisputed reign
const interimHolder = new Map<string, Championship>();
for (const f of [...fights].filter((x) => x.status === "completed" && x.titleFight).sort((a, b) => a.date.localeCompare(b.date) || b.order - a.order)) {
  const div = f.divisionId;
  if (div === "CATCH" || div === "OPEN") continue;
  const track = f.interim ? interimHolder : holder;
  const cur = track.get(div);
  if (!f.winnerId) continue; // draws / no contests: the belt stays where it was
  if (cur && cur.fighterId === f.winnerId) { cur.defenses++; continue; }
  if (cur) cur.to = f.date;
  const reign: Championship = { orgId: "ufc", divisionId: div, fighterId: f.winnerId, wonFightId: f.id, from: f.date, to: null, defenses: 0, interim: f.interim || undefined };
  championships.push(reign);
  track.set(div, reign);
  if (!f.interim) {
    // An undisputed title fight settles the division: any interim reign ends.
    const ir = interimHolder.get(div);
    if (ir) { ir.to = f.date; interimHolder.delete(div); }
  }
}

// ───────────────────────────── assemble fighters ─────────────────────────────
const boutsOf = new Map<string, Fight[]>();
for (const f of fights) for (const id of [f.redId, f.blueId]) boutsOf.set(id, [...(boutsOf.get(id) ?? []), f]);
const usedSlugs = new Set<string>();
let matchedWd = 0, withPhoto = 0;
const fighters: Fighter[] = [];
/** Wikipedia article of each roster fighter, for scripts/enrich-wikipedia.mts. */
const rosterArticles: Record<string, string> = {};
for (const r of [...raws, ...stubFighters]) {
  const fs = (boutsOf.get(r.id) ?? []).sort((a, b) => a.date.localeCompare(b.date));
  if (!fs.length) continue; // listed by UFCStats but never fought (cancelled debuts)
  const done = fs.filter((f) => f.status === "completed");
  const k = nameKey(r.name);
  const ros = roster.get(k);
  if (ros) rosterArticles[r.id] = ros.article;
  // Wikidata match: same name; birth date must agree when both sides have it.
  const cands = wdByName.get(k) ?? [];
  const byDob = r.dob ? cands.filter((c) => c.dob === r.dob) : [];
  // A unique namesake is accepted when birth dates are missing or differ by days (sources disagree on a few).
  const near = (a: string, b: string) => Math.abs(Date.parse(a) - Date.parse(b)) <= 31 * 86_400_000;
  const person = byDob.length === 1 ? byDob[0] : cands.length === 1 && (!r.dob || !cands[0].dob || near(r.dob, cands[0].dob)) ? cands[0] : null;
  if (person) matchedWd++;
  const classed = [...fs].reverse().find((f) => f.divisionId !== "CATCH" && f.divisionId !== "OPEN");
  const divisionId = classed?.divisionId ?? (ros?.sex === "F" ? "W-BW" : "M-LW");
  const sex = divisionId.startsWith("W-") || ros?.sex === "F" ? "F" : "M";
  const last = done.at(-1)?.date ?? null;
  const hasScheduled = fs.some((f) => f.status === "scheduled");
  const recent = last ? (Date.parse(AS_OF) - Date.parse(last)) / 86_400_000 < 400 : false;
  const status = ros || hasScheduled || recent ? "active" : "inactive";
  const ufc = { w: 0, l: 0, d: 0 };
  for (const f of done) {
    if (f.method === "NC") continue;
    if (!f.winnerId) ufc.d++; else if (f.winnerId === r.id) ufc.w++; else ufc.l++;
  }
  const prior = ros?.total ? { w: ros.total.w - ufc.w, l: ros.total.l - ufc.l, d: ros.total.d - ufc.d } : null;
  const country = ros?.iso ?? (person?.iso.length === 1 ? person.iso[0] : person?.iso[0] ?? null);
  const slug = uniqueSlug(slugify(r.name), usedSlugs, () => (r.dob ?? last ?? "").slice(0, 4) || "2");
  if (person?.img) withPhoto++;
  fighters.push({
    id: r.id, slug, firstName: r.first.trim(), lastName: r.last.trim(), nickname: r.nickname,
    country, sex, birthDate: r.dob ?? person?.dob ?? null, heightCm: r.heightCm, reachCm: r.reachCm, stance: r.stance,
    divisionId, orgId: "ufc", status,
    priorRecord: prior && prior.w >= 0 && prior.l >= 0 && prior.d >= 0 ? prior : null,
    wikidata: person?.q ?? null,
    photo: { src: "", kind: "none", credit: "Sin fotografía con licencia libre", updated: AS_OF },
    provenance: "imported",
  });
  if (person?.img) (fighters.at(-1) as Fighter & { _img?: string })._img = person.img;
}
console.log(`Fighters: ${fighters.length} (${fighters.filter((f) => f.status === "active").length} active) · Wikidata matched ${matchedWd} · photo files ${withPhoto}`);

// Cross-check current champions against Wikipedia.
const fighterById = new Map(fighters.map((f) => [f.id, f]));
for (const c of wikiChampions) {
  const track = c.interim ? interimHolder : holder;
  const mine = track.get(c.division);
  const mineName = mine ? `${fighterById.get(mine.fighterId)?.firstName} ${fighterById.get(mine.fighterId)?.lastName}` : "—";
  if (nameKey(mineName) === nameKey(c.name)) continue;
  console.warn(`Champion mismatch ${c.division}${c.interim ? " interim" : ""}: computed ${mineName}, Wikipedia ${c.name}`);
  // Belts also change hands without a fight (vacated, interim promoted). Wikipedia's
  // current holder wins; the reign is tied to the title fight that earned it.
  const champ = fighters.find((f) => nameKey(`${f.firstName} ${f.lastName}`) === nameKey(c.name));
  if (!champ || c.interim) continue;
  const since = c.won ?? AS_OF;
  if (mine && !mine.to) mine.to = since;
  const open = interimHolder.get(c.division);
  const earned = open?.fighterId === champ.id ? open : null;
  if (earned) { earned.to = since; interimHolder.delete(c.division); }
  const lastTitleWin = fights.filter((f) => f.titleFight && f.winnerId === champ.id && f.divisionId === c.division).sort((a, b) => a.date.localeCompare(b.date)).at(-1);
  if (!lastTitleWin) continue;
  const reign: Championship = { orgId: "ufc", divisionId: c.division, fighterId: champ.id, wonFightId: lastTitleWin.id, from: since, to: null, defenses: 0 };
  championships.push(reign);
  holder.set(c.division, reign);
  console.warn(`  → ${c.name} champion since ${since} (title fight ${lastTitleWin.date})`);
}
const listed = new Set(wikiChampions.filter((c) => !c.interim).map((c) => c.division));
for (const [div, reign] of holder) {
  if (!listed.has(div) && !reign.to) {
    // Wikipedia lists no undisputed champion: the belt was vacated after the last title fight.
    console.warn(`Vacant per Wikipedia: ${div} (last holder ${fighterById.get(reign.fighterId)?.lastName})`);
    reign.to = AS_OF;
  }
}
const interimListed = new Set(wikiChampions.filter((c) => c.interim).map((c) => c.division));
for (const [div, reign] of interimHolder) if (!interimListed.has(div) && !reign.to) reign.to = AS_OF;

// Photo candidates for the Commons step.
const photoQueue = fighters.flatMap((f) => {
  const img = (f as Fighter & { _img?: string })._img;
  delete (f as Fighter & { _img?: string })._img;
  return img ? [{ id: f.id, slug: f.slug, file: img }] : [];
});
writeFileSync("data/snapshot/roster-articles.json", JSON.stringify(rosterArticles));
writeFileSync("data/snapshot/photo-queue.json", JSON.stringify(photoQueue, null, 0));

const snapshot = {
  meta: {
    asOf: AS_OF,
    lastEvent: events.filter((e) => e.status === "completed").map((e) => e.date).sort().at(-1),
    sources: [
      { name: "UFCStats.com", via: "github.com/Greco1899/scrape_ufc_stats", covers: "Resultados y estadísticas por asalto de UFC" },
      { name: "Wikidata", license: "CC0", covers: "Nacionalidad, fecha de nacimiento (si falta), fotografía" },
      { name: "Wikipedia (en)", license: "CC BY-SA 4.0", covers: "Plantilla actual, campeones actuales, récord profesional total, carteleras programadas" },
    ],
  },
  fighters, fights, events, championships,
};
writeFileSync("data/snapshot/ufc.json.gz", gzipSync(JSON.stringify(snapshot)));
console.log(`Wrote data/snapshot/ufc.json.gz · ${fights.length} fights · ${events.length} events · ${championships.length} reigns`);
