import Link from "next/link";
import { FighterAvatar } from "@/components/fighter/FighterAvatar";
import { ChampionBadge } from "@/components/ui/ChampionBadge";
import { CountryTag, FormStrip, RatingValue, RecordValue } from "@/components/ui/primitives";
import type { RankingRow } from "@/lib/data/repository";
import s from "./RankingList.module.css";

function Movement({ row }: { row: RankingRow }) {
  if (row.movement === "new") return <span className={`${s.mv} ${s.mvNew}`} title="Nuevo en el ranking">NEW</span>;
  if (row.movement === "same") return <span className={`${s.mv} ${s.mvSame}`} title="Sin cambios"><span aria-hidden>=</span><span className="visually-hidden">Sin cambios</span></span>;
  const up = row.movement === "up";
  return (
    <span className={`${s.mv} ${up ? s.mvUp : s.mvDown}`} title={`${up ? "Sube" : "Baja"} ${Math.abs(row.delta)} desde el puesto ${row.previous}`}>
      <span aria-hidden>{up ? "▲" : "▼"}{Math.abs(row.delta)}</span>
      <span className="visually-hidden">{up ? "Sube" : "Baja"} {Math.abs(row.delta)} puestos</span>
    </span>
  );
}

/** Scale for the confidence band glyph: the visible range of the list. */
export function RankingList({ rows, density = "regular", showDivision, caption }: { rows: RankingRow[]; density?: "regular" | "compact"; showDivision?: boolean; caption: string }) {
  const lo = Math.min(...rows.map((r) => r.rating - r.band)) - 2;
  const hi = Math.max(...rows.map((r) => r.rating + r.band)) + 2;
  const pos = (v: number) => `${((v - lo) / (hi - lo)) * 100}%`;
  return (
    <ol className={`${s.list} ${s[density]}`} aria-label={caption}>
      {rows.map((r) => (
        <li key={r.fighter.id} className={`${s.row} ${r.rank === 1 ? s.first : ""}`}>
          <span className={s.rank} aria-label={`Puesto ${r.rank}`}>{String(r.rank).padStart(2, "0")}</span>
          <Movement row={r} />
          <FighterAvatar src={r.fighter.photo.src} size={density === "compact" ? 32 : 44} />
          <span className={s.who}>
            <Link href={`/fighters/${r.fighter.slug}`} className={s.name}>
              {r.fighter.name}
              {r.fighter.title && <ChampionBadge title={r.fighter.title} variant="icon" />}
            </Link>
            <span className={s.meta}>
              <CountryTag code={r.fighter.country} name={r.fighter.countryName} />
              <span>{r.fighter.org}</span>
              {showDivision && <span>{r.fighter.divisionShort}</span>}
            </span>
          </span>
          <span className={s.record}><RecordValue r={r.fighter.record} size="sm" /></span>
          <span className={s.form}><FormStrip form={r.fighter.form} /></span>
          <span className={s.band} aria-hidden>
            <span className={s.bandRange} style={{ left: pos(r.rating - r.band), right: `calc(100% - ${pos(r.rating + r.band)})` }} />
            <span className={s.bandPoint} style={{ left: pos(r.rating) }} />
          </span>
          <span className={s.rating}><RatingValue value={r.rating} band={r.band} size={r.rank === 1 && density === "regular" ? "md" : "sm"} /></span>
        </li>
      ))}
    </ol>
  );
}
