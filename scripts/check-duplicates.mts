/**
 * Duplicate audit: what lib/data/dedupe.ts merged, what it left apart and
 * why, and any same-name records that are still separate.
 *
 *   npx tsx scripts/check-duplicates.mts      (npm run check:duplicates)
 */
import { existsSync, readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { loadUniverseFromSnapshot } from "../lib/data/providers/snapshot.ts";
import { compatibleDob, dedupeFighters, nameKey } from "../lib/data/dedupe.ts";
import type { Fight, Fighter } from "../lib/domain/types.ts";

// Raw sources, before merging, to report what the merge does.
const read = (f: string) => (existsSync(f) ? JSON.parse(gunzipSync(readFileSync(f)).toString()) as { fighters: Fighter[]; fights: Fight[] } : { fighters: [], fights: [] });
const parts = ["data/snapshot/ufc.json.gz", "data/snapshot/orgs.json.gz", "data/snapshot/wiki-orgs.json.gz"].map(read);
const seen = new Set<string>(); const fighters: Fighter[] = []; const fights: Fight[] = [];
for (const p of parts) { for (const f of p.fighters) if (!seen.has(f.id)) { seen.add(f.id); fighters.push(f); } fights.push(...p.fights); }
const r = dedupeFighters(fighters, fights);
console.log(`registros: ${fighters.length} · fusionados: ${r.merged.reduce((a, m) => a + m.drop.length, 0)} (en ${r.merged.length} personas) · ambiguos sin tocar: ${r.ambiguous.length}`);
for (const m of r.merged.slice(0, 15)) console.log("  ✓", m.name, m.keep, "←", m.drop.join(", "));

const u = loadUniverseFromSnapshot();
const groups = new Map<string, Fighter[]>();
for (const f of u.fighters) { const k = nameKey(`${f.firstName} ${f.lastName}`); groups.set(k, [...(groups.get(k) ?? []), f]); }
const left = [...groups.values()].filter((g) => g.length > 1);
const sameDob = left.filter((g) => g.every((a) => g.every((b) => a.birthDate && b.birthDate && compatibleDob(a.birthDate, b.birthDate))));
console.log(`tras la carga: ${u.fighters.length} luchadores · nombres repetidos: ${left.length} (homónimos con fechas incompatibles o carreras simultáneas) · repetidos con la misma fecha: ${sameDob.length}`);
for (const g of left.slice(0, 12)) console.log("  ·", `${g[0].firstName} ${g[0].lastName}`, g.map((f) => `${f.id}:${f.birthDate ?? "?"}:${f.divisionId}`).join(" | "));
if (sameDob.length) { console.error("✗ Hay registros duplicados con la misma fecha de nacimiento"); process.exit(1); }
