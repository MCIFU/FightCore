import Link from "next/link";
import { NucleoMark } from "@/components/brand/Logo";
import { TaleOfTape } from "@/components/charts/TaleOfTape";
import { FighterAvatar } from "@/components/fighter/FighterAvatar";
import { FighterPlate } from "@/components/fighter/FighterPlate";
import { ChampionBadge } from "@/components/ui/ChampionBadge";
import { RankingList } from "@/components/rankings/RankingList";
import { SearchLauncher } from "@/components/search/SearchLauncher";
import { ButtonLink, CountryTag, FormStrip, RatingValue, RecordValue, SectionHead, Source, Tag } from "@/components/ui/primitives";
import { Tabs } from "@/components/ui/Tabs";
import { currentChampions, divisionRanking, featuredFight, fighterProfile, history, IS_DEMO, poundForPound, rankedDivisions, recentResults, records, spotlight, SRC, TODAY, trending, universeCounts, upcomingEvents } from "@/lib/data/repository";
import { fmtClock, fmtDate, fmtDayMonth, fmtWeekday, METHOD_SHORT } from "@/lib/format";
import s from "./home.module.css";
import { Portrait } from "@/components/fighter/Portrait";

export default function Home() {
  const featured = featuredFight();
  const counts = universeCounts();
  const upcoming = upcomingEvents(6);
  const results = recentResults(8);
  const p4p = poundForPound("M", 10);
  const p4pW = poundForPound("F", 10);
  const spot = spotlight();
  const recs = records().slice(0, 4);
  const trend = trending(6);
  const hist = history();
  const belts = currentChampions().filter((c) => ["UFC", "PFL", "ONE"].includes(c.org));

  const fa = featured ? fighterProfile(featured.red.slug) : null;
  const fb = featured ? fighterProfile(featured.blue.slug) : null;

  return (
    <>
      {/* ───────────── HERO ───────────── */}
      <section className={s.hero} aria-labelledby="hero-title">
        <div className={`wrap ${s.heroGrid}`}>
          <div className={s.heroMain}>
            <p className={s.heroKicker}><span className="label">Plataforma de inteligencia de MMA</span></p>
            <h1 id="hero-title" className={s.heroTitle}>
              <span className={s.heroWord}>Fight</span>
              <span className={s.heroWord}>core<span className={s.heroCore} aria-hidden /></span>
            </h1>
            <p className={s.tagline}>The core of MMA</p>
            <p className={`serif ${s.heroLede}`}>
              Estadísticas, historia y scouting en un mismo sitio. Con un rating propio que enseña sus cuentas: cada punto tiene origen, peso y margen de error.
            </p>
            <SearchLauncher demo={IS_DEMO} />
            <dl className={s.counts}>
              <div><dt>Luchadores</dt><dd className="num">{counts.fighters}</dd></div>
              <div><dt>Combates</dt><dd className="num">{counts.fights.toLocaleString("es-ES")}</dd></div>
              <div><dt>Rounds</dt><dd className="num">{counts.rounds.toLocaleString("es-ES")}</dd></div>
              {IS_DEMO
                ? <div><dt>Organizaciones</dt><dd className="num">{counts.organizations}</dd></div>
                : <div><dt>Eventos</dt><dd className="num">{counts.events.toLocaleString("es-ES")}</dd></div>}
            </dl>
            <p className={s.countsSrc}><Source kind={SRC} /> {IS_DEMO ? "Universo simulado: luchadores, combates y eventos ficticios." : `Historia completa de UFC, de 1993 al ${fmtDate(TODAY)}. Fuentes: UFCStats, Wikidata, Wikipedia.`}</p>
          </div>

          {featured && fa && fb && (
            <aside className={s.featured} aria-labelledby="featured-title">
              <div className={s.featHead}>
                <span className={s.featLabel}>Combate destacado</span>
                <span className="label">{featured.event.name} · {fmtDate(featured.event.date)}</span>
              </div>
              <h2 id="featured-title" className="visually-hidden">Combate destacado: {featured.red.name} contra {featured.blue.name}</h2>
              <div className={s.featVs}>
                <div className={s.featSide}>
                  <Portrait src={featured.red.photo.src} name={featured.red.name} alt="" sizes="160px" className={s.featFace} priority />
                  <span className={s.cornerA} aria-hidden />
                  <Link href={`/fighters/${featured.red.slug}`} className={s.featName}>
                    <span className={s.featFirst}>{featured.red.firstName}</span>
                    <span className={s.featLast}>{featured.red.lastName}</span>
                  </Link>
                  <span className={s.featMeta}><CountryTag code={featured.red.country} name={featured.red.countryName} /> <RecordValue r={featured.red.record} size="sm" />{featured.red.title && <ChampionBadge title={featured.red.title} variant="icon" />}</span>
                  <RatingValue value={featured.red.rating} band={featured.red.band} size="md" />
                </div>
                <div className={s.featMid} aria-hidden>
                  <span>VS</span>
                  <span className={s.featDiv}>{featured.division.short}</span>
                  <span className={s.featRounds}>{featured.fight.scheduledRounds}×5</span>
                </div>
                <div className={`${s.featSide} ${s.featSideB}`}>
                  <Portrait src={featured.blue.photo.src} name={featured.blue.name} alt="" sizes="160px" className={s.featFace} priority />
                  <span className={s.cornerB} aria-hidden />
                  <Link href={`/fighters/${featured.blue.slug}`} className={s.featName}>
                    <span className={s.featFirst}>{featured.blue.firstName}</span>
                    <span className={s.featLast}>{featured.blue.lastName}</span>
                  </Link>
                  <span className={s.featMeta}>{featured.blue.title && <ChampionBadge title={featured.blue.title} variant="icon" />}<RecordValue r={featured.blue.record} size="sm" /> <CountryTag code={featured.blue.country} name={featured.blue.countryName} /></span>
                  <RatingValue value={featured.blue.rating} band={featured.blue.band} size="md" />
                </div>
              </div>
              {fa.attributes && fb.attributes && (
                <TaleOfTape
                  compact
                  nameA={featured.red.name}
                  nameB={featured.blue.name}
                  rows={[
                    { label: "Golpeo", a: fa.attributes.striking, b: fb.attributes.striking, max: 100 },
                    { label: "Lucha", a: fa.attributes.wrestling, b: fb.attributes.wrestling, max: 100 },
                    { label: "Grappling", a: fa.attributes.grappling, b: fb.attributes.grappling, max: 100 },
                    { label: "Defensa", a: fa.attributes.defense, b: fb.attributes.defense, max: 100 },
                    { label: "Ritmo", a: fa.attributes.pace, b: fb.attributes.pace, max: 100 },
                    ...(fa.fighter.reachCm && fb.fighter.reachCm ? [{ label: "Alcance", a: fa.fighter.reachCm, b: fb.fighter.reachCm, fa: `${fa.fighter.reachCm} cm`, fb: `${fb.fighter.reachCm} cm`, max: 210 }] : []),
                  ]}
                />
              )}
              <p className={s.featNote}>Percentiles frente a todos los luchadores con ≥3 combates. No es una predicción.</p>
              <div className={s.featCta}>
                <ButtonLink href={`/fights/${featured.fight.id}`}>Análisis previo</ButtonLink>
                <ButtonLink href={`/compare?f=${featured.red.slug},${featured.blue.slug}`} variant="ghost">Comparar</ButtonLink>
              </div>
            </aside>
          )}
        </div>
      </section>

      {/* ───────────── R1 · UPCOMING ───────────── */}
      <section className={`wrap ${s.section}`} aria-labelledby="up-title" data-reveal>
        <SectionHead id="up-title" round="R1" kicker="FIGHTCORE Events" title="Próximos eventos" action={{ href: "/events", label: "Calendario" }} />
        <ol className={s.timeline} aria-label="Próximos eventos, desplazable en horizontal">
          {upcoming.map((e, i) => {
            const d = fmtDayMonth(e.event.date);
            const main = e.fights[0];
            return (
              <li key={e.event.id} className={s.tlItem}>
                <span className={s.tlTick} aria-hidden />
                <Link href={`/events/${e.event.slug}`} className={s.tlCard}>
                  <span className={s.tlDate}>
                    <span className={s.tlDay}>{d.day}</span>
                    <span className={s.tlMonth}>{d.month}<br />{fmtWeekday(e.event.date)}</span>
                  </span>
                  <span className={s.tlOrg}>{e.org.short}{i === 0 && <Tag tone="accent">Siguiente</Tag>}</span>
                  <span className={s.tlName}>{e.event.name}</span>
                  <span className={s.tlCity}>{e.event.city} · {e.countryName}</span>
                  {main && <span className={s.tlMain}>{main.red.lastName} <em>vs</em> {main.blue.lastName}</span>}
                  <span className={s.tlCount}>{e.fights.length} combate{e.fights.length === 1 ? "" : "s"}</span>
                </Link>
              </li>
            );
          })}
        </ol>
      </section>

      {/* ───────────── R2 · RESULTS + TRENDING ───────────── */}
      <section className={`wrap ${s.section} ${s.split}`} aria-labelledby="res-title" data-reveal>
        <div>
          <SectionHead id="res-title" round="R2" kicker="Libro de resultados" title="Últimos resultados" action={{ href: "/events", label: "Todos los eventos" }} />
          <table className={s.ledger}>
            <caption className="visually-hidden">Resultados recientes de main y co-main events</caption>
            <thead>
              <tr>
                <th scope="col">Fecha</th>
                <th scope="col">Combate</th>
                <th scope="col">Método</th>
                <th scope="col" className={s.num}>R</th>
                <th scope="col" className={s.num}>Tiempo</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r) => {
                const winRed = r.fight.winnerId === r.red.id;
                const w = r.fight.winnerId ? (winRed ? r.red : r.blue) : null;
                const l = r.fight.winnerId ? (winRed ? r.blue : r.red) : null;
                return (
                  <tr key={r.fight.id}>
                    <td className={s.ledgerDate}><span className="num">{fmtDate(r.fight.date)}</span><span className={s.ledgerEvent}>{r.event.name}</span></td>
                    <td>
                      <Link href={`/fights/${r.fight.id}`} className={s.ledgerFight}>
                        {w && l ? (<><strong>{w.name}</strong> <span className={s.def}>def.</span> {l.name}</>) : (<>{r.red.name} <span className={s.def}>—</span> {r.blue.name}</>)}
                      </Link>
                      {r.fight.titleFight && <Tag tone="solid">Título</Tag>}
                    </td>
                    <td className={s.method}>{METHOD_SHORT[r.fight.method!]}{r.fight.submission && <span className={s.subType}>{r.fight.submission}</span>}</td>
                    <td className={`${s.num} num`}>{r.fight.round}</td>
                    <td className={`${s.num} num`}>{fmtClock(r.fight.time)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <aside aria-labelledby="trend-title" className={s.trending}>
          <div className={s.trendHead}>
            <h2 id="trend-title" className={s.miniTitle}>Tendencia</h2>
            <span className="label">Δ FCR · 200 días</span>
          </div>
          <ol className={s.trendList}>
            {trend.map((t) => (
              <li key={t.fighter.id}>
                <Link href={`/fighters/${t.fighter.slug}`} className={s.trendRow}>
                  <FighterAvatar src={t.fighter.photo.src} name={t.fighter.name} size={36} champion={t.fighter.champion} />
                  <span className={s.trendName}>{t.fighter.name}<span className={s.trendMeta}>{t.fighter.divisionShort} · {t.fighter.org}</span></span>
                  <span className={`${s.trendDelta} ${t.delta >= 0 ? s.up : s.down}`}>
                    <span aria-hidden>{t.delta >= 0 ? "▲" : "▼"}</span>
                    <span className="visually-hidden">{t.delta >= 0 ? "Sube" : "Baja"}</span>
                    {Math.abs(t.delta).toFixed(1)}
                  </span>
                </Link>
              </li>
            ))}
          </ol>
          <p className={s.trendNote}>Mayor variación de rating en los combates de los últimos 200 días.</p>
        </aside>
      </section>

      {/* ───────────── R3 · RANKINGS ───────────── */}
      <section className={`wrap ${s.section}`} aria-labelledby="rank-title" data-reveal>
        <SectionHead
          id="rank-title" round="R3" kicker="FIGHTCORE Rankings" title="Quién está arriba, según los datos"
          lede="Ranking propio por FCR. Separado siempre de los rankings oficiales de cada organización. La barra muestra el margen de cada rating."
          action={{ href: "/rankings", label: "Rankings completos" }}
        />
        <Tabs
          label="Ranking por división"
          variant="scroll"
          tabs={[
            { id: "p4p", label: "P4P masculino", content: <RankingList rows={p4p} showDivision caption="Pound for pound masculino" /> },
            { id: "p4pw", label: "P4P femenino", content: <RankingList rows={p4pW} showDivision caption="Pound for pound femenino" /> },
            ...rankedDivisions().map((d) => ({ id: d.id, label: d.short, hint: d.name, content: <RankingList rows={divisionRanking(d.id, 10)} caption={d.name} /> })),
          ]}
        />
      </section>

      {/* ───────────── BELTS ───────────── */}
      <section className={`wrap ${s.section}`} aria-labelledby="belt-title" data-reveal>
        <SectionHead id="belt-title" kicker="Títulos vigentes" title="Los cinturones" action={{ href: "/champions", label: "Tabla por división" }} />
        <ul className={s.belts}>
          {belts.map((c) => (
            <li key={`${c.orgId}-${c.divisionId}`}>
              <Link href={`/fighters/${c.fighter.slug}`} className={s.beltCard}>
                <Portrait src={c.fighter.photo.src} name={c.fighter.name} alt="" sizes="120px" className={s.beltFace} />
                <ChampionBadge title={{ org: c.org, division: c.division.name }} variant="tag" />
                <span className={s.beltName}>{c.fighter.name}</span>
                <span className={s.beltMeta}>{c.division.name} · {c.defenses} {c.defenses === 1 ? "defensa" : "defensas"}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* ───────────── R4 · FIGHTERS ───────────── */}
      <section className={`wrap ${s.section}`} aria-labelledby="ftr-title" data-reveal>
        <SectionHead id="ftr-title" round="R4" kicker="FIGHTCORE Scout" title="Tres expedientes abiertos" action={{ href: "/fighters", label: "Base de datos" }} />
        <div className={s.spot}>
          {spot.map((f, i) => {
            const p = fighterProfile(f.slug)!;
            const tagline = ["Campeón vigente", "Prospecto", "Veterano"][i];
            const insight = p.insights[0];
            return (
              <article key={f.id} className={`${s.spotCard} ${i === 0 ? s.spotLead : ""}`}>
                <Link href={`/fighters/${f.slug}`} className={s.spotLink} aria-label={`Abrir expediente de ${f.name}`}>
                  <FighterPlate id={f.id} firstName={f.firstName} lastName={f.lastName} country={f.country} division={f.divisionShort} career={f.career} photo={f.photo} title={f.title} size={i === 0 ? "lg" : "md"} linkCredit={false} />
                </Link>
                <div className={s.spotBody}>
                  <span className="label">{String(i + 1).padStart(2, "0")} · {tagline}</span>
                  <h3 className={s.spotName}><Link href={`/fighters/${f.slug}`}>{f.name}</Link></h3>
                  {f.nickname && <p className={`serif ${s.nick}`}>“{f.nickname}”</p>}
                  <div className={s.spotStats}>
                    <RatingValue value={f.rating} band={f.band} size={i === 0 ? "lg" : "md"} />
                    <div className={s.spotMeta}>
                      <RecordValue r={f.record} size="sm" />
                      <FormStrip form={f.form} />
                      <span className="label">{f.division} · {f.org} · {f.age} años</span>
                    </div>
                  </div>
                  {insight && (
                    <p className={s.spotInsight}>
                      <span className="label">{insight.question}</span>
                      <span>{insight.headline}</span>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* ───────────── R5 · RECORDS ───────────── */}
      <section className={`wrap ${s.section}`} aria-labelledby="rec-title" data-reveal>
        <SectionHead id="rec-title" round="R5" kicker="FIGHTCORE Records" title="Los números que nadie ha superado" action={{ href: "/records", label: "Todos los récords" }} />
        <ul className={s.records}>
          {recs.map((r) => (
            <li key={r.id} className={s.record}>
              <Link href={r.href} className={s.recordLink}>
                <span className="label">{r.category}</span>
                <span className={s.recordValue}>{r.value}</span>
                <span className={s.recordUnit}>{r.unit}</span>
                <span className={s.recordLabel}>{r.label}</span>
                <span className={s.recordHolder}>{r.holder.name}</span>
                <span className={s.recordCtx}>{r.context}</span>
              </Link>
            </li>
          ))}
        </ul>
        <p className={s.recordsSrc}><Source kind={SRC} /> <Source kind="calculated" /> {IS_DEMO ? "Récords del dataset de demostración, calculados por FIGHTCORE." : "Récords de UFC calculados por FIGHTCORE a partir de los combates registrados."}</p>
      </section>

      {/* ───────────── HISTORY (paper) ───────────── */}
      <section className={`paper ${s.history}`} aria-labelledby="hist-title" data-reveal>
        <div className="wrap">
          <SectionHead
            tone="paper" id="hist-title" kicker="FIGHTCORE History" title="Treinta años en un archivo"
            lede="Antes de los datos, las preguntas. El MMA moderno nace de un experimento: ¿qué estilo gana? El archivo recorre cómo el deporte fue respondiendo."
            action={{ href: "/history", label: "Abrir el archivo" }}
          />
          <ol className={s.histLine} tabIndex={0} aria-label="Línea temporal de hitos, desplazable en horizontal">
            {hist.map((h) => (
              <li key={`${h.year}-${h.title}`} className={s.histItem}>
                <span className={s.histYear}>{h.year}</span>
                <span className={s.histTitle}>{h.title}</span>
                <span className={`serif ${s.histBody}`}>{h.body}</span>
              </li>
            ))}
          </ol>
          <p className={s.histSrc}><Source kind="editorial" /> Hitos redactados por FIGHTCORE a partir de hechos ampliamente documentados.</p>
        </div>
      </section>

      {/* ───────────── EXPLORE (index) ───────────── */}
      <section className={`wrap ${s.section}`} aria-labelledby="exp-title" data-reveal>
        <SectionHead id="exp-title" kicker="FIGHTCORE Database" title="Índice" />
        <ul className={s.index}>
          {[
            { href: "/fighters", label: "Luchadores", n: counts.fighters, note: `${counts.active} en activo · ${counts.countries} países` },
            { href: "/events", label: "Eventos", n: counts.events, note: "Pasados y programados" },
            { href: "/rankings", label: "Divisiones", n: counts.divisions, note: `${counts.divisionsM} masculinas · ${counts.divisionsF} femeninas` },
            { href: "/organizations", label: "Organizaciones", n: counts.organizations, note: "Actuales e históricas" },
            { href: "/champions", label: "Campeones", n: currentChampions().length, note: "Cinturones vigentes por división" },
            { href: "/records", label: "Récords", n: records().length, note: "Global, por organización y por división" },
            { href: "/map", label: "Mapa", n: counts.countries, note: "Países con luchadores o eventos" },
            { href: "/methodology", label: "Metodología", n: 8, note: "Factores del FIGHTCORE Rating" },
          ].map((x, i) => (
            <li key={x.href}>
              <Link href={x.href} className={s.indexRow}>
                <span className={s.indexNo}>{String(i + 1).padStart(2, "0")}</span>
                <span className={s.indexLabel}>{x.label}</span>
                <span className={s.indexNote}>{x.note}</span>
                <span className={s.indexN}>{x.n.toLocaleString("es-ES")}</span>
                <span className={s.indexArrow} aria-hidden>→</span>
              </Link>
            </li>
          ))}
        </ul>
        <div className={s.signoff} aria-hidden><NucleoMark size={28} /></div>
      </section>
    </>
  );
}
