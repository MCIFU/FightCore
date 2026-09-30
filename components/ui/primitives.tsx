/**
 * FIGHTCORE design-system primitives (server-safe).
 * Anything interactive lives in its own client component.
 */
import Link from "next/link";
import type { ReactNode } from "react";
import type { Outcome, Provenance } from "@/lib/domain/types";
import { fmtRating, OUTCOME_LABEL, OUTCOME_SHORT } from "@/lib/format";
import s from "./primitives.module.css";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

/* ── Provenance ─────────────────────────────────────────── */
const SOURCE_LABEL: Record<Provenance, string> = {
  official: "Oficial", imported: "Importado", calculated: "Calculado FC", editorial: "Editorial", demo: "Demo",
};
export function Source({ kind, className }: { kind: Provenance; className?: string }) {
  return (
    <span className={cx(s.source, s[`src_${kind}`], className)} title={`Procedencia del dato: ${SOURCE_LABEL[kind]}`}>
      <span aria-hidden className={s.srcDot} />
      <span className="visually-hidden">Procedencia: </span>
      {SOURCE_LABEL[kind]}
    </span>
  );
}

/* ── Section head ("rounds") ────────────────────────────── */
export function SectionHead({
  round, kicker, title, lede, action, id, as: Tag = "h2", tone,
}: {
  round?: string;
  kicker: string;
  title: ReactNode;
  lede?: ReactNode;
  action?: { href: string; label: string };
  id?: string;
  as?: "h1" | "h2" | "h3";
  tone?: "paper";
}) {
  return (
    <header className={cx(s.sectionHead, tone === "paper" && s.sectionHeadPaper)}>
      <div className={s.sectionMeta}>
        {round && <span className={s.round}>{round}</span>}
        <span className="label">{kicker}</span>
        <span className={s.sectionRule} aria-hidden />
        {action && (
          <Link href={action.href} className={s.sectionAction}>
            {action.label} <span aria-hidden>→</span>
          </Link>
        )}
      </div>
      <Tag id={id} className={s.sectionTitle}>{title}</Tag>
      {lede && <p className={cx("serif", s.sectionLede)}>{lede}</p>}
    </header>
  );
}

/* ── Rating number — the brand's signature numeral ──────── */
export function RatingValue({
  value, band, size = "md", provisional, className, label = "FIGHTCORE Rating",
}: {
  value: number;
  band?: number;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  provisional?: boolean;
  className?: string;
  label?: string;
}) {
  const [int, dec] = fmtRating(value).split(".");
  return (
    <span role="img" className={cx(s.rating, s[`rating_${size}`], className)} aria-label={`${label}: ${fmtRating(value)}${band ? `, margen ±${band}` : ""}${provisional ? ", provisional" : ""}`}>
      <span aria-hidden className={s.ratingInt}>{int}</span>
      <span aria-hidden className={s.ratingDec}>.{dec}</span>
      {band !== undefined && <span aria-hidden className={s.ratingBand}>±{band.toFixed(1)}</span>}
      {provisional && <span aria-hidden className={s.provisional}>PROV</span>}
    </span>
  );
}

/* ── Record ──────────────────────────────────────────────── */
export function RecordValue({ r, size = "md" }: { r: { w: number; l: number; d: number; nc?: number }; size?: "sm" | "md" | "lg" }) {
  return (
    <span role="img" className={cx(s.record, s[`record_${size}`])} aria-label={`Récord: ${r.w} victorias, ${r.l} derrotas, ${r.d} empates${r.nc ? `, ${r.nc} sin resultado` : ""}`}>
      <span aria-hidden>{r.w}</span>
      <span aria-hidden className={s.recordSep}>–</span>
      <span aria-hidden>{r.l}</span>
      <span aria-hidden className={s.recordSep}>–</span>
      <span aria-hidden>{r.d}</span>
      {r.nc ? <span aria-hidden className={s.recordNc}>{r.nc} NC</span> : null}
    </span>
  );
}

/* ── Outcome chip / form strip ──────────────────────────── */
export function OutcomeMark({ o, size = "md" }: { o: Outcome | null; size?: "sm" | "md" | "lg" }) {
  if (!o) return <span className={cx(s.outcome, s.o_pending, s[`o_${size}`])} title="Programado">—</span>;
  return (
    <span className={cx(s.outcome, s[`o_${o}`], s[`o_${size}`])} title={OUTCOME_LABEL[o]}>
      <span aria-hidden>{OUTCOME_SHORT[o]}</span>
      <span className="visually-hidden">{OUTCOME_LABEL[o]}</span>
    </span>
  );
}

