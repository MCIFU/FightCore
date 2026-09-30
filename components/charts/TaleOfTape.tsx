/**
 * Tale of the tape — mirrored bars, corner A (left, Ember) vs corner B (right, Cobalt).
 * Each row is normalised to its own scale; the leader's value is set in bold,
 * so the reading never depends on colour alone.
 */
import s from "./TaleOfTape.module.css";

export interface TapeRow {
  label: string;
  a: number;
  b: number;
  /** Text to display (defaults to the number). */
  fa?: string;
  fb?: string;
  /** Scale max; defaults to max(a, b) * 1.1. */
  max?: number;
  /** Lower is better (e.g. strikes absorbed). */
  invert?: boolean;
}

export function TaleOfTape({ rows, nameA, nameB, compact }: { rows: TapeRow[]; nameA: string; nameB: string; compact?: boolean }) {
  return (
    <table className={`${s.tape} ${compact ? s.compact : ""}`}>
      <caption className="visually-hidden">Comparación {nameA} (izquierda) frente a {nameB} (derecha)</caption>
      <thead className="visually-hidden">
        <tr><th scope="col">{nameA}</th><th scope="col">Métrica</th><th scope="col">{nameB}</th></tr>
      </thead>
      <tbody>
        {rows.map((r) => {
          const max = r.max ?? Math.max(r.a, r.b, 0.0001) * 1.1;
          const aLeads = r.invert ? r.a < r.b : r.a > r.b;
          const bLeads = r.invert ? r.b < r.a : r.b > r.a;
          return (
            <tr key={r.label}>
              <td><div className={s.side}>
                <span className={`${s.val} ${aLeads ? s.lead : ""}`}>{r.fa ?? r.a}</span>
                <span className={s.track}><span className={`${s.bar} ${s.barA}`} style={{ width: `${(r.a / max) * 100}%` }} /></span>
              </div></td>
              <th scope="row" className={s.label}>{r.label}</th>
              <td><div className={`${s.side} ${s.sideB}`}>
                <span className={s.track}><span className={`${s.bar} ${s.barB}`} style={{ width: `${(r.b / max) * 100}%` }} /></span>
                <span className={`${s.val} ${bLeads ? s.lead : ""}`}>{r.fb ?? r.b}</span>
              </div></td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
