import Image from "next/image";
import { BeltIcon } from "@/components/ui/ChampionBadge";
import s from "./FighterAvatar.module.css";

const monogram = (name: string) => {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
};

/**
 * Small portrait for rows and chips. Decorative: the name is always next to it.
 * Without a licensed photo (empty src) it shows the fighter's initials.
 */
export function FighterAvatar({ src, size = 40, champion = false, corner, name }: { src: string; size?: number; champion?: boolean; corner?: "a" | "b" | "c" | "d"; name?: string }) {
  return (
    <span className={`${s.avatar} ${corner ? s[`c_${corner}`] : ""}`} style={{ width: size, height: size }} aria-hidden>
      {src ? (
        <Image src={src} alt="" width={size} height={size} sizes={`${size * 2}px`} className={s.img} loading="lazy" />
      ) : (
        <span className={s.mono} style={{ fontSize: Math.max(10, Math.round(size * 0.34)) }}>{name ? monogram(name) : ""}</span>
      )}
      {champion && <span className={s.belt}><BeltIcon size={6} /></span>}
    </span>
  );
}
