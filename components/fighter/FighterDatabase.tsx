"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { FighterPlate } from "@/components/fighter/FighterPlate";
import { CountryTag, FormStrip, RatingValue, RecordValue } from "@/components/ui/primitives";
import type { FighterSummary } from "@/lib/data/repository";
import s from "./FighterDatabase.module.css";

type View = "grid" | "list" | "compact";
type Sort = "rating" | "name" | "wins" | "age" | "recent";

const norm = (x: string) => x.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/**
 * Filter state lives in the URL, so every view is shareable and the back
 * button works. Density is a per-viewer preference.
 */
export function FighterDatabase({ fighters, divisions }: { fighters: FighterSummary[]; divisions: { id: string; name: string; short: string }[] }) {
  const router = useRouter();
  const path = usePathname();
  const params = useSearchParams();
  const get = (k: string, d = "") => params.get(k) ?? d;
  const [q, setQ] = useState(get("q"));
  const [view, setView] = useState<View>("list");
  useEffect(() => {
    try { const v = localStorage.getItem("fc:db-view") as View | null; if (v) setView(v); } catch { /* storage unavailable */ }
  }, []);

  const set = (k: string, v: string) => {
    const p = new URLSearchParams(params.toString());
    if (v && v !== "all") p.set(k, v); else p.delete(k);
    router.replace(`${path}${p.toString() ? `?${p}` : ""}`, { scroll: false });
  };
  const chooseView = (v: View) => { setView(v); try { localStorage.setItem("fc:db-view", v); } catch { /* ignore */ } };

  const division = get("division", "all");
  const org = get("org", "all");
  const country = get("country", "all");
  const status = get("status", "active");
  const sort = get("sort", "rating") as Sort;
  const minRating = Number(get("min", "0"));

  const orgs = useMemo(() => [...new Set(fighters.map((f) => f.org))].sort(), [fighters]);
  const countries = useMemo(() => [...new Map(fighters.map((f) => [f.country, f.countryName])).entries()].sort((a, b) => a[1].localeCompare(b[1])), [fighters]);

  const list = useMemo(() => {
    const nq = norm(q.trim());
    return fighters
      .filter((f) => !nq || norm(`${f.name} ${f.nickname ?? ""} ${f.countryName}`).includes(nq))
      .filter((f) => division === "all" || f.divisionId === division)
      .filter((f) => org === "all" || f.org === org)
      .filter((f) => country === "all" || f.country === country)
      .filter((f) => status === "all" || f.status === status)
      .filter((f) => f.rating >= minRating)
      .sort((a, b) =>
        sort === "name" ? a.lastName.localeCompare(b.lastName)
          : sort === "wins" ? b.record.w - a.record.w
            : sort === "age" ? a.age - b.age
              : sort === "recent" ? (b.lastFight ?? "").localeCompare(a.lastFight ?? "")
                : b.rating - a.rating);
  }, [fighters, q, division, org, country, status, sort, minRating]);

  const activeFilters = [division, org, country].filter((x) => x !== "all").length + (status !== "active" ? 1 : 0) + (minRating ? 1 : 0);

  return (
    <div className={s.db}>
      <div className={s.controls} role="search" aria-label="Filtrar luchadores">
        <label className={s.search}>
          <span className="visually-hidden">Buscar por nombre, apodo o país</span>
          <svg aria-hidden viewBox="0 0 20 20" width="16" height="16"><circle cx="8.5" cy="8.5" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.6" /><path d="m13 13 4.5 4.5" stroke="currentColor" strokeWidth="1.6" /></svg>
          <input value={q} onChange={(e) => { setQ(e.target.value); }} onBlur={() => set("q", q)} onKeyDown={(e) => e.key === "Enter" && set("q", q)} placeholder="Nombre, apodo o país" />
        </label>
        <Select label="División" value={division} onChange={(v) => set("division", v)} options={[["all", "Todas"], ...divisions.map((d) => [d.id, d.name] as [string, string])]} />
        <Select label="Organización" value={org} onChange={(v) => set("org", v)} options={[["all", "Todas"], ...orgs.map((o) => [o, o] as [string, string])]} />
        <Select label="País" value={country} onChange={(v) => set("country", v)} options={[["all", "Todos"], ...countries]} />
        <Select label="Estado" value={status} onChange={(v) => set("status", v)} options={[["active", "En activo"], ["inactive", "Inactivos"], ["retired", "Retirados"], ["all", "Todos"]]} />
        <Select label="FCR mínimo" value={String(minRating)} onChange={(v) => set("min", v === "0" ? "" : v)} options={[["0", "Cualquiera"], ["40", "≥ 40"], ["55", "≥ 55"], ["65", "≥ 65"], ["75", "≥ 75"]]} />
        <Select label="Ordenar" value={sort} onChange={(v) => set("sort", v === "rating" ? "" : v)} options={[["rating", "FCR"], ["wins", "Victorias"], ["recent", "Último combate"], ["age", "Más jóvenes"], ["name", "Apellido"]]} />
      </div>

      <div className={s.bar}>
        <p className={s.count} aria-live="polite">
          <strong className="num">{list.length}</strong> luchadores
          {activeFilters > 0 && <button type="button" className={s.clear} onClick={() => { setQ(""); router.replace(path, { scroll: false }); }}>Limpiar filtros ({activeFilters})</button>}
        </p>
        <div className={s.views} role="group" aria-label="Densidad">
          {(["grid", "list", "compact"] as View[]).map((v) => (
            <button key={v} type="button" aria-pressed={view === v} onClick={() => chooseView(v)} className={s.viewBtn}>
              <ViewIcon v={v} />{v === "grid" ? "Grid" : v === "list" ? "Lista" : "Compacta"}
            </button>
          ))}
        </div>
      </div>

      {list.length === 0 ? (
        <div className={s.empty} role="status">
          <p className={s.emptyTitle}>Ningún luchador cumple estos filtros.</p>
          <p className="serif">Prueba a quitar el FCR mínimo o a incluir luchadores retirados.</p>
        </div>
      ) : view === "grid" ? (
        <ul className={s.grid}>
          {list.map((f) => (
            <li key={f.id}>
              <Link href={`/fighters/${f.slug}`} className={s.card}>
                <FighterPlate id={f.id} firstName={f.firstName} lastName={f.lastName} country={f.country} division={f.divisionShort} career={f.career} size="sm" champion={f.champion} />
                <span className={s.cardName}><span>{f.firstName}</span><strong>{f.lastName}</strong></span>
                <span className={s.cardRow}><RatingValue value={f.rating} size="sm" provisional={f.provisional} /><RecordValue r={f.record} size="sm" /></span>
                <span className={s.cardMeta}>{f.divisionShort} · {f.org}{f.rank ? ` · #${f.rank}` : ""}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <table className={`${s.table} ${view === "compact" ? s.compact : ""}`}>
          <caption className="visually-hidden">Luchadores</caption>
          <thead>
            <tr>
              <th scope="col">Luchador</th>
              <th scope="col" className={s.hideSm}>País</th>
              <th scope="col" className={s.hideSm}>División</th>
              <th scope="col" className={s.hideMd}>Org.</th>
              <th scope="col" className={s.hideMd}>Edad</th>
              <th scope="col">Récord</th>
              {view === "list" && <th scope="col" className={s.hideMd}>Forma</th>}
              <th scope="col" className={s.r}>FCR</th>
            </tr>
          </thead>
          <tbody>
            {list.map((f) => (
              <tr key={f.id}>
                <td>
                  <Link href={`/fighters/${f.slug}`} className={s.name}>
                    {f.name}
                    {f.champion && <span className={s.champ} title="Campeón vigente">C</span>}
                  </Link>
                  {view === "list" && f.nickname && <span className={s.nick}>“{f.nickname}”</span>}
                </td>
                <td className={s.hideSm}><CountryTag code={f.country} name={f.countryName} /></td>
                <td className={`${s.hideSm} ${s.mono}`}>{f.divisionShort}{f.rank ? <span className={s.rank}> #{f.rank}</span> : null}</td>
                <td className={`${s.hideMd} ${s.mono}`}>{f.org}</td>
                <td className={`${s.hideMd} num`}>{f.age}</td>
                <td><RecordValue r={f.record} size="sm" /></td>
                {view === "list" && <td className={s.hideMd}><FormStrip form={f.form} /></td>}
                <td className={s.r}><RatingValue value={f.rating} size={view === "compact" ? "xs" : "sm"} provisional={f.provisional} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: [string, string][] }) {
  return (
    <label className={s.select}>
      <span className="label">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </label>
  );
}

function ViewIcon({ v }: { v: View }) {
  const d = v === "grid" ? "M3 3h6v6H3zM11 3h6v6h-6zM3 11h6v6H3zM11 11h6v6h-6z" : v === "list" ? "M3 4h14M3 10h14M3 16h14" : "M3 3h14M3 7h14M3 11h14M3 15h14";
  return <svg aria-hidden viewBox="0 0 20 20" width="14" height="14"><path d={d} fill="none" stroke="currentColor" strokeWidth="1.5" /></svg>;
}
