/**
 * Other organizations (PFL, Bellator, RIZIN, KSW, Cage Warriors, LFA,
 * Strikeforce, WEC, PRIDE, DREAM…) from ESPN's MMA data → data/snapshot/orgs.json.gz
 *
 * ESPN gives every bout's result, method, round and time, the card segment
 * and venue; and for every athlete name, birth date, height, reach, stance,
 * nationality, team and style. It has no strike statistics outside the UFC,
 * so those bouts count for results (record, strength, rating factors based on
 * results) but not for performance metrics.
 *
 * ESPN athlete ids are the same ones matched to UFC fighters in
 * data/snapshot/espn.json, so a UFC fighter's Bellator or PFL bouts join his
 * career automatically.
 *
 *   npm run import:orgs        (cached in data/.cache/espn-core; ≈30–60 min the first time)
 */
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { gunzipSync, gzipSync } from "node:zlib";

const require = createRequire(import.meta.url);
const iso = require("i18n-iso-countries");

/** ESPN league slug → FIGHTCORE organization id (lib/domain/reference.ts). */
const LEAGUES: Record<string, string> = {
  pfl: "pfl", bellator: "bellator", rizin: "rizin", ksw: "ksw", "cage-warriors": "cw", lfa: "lfa",
  strikeforce: "strikeforce", wec: "wec", pride: "pride", dream: "dream", pancrase: "pancrase", "shooto-japan": "shooto",
};
const YEARS = Array.from({ length: new Date().getUTCFullYear() + 1 - 1997 + 1 }, (_, i) => 1997 + i);
const CACHE = "data/.cache/espn-core";
mkdirSync(CACHE, { recursive: true });
const AS_OF = new Date().toISOString().slice(0, 10);

// ───────── fetch with cache, retries and a small concurrency pool ─────────
const key = (u: string) => createHash("sha1").update(u.replace(/^http:/, "https:").replace(/[?&](lang|region)=[^&]*/g, "")).digest("hex");
/** maxAgeDays: refetch a cached answer older than this (recent events change; old ones don't). */
async function get<T = Record<string, unknown>>(url: string, maxAgeDays = Infinity): Promise<T | null> {
  const u = url.replace(/^http:/, "https:");
  const file = `${CACHE}/${key(u)}.json`;
  if (existsSync(file) && Date.now() - statSync(file).mtimeMs < maxAgeDays * 86_400_000) { const t = readFileSync(file, "utf8"); return t === "null" ? null : JSON.parse(t); }
  for (const wait of [0, 2000, 8000]) {
    if (wait) await new Promise((r) => setTimeout(r, wait));
    try {
      const r = await fetch(u, { headers: { "User-Agent": "FIGHTCORE data importer" } });
      if (r.status === 404 || r.status === 400) { writeFileSync(file, "null"); return null; }
      if (!r.ok) continue;
      const j = await r.json();
      if ((j as { error?: unknown }).error) { writeFileSync(file, "null"); return null; }
      writeFileSync(file, JSON.stringify(j));
      return j as T;
    } catch { /* retry */ }
  }
  return null;
}
async function pool<T, R>(items: T[], n: number, fn: (x: T, i: number) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  await Promise.all(Array.from({ length: n }, async () => {
    while (next < items.length) { const i = next++; out[i] = await fn(items[i], i); }
  }));
  return out;
}

