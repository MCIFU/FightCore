import type { Metadata } from "next";
import Link from "next/link";
import { SectionHead, Source, Unavailable } from "@/components/ui/primitives";
import { organizationsOverview } from "@/lib/data/repository";
import s from "./orgs.module.css";

export const metadata: Metadata = {
  title: "Organizaciones",
  description: "Organizaciones de MMA actuales e históricas: UFC, PFL, ONE, RIZIN, KSW, OKTAGON, Cage Warriors, PRIDE, Strikeforce y más.",
  alternates: { canonical: "/organizations" },
};

const GROUPS = [
  { id: "major", label: "Principales" },
  { id: "europe", label: "España y Europa" },
  { id: "historical", label: "Históricas" },
] as const;

const STATUS: Record<string, string> = { active: "Activa", defunct: "Desaparecida", absorbed: "Absorbida" };

export default function OrganizationsPage() {
  const orgs = organizationsOverview();
  return (
    <div className="wrap" style={{ paddingTop: "var(--s-7)", paddingBottom: "var(--s-8)" }}>
      <SectionHead as="h1" kicker="FIGHTCORE Database" title="Organizaciones"
        lede="Cada organización es una entidad independiente en FIGHTCORE: añadir una nueva no cambia la estructura del producto. FIGHTCORE no está afiliado a ninguna." />
      {GROUPS.map((g) => (
        <section key={g.id} aria-labelledby={`g-${g.id}`} className={s.group}>
          <h2 id={`g-${g.id}`} className={s.groupTitle}>{g.label}</h2>
          <ul className={s.grid}>
            {orgs.filter((o) => o.group === g.id).map((o) => (
              <li key={o.id}>
                <Link href={`/organizations/${o.slug}`} className={s.card}>
                  <span className={s.short}>{o.short}</span>
                  <span className={s.name}>{o.name}</span>
                  <span className={s.meta}>
                    <span>{o.countryName ?? <Unavailable reason="país sin confirmar" />}</span>
                    <span>{o.activeFrom ? `${o.activeFrom}–${o.activeTo ?? "hoy"}` : <Unavailable reason="años sin confirmar" />}</span>
                    <span>{STATUS[o.status]}</span>
                  </span>
                  <span className={s.counts}>{o.events ? `${o.events} eventos demo · ${o.fighters} luchadores` : "Sin datos de eventos"}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
      <p className={s.src}><Source kind="editorial" /> Metadatos de organización. <Source kind="demo" /> Eventos y luchadores.</p>
    </div>
  );
}
