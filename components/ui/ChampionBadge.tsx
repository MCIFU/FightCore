import s from "./ChampionBadge.module.css";

/** Belt plate glyph: centre plate + side plates. Never used for anything but titles. */
export function BeltIcon({ size = 14 }: { size?: number }) {
  return (
    <svg aria-hidden viewBox="0 0 24 14" width={size * 1.7} height={size} className={s.icon}>
      <rect x="0" y="4.5" width="24" height="5" rx="1" fill="currentColor" opacity="0.55" />
      <path d="M8 1.5h8l2.5 3v5l-2.5 3H8l-2.5-3v-5z" fill="currentColor" />
      <rect x="10.5" y="5" width="3" height="4" fill="var(--ink-0)" opacity="0.55" />
      <rect x="1.5" y="3.5" width="3" height="7" rx="0.6" fill="currentColor" />
      <rect x="19.5" y="3.5" width="3" height="7" rx="0.6" fill="currentColor" />
    </svg>
  );
}

/**
 * Champion insignia.
 * - "icon": square glyph for dense rows (with a text label for screen readers).
 * - "tag": glyph + CAMPEÓN · ORG.
 * - "full": glyph + org + division + since.
 */
export function ChampionBadge({ title, variant = "tag" }: { title: { org: string; division: string; since?: string; defenses?: number }; variant?: "icon" | "tag" | "full" }) {
  const label = `Campeón vigente de ${title.org}, ${title.division}${title.defenses !== undefined ? `, ${title.defenses} defensas` : ""}`;
  if (variant === "icon") {
    return (
      <span className={`${s.badge} ${s.iconOnly}`} title={label} role="img" aria-label={label}>
        <BeltIcon size={9} />
      </span>
    );
  }
  return (
    <span className={`${s.badge} ${variant === "full" ? s.full : ""}`} title={label}>
      <BeltIcon size={variant === "full" ? 12 : 9} />
      <span className="visually-hidden">{label}</span>
      <span aria-hidden className={s.text}>
        Campeón · {title.org}
        {variant === "full" && <span className={s.div}>{title.division}{title.defenses !== undefined ? ` · ${title.defenses} ${title.defenses === 1 ? "defensa" : "defensas"}` : ""}</span>}
      </span>
    </span>
  );
}
