"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { OutcomeMark } from "@/components/ui/primitives";
import { fmtClock, fmtDate, METHOD_SHORT } from "@/lib/format";
import s from "./Profile.module.css";

export interface OppRow {
  fightId: string; date: string; outcome: "W" | "L" | "D" | "NC" | null;
  opponent: { slug: string; name: string; country: string | null; rating: number };
  method: string | null; submission: string | null; round: number | null; time: number | null;
  org: string; event: string; eventSlug: string; division: string; title: boolean; oppStrength: number;
}

type Sort = "date" | "strength" | "rating";

export function Opponents({ rows }: { rows: OppRow[] }) {
  const [result, setResult] = useState<"all" | "W" | "L">("all");
  const [org, setOrg] = useState("all");
  const [method, setMethod] = useState("all");
  const [sort, setSort] = useState<Sort>("date");
  const orgs = useMemo(() => [...new Set(rows.map((r) => r.org))], [rows]);

  const list = useMemo(() => {
    const bucket = (m: string | null) => (m === "KO/TKO" ? "ko" : m === "SUB" ? "sub" : m?.endsWith("DEC") ? "dec" : "other");
    return rows
      .filter((r) => result === "all" || r.outcome === result)
      .filter((r) => org === "all" || r.org === org)
      .filter((r) => method === "all" || bucket(r.method) === method)
      .sort((a, b) => sort === "date" ? b.date.localeCompare(a.date) : sort === "strength" ? b.oppStrength - a.oppStrength : b.opponent.rating - a.opponent.rating);
  }, [rows, result, org, method, sort]);

  return (
    <div className={s.opp}>
      <div className={s.filters} role="search" aria-label="Filtrar rivales">
        <label className={s.filter}><span className="label">Resultado</span>
          <select value={result} onChange={(e) => setResult(e.target.value as typeof result)}>
            <option value="all">Todos</option><option value="W">Victorias</option><option value="L">Derrotas</option>
          </select>
        </label>
        <label className={s.filter}><span className="label">Organización</span>
          <select value={org} onChange={(e) => setOrg(e.target.value)}>
            <option value="all">Todas</option>{orgs.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </label>
        <label className={s.filter}><span className="label">Método</span>
          <select value={method} onChange={(e) => setMethod(e.target.value)}>
            <option value="all">Todos</option><option value="ko">KO/TKO</option><option value="sub">Sumisión</option><option value="dec">Decisión</option>
          </select>
        </label>
        <label className={s.filter}><span className="label">Ordenar por</span>
          <select value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
            <option value="date">Fecha</option><option value="strength">Fuerza del rival entonces</option><option value="rating">FCR actual del rival</option>
          </select>
        </label>
        <p className={s.count} aria-live="polite">{list.length} de {rows.length}</p>
      </div>
      {list.length === 0 ? (
        <p className={s.emptyNote}>Ningún combate cumple estos filtros.</p>
      ) : (
        <table className={s.oppTable}>
          <caption className="visually-hidden">Rivales y resultados</caption>
          <thead>
            <tr>
              <th scope="col">Res.</th><th scope="col">Rival</th><th scope="col">Método</th>
              <th scope="col" className={s.r}>R · Tiempo</th><th scope="col">Evento</th><th scope="col" className={s.r}>Fuerza</th>
            </tr>
          </thead>
          <tbody>
            {list.map((r) => (
              <tr key={r.fightId}>
                <td><OutcomeMark o={r.outcome} size="sm" /></td>
                <td>
                  <Link href={`/fighters/${r.opponent.slug}`} className={s.oppName}>{r.opponent.name}</Link>
                  <span className={s.oppSub}>{r.opponent.country} · FCR hoy {r.opponent.rating.toFixed(1)}{r.title ? " · Título" : ""}</span>
                </td>
                <td className={s.mono}><Link href={`/fights/${r.fightId}`}>{r.method ? METHOD_SHORT[r.method] : "—"}</Link>{r.submission && <span className={s.oppSub}>{r.submission}</span>}</td>
                <td className={`${s.mono} ${s.r}`}>{r.round ? `R${r.round} · ${fmtClock(r.time)}` : "—"}</td>
                <td><Link href={`/events/${r.eventSlug}`} className={s.oppEvent}>{r.event}</Link><span className={s.oppSub}>{fmtDate(r.date)} · {r.org}</span></td>
                <td className={s.r}>
                  <span className={s.strength}><span style={{ width: `${r.oppStrength}%` }} /></span>
                  <span className={s.mono}>{r.oppStrength}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
