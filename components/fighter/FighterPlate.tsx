/**
 * Fighter portrait. Just the photo on a quiet surface: no decoration
 * competing with the face. The only overlay is the champion badge. Credits
 * that a licence requires (Wikimedia Commons) sit under the frame; official
 * UFC portraits are credited on /credits.
 */
import Image from "next/image";
import { ChampionBadge } from "@/components/ui/ChampionBadge";
import type { Outcome } from "@/lib/domain/types";
import s from "./FighterPlate.module.css";

interface Props {
  id: string;
  firstName: string;
  lastName: string;
  country: string | null;
  division: string;
  career?: Outcome[];
  photo?: { src: string; kind: string; credit: string; author?: string; license?: string; licenseUrl?: string | null; sourceUrl?: string } | null;
  size?: "sm" | "md" | "lg";
  corner?: "a" | "b" | "c" | "d";
  title?: { org: string; division: string; defenses?: number } | null;
  priority?: boolean;
  /** False when the plate sits inside a link: the credit is then plain text (no nested anchors). */
  linkCredit?: boolean;
}

const initials = (a: string, b: string) => `${a.trim()[0] ?? ""}${b.trim().split(/\s+/).at(-1)?.[0] ?? ""}`.toUpperCase();

export function FighterPlate({ firstName, lastName, photo, size = "md", corner, title, priority, linkCredit = true }: Props) {
  const px = size === "lg" ? 480 : size === "md" ? 380 : 220;
  return (
    <figure className={`${s.wrap} ${s[size]}`}>
      <div className={`${s.plate} ${corner ? s[`corner_${corner}`] : ""}`}>
        {photo?.src ? (
          <Image
            src={photo.src}
            alt={`${photo.kind === "illustration" ? "Retrato ilustrado" : "Fotografía"} de ${firstName} ${lastName}`}
            width={400}
            height={400}
            sizes={`${px}px`}
            className={s.photo}
            priority={priority}
          />
        ) : (
          <span className={s.mono} aria-hidden>{initials(firstName, lastName)}</span>
        )}
        {title && <span className={s.belt}><ChampionBadge title={title} variant={size === "sm" ? "icon" : "tag"} /></span>}
      </div>
      {photo?.kind === "licensed" && size !== "sm" && (
        <figcaption className={s.license}>
          Foto: {photo.author} ·{" "}
          {linkCredit && photo.licenseUrl ? <a href={photo.licenseUrl} rel="license noopener" target="_blank">{photo.license}</a> : photo.license} ·{" "}
          {linkCredit ? <a href={photo.sourceUrl} rel="noopener" target="_blank">Wikimedia Commons</a> : "Wikimedia Commons"}
        </figcaption>
      )}
      {photo?.kind === "illustration" && size !== "sm" && <figcaption className={s.license}>Ilustración · no es una fotografía</figcaption>}
    </figure>
  );
}
