import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SectionHead, Source } from "@/components/ui/primitives";
import { listEvents, SRC } from "@/lib/data/repository";
import { EventRows } from "../../page";
import s from "../../events.module.css";

const years = () => [...new Set(listEvents().filter((e) => e.status === "completed").map((e) => e.date.slice(0, 4)))].sort();

export function generateStaticParams() {
  return years().map((year) => ({ year }));
}

export async function generateMetadata({ params }: { params: Promise<{ year: string }> }): Promise<Metadata> {
  const { year } = await params;
  return { title: `Eventos de ${year}`, description: `Todos los eventos de MMA de ${year} en FIGHTCORE, con cartelera y resultados.`, alternates: { canonical: `/events/archivo/${year}` } };
}

export default async function EventYear({ params }: { params: Promise<{ year: string }> }) {
  const { year } = await params;
  const all = years();
  if (!all.includes(year)) notFound();
  const events = listEvents().filter((e) => e.status === "completed" && e.date.startsWith(year)).reverse();
  const i = all.indexOf(year);
  const prev = all[i - 1], next = all[i + 1];
  const orgs = new Set(events.map((e) => e.orgShort));
  return (
    <div className="wrap" style={{ paddingTop: "var(--s-7)", paddingBottom: "var(--s-8)" }}>
      <nav aria-label="Ruta" className={s.crumbs}><Link href="/events">Eventos</Link> / Archivo</nav>
      <SectionHead as="h1" kicker="FIGHTCORE Events · Archivo" title={`Eventos de ${year}`} lede={<>{events.length} eventos en {orgs.size} {orgs.size === 1 ? "organización" : "organizaciones"}. <Source kind={SRC} /></>} />
      <nav aria-label="Otros años" className={s.yearNav}>
        {prev ? <Link href={`/events/archivo/${prev}`}>← {prev}</Link> : <span />}
        {next ? <Link href={`/events/archivo/${next}`}>{next} →</Link> : <Link href="/events">Últimos 12 meses →</Link>}
      </nav>
      <EventRows events={events} />
    </div>
  );
}
