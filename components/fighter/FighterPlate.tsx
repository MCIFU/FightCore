/**
 * Dossier plate — the fighter's portrait card. Every mark on it is data:
 * file number, division, country coordinates and a career "barcode"
 * (tall bar = win, short = loss, mid = draw). The portrait is a freely
 * licensed photograph (credited on the plate), an illustration for the
 * fictional demo fighters, or — when neither exists — just the initials.
 */
import Image from "next/image";
import { ChampionBadge } from "@/components/ui/ChampionBadge";
import { countryByCode } from "@/lib/domain/reference";
import type { Outcome } from "@/lib/domain/types";
import { initials } from "@/lib/format";
import s from "./FighterPlate.module.css";

interface Props {
  id: string;
  firstName: string;
  lastName: string;
  country: string | null;
  division: string;
  career: Outcome[];
  photo?: { src: string; kind: string; credit: string; author?: string; license?: string; licenseUrl?: string | null; sourceUrl?: string } | null;
  size?: "sm" | "md" | "lg";
  corner?: "a" | "b" | "c" | "d";
  title?: { org: string; division: string; defenses?: number } | null;
  priority?: boolean;
  /** False when the plate sits inside a link: the credit is then plain text (no nested anchors). */
  linkCredit?: boolean;
}

const coord = (v: number, pos: string, neg: string) => `${Math.abs(v).toFixed(1)}°${v >= 0 ? pos : neg}`;

export function FighterPlate({ id, firstName, lastName, country, division, career, photo, size = "md", corner, title, priority, linkCredit = true }: Props) {
  const c = country ? countryByCode.get(country) : undefined;
  const bars = career.slice(-28);
  const px = size === "lg" ? 420 : size === "md" ? 320 : 200;
  return (
    <figure className={`${s.plate} ${s[size]} ${corner ? s[`corner_${corner}`] : ""}`}>
      <div className={s.grid} aria-hidden />
      <span className={s.ghost} aria-hidden>{initials(firstName, lastName)}</span>
      {photo?.src && (
        <Image
          src={photo.src}
          alt={`${photo.kind === "illustration" ? "Retrato ilustrado" : "Fotografía"} de ${firstName} ${lastName}`.replace("  ", " ")}
          width={512}
          height={512}
          sizes={`${px}px`}
          className={s.photo}
          priority={priority}
        />
      )}
      <div className={s.top} aria-hidden>
        <span>FILE {id.replace("ftr-", "").slice(0, 6).toUpperCase()}</span>
        <span>{division}</span>
      </div>
      {title && <span className={s.belt}><ChampionBadge title={title} variant={size === "sm" ? "icon" : "tag"} /></span>}
      <figcaption className={s.bottom}>
        <span className={s.coords} aria-hidden>
          {country ?? "—"}
          {c && <span> · {coord(c.lat, "N", "S")} {coord(c.lon, "E", "O")}</span>}
        </span>
        <span className={s.barcode} aria-hidden>
          {bars.map((o, i) => (
            <span key={i} className={`${s.bar} ${s[`bar_${o}`]}`} />
          ))}
        </span>
        {photo?.kind === "illustration" && size !== "sm" && <span className={s.credit}>Ilustración · no es una fotografía</span>}
        {photo?.kind === "licensed" && size !== "sm" && (
          <span className={s.license}>
            Foto: {photo.author} ·{" "}
            {linkCredit && photo.licenseUrl ? <a href={photo.licenseUrl} rel="license noopener" target="_blank">{photo.license}</a> : photo.license} ·{" "}
            {linkCredit ? <a href={photo.sourceUrl} rel="noopener" target="_blank">Wikimedia Commons</a> : "Wikimedia Commons"} · recortada, fondo eliminado
          </span>
        )}
      </figcaption>
    </figure>
  );
}
