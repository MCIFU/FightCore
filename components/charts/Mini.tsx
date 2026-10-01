/**
 * Small server-rendered charts for scouting blocks. Each renders its own
 * text values, so no information depends on reading bar length alone.
 */
import s from "./Mini.module.css";

export function MiniBars({ items, label, max, format = (v) => String(v), tone = "bone", baseline }: {
  items: { key: string; label: string; value: number; sub?: string }[]; label: string; max?: number; format?: (v: number) => string; tone?: "bone" | "ember" | "cobalt"; baseline?: number;
}) {
  const m = max ?? Math.max(...items.map((i) => i.value), 0.0001);
  return (
    <div className={s.bars} role="img" aria-label={`${label}: ${items.map((i) => `${i.label} ${format(i.value)}`).join(", ")}`}>
      {items.map((i) => (
        <span key={i.key} className={s.col} aria-hidden>
          <span className={s.val}>{format(i.value)}</span>
          <span className={s.track}>
            <span className={`${s.fill} ${s[tone]}`} style={{ height: `${Math.max(1, (i.value / m) * 100)}%` }} />
            {baseline !== undefined && <span className={s.baseline} style={{ bottom: `${(baseline / m) * 100}%` }} />}
          </span>
          <span className={s.lab}>{i.label}</span>
          {i.sub && <span className={s.sub}>{i.sub}</span>}
        </span>
      ))}
    </div>
  );
}

export function Diverging({ rows, label, format = (v) => v.toFixed(1), leftLabel, rightLabel }: {
  rows: { key: string; label: string; value: number; sub?: string }[]; label: string; format?: (v: number) => string; leftLabel: string; rightLabel: string;
}) {
  const m = Math.max(...rows.map((r) => Math.abs(r.value)), 0.0001);
  return (
    <div className={s.div} role="img" aria-label={`${label}: ${rows.map((r) => `${r.label} ${r.value >= 0 ? "+" : ""}${format(r.value)}`).join(", ")}`}>
      <div className={s.divHead} aria-hidden><span>← {leftLabel}</span><span>{rightLabel} →</span></div>
      {rows.map((r) => (
        <div key={r.key} className={s.divRow} aria-hidden>
          <span className={s.divLabel}>{r.label}{r.sub && <small>{r.sub}</small>}</span>
          <span className={s.divTrack}>
            <span className={s.divAxis} />
            <span className={`${s.divFill} ${r.value >= 0 ? s.pos : s.neg}`} style={{ width: `${(Math.abs(r.value) / m) * 50}%`, [r.value >= 0 ? "left" : "right"]: "50%" } as React.CSSProperties} />
          </span>
          <span className={`${s.divVal} ${r.value >= 0 ? s.posText : ""}`}>{r.value >= 0 ? "+" : "−"}{format(Math.abs(r.value))}</span>
        </div>
      ))}
    </div>
  );
}
