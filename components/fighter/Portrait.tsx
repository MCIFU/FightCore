import Image from "next/image";
import s from "./FighterAvatar.module.css";

/**
 * Large portrait for hero blocks. Licensed photo or illustration when there is
 * one; otherwise the fighter's initials on the same footprint, so layouts
 * don't jump between fighters with and without a photo.
 */
export function Portrait({ src, name, kind, className, sizes, priority, alt }: { src: string; name: string; kind?: string; className?: string; sizes: string; priority?: boolean; alt?: string }) {
  if (!src) {
    const parts = name.trim().split(/\s+/);
    const mono = ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
    return <span className={`${className ?? ""} ${s.portraitMono}`} aria-hidden>{mono}</span>;
  }
  return (
    <Image
      src={src}
      alt={alt ?? (kind === "illustration" ? `Retrato ilustrado de ${name}` : kind === "licensed" || kind === "official" ? `Fotografía de ${name}` : "")}
      width={400} height={400} sizes={sizes} className={className} priority={priority}
    />
  );
}
