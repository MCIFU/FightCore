import Link from "next/link";
import { FighterAvatar } from "@/components/fighter/FighterAvatar";
import { FighterPlate } from "@/components/fighter/FighterPlate";
import { Portrait } from "@/components/fighter/Portrait";
import { RankingList } from "@/components/rankings/RankingList";
import { SearchLauncher } from "@/components/search/SearchLauncher";
import { BeltIcon } from "@/components/ui/ChampionBadge";
import { DaysTo } from "@/components/ui/DaysTo";
import { ButtonLink, FormStrip, RatingValue, RecordValue, SectionHead, Source } from "@/components/ui/primitives";
import { Tabs } from "@/components/ui/Tabs";
import { currentChampions, divisionRanking, fighterProfile, headlineFight, history, IS_DEMO, poundForPound, rankedDivisions, recentResults, records, spotlight, SRC, TODAY, trending, universeCounts, upcomingEvents } from "@/lib/data/repository";
import { fmtClock, fmtDate, fmtDayMonth, fmtRating, fmtShort, fmtWeekday, METHOD_SHORT } from "@/lib/format";
import s from "./home.module.css";

/** Regular octagon path centred on (100, 100). */
const oct = (r: number) => {
  const k = r * 0.4142;
  return `M${100 - k},${100 - r}H${100 + k}L${100 + r},${100 - k}V${100 + k}L${100 + k},${100 + r}H${100 - k}L${100 - r},${100 + k}V${100 - k}Z`;
};

