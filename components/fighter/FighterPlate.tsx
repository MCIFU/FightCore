/**
 * Dossier plate — FIGHTCORE's portrait until licensed photography exists.
 * Every mark on it is data: initials, file number, country coordinates and a
 * career "barcode" (tall bar = win, short = loss, mid = draw).
 */
import { countryByCode } from "@/lib/domain/reference";
import type { Outcome } from "@/lib/domain/types";
import { initials } from "@/lib/format";
import s from "./FighterPlate.module.css";

interface Props {
  id: string;
  firstName: string;
  lastName: string;
  country: string;
  division: string;
  career: Outcome[];
  size?: "sm" | "md" | "lg";
  corner?: "a" | "b" | "c" | "d";
  champion?: boolean;
}

const coord = (v: number, pos: string, neg: string) => `${Math.abs(v).toFixed(1)}°${v >= 0 ? pos : neg}`;

export function FighterPlate({ id, firstName, lastName, country, division, career, size = "md", corner, champion }: Props) {
  const c = countryByCode.get(country);
  const ini = initials(firstName, lastName);
  const bars = career.slice(-28);
  return (
    <figure className={`${s.plate} ${s[size]} ${corner ? s[`corner_${corner}`] : ""}`} aria-label={`Placa de expediente de ${firstName} ${lastName}`}>
      <div className={s.grid} aria-hidden />
      <div className={s.top} aria-hidden>
        <span>FILE {id.replace("ftr-", "")}</span>
        <span>{division}</span>
      </div>
      <div className={s.initials} aria-hidden>
        {ini}
        <span className={s.core} />
      </div>
      {champion && <span className={s.belt} aria-hidden>CAMPEÓN</span>}
      <div className={s.bottom} aria-hidden>
        <span className={s.coords}>
          {country}
          {c && <span> · {coord(c.lat, "N", "S")} {coord(c.lon, "E", "O")}</span>}
        </span>
        <span className={s.barcode}>
          {bars.map((o, i) => (
            <span key={i} className={`${s.bar} ${s[`bar_${o}`]}`} />
          ))}
        </span>
      </div>
    </figure>
  );
}
