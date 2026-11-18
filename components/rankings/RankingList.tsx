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

/**
 * Ranking as an instrument: every row reads off the same FCR scale (the
 * visible range of the list, in steps of 5), with a needle at the rating and
 * a band for its margin. Distances between fighters are real, not just order.
 */
export function RankingList({ rows, density = "regular", showDivision, caption }: { rows: RankingRow[]; density?: "regular" | "compact"; showDivision?: boolean; caption: string }) {
  const lo = Math.floor((Math.min(...rows.map((r) => r.rating - r.band)) - 1) / 5) * 5;
  const hi = Math.ceil((Math.max(...rows.map((r) => r.rating + r.band)) + 1) / 5) * 5;
  const pct = (v: number) => ((Math.min(hi, Math.max(lo, v)) - lo) / (hi - lo)) * 100;
  const ticks = Array.from({ length: (hi - lo) / 5 + 1 }, (_, i) => lo + i * 5);
  return (
    <div className={`${s.wrap} ${s[density]}`}>
      <div className={s.scale} aria-hidden>
        <span>Nº</span><span>Luchador</span>
        <span className={s.ticks}>{ticks.map((t) => <span key={t} style={{ left: `${pct(t)}%` }}>{t}</span>)}</span>
        <span className={s.fcrHead}>FCR</span>
      </div>
      <ol className={s.list} aria-label={caption}>
        {rows.map((r) => (
          <li key={r.fighter.id} className={`${s.row} ${r.rank === 1 ? s.first : ""}`}>
            <span className={s.rank} aria-label={`Puesto ${r.rank}`}>{String(r.rank).padStart(2, "0")}</span>
            <span className={s.av}><FighterAvatar src={r.fighter.photo.src} name={r.fighter.name} size={density === "compact" ? 36 : 48} /></span>
            <span className={s.who}>
              <span className={s.nameLine}>
                <Link href={`/fighters/${r.fighter.slug}`} className={s.name}>{r.fighter.name}</Link>
                {r.fighter.title && <ChampionBadge title={r.fighter.title} variant="icon" />}
                <Movement row={r} />
              </span>
              <span className={s.meta}>
                {showDivision && <span>{r.fighter.divisionShort}</span>}
                <span>{r.fighter.org}</span>
                <span className={s.rec}><RecordValue r={r.fighter.record} size="sm" /></span>
                <CountryTag code={r.fighter.country} name={r.fighter.countryName} />
              </span>
            </span>
            <span className={s.form}><FormStrip form={r.fighter.form} /></span>
            <span className={s.gauge} aria-hidden>
              {ticks.map((t) => <span key={t} className={s.tick} style={{ left: `${pct(t)}%` }} />)}
              <span className={s.fill} style={{ width: `${pct(r.rating)}%` }} />
              <span className={s.bandRange} style={{ left: `${pct(r.rating - r.band)}%`, width: `${pct(r.rating + r.band) - pct(r.rating - r.band)}%` }} />
              <span className={s.needle} style={{ left: `${pct(r.rating)}%` }} />
            </span>
            <span className={s.rating}>
              {r.rank === 1 && density === "regular"
                ? <><span className={s.wideOnly}><RatingValue value={r.rating} band={r.band} size="md" /></span><span className={s.narrowOnly}><RatingValue value={r.rating} band={r.band} size="sm" /></span></>
                : <RatingValue value={r.rating} band={r.band} size="sm" />}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