export default function Home() {
  const hf = headlineFight();
  const counts = universeCounts();
  const upcoming = upcomingEvents(6);
  const results = recentResults(8);
  const p4p = poundForPound("M", 10);
  const p4pW = poundForPound("F", 10);
  const spot = spotlight();
  const recs = records().slice(0, 4);
  const trend = trending(6);
  const hist = history();
  const champs = currentChampions();
  const ufc = champs.filter((c) => c.orgId === "ufc").sort((a, b) => b.from.localeCompare(a.from));
  const others = ["one", "pfl"].map((o) => ({ org: champs.find((c) => c.orgId === o)?.org ?? o.toUpperCase(), list: champs.filter((c) => c.orgId === o && !c.interim) }));

  const fa = hf ? fighterProfile(hf.red.slug) : null;
  const fb = hf ? fighterProfile(hf.blue.slug) : null;

  // Tale of the tape: the same rows the fight page uses, read left (red) to right (blue).
  type Row = { label: string; a: string; b: string; va?: number; vb?: number };
  const tape: Row[] = hf && fa && fb ? [
    { label: "FCR", a: fmtRating(hf.red.rating), b: fmtRating(hf.blue.rating), va: hf.red.rating, vb: hf.blue.rating },
    ...(fa.attributes && fb.attributes ? [
      { label: "Golpeo", a: `${Math.round(fa.attributes.striking)}`, b: `${Math.round(fb.attributes.striking)}`, va: fa.attributes.striking, vb: fb.attributes.striking },
      { label: "Lucha", a: `${Math.round(fa.attributes.wrestling)}`, b: `${Math.round(fb.attributes.wrestling)}`, va: fa.attributes.wrestling, vb: fb.attributes.wrestling },
      { label: "Grappling", a: `${Math.round(fa.attributes.grappling)}`, b: `${Math.round(fb.attributes.grappling)}`, va: fa.attributes.grappling, vb: fb.attributes.grappling },
      { label: "Defensa", a: `${Math.round(fa.attributes.defense)}`, b: `${Math.round(fb.attributes.defense)}`, va: fa.attributes.defense, vb: fb.attributes.defense },
    ] : []),
    { label: "Récord", a: `${hf.red.record.w}-${hf.red.record.l}-${hf.red.record.d}`, b: `${hf.blue.record.w}-${hf.blue.record.l}-${hf.blue.record.d}` },
    ...(hf.red.rank || hf.blue.rank ? [{ label: "Ranking", a: hf.red.rank ? `nº ${hf.red.rank}` : "—", b: hf.blue.rank ? `nº ${hf.blue.rank}` : "—" }] : []),
    ...(fa.fighter.reachCm || fb.fighter.reachCm ? [{ label: "Alcance", a: fa.fighter.reachCm ? `${fa.fighter.reachCm} cm` : "—", b: fb.fighter.reachCm ? `${fb.fighter.reachCm} cm` : "—" }] : []),
    { label: "Edad", a: hf.red.age ? `${hf.red.age}` : "—", b: hf.blue.age ? `${hf.blue.age}` : "—" },
  ] : [];
  // Rails: rating on a 50–100 scale, attributes are percentiles (0–100).
  const rail = (r: Row, v: number) => (r.label === "FCR" ? ((v - 50) / 50) * 100 : v);

  return (
    <>
      <h1 className="visually-hidden">FIGHTCORE: datos, rankings y scouting del MMA</h1>

      {/* ───────────── HERO · headline bout ───────────── */}
      {hf && (
        <section className={`${s.hero} grid-bg`} aria-labelledby="hero-title">
          <div className={`wrap ${s.heroMeta}`}>
            <div>
              <p className={s.heroKicker}>Próximo combate estelar · {hf.eventOrg}</p>
              <p className={s.heroEvent}><Link href={`/events/${hf.event.slug}`}>{hf.event.name.replace(/:.*/, "")}</Link> · {hf.event.city}</p>
              <p className={s.heroWhere}>{fmtWeekday(hf.event.date)} {fmtShort(hf.event.date)}{hf.event.venue ? ` · ${hf.event.venue}` : ""}</p>
            </div>
            <dl className={`cut ${s.count}`}>
              <div><dt>días</dt><dd><DaysTo date={hf.event.date} from={TODAY} /></dd></div>
              <div><dt>{fmtShort(hf.event.date)}</dt><dd>{fmtWeekday(hf.event.date).slice(0, 3)}</dd></div>
            </dl>
          </div>

          <div className={`wrap ${s.stage}`}>
            <div className={`${s.fighter} ${s.red}`}>
              <Portrait src={hf.red.photo.src} name={hf.red.name} alt="" sizes="(max-width: 760px) 50vw, 460px" className={s.face} priority />
            </div>
            <div className={s.ring} aria-hidden>
              <svg viewBox="0 0 200 200"><path className={s.ring1} d={oct(98)} /><path className={s.ring2} d={oct(86)} /><path className={s.ring1} d={oct(70)} /></svg>
              <span className={s.vs}>VS</span>
              <span className={s.ringMeta}>{hf.division.name}<br />{hf.fight.scheduledRounds} asaltos{hf.fight.titleFight ? " · título" : ""}</span>
            </div>
            <div className={`${s.fighter} ${s.blue}`}>
              <Portrait src={hf.blue.photo.src} name={hf.blue.name} alt="" sizes="(max-width: 760px) 50vw, 460px" className={s.face} priority />
            </div>
          </div>

          <div className="wrap">
            <h2 id="hero-title" className={s.names}>
              <Link href={`/fighters/${hf.red.slug}`} className={s.nameA}>
                <span className={s.first}>{hf.red.firstName} <span className={s.cc}>{hf.red.country}</span></span>
                <span className={s.last}>{hf.red.lastName}</span>
              </Link>
              <span className="visually-hidden"> contra </span>
              <Link href={`/fighters/${hf.blue.slug}`} className={s.nameB}>
                <span className={s.first}><span className={s.cc}>{hf.blue.country}</span> {hf.blue.firstName}</span>
                <span className={s.last}>{hf.blue.lastName}</span>
              </Link>
            </h2>

            <table className={s.tape}>
              <caption className="visually-hidden">Comparación: {hf.red.name} (izquierda) y {hf.blue.name} (derecha). Golpeo, lucha, grappling y defensa en percentiles.</caption>
              <tbody>
                {tape.map((r) => (
                  <tr key={r.label}>
                    <td className={s.ta}>
                      <span className={s.cell}>
                        <span className={s.rail} aria-hidden>{r.va !== undefined && <i style={{ width: `${Math.max(2, rail(r, r.va))}%` }} />}</span>
                        <span className={`${s.val} ${r.va !== undefined && r.vb !== undefined && r.va > r.vb ? s.lead : ""}`}>{r.a}</span>
                      </span>
                    </td>
                    <th scope="row">{r.label}</th>
                    <td className={s.tb}>
                      <span className={s.cell}>
                        <span className={`${s.val} ${r.va !== undefined && r.vb !== undefined && r.vb > r.va ? s.lead : ""}`}>{r.b}</span>
                        <span className={s.rail} aria-hidden>{r.vb !== undefined && <i style={{ width: `${Math.max(2, rail(r, r.vb))}%` }} />}</span>
                      </span>
                    </td>
                  </tr>
                ))}
                <tr>
                  <td className={s.ta}><span className={s.cell}><span className={s.rail} aria-hidden /><span className={s.val}><FormStrip form={hf.red.form} /></span></span></td>
                  <th scope="row">Últimos 5</th>
                  <td className={s.tb}><span className={s.cell}><span className={s.val}><FormStrip form={hf.blue.form} /></span><span className={s.rail} aria-hidden /></span></td>
                </tr>
              </tbody>
            </table>
            <div className={s.cta}>
              <ButtonLink href={`/fights/${hf.fight.id}`}>Análisis previo <span aria-hidden>→</span></ButtonLink>
              <ButtonLink href={`/compare?f=${hf.red.slug},${hf.blue.slug}`} variant="ghost">Comparar a fondo</ButtonLink>
              <ButtonLink href={`/events/${hf.event.slug}`} variant="ghost">Cartelera completa</ButtonLink>
            </div>
            <p className={s.heroNote}>Golpeo, lucha, grappling y defensa: percentiles frente a todos los luchadores con 3 o más combates. No es una predicción.</p>
          </div>
        </section>
      )}

      {/* ───────────── TICKER · latest results ───────────── */}
      <section className={s.ticker} aria-label="Últimos resultados">
        <div className={s.track}>
          {[0, 1].map((copy) => (
            <ul key={copy} className={s.tickList} aria-hidden={copy === 1 ? true : undefined}>
              {results.map((r) => {
                const winRed = r.fight.winnerId === r.red.id;
                const w = r.fight.winnerId ? (winRed ? r.red : r.blue) : null;
                const l = r.fight.winnerId ? (winRed ? r.blue : r.red) : null;
                return (
                  <li key={r.fight.id}>
                    <Link href={`/fights/${r.fight.id}`} tabIndex={copy === 1 ? -1 : undefined}>
                      <span className={s.tkMeta}>{fmtShort(r.fight.date)} · {r.eventOrg}</span>
                      {w && l ? <><b>{w.name}</b> <span className={s.tkDef}>def.</span> {l.name}</> : <>{r.red.name} <span className={s.tkDef}>—</span> {r.blue.name}</>}
                      <span className={s.tkMethod}>{METHOD_SHORT[r.fight.method!]} · R{r.fight.round} {fmtClock(r.fight.time)}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ))}
        </div>
      </section>

      {/* ───────────── 00 · DATABASE ───────────── */}
      <section className={`wrap ${s.section} ${s.base}`} aria-labelledby="base-title">
        <div className={s.baseIntro}>
          <p className={s.idx}>00 · FIGHTCORE</p>
          <h2 id="base-title" className={s.baseTitle}>The core<br />of MMA</h2>
          <p className={s.baseLede}>Estadísticas, historia y scouting en un mismo sitio, con un rating propio que enseña sus cuentas: cada punto tiene origen, peso y margen de error.</p>
          <SearchLauncher demo={IS_DEMO} />
        </div>
        <div className={s.readoutBox}>
        <dl className={s.readouts}>
          <div><dt>Luchadores</dt><dd>{counts.fighters.toLocaleString("es-ES")}</dd></div>
          <div><dt>Combates</dt><dd>{counts.fights.toLocaleString("es-ES")}</dd></div>
          <div><dt>Asaltos con estadísticas</dt><dd>{counts.rounds.toLocaleString("es-ES")}</dd></div>
          <div><dt>{IS_DEMO ? "Organizaciones" : "Eventos"}</dt><dd>{(IS_DEMO ? counts.organizations : counts.events).toLocaleString("es-ES")}</dd></div>
        </dl>
          <p className={s.readoutSrc}><Source kind={SRC} /> {IS_DEMO ? "Universo simulado: luchadores, combates y eventos ficticios." : `UFC completa desde 1993 y 13 organizaciones más, al ${fmtDate(TODAY)}.`}</p>
        </div>
      </section>

      {/* ───────────── 01 · RANKINGS ───────────── */}
      <section className={`wrap ${s.section}`} aria-labelledby="rank-title" data-reveal>
        <SectionHead
          id="rank-title" round="01" kicker="FIGHTCORE Rating" title="Libra por libra"
          lede="Una sola escala para todas las divisiones y organizaciones. Cada aguja marca el rating; la franja, su margen de error. Separado siempre de los rankings oficiales."
          action={{ href: "/rankings", label: "Rankings por división" }}
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

      {/* ───────────── 02 · BELTS ───────────── */}
      <section className={`wrap ${s.section}`} aria-labelledby="belt-title" data-reveal>
        <SectionHead id="belt-title" round="02" kicker="Cinturones" title="Campeones UFC" lede="El campeón vigente de cada división, cuándo ganó el cinturón y cuántas veces lo ha defendido." action={{ href: "/champions", label: "Todas las organizaciones" }} />
        <ul className={s.belts}>
          {ufc.map((c, i) => (
            <li key={`${c.divisionId}-${c.fighter.id}`} className={i === 0 ? s.beltLead : undefined}>
              <Link href={`/fighters/${c.fighter.slug}`} className={`cut ${s.belt}`}>
                {i === 0 && <span className={s.beltNew}>Último cambio · {fmtShort(c.from)}</span>}
                <Portrait src={c.fighter.photo.src} name={c.fighter.name} alt="" sizes={i === 0 ? "(max-width: 760px) 60vw, 420px" : "(max-width: 760px) 60vw, 220px"} className={s.beltFace} />
                <span className={s.beltDiv}><BeltIcon size={8} /> {c.division.name}{c.interim ? " · interino" : ""}</span>
                <span className={s.beltName}>{c.fighter.name}</span>
                <span className={s.beltMeta}><span>Desde {fmtShort(c.from)} {c.from.slice(2, 4)}</span><span>{c.defenses} def.</span></span>
              </Link>
            </li>
          ))}
        </ul>
        <div className={s.otherBelts}>
          {others.filter((o) => o.list.length).map((o) => (
            <div key={o.org}>
              <p className={s.otherOrg}>{o.org}</p>
              <ul>
                {o.list.map((c) => (
                  <li key={`${c.divisionId}-${c.fighter.id}`}>
                    <Link href={`/fighters/${c.fighter.slug}`}>
                      <span className={s.otherDiv}>{c.division.short}</span>
                      <span className={s.otherName}>{c.fighter.name}</span>
                      <span className={s.otherDef}>{c.defenses} def.</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ───────────── 03 · CALENDAR ───────────── */}
      <section className={`wrap ${s.section}`} aria-labelledby="up-title" data-reveal>
        <SectionHead id="up-title" round="03" kicker="Calendario" title="Próximos eventos" action={{ href: "/events", label: "Calendario completo" }} />
        <ol className={s.timeline} aria-label="Próximos eventos, desplazable en horizontal">
          {upcoming.map((e, i) => {
            const d = fmtDayMonth(e.event.date);
            const main = e.fights[0];
            return (
              <li key={e.event.id} className={`${s.tlItem} ${i === 0 ? s.tlNext : ""}`}>
                <Link href={`/events/${e.event.slug}`} className={s.tlCard}>
                  <span className={s.tlDate}><span className={s.tlDay}>{d.day}</span><span className={s.tlMonth}>{d.month} · {fmtWeekday(e.event.date).slice(0, 3)}</span></span>
                  <span className={s.tlOrg}>{e.org.short} · <DaysTo date={e.event.date} from={TODAY} format="words" /></span>
                  <span className={s.tlName}>{e.event.name.replace(/:.*/, "")}</span>
                  {main && <span className={s.tlMain}>{main.red.lastName}<br /><em>vs</em> {main.blue.lastName}{main.fight.titleFight && <span className={s.tlBelt} title="Por el título"><BeltIcon size={7} /></span>}</span>}
                  <span className={s.tlCity}>{e.event.city} · {e.fights.length} combate{e.fights.length === 1 ? "" : "s"}</span>
                </Link>
              </li>
            );
          })}
        </ol>
      </section>

      {/* ───────────── 04 · RESULTS + TRENDING ───────────── */}
      <section className={`wrap ${s.section} ${s.split}`} aria-labelledby="res-title" data-reveal>
        <div>
          <SectionHead id="res-title" round="04" kicker="Resultados" title="Última semana" action={{ href: "/events", label: "Todos los eventos" }} />
          <ol className={s.results}>
            {results.map((r) => {
              const winRed = r.fight.winnerId === r.red.id;
              const w = r.fight.winnerId ? (winRed ? r.red : r.blue) : null;
              const l = r.fight.winnerId ? (winRed ? r.blue : r.red) : null;
              return (
                <li key={r.fight.id}>
                  <Link href={`/fights/${r.fight.id}`} className={s.res}>
                    <span className={s.resMeta}>{fmtShort(r.fight.date)} · {r.eventOrg} · {r.event.name.replace(/:.*/, "")}{r.fight.titleFight ? " · título" : ""}</span>
                    <span className={s.resWho}>
                      <FighterAvatar src={(w ?? r.red).photo.src} name={(w ?? r.red).name} size={40} champion={r.fight.titleFight && !!w} />
                      <span>{w && l ? <><b>{w.name}</b> <span className={s.def}>def.</span> {l.name}</> : <>{r.red.name} <span className={s.def}>—</span> {r.blue.name}</>}</span>
                    </span>
                    <span className={s.resMethod}><b>{METHOD_SHORT[r.fight.method!]}</b>{r.fight.submission && <span className={s.subType}>{r.fight.submission}</span>}<span>R{r.fight.round} · {fmtClock(r.fight.time)}</span></span>
                  </Link>
                </li>
              );
            })}
          </ol>
        </div>
        <aside aria-labelledby="trend-title" className={`cut ${s.trending}`}>
          <div className={s.trendHead}>
            <h3 id="trend-title" className={s.miniTitle}>Tendencia</h3>
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

      {/* ───────────── 05 · SCOUT ───────────── */}
      <section className={`wrap ${s.section}`} aria-labelledby="ftr-title" data-reveal>
        <SectionHead id="ftr-title" round="05" kicker="FIGHTCORE Scout" title="Tres expedientes" action={{ href: "/fighters", label: "Base de datos" }} />
        <div className={s.spot}>
          {spot.map((f, i) => {
            const p = fighterProfile(f.slug)!;
            const tagline = ["Campeón vigente", "Prospecto", "Veterano"][i];
            const insight = p.insights[0];
            return (
              <article key={f.id} className={`cut ${s.spotCard} ${i === 0 ? s.spotLead : ""}`}>
                <Link href={`/fighters/${f.slug}`} className={s.spotLink} aria-label={`Abrir expediente de ${f.name}`}>
                  <FighterPlate id={f.id} firstName={f.firstName} lastName={f.lastName} country={f.country} division={f.divisionShort} career={f.career} photo={f.photo} title={f.title} size={i === 0 ? "lg" : "md"} linkCredit={false} />
                </Link>
                <div className={s.spotBody}>
                  <span className={s.spotTag}>{String(i + 1).padStart(2, "0")} · {tagline}</span>
                  <h3 className={s.spotName}><Link href={`/fighters/${f.slug}`}>{f.name}</Link></h3>
                  {f.nickname && <p className={s.nick}>“{f.nickname}”</p>}
                  <div className={s.spotStats}>
                    <RatingValue value={f.rating} band={f.band} size={i === 0 ? "lg" : "md"} />
                    <div className={s.spotMeta}>
                      <RecordValue r={f.record} size="sm" />
                      <FormStrip form={f.form} />
                      <span className="label">{f.division} · {f.org}{f.age ? ` · ${f.age} años` : ""}</span>
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

      {/* ───────────── 06 · RECORDS ───────────── */}
      <section className={`wrap ${s.section}`} aria-labelledby="rec-title" data-reveal>
        <SectionHead id="rec-title" round="06" kicker="FIGHTCORE Records" title="Nadie los ha superado" action={{ href: "/records", label: "Todos los récords" }} />
        <ul className={s.records}>
          {recs.map((r) => (
            <li key={r.id}>
              <Link href={r.href} className={`cut ${s.record}`}>
                <span className={s.recCat}>{r.category}</span>
                <span className={s.recordValue}>{r.value}<span className={s.recordUnit}>{r.unit}</span></span>
                <span className={s.recordLabel}>{r.label}</span>
                <span className={s.recordHolder}>{r.holder.name}</span>
                <span className={s.recordCtx}>{r.context}</span>
              </Link>
            </li>
          ))}
        </ul>
        <p className={s.srcLine}><Source kind={SRC} /> <Source kind="calculated" /> {IS_DEMO ? "Récords del dataset de demostración, calculados por FIGHTCORE." : "Récords calculados por FIGHTCORE a partir de todos los combates registrados, de todas las organizaciones."}</p>
      </section>

      {/* ───────────── 07 · HISTORY ───────────── */}
      <section className={`paper ${s.history}`} aria-labelledby="hist-title" data-reveal>
        <div className="wrap">
          <SectionHead
            id="hist-title" round="07" kicker="FIGHTCORE History" title="Treinta años en un archivo"
            lede="El MMA moderno nace de un experimento: ¿qué estilo gana? El archivo recorre cómo el deporte fue respondiendo."
            action={{ href: "/history", label: "Abrir el archivo" }}
          />
          <ol className={s.histLine} tabIndex={0} aria-label="Línea temporal de hitos, desplazable en horizontal">
            {hist.map((h) => (
              <li key={`${h.year}-${h.title}`} className={s.histItem}>
                <span className={s.histYear}>{h.year}</span>
                <span className={s.histTitle}>{h.title}</span>
                <span className={s.histBody}>{h.body}</span>
              </li>
            ))}
          </ol>
          <p className={s.srcLine}><Source kind="editorial" /> Hitos redactados por FIGHTCORE a partir de hechos ampliamente documentados.</p>
        </div>
      </section>

      {/* ───────────── 08 · INDEX ───────────── */}
      <section className={`wrap ${s.section}`} aria-labelledby="exp-title" data-reveal>
        <SectionHead id="exp-title" round="08" kicker="FIGHTCORE Database" title="Índice" />
        <ul className={s.index}>
          {[
            { href: "/fighters", label: "Luchadores", n: counts.fighters, note: `${counts.active} en activo · ${counts.countries} países` },
            { href: "/events", label: "Eventos", n: counts.events, note: "Pasados y programados" },
            { href: "/rankings", label: "Divisiones", n: counts.divisions, note: `${counts.divisionsM} masculinas · ${counts.divisionsF} femeninas` },
            { href: "/organizations", label: "Organizaciones", n: counts.organizations, note: "Actuales e históricas" },
            { href: "/champions", label: "Campeones", n: champs.length, note: "Cinturones vigentes por división" },
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
      </section>
    </>
  );
}