// ───────── helpers ─────────
const slugify = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const COUNTRY_FIX: Record<string, string> = {
  usa: "USA", "united states": "USA", england: "GBR", scotland: "GBR", wales: "GBR", "northern ireland": "GBR", "united kingdom": "GBR",
  russia: "RUS", "south korea": "KOR", korea: "KOR", "czech republic": "CZE", czechia: "CZE", "the netherlands": "NLD", netherlands: "NLD",
  "united arab emirates": "ARE", uae: "ARE", turkey: "TUR", "türkiye": "TUR", moldova: "MDA", "bosnia and herzegovina": "BIH", "dr congo": "COD",
  "democratic republic of the congo": "COD", "republic of ireland": "IRL", ireland: "IRL", taiwan: "TWN", "hong kong": "HKG", "puerto rico": "PRI",
  kyrgyzstan: "KGZ", venezuela: "VEN", bolivia: "BOL", iran: "IRN", syria: "SYR", vietnam: "VNM", laos: "LAO", tanzania: "TZA",
};
const country = (name: string | undefined | null) => {
  if (!name) return null;
  const n = name.trim();
  if (/^[A-Z]{3}$/.test(n) && iso.alpha3ToAlpha2(n)) return n;
  return COUNTRY_FIX[n.toLowerCase()] ?? iso.getAlpha3Code(n, "en") ?? null;
};
const DIV: Record<string, string> = {
  flyweight: "FLY", bantamweight: "BW", featherweight: "FW", lightweight: "LW", welterweight: "WW", middleweight: "MW",
  "light heavyweight": "LHW", heavyweight: "HW", strawweight: "SW", atomweight: "SW",
};
function division(text: string | null | undefined, female: boolean): string {
  const t = (text ?? "").toLowerCase().replace(/women'?s\s*/, "").trim();
  const w = /women/i.test(text ?? "") || female;
  if (!t || /catch/.test(t)) return "CATCH";
  if (/open|super heavy/.test(t)) return "OPEN";
  const d = DIV[t];
  if (!d) return "CATCH";
  if (w) return d === "SW" ? "W-SW" : d === "FLY" ? "W-FLY" : d === "BW" ? "W-BW" : d === "FW" ? "W-FW" : "CATCH";
  return d === "SW" ? "CATCH" : `M-${d}`;
}
function method(r: { name?: string; displayName?: string; description?: string } | undefined, draw: boolean, nc: boolean): string | null {
  if (nc) return "NC";
  if (draw) return "DRAW";
  const s = `${r?.name ?? ""} ${r?.displayName ?? ""}`.toLowerCase();
  if (!s.trim()) return null;
  if (/disq|\bdq\b/.test(s)) return "DQ";
  if (/sub/.test(s)) return "SUB";
  if (/split/.test(s)) return "S-DEC";
  if (/majority/.test(s)) return "M-DEC";
  if (/dec|unanim|points/.test(s)) return "U-DEC";
  if (/ko|tko|stoppage|doctor|retire|corner|injur/.test(s)) return "KO/TKO";
  if (/no contest|overturn/.test(s)) return "NC";
  if (/draw/.test(s)) return "DRAW";
  return null;
}

/**
 * Title bouts: ESPN tags them in competition.types ("Bellator Middleweight Title",
 * "KSW Heavyweight Championship", "Lightweight Title"). Tournament finals and
 * regional belts (WSOF Canadian…) are not the promotion's world title, and a
 * belt named after another promotion is not this one's lineage.
 */
const TITLE_ORG: [RegExp, string][] = [
  [/^bellator\b/i, "bellator"], [/^pfl\b/i, "pfl"], [/^ksw\b/i, "ksw"], [/^lfa\b/i, "lfa"], [/^(cage warriors|cw)\b/i, "cw"],
  [/^rizin\b/i, "rizin"], [/^strikeforce\b/i, "strikeforce"], [/^wec\b/i, "wec"], [/^pride\b/i, "pride"], [/^dream\b/i, "dream"],
  [/^(king of pancrase|pancrase)\b/i, "pancrase"], [/^shooto\b/i, "shooto"], [/^(ufc|wsof|cage)\b/i, "other"],
];
function titleOf(c: Competition, orgId: string): { title: boolean; interim: boolean; text: string | null } {
  const text = c.types?.map((t) => t.text ?? "").find((t) => /title|championship/i.test(t)) ?? null;
  if (!text || /tournament|grand prix|canadian|regional|national|amateur/i.test(text)) return { title: false, interim: false, text };
  const owner = TITLE_ORG.find(([re]) => re.test(text))?.[1] ?? orgId;
  return { title: owner === orgId, interim: /interim/i.test(text), text };
}

/**
 * ESPN times are UTC. A night card in the Americas (19:00 in New York is
 * 00:00 UTC the next day) would land on the wrong day, so there a start before
 * 04:00 UTC belongs to the previous local day. 04:00/05:00 UTC exactly is how
 * ESPN stores a date without a time (midnight US Eastern): that is the day.
 */
const AMERICAS = new Set(["USA", "CAN", "MEX", "BRA", "ARG", "CHL", "PER", "COL", "ECU", "VEN", "URY", "PRY", "BOL", "PAN", "CRI", "PRI", "DOM", "JAM", "GTM", "HND", "SLV", "NIC", "BHS", "TTO"]);
const US_LEAGUES = new Set(["pfl", "bellator", "lfa", "strikeforce", "wec"]);
function localDay(iso: string, venueCountry: string | null, league: string): string {
  const americas = venueCountry ? AMERICAS.has(venueCountry) : US_LEAGUES.has(league);
  const t = new Date(Date.parse(iso));
  return new Date(t.getTime() - (americas && t.getUTCHours() < 4 ? 86_400_000 : 0)).toISOString().slice(0, 10);
}

// ───────── 1. events ─────────
type Ref = { $ref: string };
interface EvList { items?: Ref[]; pageCount?: number }
interface Competitor { id: string; order: number; winner?: boolean; athlete?: Ref }
interface Competition { id: string; date: string; description?: string; type?: { text?: string }; types?: { text?: string }[]; cardSegment?: { name?: string }; matchNumber?: number; competitors: Competitor[]; status?: Ref; format?: { regulation?: { periods?: number } } }
interface EspnEvent { id: string; name: string; date: string; venues?: Ref[]; competitions: Competition[] }

const THIS_YEAR = +AS_OF.slice(0, 4);
const refs: { league: string; ref: string; fresh: boolean }[] = [];
await pool(Object.keys(LEAGUES).flatMap((l) => YEARS.map((y) => [l, y] as const)), 6, async ([league, y]) => {
  const fresh = y >= THIS_YEAR - 1;
  const list = await get<EvList>(`https://sports.core.api.espn.com/v2/sports/mma/leagues/${league}/events?dates=${y}&limit=1000`, fresh ? 3 : Infinity);
  for (const it of list?.items ?? []) refs.push({ league, ref: it.$ref, fresh });
});
console.log(`event refs: ${refs.length}`);

const events = (await pool(refs, 8, async (r) => ({ league: r.league, ev: await get<EspnEvent>(r.ref, r.fresh ? 3 : Infinity) })))
  .filter((x): x is { league: string; ev: EspnEvent } => !!x.ev && !!x.ev.competitions?.length);
console.log(`events: ${events.length}`);

// ───────── 2. bout status (result, method, round, time) and venues ─────────
interface Status { period?: number; clock?: number; type?: { completed?: boolean; name?: string; description?: string }; result?: { name?: string; displayName?: string; description?: string } }
const comps = events.flatMap(({ league, ev }) => ev.competitions.map((c) => ({ league, ev, c })));
let done = 0;
const statuses = await pool(comps, 10, async ({ c }) => {
  // Results of the last 60 days and upcoming bouts can still change.
  const recentBout = (c.date ?? "") >= new Date(Date.now() - 60 * 86_400_000).toISOString();
  const s = c.status ? await get<Status>(c.status.$ref, recentBout ? 3 : Infinity) : null;
  if (++done % 1000 === 0) console.log(`status ${done}/${comps.length}`);
  return s;
});
const venueRefs = [...new Set(events.flatMap(({ ev }) => (ev.venues ?? []).map((v) => v.$ref)))];
interface Venue { fullName?: string; address?: { city?: string; country?: string; state?: string } }
const venues = new Map((await pool(venueRefs, 8, async (r) => [r, await get<Venue>(r)] as const)));

// ───────── 3. athletes ─────────
/** Fighters created by this script: "e" + ESPN id (UFC ids are 16 hex characters). */
const NON_UFC = /^e\d+$/;
const espnMap: Record<string, { slug: string; espnId: string }> = existsSync("data/snapshot/espn.json") ? JSON.parse(readFileSync("data/snapshot/espn.json", "utf8")) : {};
// Only UFC fighters: entries keyed "e…" are this script's own (non-UFC) portraits from a previous run.
const ufcByEspn = new Map(Object.entries(espnMap).filter(([fid]) => !NON_UFC.test(fid)).map(([fid, v]) => [v.espnId, fid]));
const athleteIds = [...new Set(comps.flatMap(({ c }) => c.competitors.map((x) => x.id)))];
interface Athlete { id: string; firstName?: string; lastName?: string; fullName?: string; nickname?: string; dateOfBirth?: string; height?: number; reach?: number; citizenship?: string; citizenshipCountry?: { abbreviation?: string }; stance?: { text?: string }; association?: { name?: string }; styles?: { text: string }[]; gender?: string; weightClass?: { text?: string }; headshot?: { href: string } }
done = 0;
const athletes = new Map((await pool(athleteIds, 10, async (id) => {
  const a = await get<Athlete>(`https://sports.core.api.espn.com/v2/sports/mma/athletes/${id}`, 90);
  if (++done % 1000 === 0) console.log(`athletes ${done}/${athleteIds.length}`);
  return [id, a] as const;
})));
// Some athletes have no record in the core API: take name and flag from the
// site scoreboard of that event's day.
interface SbComp { id: string; competitors: { id: string; athlete?: { fullName?: string; displayName?: string; flag?: { alt?: string } } }[] }
const missingByDay = new Map<string, Set<string>>();
for (const { league, ev, c } of comps) for (const x of c.competitors) if (!athletes.get(x.id)) {
  const k = `${league}|${(c.date ?? ev.date).slice(0, 10).replace(/-/g, "")}`;
  missingByDay.set(k, (missingByDay.get(k) ?? new Set()).add(x.id));
}
const fallback = new Map<string, { name: string; country: string | null }>();
await pool([...missingByDay.keys()], 6, async (k) => {
  const [league, day] = k.split("|");
  for (const d of [day, String(Number(day) - 1), String(Number(day) + 1)]) {
    const sb = await get<{ events?: { competitions: SbComp[] }[] }>(`https://site.api.espn.com/apis/site/v2/sports/mma/${league}/scoreboard?dates=${d}`);
    for (const e of sb?.events ?? []) for (const c of e.competitions ?? []) for (const x of c.competitors ?? []) {
      const n = x.athlete?.fullName ?? x.athlete?.displayName;
      if (n && !fallback.has(x.id)) fallback.set(x.id, { name: n, country: x.athlete?.flag?.alt ?? null });
    }
  }
});
for (const id of athleteIds) if (!athletes.get(id) && fallback.has(id)) {
  const f = fallback.get(id)!;
  const parts = f.name.split(" ");
  athletes.set(id, { id, firstName: parts[0], lastName: parts.slice(1).join(" "), fullName: f.name, citizenship: f.country ?? undefined });
}
console.log(`names recovered from scoreboards: ${[...fallback.keys()].filter((id) => athleteIds.includes(id)).length}; still unknown: ${athleteIds.filter((id) => !athletes.get(id)).length}`);
console.log(`athletes: ${athleteIds.length} (${athleteIds.filter((id) => ufcByEspn.has(id)).length} already in the UFC dataset)`);

// ───────── 4. assemble ─────────
// Link the rest by name (any order, accents ignored) and birth date: a UFC
// veteran's PRIDE or Strikeforce bouts must join the same career.
const nameKey = (x: string) => x.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9 ]+/g, " ").split(/\s+/).filter(Boolean).sort().join(" ");
const ufc = JSON.parse(gunzipSync(readFileSync("data/snapshot/ufc.json.gz")).toString()) as { fighters: { id: string; slug: string; firstName: string; lastName: string; birthDate: string | null }[]; events: { slug: string }[] };
const ufcSlug = new Map(ufc.fighters.map((f) => [f.id, f.slug]));
const ufcByName = new Map<string, { id: string; birthDate: string | null }[]>();
for (const f of ufc.fighters) { const k = nameKey(`${f.firstName} ${f.lastName}`); ufcByName.set(k, [...(ufcByName.get(k) ?? []), f]); }
const taken = new Set(ufcByEspn.values());
let linked = 0;
for (const id of athleteIds) {
  if (ufcByEspn.has(id)) continue;
  const a = athletes.get(id);
  if (!a) continue;
  const cands = (ufcByName.get(nameKey(a.fullName ?? `${a.firstName ?? ""} ${a.lastName ?? ""}`)) ?? []).filter((c) => !taken.has(c.id));
  const dob = a.dateOfBirth?.slice(0, 10) ?? null;
  const near = (x: string, y: string) => Math.abs(Date.parse(x) - Date.parse(y)) <= 2 * 86_400_000;
  const exact = dob ? cands.filter((c) => c.birthDate && near(c.birthDate, dob)) : [];
  // A single namesake whose date differs by a typical source error (year off, day and month swapped, same month) is the same person.
  const typo = (x: string, y: string) => {
    const [xy, xm, xd] = x.split("-"), [yy, ym, yd] = y.split("-");
    return (xm === ym && xd === yd && Math.abs(+xy - +yy) <= 10) || (xy === yy && xm === yd && xd === ym) || (xy === yy && (xm === ym || xd === yd));
  };
  const pick = exact.length === 1 ? exact[0]
    : cands.length === 1 && (!dob || !cands[0].birthDate || typo(dob, cands[0].birthDate)) ? cands[0] : null;
  if (pick) { ufcByEspn.set(id, pick.id); taken.add(pick.id); linked++; }
}
console.log(`linked to UFC fighters by name + birth date: ${linked}`);
const fighterId = (espnId: string) => ufcByEspn.get(espnId) ?? `e${espnId}`;
const outEvents: unknown[] = [], outFights: unknown[] = [];
// Slugs must stay unique across the UFC dataset too (namesakes in other organizations).
const usedSlugs = new Set<string>([...ufc.fighters.map((f) => `f:${f.slug}`), ...ufc.events.map((e) => e.slug)]);
const female = (id: string) => athletes.get(id)?.gender === "FEMALE";
comps.forEach(({ league, ev, c }, i) => {
  const st = statuses[i];
  if (c.competitors.length !== 2) return;
  // A bout with an unidentifiable fighter can't be attributed: leave it out.
  if (c.competitors.some((x) => !athletes.get(x.id) && !ufcByEspn.has(x.id))) return;
  const [a, b] = [...c.competitors].sort((x, y) => x.order - y.order);
  const completed = !!st?.type?.completed;
  const date = localDay(c.date ?? ev.date, country(venues.get(ev.venues?.[0]?.$ref ?? "")?.address?.country), league);
  const nc = /no contest|overturn/i.test(`${st?.result?.displayName ?? ""} ${st?.type?.description ?? ""}`);
  const winner = a.winner ? a.id : b.winner ? b.id : null;
  const draw = completed && !winner && !nc && /draw/i.test(`${st?.result?.displayName ?? ""} ${st?.type?.description ?? ""}`);
  const m = completed ? method(st?.result, draw, nc) : null;
  if (completed && !winner && !draw && !nc) return; // result unknown: leave it out rather than guess
  const t = titleOf(c, LEAGUES[league]);
  outFights.push({
    id: `x${c.id}`, eventId: `x${ev.id}`, date, orgId: LEAGUES[league],
    divisionId: division(c.type?.text ?? t.text?.replace(/^.*?\b((women'?s )?(light heavy|heavy|middle|welter|light|feather|bantam|fly|straw|atom)weight)\b.*$/i, "$1") ?? athletes.get(a.id)?.weightClass?.text, female(a.id) || female(b.id)),
    redId: fighterId(a.id), blueId: fighterId(b.id), status: completed ? "completed" : date > AS_OF ? "scheduled" : "completed",
    winnerId: winner ? fighterId(winner) : null, method: m, submission: m === "SUB" ? st?.result?.description || null : null,
    round: completed ? st?.period ?? null : null, time: completed && st?.clock != null ? Math.round(st.clock) : null,
    scheduledRounds: c.format?.regulation?.periods ?? 3, titleFight: t.title, interim: t.interim || undefined, referee: null,
    slot: "main-card", order: 0, _match: c.matchNumber ?? 0, _seg: c.cardSegment?.name ?? "",
    red: null, blue: null, rounds: [], scorecards: null, redStrengthPre: 1500, blueStrengthPre: 1500, provenance: "imported",
  });
});
// Card order: match number 1 = main event.
const byEvent = new Map<string, Record<string, unknown>[]>();
for (const f of outFights as Record<string, unknown>[]) byEvent.set(f.eventId as string, [...(byEvent.get(f.eventId as string) ?? []), f]);
for (const { league, ev } of events) {
  const fs = (byEvent.get(`x${ev.id}`) ?? []).sort((x, y) => ((x._match as number) || 99) - ((y._match as number) || 99));
  if (!fs.length) continue;
  fs.forEach((f, i) => { f.order = i; f.slot = i === 0 ? "main" : i === 1 ? "co-main" : /prelim/.test(String(f._seg)) ? "prelims" : "main-card"; delete f._match; delete f._seg; });
  const v = venues.get(ev.venues?.[0]?.$ref ?? "");
  const date = localDay(ev.date, country(v?.address?.country), league);
  let slug = slugify(ev.name) || `evento-${ev.id}`;
  if (usedSlugs.has(slug)) slug = `${slug}-${date.slice(0, 4)}`;
  if (usedSlugs.has(slug)) slug = `${slug}-${ev.id}`;
  usedSlugs.add(slug);
  outEvents.push({
    id: `x${ev.id}`, slug, name: ev.name, orgId: LEAGUES[league], date, city: v?.address?.city ?? "", country: country(v?.address?.country) ?? "",
    venue: v?.fullName ?? null, status: date > AS_OF ? "upcoming" : "completed", fightIds: fs.map((f) => f.id), provenance: "imported",
  });
}

// Fighters that only exist outside the UFC dataset.
const inBouts = new Set((outFights as { redId: string; blueId: string }[]).flatMap((f) => [f.redId, f.blueId]));
const outFighters: unknown[] = [], extra: Record<string, unknown> = {}, headshots: { id: string; slug: string; href: string }[] = [];
const lastBout = new Map<string, string>();
for (const f of outFights as { date: string; redId: string; blueId: string; orgId: string }[]) for (const id of [f.redId, f.blueId]) if ((lastBout.get(id) ?? "") < f.date) lastBout.set(id, f.date);
const lastOrg = new Map<string, string>();
for (const f of [...(outFights as { date: string; redId: string; blueId: string; orgId: string; divisionId: string }[])].sort((x, y) => x.date.localeCompare(y.date))) for (const id of [f.redId, f.blueId]) lastOrg.set(id, f.orgId);
const lastDiv = new Map<string, string>();
for (const f of [...(outFights as { date: string; redId: string; blueId: string; divisionId: string }[])].sort((x, y) => x.date.localeCompare(y.date))) for (const id of [f.redId, f.blueId]) if (f.divisionId !== "CATCH" && f.divisionId !== "OPEN") lastDiv.set(id, f.divisionId);
for (const espnId of athleteIds) {
  const id = fighterId(espnId);
  const a = athletes.get(espnId);
  const style = a?.styles?.map((x) => x.text).join(",") || null;
  // Profile extras for every fighter, UFC ones included (team, style).
  extra[id] = { espnId, team: a?.association?.name ?? null, style };
  // A UFC fighter linked here by name + birth date, still without an official portrait.
  if (ufcByEspn.has(espnId) && a?.headshot?.href && !espnMap[id] && (lastBout.get(id) ?? "") >= new Date(Date.parse(AS_OF) - 730 * 86_400_000).toISOString().slice(0, 10)) {
    const slug = ufcSlug.get(id);
    if (slug) headshots.push({ id, slug, href: a.headshot.href });
  }
  if (ufcByEspn.has(espnId) || !inBouts.has(id) || !a) continue;
  const first = a.firstName ?? (a.fullName ?? "").split(" ")[0] ?? "";
  const last = a.lastName ?? (a.fullName ?? "").split(" ").slice(1).join(" ");
  let slug = slugify(`${first} ${last}`) || `luchador-${espnId}`;
  if (usedSlugs.has(`f:${slug}`)) slug = `${slug}-${espnId}`;
  usedSlugs.add(`f:${slug}`);
  const recent = (lastBout.get(id) ?? "") >= new Date(Date.parse(AS_OF) - 730 * 86_400_000).toISOString().slice(0, 10);
  outFighters.push({
    id, slug, firstName: first, lastName: last, nickname: a.nickname || null,
    country: country(a.citizenshipCountry?.abbreviation) ?? country(a.citizenship), sex: a.gender === "FEMALE" ? "F" : "M",
    birthDate: a.dateOfBirth ? a.dateOfBirth.slice(0, 10) : null,
    heightCm: a.height ? Math.round(a.height * 2.54) : null, reachCm: a.reach ? Math.round(a.reach * 2.54) : null,
    stance: a.stance?.text === "Orthodox" || a.stance?.text === "Southpaw" || a.stance?.text === "Switch" ? a.stance.text : null,
    divisionId: lastDiv.get(id) ?? (a.gender === "FEMALE" ? "W-FLY" : "M-LW"), orgId: lastOrg.get(id) ?? "pfl",
    status: recent ? "active" : "inactive", priorRecord: null, team: a.association?.name ?? null, style,
    photo: { src: "", kind: "none", credit: "Sin foto oficial", updated: AS_OF }, provenance: "imported",
  });
  if (recent && a.headshot?.href) headshots.push({ id, slug, href: a.headshot.href });
}

// Title lineage is built at load time from every source (lib/data/lineage.ts).
console.log(`title bouts ${(outFights as { titleFight: boolean }[]).filter((f) => f.titleFight).length}`);

writeFileSync("data/snapshot/orgs.json.gz", gzipSync(JSON.stringify({ meta: { asOf: AS_OF, source: "ESPN" }, fighters: outFighters, fights: outFights, events: outEvents })));
writeFileSync("data/snapshot/espn-extra.json", JSON.stringify(extra));
writeFileSync("data/snapshot/espn-headshots.json", JSON.stringify(headshots));
const per: Record<string, number> = {};
for (const f of outFights as { orgId: string }[]) per[f.orgId] = (per[f.orgId] ?? 0) + 1;
console.log(`events ${outEvents.length} · bouts ${outFights.length} · new fighters ${outFighters.length} · headshots to fetch ${headshots.length}`, per);

// ───────── 5. official portraits of active fighters outside the UFC ─────────
// Merged into data/snapshot/espn.json so scripts/process-photos.py crops them like the UFC ones.
const espnPath = "data/snapshot/espn.json";
const espnOut: Record<string, { slug: string; espnId: string; headshot: string; team: string | null; style: string | null; nickname: string | null; page: string }> = existsSync(espnPath) ? JSON.parse(readFileSync(espnPath, "utf8")) : {};
// Non-UFC entries are rebuilt on every run (a fighter may since have been linked to a UFC record).
for (const k of Object.keys(espnOut)) if (NON_UFC.test(k)) delete espnOut[k];
mkdirSync("data/.cache/espn", { recursive: true });
let got = 0;
await pool(headshots, 6, async (h) => {
  const img = `data/.cache/espn/${h.slug}.png`;
  if (!existsSync(img)) {
    try {
      const r = await fetch(h.href, { headers: { "User-Agent": "FIGHTCORE data importer" } });
      if (!r.ok) return;
      writeFileSync(img, Buffer.from(await r.arrayBuffer()));
    } catch { return; }
  }
  const espnId = NON_UFC.test(h.id) ? h.id.slice(1) : [...ufcByEspn].find(([, fid]) => fid === h.id)![0];
  const x = extra[h.id] as { team: string | null; style: string | null };
  espnOut[h.id] = { slug: h.slug, espnId, headshot: h.href, team: x?.team ?? null, style: x?.style ?? null, nickname: null, page: `https://www.espn.com/mma/fighter/_/id/${espnId}` };
  got++;
});
writeFileSync(espnPath, JSON.stringify(espnOut, null, 1));
console.log(`portraits outside the UFC: ${got}`);
