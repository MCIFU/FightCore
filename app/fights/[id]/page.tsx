import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TaleOfTape } from "@/components/charts/TaleOfTape";
import { ButtonLink, CountryTag, RecordValue, Source, Tag } from "@/components/ui/primitives";
import { fightDetail } from "@/lib/data/repository";
import { fmtClock, fmtDateLong, METHOD_LABEL } from "@/lib/format";
import s from "./fight.module.css";

// ~1,200 bouts: render on demand and cache, instead of pre-building every page.
export const dynamicParams = true;
export function generateStaticParams() { return []; }

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const d = fightDetail(id);
  if (!d) return { title: "Combate no encontrado" };
  const res = d.fight.status === "completed" && d.fight.method ? ` Resultado: ${METHOD_LABEL[d.fight.method]}${d.fight.round ? `, R${d.fight.round}` : ""}.` : " Combate programado.";
  return {
    title: `${d.red.name} vs ${d.blue.name}`,
    description: `${d.red.name} vs ${d.blue.name} · ${d.event.name}, ${fmtDateLong(d.fight.date)}.${res} Desglose estadístico completo. Datos de demostración.`,
    alternates: { canonical: `/fights/${id}` },
  };
}

const mmss = (sec: number) => fmtClock(sec);

export default async function FightPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const d = fightDetail(id);
  if (!d) notFound();
  const f = d.fight;
  const done = f.status === "completed" && f.red && f.blue;
  const winner = f.winnerId === d.red.id ? d.red : f.winnerId === d.blue.id ? d.blue : null;
  const loser = winner ? (winner.id === d.red.id ? d.blue : d.red) : null;
  const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)}%` : "—");

  const corner = (side: "red" | "blue") => {
    const x = side === "red" ? d.red : d.blue;
    const r = side === "red" ? d.redRating : d.blueRating;
    const won = f.winnerId === x.id;
    return (
      <div className={`${s.corner} ${side === "red" ? s.red : s.blue} ${done && !won && winner ? s.lost : ""}`}>
        <span className={s.cornerTag}>{side === "red" ? "Esquina roja · A" : "Esquina azul · B"}</span>
        <Link href={`/fighters/${x.slug}`} className={s.name}>
          <span className={s.first}>{x.firstName}</span>
          <span className={s.last}>{x.lastName}</span>
        </Link>
        <span className={s.meta}><CountryTag code={x.country} name={x.countryName} /> <RecordValue r={x.record} size="sm" /></span>
        <span className={s.rating}>
          <span className="label">FCR {done ? "antes → después" : "actual"}</span>
          <span className={s.ratingNums}>
            {done ? (r.before === null ? <><span className={s.debut}>Debut en cobertura</span> <strong>{r.after?.toFixed(1) ?? "—"}</strong></> : <>{r.before.toFixed(1)} <span aria-hidden>→</span><span className="visually-hidden"> a </span> <strong>{r.after?.toFixed(1) ?? "—"}</strong></>) : <strong>{x.rating.toFixed(1)}</strong>}
          </span>
          <span className={s.strength}>Fuerza al llegar: {side === "red" ? d.redStrength : d.blueStrength}/100</span>
        </span>
        {won && <span className={s.winTag}>Ganador</span>}
      </div>
    );
  };

  return (
    <article className="wrap" style={{ paddingTop: "var(--s-6)", paddingBottom: "var(--s-8)" }} aria-labelledby="fight-title">
      <nav aria-label="Ruta" className={s.crumbs}>
        <Link href="/events">Eventos</Link> / <Link href={`/events/${d.event.slug}`}>{d.event.name}</Link> / <span>Combate {f.order}</span>
      </nav>
      <h1 id="fight-title" className="visually-hidden">{d.red.name} contra {d.blue.name}</h1>
      <p className={s.context}>
        <span>{d.eventOrg}</span><span>{d.division.name}</span><span>{fmtDateLong(f.date)}</span><span>{d.event.city}</span>
        <span>{f.scheduledRounds} × 5 min</span>
        {f.titleFight && <Tag tone="solid">Combate por el título</Tag>}
        <Source kind="demo" />
      </p>

      <header className={s.versus}>
        {corner("red")}
        <div className={s.mid} aria-hidden>VS</div>
        {corner("blue")}
      </header>

      {done ? (
        <div className={s.result} role="status">
          <span className="label">Resultado</span>
          <p className={s.resultMain}>
            {winner ? <><strong>{winner.name}</strong> derrota a {loser!.name}</> : f.method === "NC" ? "Sin resultado" : "Empate"}
          </p>
          <dl className={s.resultFacts}>
            <div><dt>Método</dt><dd>{METHOD_LABEL[f.method!]}{f.submission ? ` · ${f.submission}` : ""}</dd></div>
            <div><dt>Round</dt><dd>{f.round} de {f.scheduledRounds}</dd></div>
            <div><dt>Tiempo</dt><dd>{mmss(f.time!)}</dd></div>
            {f.scorecards && <div><dt>Tarjetas (A–B)</dt><dd>{f.scorecards.join(" · ")}</dd></div>}
          </dl>
        </div>
      ) : (
        <div className={s.result}>
          <span className="label">Programado</span>
          <p className={s.resultMain}>Análisis previo</p>
          <p className={s.previewNote}>No es una predicción. Comparamos lo que cada uno ha demostrado hasta hoy.</p>
        </div>
      )}

      {done ? (
        <>
          <section className={s.block} aria-labelledby="bd">
            <h2 id="bd" className={s.h2}>Fight breakdown</h2>
            <div className={s.tapeWrap}>
              <TaleOfTape
                nameA={d.red.name}
                nameB={d.blue.name}
                rows={[
                  { label: "Golpes sig.", a: f.red!.sigLanded, b: f.blue!.sigLanded, fa: `${f.red!.sigLanded}/${f.red!.sigAttempted}`, fb: `${f.blue!.sigLanded}/${f.blue!.sigAttempted}` },
                  { label: "Precisión sig.", a: f.red!.sigLanded / Math.max(1, f.red!.sigAttempted), b: f.blue!.sigLanded / Math.max(1, f.blue!.sigAttempted), fa: pct(f.red!.sigLanded, f.red!.sigAttempted), fb: pct(f.blue!.sigLanded, f.blue!.sigAttempted), max: 1 },
                  { label: "Golpes totales", a: f.red!.totalLanded, b: f.blue!.totalLanded, fa: `${f.red!.totalLanded}/${f.red!.totalAttempted}`, fb: `${f.blue!.totalLanded}/${f.blue!.totalAttempted}` },
                  { label: "Cabeza", a: f.red!.head, b: f.blue!.head },
                  { label: "Cuerpo", a: f.red!.body, b: f.blue!.body },
                  { label: "Pierna", a: f.red!.leg, b: f.blue!.leg },
                  { label: "Distancia", a: f.red!.distance, b: f.blue!.distance },
                  { label: "Clinch", a: f.red!.clinch, b: f.blue!.clinch },
                  { label: "Suelo", a: f.red!.ground, b: f.blue!.ground },
                  { label: "Derribos", a: f.red!.tdLanded, b: f.blue!.tdLanded, fa: `${f.red!.tdLanded}/${f.red!.tdAttempted}`, fb: `${f.blue!.tdLanded}/${f.blue!.tdAttempted}` },
                  { label: "Int. sumisión", a: f.red!.subAttempts, b: f.blue!.subAttempts },
                  { label: "Control", a: f.red!.ctrlSec, b: f.blue!.ctrlSec, fa: mmss(f.red!.ctrlSec), fb: mmss(f.blue!.ctrlSec) },
                  { label: "Knockdowns", a: f.red!.kd, b: f.blue!.kd },
                ]}
              />
            </div>
          </section>

          <section className={s.block} aria-labelledby="rbr">
            <h2 id="rbr" className={s.h2}>Round a round</h2>
            <div className={s.rounds}>
              {f.rounds.map((r) => {
                const max = Math.max(...f.rounds.map((x) => Math.max(x.red.sigLanded, x.blue.sigLanded)), 1);
                const partial = r.round === f.round && (f.time ?? 300) < 300;
                return (
                  <div key={r.round} className={s.round}>
                    <p className={s.roundHead}><strong>R{r.round}</strong>{partial && <span> · hasta {mmss(f.time!)}</span>}</p>
                    <div className={s.roundBars} role="img" aria-label={`Round ${r.round}: ${d.red.lastName} ${r.red.sigLanded} golpes significativos, ${d.blue.lastName} ${r.blue.sigLanded}`}>
                      <span className={s.rbA} style={{ height: `${(r.red.sigLanded / max) * 100}%` }}><em>{r.red.sigLanded}</em></span>
                      <span className={s.rbB} style={{ height: `${(r.blue.sigLanded / max) * 100}%` }}><em>{r.blue.sigLanded}</em></span>
                    </div>
                    <dl className={s.roundFacts}>
                      <div><dt>Derribos</dt><dd>{r.red.tdLanded}–{r.blue.tdLanded}</dd></div>
                      <div><dt>Control</dt><dd>{mmss(r.red.ctrlSec)}–{mmss(r.blue.ctrlSec)}</dd></div>
                      <div><dt>KD</dt><dd>{r.red.kd}–{r.blue.kd}</dd></div>
                    </dl>
                  </div>
                );
              })}
            </div>
            <p className={s.legend}><i className={s.kA} /> {d.red.lastName} <i className={s.kB} /> {d.blue.lastName} · golpes significativos conectados por round</p>
          </section>
        </>
      ) : (
        d.redAttr && d.blueAttr && (
          <section className={s.block} aria-labelledby="pv">
            <h2 id="pv" className={s.h2}>Tale of the tape</h2>
            <div className={s.tapeWrap}>
              <TaleOfTape
                nameA={d.red.name} nameB={d.blue.name}
                rows={[
                  { label: "FCR", a: d.red.rating, b: d.blue.rating, fa: d.red.rating.toFixed(1), fb: d.blue.rating.toFixed(1), max: 100 },
                  { label: "Golpeo", a: d.redAttr.striking, b: d.blueAttr.striking, max: 100 },
                  { label: "Lucha", a: d.redAttr.wrestling, b: d.blueAttr.wrestling, max: 100 },
                  { label: "Grappling", a: d.redAttr.grappling, b: d.blueAttr.grappling, max: 100 },
                  { label: "Defensa", a: d.redAttr.defense, b: d.blueAttr.defense, max: 100 },
                  { label: "Finalización", a: d.redAttr.finishing, b: d.blueAttr.finishing, max: 100 },
                  { label: "Durabilidad", a: d.redAttr.durability, b: d.blueAttr.durability, max: 100 },
                  { label: "Golpes sig./min", a: d.redStats.slpm, b: d.blueStats.slpm, fa: d.redStats.slpm.toFixed(2).replace(".", ","), fb: d.blueStats.slpm.toFixed(2).replace(".", ",") },
                  { label: "Derribos/15", a: d.redStats.tdAvg, b: d.blueStats.tdAvg, fa: d.redStats.tdAvg.toFixed(2).replace(".", ","), fb: d.blueStats.tdAvg.toFixed(2).replace(".", ",") },
                ]}
              />
            </div>
            <p className={s.previewNote}>
              {d.commonOpponents.length ? `Rivales comunes: ${d.commonOpponents.join(", ")}.` : "Sin rivales comunes."}
            </p>
            <ButtonLink href={`/compare?f=${d.red.slug},${d.blue.slug}`}>Comparación completa</ButtonLink>
          </section>
        )
      )}
    </article>
  );
}
