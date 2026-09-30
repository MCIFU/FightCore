/**
 * Skill attributes (0–100) as percentiles against the covered population.
 * Each attribute is a z-score composite of observable metrics.
 */
import type { CareerStats } from "./career";

export type AttributeKey =
  | "striking" | "grappling" | "wrestling" | "defense" | "adaptation"
  | "finishing" | "pace" | "durability" | "competition";

export interface AttributeDef {
  key: AttributeKey;
  label: string;
  short: string;
  basis: string;
  experimental?: boolean;
}

export const ATTRIBUTES: AttributeDef[] = [
  { key: "striking", label: "Golpeo", short: "STR", basis: "Golpes significativos por minuto, precisión y diferencial." },
  { key: "grappling", label: "Grappling", short: "GRP", basis: "Intentos de sumisión por 15 min, control y golpeo en suelo." },
  { key: "wrestling", label: "Lucha", short: "WRS", basis: "Derribos por 15 min y precisión de derribo." },
  { key: "defense", label: "Defensa", short: "DEF", basis: "Defensa de golpeo y de derribo; golpes encajados por minuto." },
  { key: "adaptation", label: "Adaptación", short: "ADP", basis: "Cambio del diferencial de golpeo del R1 a los rounds siguientes. Sustituye a “Fight IQ”, que no es medible con estadísticas de caja.", experimental: true },
  { key: "finishing", label: "Finalización", short: "FIN", basis: "Proporción de victorias antes del límite y knockdowns por 15 min." },
  { key: "pace", label: "Ritmo", short: "PAC", basis: "Golpes significativos intentados por minuto." },
  { key: "durability", label: "Durabilidad", short: "DUR", basis: "Frecuencia de derrotas por KO/TKO y knockdowns recibidos." },
  { key: "competition", label: "Competición", short: "CMP", basis: "Fuerza media de los rivales afrontados." },
];

export interface AttributeInput {
  id: string;
  stats: CareerStats;
  adaptationRaw: number;
  opponentStrength: number;
}

function raw(i: AttributeInput): Record<AttributeKey, number[]> {
  const s = i.stats;
  const perFight = s.bouts || 1;
  return {
    striking: [s.slpm, s.strAcc * 10, s.slpm - s.sapm],
    grappling: [s.subAvg, s.ctrlShare * 10, s.position.ground * 5],
    wrestling: [s.tdAvg, s.tdAcc * 4],
    defense: [s.strDef * 10, s.tdDef * 5, -s.sapm],
    adaptation: [i.adaptationRaw],
    finishing: [s.finishRate * 5, s.kdAvg * 2],
    pace: [s.sigAttPerMin],
    durability: [-s.koLosses / perFight * 10, -(s.oppTotals.kd / perFight) * 3],
    competition: [i.opponentStrength],
  };
}

export function computeAttributes(pop: AttributeInput[]): Map<string, Record<AttributeKey, number>> {
  const raws = pop.map((p) => ({ id: p.id, r: raw(p) }));
  const keys = ATTRIBUTES.map((a) => a.key);
  const composite = new Map<string, Record<AttributeKey, number>>();
  for (const k of keys) {
    const dims = raws[0]?.r[k].length ?? 0;
    const mean: number[] = [], sd: number[] = [];
    for (let d = 0; d < dims; d++) {
      const vals = raws.map((x) => x.r[k][d]);
      const m = vals.reduce((a, b) => a + b, 0) / vals.length;
      const v = vals.reduce((a, b) => a + (b - m) ** 2, 0) / vals.length;
      mean.push(m); sd.push(Math.sqrt(v) || 1);
    }
    for (const x of raws) {
      const z = x.r[k].reduce((acc, v, d) => acc + (v - mean[d]) / sd[d], 0) / dims;
      const cur = composite.get(x.id) ?? ({} as Record<AttributeKey, number>);
      cur[k] = z;
      composite.set(x.id, cur);
    }
  }
  // z → percentile.
  const out = new Map<string, Record<AttributeKey, number>>();
  for (const k of keys) {
    const sorted = raws.map((x) => composite.get(x.id)![k]).sort((a, b) => a - b);
    for (const x of raws) {
      const v = composite.get(x.id)![k];
      let lo = 0, hi = sorted.length;
      while (lo < hi) { const mid = (lo + hi) >> 1; if (sorted[mid] < v) lo = mid + 1; else hi = mid; }
      const pct = Math.round((lo / Math.max(1, sorted.length - 1)) * 99);
      const cur = out.get(x.id) ?? ({} as Record<AttributeKey, number>);
      cur[k] = Math.max(1, Math.min(99, pct));
      out.set(x.id, cur);
    }
  }
  return out;
}
