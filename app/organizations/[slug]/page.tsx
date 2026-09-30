import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EmptyState, RatingValue, SectionHead, Source, Unavailable } from "@/components/ui/primitives";
import { organizationDetail } from "@/lib/data/repository";
import { ORGANIZATIONS } from "@/lib/domain/reference";
import { fmtDate } from "@/lib/format";
import s from "./org.module.css";

export function generateStaticParams() {
  return ORGANIZATIONS.map((o) => ({ slug: o.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const d = organizationDetail(slug);
  if (!d) return { title: "Organización no encontrada" };
  return {
    title: `${d.org.name} (${d.org.short})`,
    description: `${d.org.name}: historia, eventos, campeones, luchadores y estadísticas en FIGHTCORE. FIGHTCORE no está afiliado a ${d.org.short}.`,
    alternates: { canonical: `/organizations/${slug}` },
  };
}

export default async function OrgPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const d = organizationDetail(slug);
  if (!d) notFound();
  const o = d.org;
  const hasData = d.stats.events > 0;
  return (
    <article className="wrap" style={{ paddingTop: "var(--s-6)", paddingBottom: "var(--s-8)" }}>
      <nav aria-label="Ruta" className={s.crumbs}><Link href="/organizations">Organizaciones</Link> / <span>{o.short}</span></nav>
      <header className={s.head}>
        <p className={s.short} aria-hidden>{o.short}</p>
        <div className={s.headInfo}>
          <h1 className={s.name}>{o.name}</h1>
          <dl className={s.facts}>
            <div><dt>País</dt><dd>{d.countryName ?? <Unavailable reason="sin confirmar" />}</dd></div>
            <div><dt>Región</dt><dd>{o.region}</dd></div>
            <div><dt>Actividad</dt><dd>{o.activeFrom ? `${o.activeFrom}–${o.activeTo ?? "hoy"}` : <Unavailable reason="sin confirmar" />}</dd></div>
            <div><dt>Estado</dt><dd>{o.status === "active" ? "Activa" : o.status === "defunct" ? "Desaparecida" : "Absorbida"}</dd></div>
          </dl>
          {o.note && <p className={`serif ${s.note}`}>{o.note}</p>}
          <p className={s.disclaimer}><Source kind="editorial" /> FIGHTCORE no está afiliado a {o.short}. Nombre usado solo para identificarla.</p>
        </div>
      </header>

      {!hasData ? (
        <div style={{ marginTop: 40 }}>
          <EmptyState title="Sin eventos en el dataset" body={`El dataset de demostración no incluye eventos de ${o.short}. La estructura de la página es la misma para cualquier organización: cuando se conecte un proveedor aparecerán aquí eventos, campeones, luchadores y récords.`} action={{ href: "/organizations", label: "Ver otras organizaciones" }} />
        </div>
      ) : (
        <>
          <section className={s.stats} aria-label="Estadísticas">
            <div><span className="label">Eventos</span><strong>{d.stats.events}</strong></div>
            <div><span className="label">Combates</span><strong>{d.stats.fights}</strong></div>
            <div><span className="label">Finalizaciones</span><strong>{Math.round(d.stats.finishRate * 100)}%</strong></div>
            <div><span className="label">Campeones vigentes</span><strong>{d.champions.length}</strong></div>
            <div className={s.statSrc}><Source kind="demo" /></div>
          </section>

          <div className={s.cols}>
            <section aria-labelledby="o-champs">
              <SectionHead id="o-champs" round="R1" kicker="Títulos" title="Campeones" />
              {d.champions.length ? (
                <ul className={s.list}>
                  {d.champions.map((c) => (
                    <li key={c.divisionId}><Link href={`/fighters/${c.fighter.slug}`} className={s.row}><span className={s.rowLabel}>{c.division.name}</span><strong>{c.fighter.name}</strong><span className={s.rowMeta}>desde {fmtDate(c.from)} · {c.defenses} def.</span></Link></li>
                  ))}
                </ul>
              ) : <p className={s.empty}>Sin campeones vigentes en el dataset.</p>}
            </section>
            <section aria-labelledby="o-roster">
              <SectionHead id="o-roster" round="R2" kicker="Plantilla" title="Mejor valorados" />
              <ol className={s.list}>
                {d.roster.map((f) => (
                  <li key={f.id}><Link href={`/fighters/${f.slug}`} className={s.row}><span className={s.rowLabel}>{f.divisionShort}</span><strong>{f.name}</strong><RatingValue value={f.rating} size="xs" /></Link></li>
                ))}
              </ol>
            </section>
          </div>

          <section aria-labelledby="o-events" style={{ paddingTop: "var(--s-8)" }}>
            <SectionHead id="o-events" round="R3" kicker="Eventos" title="Eventos" />
            <ul className={s.events}>
              {[...d.upcoming, ...d.recent].map((e) => (
                <li key={e.event.id}>
                  <Link href={`/events/${e.event.slug}`} className={s.event}>
                    <span className={s.evDate}>{fmtDate(e.event.date)}</span>
                    <strong>{e.event.name}</strong>
                    <span className={s.rowMeta}>{e.event.city} · {e.fights.length} combates · {e.event.status === "upcoming" ? "Programado" : "Completado"}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          {d.titleHistory.length > 0 && (
            <section aria-labelledby="o-timeline" style={{ paddingTop: "var(--s-8)" }}>
              <SectionHead id="o-timeline" round="R4" kicker="Timeline" title="Linaje de campeones" />
              <ol className={s.lineage}>
                {d.titleHistory.map((t) => (
                  <li key={t.wonFightId}>
                    <span className={s.evDate}>{fmtDate(t.from)}</span>
                    <span className={s.rowLabel}>{t.division}</span>
                    <Link href={`/fighters/${t.slug}`}>{t.fighter}</Link>
                    <span className={s.rowMeta}>{t.to ? `hasta ${fmtDate(t.to)}` : "vigente"} · {t.defenses} def.</span>
                  </li>
                ))}
              </ol>
            </section>
          )}
        </>
      )}
    </article>
  );
}
