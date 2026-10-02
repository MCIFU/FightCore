/**
 * Núcleo — FIGHTCORE symbol.
 * A regular octagon (the cage) holding a square core: "the core of MMA".
 * 24-unit grid. Two optical masters: ≥ 28 px uses a 2.5 u stroke and a 7 u
 * core; below that a heavier 3.2 u stroke and an 8 u core keep it crisp at
 * 16 px. Only the core carries colour; the octagon is always one flat tone.
 */
import { MARK_SPEC, OCTAGON } from "./geometry";
import styles from "./Logo.module.css";

export { MARK_SPEC, OCTAGON };


interface SymbolProps {
  size?: number;
  /** Whole mark in currentColor (single-ink reproductions). */
  mono?: boolean;
  /** Core colour; defaults to Ember. Product lines may use their own. */
  core?: string;
  className?: string;
  title?: string;
}

export function NucleoMark({ size = 24, mono = false, core, className, title }: SymbolProps) {
  const m = size < 28 ? MARK_SPEC.small : MARK_SPEC.large;
  const c0 = 12 - m.core / 2;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      <path d={OCTAGON} fill="none" stroke="currentColor" strokeWidth={m.stroke} strokeLinejoin="miter" />
      <rect x={c0} y={c0} width={m.core} height={m.core} fill={mono ? "currentColor" : core ?? "var(--corner-a, #EC6528)"} />
    </svg>
  );
}

interface LockupProps {
  variant?: "horizontal" | "compact" | "stacked" | "wordmark";
  mono?: boolean;
  className?: string;
}

export function Logo({ variant = "horizontal", mono = false, className }: LockupProps) {
  if (variant === "wordmark") {
    return <span className={`${styles.word} ${className ?? ""}`}>FIGHTCORE</span>;
  }
  if (variant === "compact") {
    return (
      <span className={`${styles.lockup} ${className ?? ""}`}>
        <NucleoMark size={24} mono={mono} />
        <span className={styles.word}>FC</span>
      </span>
    );
  }
  if (variant === "stacked") {
    return (
      <span className={`${styles.stacked} ${className ?? ""}`}>
        <NucleoMark size={64} mono={mono} />
        <span className={styles.word}>FIGHTCORE</span>
        <span className={styles.tag}>THE CORE OF MMA</span>
      </span>
    );
  }
  return (
    <span className={`${styles.lockup} ${className ?? ""}`}>
      <NucleoMark size={24} mono={mono} />
      <span className={styles.word}>FIGHTCORE</span>
    </span>
  );
}
