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
import { SectionNav } from "@/components/fighter/SectionNav";
import { ButtonLink, CountryTag, FormStrip, OutcomeMark, RecordValue, SectionHead, Source, Tag, Unavailable } from "@/components/ui/primitives";
import { Tabs } from "@/components/ui/Tabs";
import { ATTRIBUTES } from "@/lib/analytics/attributes";
import { allFighterSlugs, fighterProfile, STYLE_DIMS, TODAY } from "@/lib/data/repository";
import { fmtClock, fmtDate, fmtDateLong, METHOD_LABEL, METHOD_SHORT } from "@/lib/format";
import { FACTORS, FCR_VERSION } from "@/lib/rating/model";
import s from "@/components/fighter/Profile.module.css";

export function generateStaticParams() {
  return allFighterSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = fighterProfile(slug);
  if (!p) return { title: "Luchador no encontrado" };
  const r = p.summary.record;
  const desc = `${p.summary.name}: ${r.w}-${r.l}-${r.d}, ${p.summary.division}. FIGHTCORE Rating ${p.rating.value.toFixed(1)} ±${p.rating.band}. Récord, estilo, rendimiento, rivales y evolución. Datos de demostración.`;
  return {
    title: `${p.summary.name} — Expediente`,
    description: desc,
    alternates: { canonical: `/fighters/${slug}` },
    openGraph: { title: `${p.summary.name} · FIGHTCORE`, description: desc, type: "profile" },
  };
}

