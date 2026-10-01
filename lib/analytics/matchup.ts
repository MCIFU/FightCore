/**
 * Style matchup: pairs one fighter's weapon with the other's matching defence.
 * It describes interactions; it never outputs a winner or a probability.
 */
import type { CareerStats } from "./career";
import type { AttributeKey } from "./attributes";

export type Edge = "A" | "B" | "even";

export interface Interaction {
  id: string;
  label: string;
  /** What side A brings vs what side B resists with. */
  a: { value: string; basis: string };
  b: { value: string; basis: string };
  edge: Edge;
  note: string;
}

const pct = (x: number) => `${Math.round(x * 100)}%`;
const dec = (x: number, d = 1) => x.toFixed(d).replace(".", ",");

interface Side { name: string; stats: CareerStats; attr: Record<AttributeKey, number> }

function edge(diff: number, threshold: number): Edge {
  return diff > threshold ? "A" : diff < -threshold ? "B" : "even";
}

/** Offence of `att` against defence of `def`, labelled from att's perspective. */
export function interactions(A: Side, B: Side): Interaction[] {
  const rows: Interaction[] = [];
  const pairs: [Side, Side, "A" | "B"][] = [[A, B, "A"], [B, A, "B"]];
  for (const [att, def, who] of pairs) {
    const flip = (e: Edge): Edge => (who === "A" ? e : e === "A" ? "B" : e === "B" ? "A" : "even");
    // Striking offence vs striking defence (percentile space).
    const s = att.attr.striking - def.attr.defense;
    rows.push({
      id: `str-${who}`, label: `Golpeo de ${att.name} contra la defensa de ${def.name}`,
      a: { value: `${dec(att.stats.slpm, 2)}/min · ${pct(att.stats.strAcc)}`, basis: "Golpes sig. por minuto y precisión" },
      b: { value: `${pct(def.stats.strDef)} evitados`, basis: "Defensa de golpeo" },
      edge: flip(edge(s, 15)),
      note: s > 15 ? `${att.name} conecta por encima de lo que ${def.name} suele permitir.` : s < -15 ? `${def.name} neutraliza bien a golpeadores de este nivel.` : "Intercambio sin ventaja clara en los datos.",
    });
    // Wrestling offence vs takedown defence (raw rates).
    const expected = att.stats.tdAcc * (1 - def.stats.tdDef) / 0.3;
    const w = att.attr.wrestling - (def.stats.tdDef * 100);
    rows.push({
      id: `td-${who}`, label: `Derribos de ${att.name} contra la defensa de ${def.name}`,
      a: { value: `${dec(att.stats.tdAvg, 2)}/15 · ${pct(att.stats.tdAcc)}`, basis: "Derribos por 15 min y precisión" },
      b: { value: `${pct(def.stats.tdDef)} defendidos`, basis: "Defensa de derribo" },
      edge: flip(edge(w, 18)),
      note: att.stats.tdAvg < 0.8 ? `${att.name} apenas busca derribos: no es un arma que use.` : expected > 1 ? `Los números de ${att.name} superan el filtro defensivo de ${def.name}.` : `${def.name} suele parar derribos de este volumen.`,
    });
  }
  // Pace and durability, symmetric.
  const pace = A.attr.pace - B.attr.pace;
  rows.push({
    id: "pace", label: "Ritmo", a: { value: `${dec(A.stats.sigAttPerMin)} intentos/min`, basis: A.name }, b: { value: `${dec(B.stats.sigAttPerMin)} intentos/min`, basis: B.name },
    edge: edge(pace, 15), note: Math.abs(pace) > 15 ? `${pace > 0 ? A.name : B.name} impone más volumen de trabajo.` : "Ritmos comparables.",
  });
  const power = A.attr.finishing - B.attr.durability;
  const power2 = B.attr.finishing - A.attr.durability;
  rows.push({
    id: "finish", label: "Poder de finalización contra durabilidad",
    a: { value: `Finalización ${A.attr.finishing} · Durabilidad ${A.attr.durability}`, basis: A.name },
    b: { value: `Finalización ${B.attr.finishing} · Durabilidad ${B.attr.durability}`, basis: B.name },
    edge: edge(power - power2, 18),
    note: Math.abs(power - power2) > 18 ? `${power > power2 ? A.name : B.name} tiene más camino hacia una finalización.` : "Ninguno tiene una vía de finalización claramente superior.",
  });
  return rows;
}
