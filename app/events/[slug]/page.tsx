import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FightRow } from "@/components/fight/FightRow";
import { Source, Tag, Unavailable } from "@/components/ui/primitives";
import { getEventBySlug, IS_DEMO, listEvents, SRC, TODAY } from "@/lib/data/repository";
import { fmtDateLong, METHOD_SHORT } from "@/lib/format";
import s from "./event.module.css";

export function generateStaticParams() {
  // Upcoming cards and the last two years at build time; older events render on first request.
  const cut = new Date(Date.parse(TODAY) - 730 * 86_400_000).toISOString().slice(0, 10);
  return listEvents().filter((e) => e.date >= cut).map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const v = getEventBySlug(slug);
  if (!v) return { title: "Evento no encontrado" };
  const main = v.fights[0];
  return {
    title: `${v.event.name} · ${v.event.city}`,
    description: `${v.event.name} (${v.org.name}), ${fmtDateLong(v.event.date)} en ${v.event.city}.${main ? ` Main event: ${main.red.name} vs ${main.blue.name}.` : ""}${IS_DEMO ? " Datos de demostración." : ""}`,
    alternates: { canonical: `/events/${slug}` },
  };
}

export default async function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const v = getEventBySlug(slug);
  if (!v) notFound();
  const e = v.event;
  const done = v.fights.filter((f) => f.fight.status === "completed");
  const finishes = done.filter((f) => f.fight.method === "KO/TKO" || f.fight.method === "SUB");
  const totalSig = done.reduce((a, f) => a + (f.fight.red?.sigLanded ?? 0) + (f.fight.blue?.sigLanded ?? 0), 0);
  const fastest = [...finishes].sort((a, b) => ((a.fight.round! - 1) * 300 + a.fight.time!) - ((b.fight.round! - 1) * 300 + b.fight.time!))[0];
  const peak = (f: (typeof done)[number]) => Math.max(f.fight.red?.sigLanded ?? 0, f.fight.blue?.sigLanded ?? 0);
  const bestSig = [...done].filter((f) => f.fight.red && f.fight.blue).sort((a, b) => peak(b) - peak(a))[0];

  const jsonLd = {
    "@context": "https://schema.org", "@type": "SportsEvent", name: e.name, startDate: e.date, sport: "Mixed Martial Arts",
    location: { "@type": "Place", name: e.venue ?? e.city, address: { "@type": "PostalAddress", addressLocality: e.city, addressCountry: e.country || undefined } },
    organizer: { "@type": "Organization", name: v.org.name },
    eventStatus: "https://schema.org/EventScheduled",
    description: IS_DEMO ? "Evento ficticio del dataset de demostración de FIGHTCORE." : `${e.name}: cartelera, resultados y estadísticas por combate.`,
  };

  return (
    <article className="wrap" style={{ paddingTop: "var(--s-6)", paddingBottom: "var(--s-8)" }} aria-labelledby="ev-title">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <nav aria-label="Ruta" className={s.crumbs}><Link href="/events">Eventos</Link> / <span>{v.org.short}</span></nav>
      <header className={s.head}>
        <div className={s.headMain}>
          <p className={s.org}>{v.org.name} <Tag tone={e.status === "upcoming" ? "accent" : "default"}>{e.status === "upcoming" ? "Programado" : "Completado"}</Tag> <Source kind={SRC} /></p>
          <h1 id="ev-title" className={s.title}>{e.name}</h1>
        </div>
        <dl className={s.facts}>
          <div><dt>Fecha</dt><dd>{fmtDateLong(e.date)}</dd></div>
          <div><dt>Ciudad</dt><dd>{[e.city, v.countryName].filter(Boolean).join(", ") || "—"}</dd></div>
          <div><dt>Recinto</dt><dd>{e.venue ?? <Unavailable reason="sin datos" />}</dd></div>
          <div><dt>Combates</dt><dd className="num">{v.fights.length}</dd></div>
        </dl>
      </header>

      {done.length > 0 && (
        <section aria-labelledby="ev-hl" className={s.highlights}>
          <h2 id="ev-hl" className="visually-hidden">Highlights estadísticos</h2>
          <div><span className="label">Finalizaciones</span><strong className="num">{finishes.length}/{done.length}</strong></div>
          <div><span className="label">Golpes sig. totales</span><strong className="num">{totalSig}</strong></div>
          {fastest && <div><span className="label">Finalización más rápida</span><strong className="num">R{fastest.fight.round} {Math.floor(fastest.fight.time! / 60)}:{String(fastest.fight.time! % 60).padStart(2, "0")}</strong><span className={s.hlSub}>{METHOD_SHORT[fastest.fight.method!]} · {fastest.fight.winnerId === fastest.red.id ? fastest.red.name : fastest.blue.name}</span></div>}
          {bestSig && <div><span className="label">Más golpes sig.</span><strong className="num">{Math.max(bestSig.fight.red!.sigLanded, bestSig.fight.blue!.sigLanded)}</strong><span className={s.hlSub}>{bestSig.fight.red!.sigLanded >= bestSig.fight.blue!.sigLanded ? bestSig.red.name : bestSig.blue.name}</span></div>}
        </section>
      )}

      <section aria-labelledby="ev-card">
        <h2 id="ev-card" className={s.h2}>Cartelera</h2>
        <ol className={s.card}>{v.fights.map((f) => <FightRow key={f.fight.id} v={f} />)}</ol>
      </section>
    </article>
  );
}
