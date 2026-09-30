/**
 * Server-rendered bar primitives: segmented 100% bars, contribution stacks and
 * bullet rows. Every graphic has a text equivalent next to it.
 */
import s from "./Bars.module.css";

export interface Segment { key: string; label: string; value: number; tone?: "bone" | "bone-2" | "bone-3" | "a" | "b" | "c" | "d" | "ink" }

/** 100% segmented bar with an inline legend (value + share). */
export function SegmentBar({ segments, label, unit = "", size = "md" }: { segments: Segment[]; label: string; unit?: string; size?: "sm" | "md" }) {
  const total = segments.reduce((a, x) => a + x.value, 0) || 1;
  return (
    <div className={s.segWrap}>
      <div className={`${s.seg} ${s[`seg_${size}`]}`} role="img" aria-label={`${label}: ${segments.map((x) => `${x.label} ${Math.round((x.value / total) * 100)}%`).join(", ")}`}>
        {segments.map((x) => x.value > 0 && (
          <span key={x.key} className={`${s.segPart} ${s[`t_${x.tone ?? "bone"}`]}`} style={{ flexGrow: x.value }} />
        ))}
      </div>
      <ul className={s.segLegend} aria-hidden>
        {segments.map((x) => (
          <li key={x.key}>
            <span className={`${s.key} ${s[`t_${x.tone ?? "bone"}`]}`} />
            <span className={s.segLabel}>{x.label}</span>
            <span className={s.segVal}>{Math.round((x.value / total) * 100)}%{unit ? <small> · {x.value}{unit}</small> : null}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Bullet row: value bar with a reference tick (e.g. division average). */
export function BulletRow({ label, value, display, reference, refLabel, max, better = "higher", note }: {
  label: string; value: number; display: string; reference?: number; refLabel?: string; max: number; better?: "higher" | "lower"; note?: string;
}) {
  const pct = (v: number) => `${Math.max(0, Math.min(100, (v / max) * 100))}%`;
  const delta = reference !== undefined && reference !== 0 ? (value - reference) / Math.abs(reference) : null;
  const good = delta !== null && (better === "higher" ? delta > 0.05 : delta < -0.05);
  const bad = delta !== null && (better === "higher" ? delta < -0.05 : delta > 0.05);
  return (
    <div className={s.bullet}>
      <span className={s.bLabel}>{label}{note && <span className={s.bNote}>{note}</span>}</span>
      <span className={s.bValue}>{display}</span>
      <span className={s.bTrack} aria-hidden>
        <span className={s.bFill} style={{ width: pct(value) }} />
        {reference !== undefined && <span className={s.bRef} style={{ left: pct(reference) }} />}
      </span>
      <span className={`${s.bDelta} ${good ? s.good : bad ? s.bad : ""}`}>
        {delta === null ? "" : `${delta > 0 ? "+" : ""}${Math.round(delta * 100)}%`}
        {delta !== null && <span className="visually-hidden"> frente a {refLabel}</span>}
      </span>
    </div>
  );
}