const SECTIONS = [
  { id: "lectura", label: "Lectura rápida" },
  { id: "rating", label: "Rating" },
  { id: "record", label: "Récord" },
  { id: "estilo", label: "Estilo" },
  { id: "rendimiento", label: "Rendimiento" },
  { id: "forma", label: "Forma" },
  { id: "carrera", label: "Carrera" },
  { id: "evolucion", label: "Evolución" },
  { id: "rivales", label: "Rivales" },
];

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
    nationality: me.countryName,
    height: { "@type": "QuantitativeValue", value: f.heightCm, unitCode: "CMT" },
    description: "Perfil de un luchador ficticio del dataset de demostración de FIGHTCORE.",
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
            <FighterPlate id={f.id} firstName={f.firstName} lastName={f.lastName} country={f.country} division={me.divisionShort} career={me.career} size="lg" champion={me.champion} />
          </div>

          <div className={s.idCol}>
            <div className={s.tags}>
              {me.champion && <Tag tone="solid">Campeón {me.org}</Tag>}
              {rankText && <Tag tone="accent">{rankText} · FC Rankings</Tag>}
              <Tag>{f.status === "active" ? "En activo" : f.status === "inactive" ? "Inactivo" : "Retirado"}</Tag>
              <Source kind="demo" />
            </div>
            <h1 id="fighter-name" className={s.name}>
              <span className={s.first}>{f.firstName}</span>
              <span className={s.last}>{f.lastName}</span>
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

          <dl className={s.facts}>
            <div><dt>Edad</dt><dd>{me.age}</dd></div>
            <div><dt>Altura</dt><dd>{f.heightCm} cm</dd></div>
            <div><dt>Alcance</dt><dd>{f.reachCm} cm</dd></div>
            <div><dt>Guardia</dt><dd>{f.stance === "Orthodox" ? "Ortodoxa" : f.stance === "Southpaw" ? "Zurda" : "Cambiante"}</dd></div>
            <div><dt>Equipo</dt><dd><Unavailable reason="sin datos" /></dd></div>
            <div><dt>Último combate</dt><dd>{me.lastFight ? fmtDate(me.lastFight) : "—"}</dd></div>
            <div><dt>Tiempo en jaula</dt><dd>{Math.round(st.minutes)} min</dd></div>
          </dl>

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

      <SectionNav items={SECTIONS} label="Secciones del expediente" />

      <div className="wrap">
        {/* ───────── 01 LECTURA RÁPIDA ───────── */}
        <section id="lectura" className={s.section} aria-labelledby="h-lectura">
          <SectionHead id="h-lectura" round="01" kicker="FIGHTCORE Scout" title="Qué dicen los datos"
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

        {/* ───────── 02 RATING ───────── */}
        <section id="rating" className={s.section} aria-labelledby="h-rating">
          <SectionHead id="h-rating" round="02" kicker={`FIGHTCORE Rating · v${FCR_VERSION}`} title="Cómo se compone su rating"
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

        {/* ───────── 03 RÉCORD ───────── */}
        <section id="record" className={s.section} aria-labelledby="h-record">
          <SectionHead id="h-record" round="03" kicker="FIGHTCORE Records" title="Cómo gana. Cómo pierde." />
          <Tabs
            label="Tipo de récord"
            tabs={[
              {
                id: "career", label: "Carrera", content: (
                  <div className={s.recGrid}>
                    <div className={s.recBig}>
                      <RecordValue r={p.records.career} size="lg" />
                      <p className={s.recNote}>
                        Incluye {p.records.prior.w}-{p.records.prior.l}-{p.records.prior.d} previo a la cobertura de FIGHTCORE, sin desglose por método.
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

        {/* ───────── 04 ESTILO ───────── */}
        <section id="estilo" className={s.section} aria-labelledby="h-estilo">
          <SectionHead id="h-estilo" round="04" kicker="Análisis de estilo" title="Cómo pelea"
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
        <section id="rendimiento" className={s.section} aria-labelledby="h-rend">
          <SectionHead id="h-rend" round="05" kicker="FIGHTCORE Stats" title="Rendimiento con contexto"
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

        {/* ───────── 06 FORMA ───────── */}
        <section id="forma" className={s.section} aria-labelledby="h-forma">
          <SectionHead id="h-forma" round="06" kicker="Forma" title="Cómo llega" lede="Últimos cinco combates, del más reciente al más antiguo, con su efecto en el rating." />
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

        {/* ───────── 07 CARRERA ───────── */}
        <section id="carrera" className={s.section} aria-labelledby="h-carrera">
          <SectionHead id="h-carrera" round="07" kicker="FIGHTCORE History" title="Carrera"
            lede={p.titleHistory.length ? `${p.titleHistory.length} ${p.titleHistory.length === 1 ? "reinado" : "reinados"} como campeón: ${p.titleHistory.map((t) => `${t.org} desde ${fmtDate(t.from)}${t.to ? ` hasta ${fmtDate(t.to)}` : " (vigente)"}, ${t.defenses} ${t.defenses === 1 ? "defensa" : "defensas"}`).join("; ")}.` : "Cada combate registrado, con la organización en la que se disputó."} />
          <CareerTimeline
            titleWins={titleWinIds}
            bouts={p.bouts.map((b) => ({
              fightId: b.fightId, date: b.date, outcome: b.outcome, opponent: b.opponent.name, method: b.method,
              round: b.round, org: b.event.org, event: b.event.name, title: b.title, oppStrength: b.oppStrength, ratingAfter: b.ratingAfter,
            }))}
          />
        </section>

        {/* ───────── 08 EVOLUCIÓN ───────── */}
        <section id="evolucion" className={s.section} aria-labelledby="h-evo">
          <SectionHead id="h-evo" round="08" kicker="Evolución" title="Cómo ha cambiado" lede="El rating se recalcula tras cada combate. La banda gris es su margen de incertidumbre." />
          <Evolution
            points={p.evolution}
            bands={p.ratingHistory.map((h) => ({ date: h.date, lo: h.value - h.band, hi: h.value + h.band }))}
            titleDates={p.titleHistory.map((t) => ({ date: t.from, label: `TÍTULO ${t.org}` }))}
          />
        </section>

        {/* ───────── 09 RIVALES ───────── */}
        <section id="rivales" className={s.section} aria-labelledby="h-riv">
          <SectionHead id="h-riv" round="09" kicker="Rivales" title="Contra quién" lede="La fuerza del rival se mide en el momento del combate (0–100), no con lo que hizo después." />
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

        <p className={s.provenance}>
          <Source kind="demo" /> <Source kind="calculated" /> Luchador ficticio. Estadísticas simuladas; rating, atributos y observaciones calculados por FIGHTCORE a {fmtDate(TODAY)}.
        </p>
      </div>
    </article>
  );
}
