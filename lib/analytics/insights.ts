/**
 * Scouting observations. Every observation is produced by an explicit rule
 * with a minimum sample and carries its evidence. No rule fires on thin data:
 * a missing observation is better than an invented one.
 */
import type { FighterBout } from "../domain/types";
import { strength01 } from "../rating/model";
import { careerStats, methodBucket, roundProfile } from "./career";

export type InsightTone = "strength" | "risk" | "pattern";

export interface Insight {
  id: string;
  tone: InsightTone;
  question: string;
  headline: string;
  evidence: string;
  sample: number;
}

const pct = (x: number) => `${Math.round(x * 100)}%`;
const dec = (x: number, d = 1) => x.toFixed(d).replace(".", ",");
const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

export function buildInsights(all: FighterBout[]): Insight[] {
  const bouts = all.filter((b) => b.fight.status === "completed" && b.outcome !== "NC");
  const s = careerStats(bouts);
  const out: Insight[] = [];
  const wins = bouts.filter((b) => b.outcome === "W");
  const losses = bouts.filter((b) => b.outcome === "L");

  // How does he win?
  if (wins.length >= 4) {
    const entries = [["KO/TKO", s.winsBy.ko], ["sumisión", s.winsBy.sub], ["decisión", s.winsBy.dec]] as const;
    const [label, n] = [...entries].sort((a, b) => b[1] - a[1])[0];
    if (n / wins.length >= 0.5) {
      const early = wins.filter((b) => methodBucket(b.fight.method) !== "dec" && (b.fight.round ?? 9) <= 2).length;
      out.push({
        id: "win-method", tone: "strength", question: "¿Cómo gana?",
        headline: `Gana por ${label} en ${n} de ${wins.length} victorias (${pct(n / wins.length)}).`,
        evidence: label === "decisión" ? `Tasa de finalización: ${pct(s.finishRate)}.` : `${early} de esas finalizaciones llegan en los dos primeros rounds.`,
        sample: wins.length,
      });
    }
  }

  // How does he lose?
  if (losses.length >= 2) {
    const decLoss = s.lossesBy.dec;
    if (decLoss / losses.length >= 0.6) {
      out.push({ id: "loss-dec", tone: "strength", question: "¿Cómo pierde?", headline: `Difícil de finalizar: ${decLoss} de ${losses.length} derrotas han sido por decisión.`, evidence: `Derrotas por KO/TKO: ${s.lossesBy.ko}. Por sumisión: ${s.lossesBy.sub}.`, sample: losses.length });
    } else {
      const [label, n] = s.lossesBy.ko >= s.lossesBy.sub ? ["KO/TKO", s.lossesBy.ko] : ["sumisión", s.lossesBy.sub];
      out.push({ id: "loss-finish", tone: "risk", question: "¿Cómo pierde?", headline: `${n} de sus ${losses.length} derrotas llegan por ${label}.`, evidence: `Derrotas por decisión: ${decLoss}.`, sample: losses.length });
    }
    // What kind of opponent troubles him?
    const tdInLosses = avg(losses.map((b) => b.opp?.tdLanded ?? 0));
    const tdInWins = avg(wins.map((b) => b.opp?.tdLanded ?? 0));
    if (wins.length >= 2 && tdInLosses - tdInWins >= 1.2) {
      out.push({ id: "td-trouble", tone: "risk", question: "¿Qué rival le complica?", headline: "Sus derrotas llegan cuando le derriban.", evidence: `Encaja ${dec(tdInLosses)} derribos de media en derrotas frente a ${dec(tdInWins)} en victorias.`, sample: bouts.length });
    }
    const volInLosses = avg(losses.map((b) => b.opp?.sigLanded ?? 0));
    const volInWins = avg(wins.map((b) => b.opp?.sigLanded ?? 0));
    if (!out.some((o) => o.id === "td-trouble") && wins.length >= 2 && volInLosses >= volInWins * 1.5 && volInLosses > 25) {
      out.push({ id: "vol-trouble", tone: "risk", question: "¿Qué rival le complica?", headline: "Sufre ante rivales de alto volumen.", evidence: `Encaja ${Math.round(volInLosses)} golpes significativos de media en derrotas frente a ${Math.round(volInWins)} en victorias.`, sample: bouts.length });
    }
  }

  // Where does he build his advantage?
  if (bouts.length >= 3 && s.totals.sigLanded >= 60) {
    const zones = [["en el suelo", s.position.ground, 0.28], ["en el clinch", s.position.clinch, 0.22], ["a distancia", s.position.distance, 0.8]] as const;
    const hit = zones.find(([, v, t]) => v >= t);
    if (hit) out.push({ id: "zone", tone: "pattern", question: "¿Dónde genera su ventaja?", headline: `El ${pct(hit[1])} de su golpeo significativo llega ${hit[0]}.`, evidence: `Distancia ${pct(s.position.distance)} · Clinch ${pct(s.position.clinch)} · Suelo ${pct(s.position.ground)}.`, sample: bouts.length });
    if (s.target.leg >= 0.18) out.push({ id: "legs", tone: "pattern", question: "¿Qué distancia utiliza?", headline: `Trabaja la pierna: ${pct(s.target.leg)} de sus golpes significativos van a las piernas.`, evidence: `Cabeza ${pct(s.target.head)} · Cuerpo ${pct(s.target.body)} · Pierna ${pct(s.target.leg)}.`, sample: bouts.length });
  }

  // When does the pace drop?
  const rp = roundProfile(bouts);
  const r1 = rp.find((r) => r.round === 1);
  const r3 = rp.find((r) => r.round === 3);
  if (r1 && r3 && r1.n >= 3 && r3.n >= 3 && r1.landed > 4) {
    const change = r3.landed / r1.landed - 1;
    if (change <= -0.18) out.push({ id: "fade", tone: "risk", question: "¿Cuándo baja su ritmo?", headline: `Su volumen cae un ${pct(-change)} del R1 al R3.`, evidence: `${dec(r1.landed)} golpes significativos en R1 frente a ${dec(r3.landed)} en R3 (${r3.n} terceros rounds completos).`, sample: r3.n });
    else if (change >= 0.12) out.push({ id: "grows", tone: "strength", question: "¿Cómo cambia entre rounds?", headline: `Crece con el combate: +${pct(change)} de volumen del R1 al R3.`, evidence: `${dec(r1.landed)} en R1 frente a ${dec(r3.landed)} en R3 (${r3.n} terceros rounds completos).`, sample: r3.n });
  }

  // Level of opposition.
  const strong = bouts.filter((b) => strength01(b.oppStrengthPre) >= 0.55);
  if (strong.length >= 3) {
    const w = strong.filter((b) => b.outcome === "W").length;
    out.push({ id: "vs-elite", tone: w / strong.length >= 0.5 ? "strength" : "risk", question: "¿Qué pasa contra la élite?", headline: `Contra rivales de nivel alto: ${w}-${strong.length - w}.`, evidence: `Rivales con índice de fuerza superior a 0,55 en el momento del combate (${strong.length} combates).`, sample: strong.length });
  }

  return out.slice(0, 6);
}
