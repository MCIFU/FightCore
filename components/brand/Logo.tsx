/**
 * Corner Mark — FIGHTCORE symbol.
 * Two opposing cage corners converging on a core. Built on a 24-unit grid so
 * it stays crisp at 16px. Only the core may carry colour.
 */
import styles from "./Logo.module.css";

interface SymbolProps {
  size?: number;
  mono?: boolean;
  className?: string;
  title?: string;
}

export function CornerMark({ size = 24, mono = false, className, title }: SymbolProps) {
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
      <path d="M2 11V2h9" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="square" />
      <path d="M22 13v9h-9" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="square" />
      <rect x="9" y="9" width="6" height="6" fill={mono ? "currentColor" : "var(--corner-a, #EC6528)"} />
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
        <CornerMark size={22} mono={mono} />
        <span className={styles.word}>FC</span>
      </span>
    );
  }
  if (variant === "stacked") {
    return (
      <span className={`${styles.stacked} ${className ?? ""}`}>
        <CornerMark size={56} mono={mono} />
        <span className={styles.word}>FIGHTCORE</span>
        <span className={styles.tag}>THE CORE OF MMA</span>
      </span>
    );
  }
  return (
    <span className={`${styles.lockup} ${className ?? ""}`}>
      <CornerMark size={22} mono={mono} />
      <span className={styles.word}>FIGHTCORE</span>
    </span>
  );
}
