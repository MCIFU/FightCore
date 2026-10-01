import type { Metadata } from "next";
import Link from "next/link";
import { FighterAvatar } from "@/components/fighter/FighterAvatar";
import { EmptyState, SectionHead, Source } from "@/components/ui/primitives";
import { parseRecordScope, recordsFor } from "@/lib/data/repository";
import { DIVISIONS, divisionById, orgById, ORGANIZATIONS } from "@/lib/domain/reference";
import s from "./records.module.css";

export const metadata: Metadata = {
  title: "Récords",
  description: "Récords de carrera, golpeo, grappling, tiempo y títulos, globales, por organización y por división. Cada récord enlaza a su evidencia.",
  alternates: { canonical: "/records" },
};

const ORDER = ["Tiempo", "Carrera", "Golpeo", "Grappling", "Títulos"];

export default async function RecordsPage({ searchParams }: { searchParams: Promise<{ scope?: string }> }) {
  const { scope: raw } = await searchParams;
  const scope = parseRecordScope(raw);
  const key = scope.kind === "global" ? "global" : `${scope.kind}:${scope.id}`;
  const all = recordsFor(key);
  const title = scope.kind === "global" ? "Todo el dataset" : scope.kind === "org" ? orgById.get(scope.id)!.name : divisionById.get(scope.id)!.name;
  const cats = ORDER.filter((c) => all.some((r) => r.category === c));
  const orgsWithData = ORGANIZATIONS.filter((o) => recordsFor(`org:${o.id}`).length > 0);

  return (
    <div className="wrap" style={{ paddingTop: "var(--s-7)", paddingBottom: "var(--s-8)" }}>
      <SectionHead as="h1" kicker="FIGHTCORE Records" title="Récords"
        lede={<>Cada récord se calcula a partir de los combates registrados y enlaza a su evidencia. <Source kind="demo" /> <Source kind="calculated" /></>} />

      <form method="get" className={s.scope} aria-label="Ámbito de los récords">
        <Link href="/records" className={s.chip} aria-current={scope.kind === "global" ? "page" : undefined}>Global</Link>
        <label className={s.select}>
          <span className="label">Organización</span>
          <select name="scope" defaultValue={scope.kind === "org" ? key : ""}>
            <option value="" disabled>Elegir…</option>
            {orgsWithData.map((o) => <option key={o.id} value={`org:${o.id}`}>{o.short} · {o.name}</option>)}
          </select>
        </label>
        <button type="submit" className={s.go}>Ver</button>
        <span className={s.or}>o por división:</span>
        <div className={s.divs}>
          {DIVISIONS.map((d) => (
            <Link key={d.id} href={`/records?scope=division:${d.id}`} className={s.chip} aria-current={scope.kind === "division" && scope.id === d.id ? "page" : undefined} title={d.name}>{d.short}</Link>
          ))}
        </div>
      </form>

      <p className={s.scopeTitle}>Ámbito: <strong>{title}</strong></p>

      {all.length === 0 ? (
        <EmptyState title="Sin combates en este ámbito" body="No hay combates registrados con los que calcular récords." action={{ href: "/records", label: "Ver récords globales" }} />
      ) : cats.map((c) => (
        <section key={c} aria-labelledby={`rc-${c}`} className={s.cat}>
          <h2 id={`rc-${c}`} className={s.catTitle}>{c}</h2>
          <ul className={s.list}>
            {all.filter((r) => r.category === c).map((r) => (
              <li key={r.id}>
                <Link href={r.href} className={s.row}>
                  <span className={s.value}>{r.value}</span>
                  <span className={s.unit}>{r.unit}</span>
                  <span className={s.label}>{r.label}</span>
                  <span className={s.holder}>
                    <FighterAvatar src={r.holder.photo.src} size={36} champion={r.holder.champion} />
                    <span>{r.holder.name}<small>{r.holder.divisionShort} · {r.holder.org}</small></span>
                  </span>
                  <span className={s.ctx}>{r.context}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
      <p className={s.note}>Los récords de cada evento aparecen en su página, en «Highlights estadísticos».</p>
    </div>
  );
}
