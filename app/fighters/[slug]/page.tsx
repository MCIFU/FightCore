import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SegmentBar } from "@/components/charts/Bars";
import { CareerTimeline } from "@/components/charts/CareerTimeline";
import { CountUp } from "@/components/fighter/CountUp";
import { Evolution } from "@/components/fighter/Evolution";
import { FighterPlate } from "@/components/fighter/FighterPlate";
import { Opponents } from "@/components/fighter/Opponents";
import { Performance } from "@/components/fighter/Performance";
import { ProfilePanels } from "@/components/fighter/ProfilePanels";
import { ButtonLink, CountryTag, FormStrip, OutcomeMark, RecordValue, SectionHead, Source, Tag, Unavailable } from "@/components/ui/primitives";
import { Tabs } from "@/components/ui/Tabs";
import { ChampionBadge } from "@/components/ui/ChampionBadge";
import { ATTRIBUTES } from "@/lib/analytics/attributes";
import { DATASET, fighterProfile, IS_DEMO, prerenderFighterSlugs, SRC, STYLE_DIMS, TODAY } from "@/lib/data/repository";
import { fmtClock, fmtCm, fmtDate, fmtDateLong, fmtStance, METHOD_LABEL, METHOD_SHORT, SITE_URL } from "@/lib/format";
import { FACTORS, FCR_VERSION } from "@/lib/rating/model";
import s from "@/components/fighter/Profile.module.css";

/** ESPN's fighting-style labels in Spanish. */
const STYLE_ES: Record<string, string> = {
  "Brazilian Jiu-Jitsu": "Jiu-jitsu brasileño", "Jiu-Jitsu": "Jiu-jitsu", "Mixed Martial Artist": "MMA completo", Freestyle: "Lucha libre olímpica", Grappling: "Grappling", Wrestling: "Lucha", Kickboxer: "Kickboxing", Boxer: "Boxeo", Wrestler: "Lucha", Boxing: "Boxeo", Kickboxing: "Kickboxing", "Muay Thai": "Muay thai",
  Karate: "Kárate", Judo: "Judo", Sambo: "Sambo", Taekwondo: "Taekwondo", "Mixed Martial Arts": "MMA", Striker: "Golpeador", Grappler: "Grappler",
  "Freestyle Wrestling": "Lucha libre olímpica", "Greco-Roman Wrestling": "Lucha grecorromana", "Kung Fu": "Kung fu", "Combat Sambo": "Sambo de combate",
};

/** Dominant hand implied by the stance. */
const HAND: Record<string, string> = { Orthodox: "Diestro · adelanta la izquierda", Southpaw: "Zurdo · adelanta la derecha", Switch: "Alterna las dos guardias" };
const ftIn = (cm: number) => { const inch = Math.round(cm / 2.54); return `${Math.floor(inch / 12)}′${inch % 12}″`; };
const vsAvg = (v: number, avg: number | null) => {
  if (avg == null) return "";
  const d = v - avg;
  return d === 0 ? " · en la media" : ` · ${d > 0 ? "+" : "−"}${Math.abs(d)} vs media`;
};

export function generateStaticParams() {
  return prerenderFighterSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = fighterProfile(slug);
  if (!p) return { title: "Luchador no encontrado" };
  const r = p.summary.record;
  const desc = `${p.summary.name}: ${r.w}-${r.l}-${r.d}, ${p.summary.division}. FIGHTCORE Rating ${p.rating.value.toFixed(1)} ±${p.rating.band}. Récord, estilo, rendimiento, rivales y evolución.${IS_DEMO ? " Datos de demostración." : ""}`;
  return {
    title: `${p.summary.name} — Expediente`,
    description: desc,
    alternates: { canonical: `/fighters/${slug}` },
    openGraph: { title: `${p.summary.name} · FIGHTCORE`, description: desc, type: "profile" },
  };
}


