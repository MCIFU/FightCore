import Link from "next/link";
import { FighterAvatar } from "@/components/fighter/FighterAvatar";
import { ChampionBadge } from "@/components/ui/ChampionBadge";
import { Tag } from "@/components/ui/primitives";
import type { FightView } from "@/lib/data/repository";
import { fmtClock, METHOD_SHORT } from "@/lib/format";
import s from "./FightRow.module.css";

const SLOT: Record<string, string> = { main: "Main event", "co-main": "Co-main", "main-card": "Cartelera", prelims: "Preliminar" };

/** One bout on a card: red corner left, blue right, winner in full weight. */
export function FightRow({ v }: { v: FightView }) {
  const f = v.fight;
  const done = f.status === "completed";
  const redWon = f.winnerId === v.red.id;
  const blueWon = f.winnerId === v.blue.id;
  return (
    <li className={`${s.row} ${f.slot === "main" ? s.main : ""}`}>
      <span className={s.slot}>{SLOT[f.slot]}{f.titleFight && <Tag tone="solid">Título</Tag>}</span>
      <Link href={`/fighters/${v.red.slug}`} className={`${s.side} ${s.red} ${done && !redWon ? s.lost : ""}`}>
        <span className={s.face}><FighterAvatar src={v.red.photo.src} name={v.red.name} size={f.slot === "main" ? 72 : 52} corner="a" /></span>
        {v.red.title && <ChampionBadge title={v.red.title} variant="icon" />}
        <span className={s.first}>{v.red.firstName}</span>
        <span className={s.last}>{v.red.lastName}</span>
        <span className={s.meta}>{v.red.record.w}-{v.red.record.l}-{v.red.record.d} · FCR {v.red.rating.toFixed(1)}</span>
        {redWon && <span className={s.win}>Gana</span>}
      </Link>
      <Link href={`/fights/${f.id}`} className={s.center} aria-label={`Ver combate ${v.red.name} contra ${v.blue.name}`}>
        <span className={s.div}>{v.division.short}</span>
        {done ? (
          <>
            <span className={s.method}>{METHOD_SHORT[f.method!]}</span>
            <span className={s.time}>R{f.round} · {fmtClock(f.time)}</span>
          </>
        ) : <span className={s.vs}>VS</span>}
        <span className={s.open} aria-hidden>Abrir →</span>
      </Link>
      <Link href={`/fighters/${v.blue.slug}`} className={`${s.side} ${s.blue} ${done && !blueWon ? s.lost : ""}`}>
        <span className={s.face}><FighterAvatar src={v.blue.photo.src} name={v.blue.name} size={f.slot === "main" ? 72 : 52} corner="b" /></span>
        {v.blue.title && <ChampionBadge title={v.blue.title} variant="icon" />}
        <span className={s.first}>{v.blue.firstName}</span>
        <span className={s.last}>{v.blue.lastName}</span>
        <span className={s.meta}>{v.blue.record.w}-{v.blue.record.l}-{v.blue.record.d} · FCR {v.blue.rating.toFixed(1)}</span>
        {blueWon && <span className={s.win}>Gana</span>}
      </Link>
    </li>
  );
}
