import Image from "next/image";
import { BeltIcon } from "@/components/ui/ChampionBadge";
import s from "./FighterAvatar.module.css";

/** Small portrait for rows and chips. Decorative: the name is always next to it. */
export function FighterAvatar({ src, size = 40, champion = false, corner }: { src: string; size?: number; champion?: boolean; corner?: "a" | "b" | "c" | "d" }) {
  return (
    <span className={`${s.avatar} ${corner ? s[`c_${corner}`] : ""}`} style={{ width: size, height: size }} aria-hidden>
      <Image src={src} alt="" width={size} height={size} sizes={`${size * 2}px`} className={s.img} loading="lazy" />
      {champion && <span className={s.belt}><BeltIcon size={6} /></span>}
    </span>
  );
}