export default async function FighterPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = fighterProfile(slug);
  if (!p) notFound();
  const { fighter: f, summary: me, rating, stats: st } = p;
  const titleWinIds = p.bouts.filter((b) => b.title && b.outcome === "W").map((b) => b.fightId);
  const last5 = p.bouts.slice(-5).reverse();
  const rankText = me.rank ? `Nº ${me.rank} de ${p.divisionSize}` : null;
  const factorTotal = FACTORS.reduce((a, x) => a + rating.contributions[x.key], 0);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: me.name,
    alternateName: f.nickname ?? undefined,
    nationality: me.countryName ?? undefined,
    birthDate: DATASET.kind === "ufc" ? f.birthDate ?? undefined : undefined,
    height: f.heightCm ? { "@type": "QuantitativeValue", value: f.heightCm, unitCode: "CMT" } : undefined,
    image: f.photo.kind === "licensed" || f.photo.kind === "official" ? `${SITE_URL}${f.photo.src}` : undefined,
    description: DATASET.kind === "ufc"
      ? `Perfil analítico de ${me.name} en FIGHTCORE: récord, estadísticas por asalto y FIGHTCORE Rating.`
      : "Perfil de un luchador ficticio del dataset de demostración de FIGHTCORE.",
  };

  return (
    <article className={s.page} aria-labelledby="fighter-name">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* ───────── HERO ───────── */}
      <header className={s.hero}>
        <div className={`wrap ${s.heroGrid}`}>
          <nav aria-label="Ruta" className={s.crumbs}>
            <ol>
              <li><Link href="/">FIGHTCORE</Link></li>
              <li><Link href="/fighters">Luchadores</Link></li>
              <li><Link href={`/rankings#${f.divisionId}`}>{me.division}</Link></li>
              <li aria-current="page">{me.name}</li>
            </ol>
          </nav>

          <div className={s.plateCol}>
            <FighterPlate id={f.id} firstName={f.firstName} lastName={f.lastName} country={f.country} division={me.divisionShort} career={me.career} photo={me.photo} size="lg" priority />
          </div>

          <div className={s.idCol}>
            <div className={s.tags}>
              {me.title && <ChampionBadge title={me.title} variant="full" />}
              {rankText && <Tag tone="accent">{rankText} · FC Rankings</Tag>}
              <Tag>{f.status === "active" ? "En activo" : f.status === "inactive" ? (IS_DEMO ? "Inactivo" : "Fuera de la plantilla UFC") : "Retirado"}</Tag>
              <Source kind={SRC} />
            </div>
            <h1 id="fighter-name" className={s.name}>
              <span className={s.first}>{f.firstName}</span>
              <span className={s.last} style={{ "--len": Math.max(9, ...f.lastName.split(/[\s-]+/).map((w) => w.length)) } as React.CSSProperties}>{f.lastName}</span>
            </h1>
            {f.nickname && <p className={`serif ${s.nick}`}>“{f.nickname}”</p>}
            <div className={s.idRow}>
              <CountryTag code={f.country} name={me.countryName} />
              <span>{me.countryName}</span>
              <span className={s.dot} aria-hidden />
              <span>{me.division}</span>
              <span className={s.dot} aria-hidden />
              <span>{me.orgName}</span>
            </div>
            <div className={s.recordLine}>
              <RecordValue r={me.record} size="lg" />
              <div className={s.recordAside}>
                <span className="label">Récord profesional</span>
                <FormStrip form={me.form} size="md" />
                <span className={s.streak}>
                  {st.currentStreak.kind && `Racha: ${st.currentStreak.n} ${st.currentStreak.kind === "W" ? (st.currentStreak.n === 1 ? "victoria" : "victorias") : st.currentStreak.kind === "L" ? (st.currentStreak.n === 1 ? "derrota" : "derrotas") : "empates"}`}
                </span>
              </div>
            </div>
          </div>

          <div className={s.ratingCol}>
            <div className={s.ratingBox}>
              <span className={s.ratingKicker}>FIGHTCORE Rating</span>
              <p role="img" className={s.bigRating} aria-label={`FIGHTCORE Rating ${rating.value.toFixed(1)}, margen más o menos ${rating.band}`}>
                <CountUp value={rating.value} />
              </p>
              <div className={s.bandScale} aria-hidden>
                <span className={s.bandTrack} />
                <span className={s.bandRange} style={{ left: `${Math.max(0, rating.value - rating.band)}%`, width: `${rating.band * 2}%` }} />
                <span className={s.bandPoint} style={{ left: `${rating.value}%` }} />
                <span className={s.bandTicks}><span>0</span><span>50</span><span>100</span></span>
              </div>
              <p className={s.ratingMeta}>
                <span>±{rating.band.toFixed(1)} margen</span>
                <span>n = {rating.sample} combates</span>
                {p.peak && <span>Pico {p.peak.value.toFixed(1)} · {fmtDate(p.peak.date)}</span>}
              </p>
              {rating.provisional && <p className={s.provisional}>Rating provisional: menos de 3 combates en cobertura.</p>}
              <a href="#rating" className={s.ratingLink}>Ver cómo se compone <span aria-hidden>↓</span></a>
            </div>
          </div>

          <section className={s.ficha} aria-label="Ficha">
            <div className={s.fichaGroup}>
              <h3 className={s.fichaHead}>Personal</h3>
              <dl className={s.fichaList}>
                <div><dt>Nacimiento</dt><dd>{f.birthDate ? <>{fmtDateLong(f.birthDate)}{me.age != null && <span className={s.fichaSub}>{me.age} años</span>}</> : <Unavailable reason="sin datos" />}</dd></div>
                <div><dt>Lugar</dt><dd>{f.birthPlace?.city ? <>{f.birthPlace.city}{p.birthCountryName && <span className={s.fichaSub}>{p.birthCountryName}</span>}</> : <Unavailable reason="sin datos" />}</dd></div>
                <div><dt>Nacionalidad</dt><dd>{me.countryName ? <span className={s.fichaFlag}><CountryTag code={f.country} name={me.countryName} />{me.countryName}</span> : "—"}</dd></div>
                <div><dt>Equipo</dt><dd>{f.team ?? <Unavailable reason="sin datos" />}</dd></div>
              </dl>
            </div>
            <div className={s.fichaGroup}>
              <h3 className={s.fichaHead}>Físico</h3>
              <dl className={s.fichaList}>
                <div><dt>Altura</dt><dd>{f.heightCm ? <>{f.heightCm} cm<span className={s.fichaSub}>{ftIn(f.heightCm)}{vsAvg(f.heightCm, p.divisionBody.height)}</span></> : "—"}</dd></div>
                <div><dt>Alcance</dt><dd>{f.reachCm ? <>{f.reachCm} cm<span className={s.fichaSub}>{Math.round(f.reachCm / 2.54)}″{vsAvg(f.reachCm, p.divisionBody.reach)}</span></> : "—"}</dd></div>
                <div><dt>Guardia y mano</dt><dd>{f.stance ? <>{fmtStance(f.stance)}<span className={s.fichaSub}>{HAND[f.stance] ?? ""}</span></> : "—"}</dd></div>
                <div><dt>Peso</dt><dd>{me.division}</dd></div>
              </dl>
            </div>
            <div className={s.fichaGroup}>
              <h3 className={s.fichaHead}>Combate</h3>
              <dl className={s.fichaList}>
                <div><dt>Estilo</dt><dd>{f.style ? <>{f.style.split(",").map((x) => STYLE_ES[x.trim()] ?? x.trim()).join(" · ")}{p.numbersStyle && <span className={s.fichaSub}>Por números: {p.numbersStyle.toLowerCase()}</span>}</> : p.numbersStyle ? <>{p.numbersStyle}<span className={s.fichaSub}>según sus números</span></> : <Unavailable reason="sin datos" />}</dd></div>
                <div><dt>Organizaciones</dt><dd className={s.fichaOrgs}>{p.orgRecords.length ? p.orgRecords.map((o) => <span key={o.org} title={o.orgName}><b>{o.org}</b> {o.w}-{o.l}{o.d ? `-${o.d}` : ""}</span>) : "—"}</dd></div>
                <div><dt>Debut en cobertura</dt><dd>{p.debut ? <>{fmtDate(p.debut.date)}<span className={s.fichaSub}>{p.debut.org}</span></> : "—"}</dd></div>
                <div><dt>Último combate</dt><dd>{me.lastFight ? <>{fmtDate(me.lastFight)}<span className={s.fichaSub}>{st.minutes > 0 ? `${Math.round(st.minutes)} min en jaula` : ""}</span></> : "—"}</dd></div>
              </dl>
            </div>
          </section>

          {p.upcoming[0] && (
            <Link href={`/fights/${p.upcoming[0].fight.id}`} className={s.next}>
              <span className={s.nextLabel}>Próximo combate</span>
              <span className={s.nextVs}>vs {p.upcoming[0].red.id === f.id ? p.upcoming[0].blue.name : p.upcoming[0].red.name}</span>
              <span className={s.nextMeta}>{p.upcoming[0].event.name} · {fmtDateLong(p.upcoming[0].event.date)} · {p.upcoming[0].event.city}</span>
              <span aria-hidden className={s.nextArrow}>→</span>
            </Link>
          )}
        </div>
      </header>

      <ProfilePanels label="Apartados del expediente" panels={[
        { id: "resumen", label: "Resumen", hint: "Informe y forma", aliases: ["informe", "lectura", "forma"], content: (
          <>
        {/* ───────── INFORME ───────── */}
        <section id="s-informe" className={s.section} aria-labelledby="h-informe">
          <SectionHead id="h-informe" kicker="Informe FIGHTCORE" title="Lectura del luchador"
            lede={p.report.depth === "stats"
              ? `Comparado con la media de su división. Base: ${p.report.sample.statBouts} combates con estadísticas de ${p.report.sample.bouts} en cobertura.`
              : `Solo resultados: sus combates no tienen estadísticas de golpeo publicadas. Base: ${p.report.sample.bouts} combates.`} />
          <div className={s.report}>
            <div className={`serif ${s.reportText}`}>{p.report.summary.map((t, i) => <p key={i}>{t}</p>)}</div>
            <div className={s.reportCols}>
              {([["Fortalezas", p.report.strengths, s.repUp], ["Puntos débiles", p.report.weaknesses, s.repDown]] as const).map(([h, list, tone]) => (
                <div key={h} className={`${s.repCol} ${tone}`}>
                  <h3 className={s.repHead}>{h}</h3>
                  {list.length ? (
                    <ul className={s.repList}>
                      {list.map((x) => (
                        <li key={x.label}>
                          <span className={s.repLabel}>{x.label}</span>
                          <span className={s.repValue}>{x.value}{x.ref && <span className={s.repRef}> · media {x.ref}</span>}</span>
                          <span className={s.repNote}>{x.note}</span>
                        </li>
                      ))}
                    </ul>
                  ) : <p className={s.emptyNote}>{h === "Fortalezas" ? "Ningún aspecto se separa claramente de la media." : "Ningún aspecto queda claramente por debajo de la media."}</p>}
                </div>
              ))}
            </div>
            {(p.report.wins || p.report.losses) && (
              <dl className={s.repHow}>
                {p.report.wins && <div><dt>Cómo gana</dt><dd>{p.report.wins}</dd></div>}
                {p.report.losses && <div><dt>Cómo pierde</dt><dd>{p.report.losses}</dd></div>}
              </dl>
            )}
          </div>
        </section>
        {/* ───────── 01 LECTURA RÁPIDA ───────── */}
        <section id="s-lectura" className={s.section} aria-labelledby="h-lectura">
          <SectionHead id="h-lectura" kicker="FIGHTCORE Scout" title="Patrones en los datos"
            lede="Observaciones generadas por reglas explícitas. Cada una muestra su evidencia y solo aparece si hay muestra suficiente." />
          {p.insights.length ? (
            <ul className={s.insights}>
              {p.insights.map((i) => (
                <li key={i.id} className={`${s.insight} ${s[`tone_${i.tone}`]}`}>
                  <span className={s.iq}>{i.question}</span>
                  <p className={s.ih}>{i.headline}</p>
                  <p className={s.ie}>{i.evidence}</p>
                  <span className={s.in}>n = {i.sample} · {i.tone === "strength" ? "Fortaleza" : i.tone === "risk" ? "Riesgo" : "Patrón"}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className={s.emptyNote}>Aún no hay muestra suficiente para extraer observaciones fiables.</p>
          )}
        </section>
        {/* ───────── 06 FORMA ───────── */}
        <section id="s-forma" className={s.section} aria-labelledby="h-forma">
          <SectionHead id="h-forma" kicker="Forma" title="Cómo llega" lede="Últimos cinco combates, del más reciente al más antiguo, con su efecto en el rating." />
          <ol className={s.form}>
            {last5.map((b) => {
              const delta = b.ratingAfter !== null && b.ratingBefore !== null ? b.ratingAfter - b.ratingBefore : null;
              return (
                <li key={b.fightId} className={s.formCard}>
                  <Link href={`/fights/${b.fightId}`} className={s.formLink}>
                    <OutcomeMark o={b.outcome} size="lg" />
                    <span className={s.formOpp}>vs {b.opponent.name}</span>
                    <span className={s.formMethod}>{b.method ? METHOD_LABEL[b.method] : "—"}{b.round ? ` · R${b.round} ${fmtClock(b.time)}` : ""}</span>
                    <span className={s.formEvent}>{b.event.name} · {fmtDate(b.date)}</span>
                    <span className={s.formStats}>
                      <span><b className="num">{b.sigFor ?? "—"}</b>–<span className="num">{b.sigAgainst ?? "—"}</span> golpes sig.</span>
                      <span><b className="num">{b.tdFor ?? "—"}</b> derribos</span>
                    </span>
                    <span className={s.formRating}>
                      <span className="label">FCR</span>
                      <span className="num">{b.ratingBefore?.toFixed(1) ?? "—"} → {b.ratingAfter?.toFixed(1) ?? "—"}</span>
                      {delta !== null && <span className={`${s.formDelta} ${delta >= 0 ? s.up : s.down}`}>{delta >= 0 ? "+" : ""}{delta.toFixed(1)}</span>}
                    </span>
                    {b.title && <Tag tone="solid">Título</Tag>}
                  </Link>
                </li>
              );
            })}
          </ol>
        </section>
          </>
        ) },
        { id: "rating", label: "Rating", hint: "FCR y evolución", aliases: ["evolucion"], content: (
          <>
        {/* ───────── 02 RATING ───────── */}
        <section id="s-rating" className={s.section} aria-labelledby="h-rating">
          <SectionHead id="h-rating" kicker={`FIGHTCORE Rating · v${FCR_VERSION}`} title="Cómo se compone su rating"
            lede={<>Ocho factores con peso fijo. La barra suma exactamente {rating.value.toFixed(1)} puntos. <Link href="/methodology" className={s.inlineLink}>Metodología completa</Link>.</>} />
          <div className={s.stackWrap}>
            <div className={s.stack} role="img" aria-label={`Contribución por factor: ${FACTORS.map((x) => `${x.label} ${rating.contributions[x.key].toFixed(1)}`).join(", ")}. Total ${factorTotal.toFixed(1)} de 100.`}>
              {FACTORS.map((x, i) => (
                <span key={x.key} className={`${s.stackPart} ${s[`st${i % 3}`]}`} style={{ width: `${rating.contributions[x.key]}%` }} title={`${x.label}: ${rating.contributions[x.key].toFixed(1)}`} />
              ))}
            </div>
            <div className={s.stackScale} aria-hidden><span>0</span><span>25</span><span>50</span><span>75</span><span>100</span></div>
          </div>
          <table className={s.factors}>
            <caption className="visually-hidden">Factores del FIGHTCORE Rating</caption>
            <thead>
              <tr><th scope="col">Factor</th><th scope="col" className={s.r}>Puntuación</th><th scope="col" className={s.hideSm}>Escala 0–100</th><th scope="col" className={s.r}>Peso</th><th scope="col" className={s.r}>Aporta</th></tr>
            </thead>
            <tbody>
              {FACTORS.map((x, i) => (
                <tr key={x.key}>
                  <th scope="row"><span className={`${s.fKey} ${s[`st${i % 3}`]}`} aria-hidden />{x.label}<span className={s.fDesc}>{x.description}</span></th>
                  <td className={`${s.r} ${s.fScore}`}>{rating.factors[x.key].toFixed(0)}</td>
                  <td className={s.hideSm}><span className={s.fTrack}><span style={{ width: `${rating.factors[x.key]}%` }} /></span></td>
                  <td className={`${s.r} ${s.mono}`}>{Math.round(x.weight * 100)}%</td>
                  <td className={`${s.r} ${s.fContrib}`}>{rating.contributions[x.key].toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr><th scope="row">Total</th><td /><td className={s.hideSm} /><td className={`${s.r} ${s.mono}`}>100%</td><td className={`${s.r} ${s.fContrib}`}>{rating.value.toFixed(1)}</td></tr>
            </tfoot>
          </table>

          {p.attributes && (
            <div className={s.attrs}>
              <div className={s.attrHead}>
                <h3 className={s.h3}>Atributos</h3>
                <p className={s.attrLegend}><span className={s.lgBar} aria-hidden /> Percentil frente a todos los luchadores con ≥3 combates <span className={s.lgTick} aria-hidden /> media de su división</p>
              </div>
              <ul className={s.attrList}>
                {ATTRIBUTES.map((a) => {
                  const v = p.attributes![a.key];
                  const ref = p.divisionAttributes?.[a.key];
                  return (
                    <li key={a.key} className={s.attr}>
                      <span className={s.attrShort} aria-hidden>{a.short}</span>
                      <span className={s.attrLabel}>{a.label}{a.experimental && <Tag tone="warning">Experimental</Tag>}<span className={s.attrBasis}>{a.basis}</span></span>
                      <span className={s.attrTrack} role="img" aria-label={`${a.label}: percentil ${v}${ref !== undefined ? `; media de división ${ref}` : ""}`}>
                        {[25, 50, 75].map((t) => <span key={t} className={s.attrGrid} style={{ left: `${t}%` }} />)}
                        <span className={s.attrFill} style={{ width: `${v}%` }} />
                        {ref !== undefined && <span className={s.attrRef} style={{ left: `${ref}%` }} />}
                      </span>
                      <span className={s.attrVal}>{v}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </section>
        {/* ───────── 08 EVOLUCIÓN ───────── */}
        <section id="s-evolucion" className={s.section} aria-labelledby="h-evo">
          <SectionHead id="h-evo" kicker="Evolución" title="Cómo ha cambiado" lede="El rating se recalcula tras cada combate. La banda gris es su margen de incertidumbre." />
          <Evolution
            points={p.evolution}
            bands={p.ratingHistory.map((h) => ({ date: h.date, lo: h.value - h.band, hi: h.value + h.band }))}
            titleDates={p.titleHistory.map((t) => ({ date: t.from, label: `TÍTULO ${t.org}` }))}
          />
        </section>
          </>
        ) },
        { id: "record", label: "Récord", hint: "Métodos y carrera", aliases: ["carrera"], content: (
          <>
        {/* ───────── 03 RÉCORD ───────── */}
        <section id="s-record" className={s.section} aria-labelledby="h-record">
          <SectionHead id="h-record" kicker="FIGHTCORE Records" title="Cómo gana. Cómo pierde." />
          <Tabs
            label="Tipo de récord"
            tabs={[
              {
                id: "career", label: "Carrera", content: (
                  <div className={s.recGrid}>
                    <div className={s.recBig}>
                      <RecordValue r={p.records.career} size="lg" />
                      <p className={s.recNote}>
                        {p.records.prior
                          ? <>Récord profesional. Incluye {p.records.prior.w}-{p.records.prior.l}-{p.records.prior.d} fuera de la cobertura de FIGHTCORE, sin desglose por método.</>
                          : <>Solo combates en cobertura{DATASET.kind === "ufc" ? " (UFC y las organizaciones que publica ESPN)" : ""}: el récord profesional completo no está disponible en las fuentes.</>}
                      </p>
                    </div>
                    <dl className={s.recStats}>
                      <div><dt>Victorias</dt><dd>{p.records.career.w}</dd></div>
                      <div><dt>Derrotas</dt><dd>{p.records.career.l}</dd></div>
                      <div><dt>Empates</dt><dd>{p.records.career.d}</dd></div>
                      <div><dt>Sin resultado</dt><dd>{p.records.career.nc}</dd></div>
                    </dl>
                  </div>
                ),
              },
              {
                id: "org", label: `Organización · ${p.records.org.org}`, content: (
                  <div className={s.recGrid}>
                    <div className={s.recBig}><RecordValue r={p.records.org} size="lg" /><p className={s.recNote}>Solo combates en {p.records.org.org}. Ha competido en: {p.orgsFought.join(", ")}.</p></div>
                    <dl className={s.recStats}>
                      <div><dt>Combates por título</dt><dd>{st.titleRecord.w}-{st.titleRecord.l}</dd></div>
                      <div><dt>Mejor racha</dt><dd>{st.longestWinStreak}</dd></div>
                    </dl>
                  </div>
                ),
              },
              {
                id: "division", label: "División", content: (
                  <div className={s.recGrid}>
                    <div className={s.recBig}><RecordValue r={p.records.division} size="lg" /><p className={s.recNote}>Combates en {p.records.division.division} registrados por FIGHTCORE.</p></div>
                  </div>
                ),
              },
            ]}
          />
          <div className={s.methods}>
            <div>
              <h3 className={s.h3}>Victorias por método</h3>
              <p className={s.methodsTotal}><span className="num">{st.record.w}</span> en cobertura</p>
              <SegmentBar label="Victorias por método" segments={[
                { key: "ko", label: "KO/TKO", value: st.winsBy.ko, tone: "bone" },
                { key: "sub", label: "Sumisión", value: st.winsBy.sub, tone: "bone-2" },
                { key: "dec", label: "Decisión", value: st.winsBy.dec, tone: "ink" },
              ]} />
            </div>
            <div>
              <h3 className={s.h3}>Derrotas por método</h3>
              <p className={s.methodsTotal}><span className="num">{st.record.l}</span> en cobertura</p>
              {st.record.l ? (
                <SegmentBar label="Derrotas por método" segments={[
                  { key: "ko", label: "KO/TKO", value: st.lossesBy.ko, tone: "bone" },
                  { key: "sub", label: "Sumisión", value: st.lossesBy.sub, tone: "bone-2" },
                  { key: "dec", label: "Decisión", value: st.lossesBy.dec, tone: "ink" },
                ]} />
              ) : <p className={s.emptyNote}>Sin derrotas en cobertura.</p>}
            </div>
          </div>
        </section>
        {/* ───────── 07 CARRERA ───────── */}
        <section id="s-carrera" className={s.section} aria-labelledby="h-carrera">
          <SectionHead id="h-carrera" kicker="FIGHTCORE History" title="Carrera"
            lede={p.titleHistory.length ? `${p.titleHistory.length} ${p.titleHistory.length === 1 ? "reinado" : "reinados"} como campeón: ${p.titleHistory.map((t) => `${t.org} desde ${fmtDate(t.from)}${t.to ? (t.toApprox ? ` (último combate como campeón: ${fmtDate(t.to)})` : ` hasta ${fmtDate(t.to)}`) : " (vigente)"}, ${t.defenses} ${t.defenses === 1 ? "defensa" : "defensas"}`).join("; ")}.` : "Cada combate registrado, con la organización en la que se disputó."} />
          <CareerTimeline
            titleWins={titleWinIds}
            bouts={p.bouts.map((b) => ({
              fightId: b.fightId, date: b.date, outcome: b.outcome, opponent: b.opponent.name, method: b.method,
              round: b.round, org: b.event.org, event: b.event.name, title: b.title, oppStrength: b.oppStrength, ratingAfter: b.ratingAfter,
            }))}
          />
        </section>
          </>
        ) },
        { id: "estilo", label: "Estilo", hint: "Cómo pelea y stats", aliases: ["rendimiento"], content: (
          <>
        {/* ───────── 04 ESTILO ───────── */}
        <section id="s-estilo" className={s.section} aria-labelledby="h-estilo">
          <SectionHead id="h-estilo" kicker="Análisis de estilo" title="Cómo pelea"
            lede="Dónde y a qué golpea, y cómo se reparte su trabajo. Percentiles frente al conjunto de luchadores con al menos tres combates." />
          <div className={s.styleGrid}>
            <div className={s.styleZones}>
              <h3 className={s.h3}>Dónde conecta</h3>
              <SegmentBar label="Golpes significativos por posición" unit="" segments={[
                { key: "d", label: "Distancia", value: st.totals.distance, tone: "bone" },
                { key: "c", label: "Clinch", value: st.totals.clinch, tone: "bone-2" },
                { key: "g", label: "Suelo", value: st.totals.ground, tone: "ink" },
              ]} />
              <h3 className={s.h3}>A qué golpea</h3>
              <SegmentBar label="Golpes significativos por objetivo" segments={[
                { key: "h", label: "Cabeza", value: st.totals.head, tone: "bone" },
                { key: "b", label: "Cuerpo", value: st.totals.body, tone: "bone-2" },
                { key: "l", label: "Pierna", value: st.totals.leg, tone: "ink" },
              ]} />
              {p.rounds.length > 0 && (
                <>
                  <h3 className={s.h3}>Volumen por round</h3>
                  <div className={s.rounds} role="table" aria-label="Golpes significativos conectados y encajados por round (media de rounds completos)">
                    <div role="row" className="visually-hidden"><span role="columnheader">Round</span><span role="columnheader">Conectados</span><span role="columnheader">Encajados</span></div>
                    {p.rounds.map((r) => {
                      const max = Math.max(...p.rounds.map((x) => Math.max(x.landed, x.oppLanded)), 1);
                      return (
                        <div key={r.round} role="row" className={s.roundCol}>
                          <span role="cell" className={s.roundBars}>
                            <span className={s.rbOwn} style={{ height: `${(r.landed / max) * 100}%` }} />
                            <span className={s.rbOpp} style={{ height: `${(r.oppLanded / max) * 100}%` }} />
                          </span>
                          <span role="rowheader" className={s.roundLabel}>R{r.round}</span>
                          <span role="cell" className={s.roundVal}>{r.landed.toFixed(1).replace(".", ",")}<small> / {r.oppLanded.toFixed(1).replace(".", ",")}</small></span>
                          <span className={s.roundN}>n={r.n}</span>
                        </div>
                      );
                    })}
                  </div>
                  <p className={s.miniLegend}><span className={s.keyOwn} aria-hidden /> Conectados <span className={s.keyOpp} aria-hidden /> Encajados · media por round completo</p>
                </>
              )}
            </div>
            {p.style && (
              <div>
                <h3 className={s.h3}>Firma de estilo</h3>
                <ul className={s.signature}>
                  {STYLE_DIMS.map((d) => {
                    const v = p.style![d.key];
                    return (
                      <li key={d.key} className={s.sigRow}>
                        <span className={s.sigLabel}>{d.label}<span className={s.attrBasis}>{d.basis}</span></span>
                        <span className={s.sigScale} role="img" aria-label={`${d.label}: percentil ${v}`}>
                          {Array.from({ length: 10 }, (_, i) => (
                            <span key={i} className={i < Math.round(v / 10) ? s.sigOn : s.sigOff} />
                          ))}
                        </span>
                        <span className={s.sigVal}>{v}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        </section>
        {/* ───────── 05 RENDIMIENTO ───────── */}
        <section id="s-rendimiento" className={s.section} aria-labelledby="h-rend">
          <SectionHead id="h-rend" kicker="FIGHTCORE Stats" title="Rendimiento con contexto"
            lede="Ningún número aparece solo: la barra es su media de carrera; la marca naranja, la referencia que elijas." />
          <Performance
            career={{ slpm: st.slpm, sapm: st.sapm, strAcc: st.strAcc, strDef: st.strDef, tdAvg: st.tdAvg, tdAcc: st.tdAcc, tdDef: st.tdDef, subAvg: st.subAvg, kdAvg: st.kdAvg, ctrlShare: st.ctrlShare }}
            baselines={{
              division: p.baselines.division,
              last5: p.baselines.last5,
              opponents: p.baselines.opponents,
            }}
          />
        </section>
          </>
        ) },
        { id: "rivales", label: "Rivales", hint: "Historial y comparar", aliases: [], content: (
          <>
        {/* ───────── 09 RIVALES ───────── */}
        <section id="s-rivales" className={s.section} aria-labelledby="h-riv">
          <SectionHead id="h-riv" kicker="Rivales" title="Contra quién" lede="La fuerza del rival se mide en el momento del combate (0–100), no con lo que hizo después." />
          <Opponents rows={p.bouts.map((b) => ({
            fightId: b.fightId, date: b.date, outcome: b.outcome,
            opponent: { slug: b.opponent.slug, name: b.opponent.name, country: b.opponent.country, rating: b.opponent.rating },
            method: b.method, submission: b.submission, round: b.round, time: b.time, org: b.event.org, event: b.event.name,
            eventSlug: b.event.slug, division: b.division, title: b.title, oppStrength: b.oppStrength,
          }))} />
        </section>
        {/* ───────── COMPARE ───────── */}
        <section className={`${s.section} ${s.compareCta}`} aria-labelledby="h-cmp">
          <div>
            <p className="label">FIGHTCORE Compare</p>
            <h2 id="h-cmp" className={s.cmpTitle}>¿Cómo se compara con su división?</h2>
          </div>
          <ul className={s.cmpList}>
            {p.rivalsToCompare.map((r) => (
              <li key={r.id}>
                <Link href={`/compare?f=${f.slug},${r.slug}`} className={s.cmpItem}>
                  <span>{me.lastName} <em>vs</em> {r.lastName}</span>
                  <span className="mono">{r.rank ? `#${r.rank}` : ""} · {r.rating.toFixed(1)}</span>
                </Link>
              </li>
            ))}
          </ul>
          <ButtonLink href={`/compare?f=${f.slug}`} variant="ghost">Elegir rivales</ButtonLink>
        </section>
          </>
        ) },
      ]} />

      <div className="wrap">
        <p className={s.provenance}>
          <Source kind={SRC} /> <Source kind="calculated" /> {IS_DEMO
            ? <>Luchador ficticio. Estadísticas simuladas; rating, atributos y observaciones calculados por FIGHTCORE a {fmtDate(TODAY)}.</>
            : <>Combates y estadísticas de UFC (UFCStats); nacionalidad y récord profesional de Wikidata y Wikipedia cuando lo indican. Rating, atributos y observaciones calculados por FIGHTCORE a {fmtDate(TODAY)}. <Link href="/methodology">Metodología</Link>.</>}
        </p>
      </div>
    </article>
  );
}
