import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { TaleOfTape } from "@/components/charts/TaleOfTape";
import { FighterPicker } from "@/components/fighter/FighterPicker";
import { ChampionBadge } from "@/components/ui/ChampionBadge";
import { ButtonLink, OutcomeMark, RatingValue, RecordValue, SectionHead, Source } from "@/components/ui/primitives";
import { featuredFight, IS_DEMO, listFighters, matchupData } from "@/lib/data/repository";
import s from "./matchup.module.css";
import { Portrait } from "@/components/fighter/Portrait";

export const metadata: Metadata = {
  title: "Style Matchup",
  description: "Análisis de estilos entre dos luchadores: fortalezas, debilidades, interacciones estadísticas y rendimiento histórico ante estilos similares. No es una predicción.",
  alternates: { canonical: "/matchup" },
};

const dec = (x: number, d = 1) => x.toFixed(d).replace(".", ",");

export default async function MatchupPage({ searchParams }: { searchParams: Promise<{ a?: string; b?: string }> }) {
  const sp = await searchParams;
  const ff = featuredFight();
  const a = sp.a ?? ff?.red.slug ?? "";
  const b = sp.b ?? (sp.a ? undefined : ff?.blue.slug);
  const roster = listFighters().filter((x) => x.statBouts >= 3).sort((p, q) => q.rating - p.rating)
    .map((x) => ({ slug: x.slug, name: x.name, division: x.divisionShort, org: x.org, rating: x.rating, photo: x.photo.src }));
  const m = b ? matchupData(a, b) : null;

  return (
    <div className="wrap" style={{ paddingTop: "var(--s-7)", paddingBottom: "var(--s-8)" }}>
      <SectionHead as="h1" kicker="FIGHTCORE Scout · Matchup" title="Style Matchup"
        lede="Cómo encajan dos estilos: qué arma de uno choca con qué defensa del otro. Es una herramienta de análisis, no un pronóstico: no calcula ganador ni probabilidades." />
      <div className={s.pickers}>
        <Suspense>
          <FighterPicker roster={roster} param="a" label="Esquina A" current={a} exclude={b ? [b] : []} />
          <span className={s.vs} aria-hidden>VS</span>
          <FighterPicker roster={roster} param="b" label="Esquina B" current={b} exclude={[a]} />
        </Suspense>
      </div>

      {!m ? (
        <p className={s.empty}>Elige dos luchadores distintos para ver el análisis.</p>
      ) : m.insufficient ? (
        <p className={s.empty}>Uno de los dos no tiene al menos 3 combates registrados: no hay datos suficientes para un análisis de estilos.</p>
      ) : (
        <>
          <section className={s.corners} aria-label="Luchadores">
            {([["a", m.a, m.styleA], ["b", m.b, m.styleB]] as const).map(([k, f, st]) => (
              <article key={k} className={`${s.corner} ${s[k]}`}>
                <Portrait src={f.photo.src} name={f.name} alt="" sizes="160px" className={s.face} />
                <div className={s.cInfo}>
                  <span className="label">Esquina {k.toUpperCase()} · {st.label}</span>
                  <Link href={`/fighters/${f.slug}`} className={s.cName}>{f.name}</Link>
                  <span className={s.cMeta}>{f.title && <ChampionBadge title={f.title} variant="icon" />}<RecordValue r={f.record} size="sm" /><RatingValue value={f.rating} band={f.band} size="sm" /><span>{f.divisionShort} · {f.org}</span></span>
                </div>
              </article>
            ))}
          </section>
          {m.a.divisionId !== m.b.divisionId && <p className={s.warn}>Atención: compiten en divisiones distintas ({m.a.division} y {m.b.division}). Las métricas por minuto no corrigen la diferencia de peso.</p>}

          <section className={s.block} aria-labelledby="sw">
            <h2 id="sw" className={s.h2}>Fortalezas y debilidades</h2>
            <div className={s.sw}>
              {([["A", m.a.lastName, m.strengthsA, m.weaknessesA], ["B", m.b.lastName, m.strengthsB, m.weaknessesB]] as const).map(([k, name, st, wk]) => (
                <div key={k} className={s.swCol}>
                  <p className={s.swName}>{k} · {name}</p>
                  <p className="label">Fortalezas</p>
                  <ul className={s.swList}>{st.map((x) => <li key={x.key}><span>{x.label}</span><strong>{x.v}</strong></li>)}</ul>
                  <p className="label">Debilidades</p>
                  <ul className={s.swList}>{wk.map((x) => <li key={x.key} className={s.weak}><span>{x.label}</span><strong>{x.v}</strong></li>)}</ul>
                </div>
              ))}
            </div>
            <p className={s.note}>Percentiles frente a todos los luchadores con al menos 3 combates. <Source kind="calculated" /></p>
          </section>

          <section className={s.block} aria-labelledby="int">
            <h2 id="int" className={s.h2}>Interacción de estilos</h2>
            <ol className={s.inter}>
              {m.interactions.map((i) => (
                <li key={i.id} className={s.row}>
                  <p className={s.iLabel}>{i.label}</p>
                  <div className={s.iSides}>
                    <span className={`${s.iSide} ${i.edge === "A" ? s.lead : ""}`}><em>A</em>{i.a.value}<small>{i.a.basis}</small></span>
                    <span className={`${s.edge} ${s[`e_${i.edge}`]}`}>{i.edge === "even" ? "Equilibrado" : `Ventaja ${i.edge}`}</span>
                    <span className={`${s.iSide} ${s.right} ${i.edge === "B" ? s.lead : ""}`}><em>B</em>{i.b.value}<small>{i.b.basis}</small></span>
                  </div>
                  <p className={s.iNote}>{i.note}</p>
                </li>
              ))}
            </ol>
          </section>

          <section className={s.block} aria-labelledby="attr">
            <h2 id="attr" className={s.h2}>Atributos enfrentados</h2>
            <div className={s.tape}>
              <TaleOfTape nameA={m.a.name} nameB={m.b.name} rows={[
                ["Golpeo", "striking"], ["Lucha", "wrestling"], ["Grappling", "grappling"], ["Defensa", "defense"], ["Finalización", "finishing"], ["Ritmo", "pace"], ["Durabilidad", "durability"], ["Competición", "competition"],
              ].map(([label, key]) => ({ label, a: m.attrA[key as keyof typeof m.attrA], b: m.attrB[key as keyof typeof m.attrB], max: 100 }))} />
            </div>
          </section>

          <section className={s.block} aria-labelledby="hist">
            <h2 id="hist" className={s.h2}>Rendimiento histórico ante estilos similares</h2>
            <div className={s.hist}>
              {([["A", m.a.lastName, m.styleB.label, m.history.aVsStyleB], ["B", m.b.lastName, m.styleA.label, m.history.bVsStyleA]] as const).map(([k, name, label, h]) => (
                <div key={k} className={s.histCol}>
                  <p className={s.swName}>{k} · {name} contra {label.toLowerCase()}</p>
                  {h ? (
                    <p className={s.histVal}><strong className="num">{h.w}-{h.l}{h.d ? `-${h.d}` : ""}</strong><span>dif. de golpes sig. {h.sigDiff >= 0 ? "+" : "−"}{dec(Math.abs(h.sigDiff))} por combate · n = {h.n}</span></p>
                  ) : <p className={s.note}>Sin combates contra ese estilo.</p>}
                </div>
              ))}
            </div>
          </section>

          <section className={s.block} aria-labelledby="rnd">
            <h2 id="rnd" className={s.h2}>Cómo evolucionan por round</h2>
            <table className={s.rtable}>
              <caption className="visually-hidden">Diferencial y volumen por round</caption>
              <thead><tr><th scope="col">Round</th><th scope="col">A · golpes sig. intentados</th><th scope="col">A · diferencial</th><th scope="col">B · golpes sig. intentados</th><th scope="col">B · diferencial</th></tr></thead>
              <tbody>
                {[1, 2, 3, 4, 5].map((n) => {
                  const ra = m.roundsA.find((x) => x.round === n), rb = m.roundsB.find((x) => x.round === n);
                  if (!ra && !rb) return null;
                  return (
                    <tr key={n}>
                      <th scope="row">R{n}</th>
                      <td>{ra ? dec(ra.att) : "—"}</td><td>{ra ? `${ra.diff >= 0 ? "+" : "−"}${dec(Math.abs(ra.diff))}` : "—"}</td>
                      <td>{rb ? dec(rb.att) : "—"}</td><td>{rb ? `${rb.diff >= 0 ? "+" : "−"}${dec(Math.abs(rb.diff))}` : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>

          <section className={s.block} aria-labelledby="cmn">
            <h2 id="cmn" className={s.h2}>Rivales comunes</h2>
            {m.common.length ? (
              <ul className={s.common}>
                {m.common.map((c) => (
                  <li key={c.opponent.id}>
                    <Link href={`/fighters/${c.opponent.slug}`}>{c.opponent.name}</Link>
                    <span className={s.outs}>A {c.a.map((o, i) => <OutcomeMark key={i} o={o} size="sm" />)}</span>
                    <span className={s.outs}>B {c.b.map((o, i) => <OutcomeMark key={i} o={o} size="sm" />)}</span>
                  </li>
                ))}
              </ul>
            ) : <p className={s.note}>Sin rivales comunes.</p>}
          </section>

          <div className={s.cta}>
            <ButtonLink href={`/compare?f=${m.a.slug},${m.b.slug}`}>Comparación completa</ButtonLink>
            <ButtonLink href={`/scout?f=${m.a.slug}`} variant="ghost">Scout de {m.a.lastName}</ButtonLink>
            <ButtonLink href={`/scout?f=${m.b.slug}`} variant="ghost">Scout de {m.b.lastName}</ButtonLink>
          </div>
          <p className={s.note}>Análisis descriptivo{IS_DEMO ? " con datos de demostración" : " de lo que cada uno ha hecho en UFC"}. No es un pronóstico y no debe usarse para apuestas.</p>
        </>
      )}
    </div>
  );
}