export function FormStrip({ form, size = "sm" }: { form: Outcome[]; size?: "sm" | "md" }) {
  if (!form.length) return <span className="label">Sin combates</span>;
  return (
    <span role="img" className={s.form} aria-label={`Últimos combates, del más antiguo al más reciente: ${form.map((o) => OUTCOME_LABEL[o]).join(", ")}`}>
      {form.map((o, i) => (
        <span key={i} aria-hidden className={cx(s.formCell, s[`f_${o}`], size === "md" && s.formMd)}>{OUTCOME_SHORT[o]}</span>
      ))}
    </span>
  );
}

/* ── Country tag (no emoji flags: they don't render everywhere) ── */
export function CountryTag({ code, name }: { code: string; name?: string }) {
  return (
    <span className={s.country} title={name}>
      <span aria-hidden className={s.countryTick} />
      <span aria-hidden>{code}</span>
      {name && <span className="visually-hidden">{name}</span>}
    </span>
  );
}

/* ── Tag / badge ────────────────────────────────────────── */
export function Tag({ children, tone = "default", className }: { children: ReactNode; tone?: "default" | "accent" | "solid" | "warning" | "outline"; className?: string }) {
  return <span className={cx(s.tag, s[`tag_${tone}`], className)}>{children}</span>;
}

/* ── Buttons ────────────────────────────────────────────── */
export function ButtonLink({ href, children, variant = "primary", className }: { href: string; children: ReactNode; variant?: "primary" | "ghost" | "quiet"; className?: string }) {
  return (
    <Link href={href} className={cx(s.btn, s[`btn_${variant}`], className)}>
      {children}
    </Link>
  );
}

/* ── Meter: value on a 0–100 track with optional reference tick ── */
export function Meter({ value, reference, label, tone = "a" }: { value: number; reference?: number; label: string; tone?: "a" | "b" | "c" | "d" | "bone" }) {
  return (
    <span className={s.meter} role="img" aria-label={`${label}: ${Math.round(value)} de 100${reference !== undefined ? `; referencia ${Math.round(reference)}` : ""}`}>
      <span className={cx(s.meterFill, s[`tone_${tone}`])} style={{ width: `${Math.max(1.5, Math.min(100, value))}%` }} />
      {reference !== undefined && <span className={s.meterRef} style={{ left: `${reference}%` }} />}
    </span>
  );
}

/* ── Stat: label + big number + unit + context ─────────── */
export function Stat({ label, value, unit, context, emphasis }: { label: string; value: ReactNode; unit?: string; context?: ReactNode; emphasis?: boolean }) {
  return (
    <div className={cx(s.stat, emphasis && s.statEm)}>
      <dt className="label">{label}</dt>
      <dd className={s.statValue}>
        <span className="num">{value}</span>
        {unit && <span className={s.statUnit}>{unit}</span>}
      </dd>
      {context && <dd className={s.statContext}>{context}</dd>}
    </div>
  );
}

/* ── Corner frame: brand bracket around key elements ───── */
export function CornerFrame({ children, className, tone = "bone" }: { children: ReactNode; className?: string; tone?: "bone" | "ember" }) {
  return (
    <div className={cx(s.frame, tone === "ember" && s.frameEmber, className)}>
      <span aria-hidden className={s.frameTL} />
      <span aria-hidden className={s.frameBR} />
      {children}
    </div>
  );
}

/* ── Empty / error / skeleton ───────────────────────────── */
export function EmptyState({ title, body, action }: { title: string; body?: ReactNode; action?: { href: string; label: string } }) {
  return (
    <div className={s.empty} role="status">
      <span aria-hidden className={s.emptyMark}>
        <svg viewBox="0 0 24 24" width="28" height="28"><path d="M2 11V2h9M22 13v9h-9" fill="none" stroke="currentColor" strokeWidth="2" /></svg>
      </span>
      <p className={s.emptyTitle}>{title}</p>
      {body && <p className={cx("serif", s.emptyBody)}>{body}</p>}
      {action && <ButtonLink href={action.href} variant="ghost">{action.label}</ButtonLink>}
    </div>
  );
}

export function Skeleton({ w = "100%", h = 14, className }: { w?: string | number; h?: number; className?: string }) {
  return <span aria-hidden className={cx(s.skeleton, className)} style={{ width: w, height: h }} />;
}

export function Unavailable({ reason = "sin datos" }: { reason?: "sin datos" | "pendiente" | "desconocido" | string }) {
  return <span className={s.unavailable} title="Dato no disponible. FIGHTCORE no rellena huecos con estimaciones.">{reason}</span>;
}

export { cx };
