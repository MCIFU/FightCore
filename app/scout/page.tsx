import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { SegmentBar } from "@/components/charts/Bars";
import { Diverging, MiniBars } from "@/components/charts/Mini";
import { FighterPicker } from "@/components/fighter/FighterPicker";
import { ChampionBadge } from "@/components/ui/ChampionBadge";
import { ButtonLink, RatingValue, RecordValue, SectionHead, Source, Unavailable } from "@/components/ui/primitives";
import { listFighters, poundForPound, scoutReport } from "@/lib/data/repository";
import s from "./scout.module.css";
import { Portrait } from "@/components/fighter/Portrait";

export const metadata: Metadata = {
  title: "Scout",
  description: "Informe de scouting de un luchador: cómo gana, cómo pierde, dónde genera su ventaja, qué rival le complica y cómo cambia entre rounds. Solo conclusiones respaldadas por datos.",
  alternates: { canonical: "/scout" },
};

const dec = (x: number, d = 1) => x.toFixed(d).replace(".", ",");
const pct = (x: number) => `${Math.round(x * 100)}%`;

function Q({ n, q, sample, children }: { n: number; q: string; sample?: string; children: React.ReactNode }) {
  return (
    <section className={s.q} aria-labelledby={`q${n}`}>
      <header className={s.qHead}>
        <span className={s.qn}>{String(n).padStart(2, "0")}</span>
        <h2 id={`q${n}`} className={s.qt}>{q}</h2>
        {sample && <span className={s.qs}>{sample}</span>}
      </header>
      <div className={s.qBody}>{children}</div>
    </section>
  );
}

export default async function ScoutPage({ searchParams }: { searchParams: Promise<{ f?: string }> }) {
  const { f } = await searchParams;
  const slug = f ?? poundForPound("M", 1)[0].fighter.slug;
  const r = scoutReport(slug);
  const roster = listFighters().filter((x) => x.statBouts >= 3).sort((a, b) => b.rating - a.rating)
    .map((x) => ({ slug: x.slug, name: x.name, division: x.divisionShort, org: x.org, rating: x.rating, photo: x.photo.src }));

  return (
    <div className="wrap" style={{ paddingTop: "var(--s-7)", paddingBottom: "var(--s-8)" }}>
      <SectionHead as="h1" kicker="FIGHTCORE Scout" title="Scout"
        lede="Nueve preguntas de scouting respondidas con datos. Si la muestra no alcanza, la respuesta es «no hay datos suficientes», nunca una suposición." />
      <div className={s.pickRow}>
        <Suspense><FighterPicker roster={roster} param="f" label="Luchador a investigar" current={slug} /></Suspense>
        {r && <ButtonLink href={`/matchup?a=${r.summary.slug}`} variant="ghost">Preparar un cruce →</ButtonLink>}
      </div>

      {!r ? (
        <p className={s.empty}>No encontramos a ese luchador.</p>
      ) : r.sample < 3 ? (
        <p className={s.empty}>{r.summary.name} tiene {r.sample} combates registrados. Hacen falta al menos 3 para un informe.</p>
      ) : (
        <>
          <header className={s.subject}>
            <Portrait src={r.summary.photo.src} name={r.summary.name} kind={r.summary.photo.kind} sizes="160px" className={s.face} priority />
            <div className={s.subjectInfo}>
              <p className="label">Informe · {r.summary.division} · {r.summary.org}</p>
              <h2 className={s.name}><Link href={`/fighters/${r.summary.slug}`}>{r.summary.name}</Link></h2>
              <div className={s.subjectMeta}>
                {r.summary.title && <ChampionBadge title={r.summary.title} variant="tag" />}
                <RecordValue r={r.summary.record} size="sm" />
                <RatingValue value={r.summary.rating} band={r.summary.band} size="sm" />
                <span className={s.tagStyle}>Perfil: {r.style === "striker" ? "golpeador" : r.style === "wrestler" ? "luchador" : r.style === "grappler" ? "especialista en suelo" : "completo"}</span>
                <Source kind="calculated" />
              </div>
              <p className={s.sampleNote}>Basado en {r.sample} combates y {Math.round(r.stats.minutes)} minutos registrados.</p>
            </div>
          </header>

          <div className={s.grid}>
            <Q n={1} q="¿Cómo gana?" sample={`n = ${r.stats.record.w} victorias`}>
              <SegmentBar label="Victorias por método" segments={[
                { key: "ko", label: "KO/TKO", value: r.stats.winsBy.ko, tone: "bone" },
                { key: "sub", label: "Sumisión", value: r.stats.winsBy.sub, tone: "bone-2" },
                { key: "dec", label: "Decisión", value: r.stats.winsBy.dec, tone: "ink" },
              ]} />
              <p className={s.caption}>Round de las finalizaciones</p>
              <MiniBars label="Finalizaciones por round" items={[1, 2, 3, 4, 5].map((n) => ({ key: `r${n}`, label: `R${n}`, value: r.winRounds.ko[n - 1] + r.winRounds.sub[n - 1], sub: `${r.winRounds.ko[n - 1]} KO · ${r.winRounds.sub[n - 1]} SUB` }))} />
              {Object.keys(r.submissions).length > 0 && <p className={s.note}>Sumisiones: {Object.entries(r.submissions).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} (${v})`).join(", ")}.</p>}
            </Q>

            <Q n={2} q="¿Cómo pierde?" sample={`n = ${r.stats.record.l} derrotas`}>
              {r.stats.record.l === 0 ? <p className={s.note}>Sin derrotas en los combates registrados.</p> : (
                <>
                  <SegmentBar label="Derrotas por método" segments={[
                    { key: "ko", label: "KO/TKO", value: r.stats.lossesBy.ko, tone: "bone" },
                    { key: "sub", label: "Sumisión", value: r.stats.lossesBy.sub, tone: "bone-2" },
                    { key: "dec", label: "Decisión", value: r.stats.lossesBy.dec, tone: "ink" },
                  ]} />
                  <p className={s.caption}>Round en el que es finalizado</p>
                  <MiniBars label="Derrotas antes del límite por round" tone="ember" items={[1, 2, 3, 4, 5].map((n) => ({ key: `r${n}`, label: `R${n}`, value: r.lossRounds.ko[n - 1] + r.lossRounds.sub[n - 1] }))} />
                </>
              )}
            </Q>

            <Q n={3} q="¿Dónde genera su ventaja?" sample="golpes sig. por minuto">
              <Diverging label="Diferencial de golpeo por posición" leftLabel="Pierde el intercambio" rightLabel="Gana el intercambio"
                format={(v) => dec(v, 2)}
                rows={r.zones.map((z) => ({ key: z.zone, label: z.label, value: z.perMinOwn - z.perMinOpp, sub: `${dec(z.perMinOwn, 2)} vs ${dec(z.perMinOpp, 2)}` }))} />
              <p className={s.note}>Diferencia entre lo que conecta y lo que encaja en cada posición, por minuto de combate.</p>
            </Q>

            <Q n={4} q="¿Qué tipo de rival le complica?" sample="rivales clasificados por su atributo dominante">
              {r.vsStyles.length ? (
                <table className={s.table}>
                  <caption className="visually-hidden">Récord contra cada estilo de rival</caption>
                  <thead><tr><th scope="col">Estilo del rival</th><th scope="col">Récord</th><th scope="col">Dif. golpes sig.</th><th scope="col">n</th></tr></thead>
                  <tbody>
                    {r.vsStyles.map((v) => (
                      <tr key={v.style} className={v.l > v.w ? s.bad : ""}>
                        <th scope="row">{v.label}</th>
                        <td className="num">{v.w}-{v.l}{v.d ? `-${v.d}` : ""}</td>
                        <td className="num">{v.sigDiff >= 0 ? "+" : "−"}{dec(Math.abs(v.sigDiff))}</td>
                        <td className="num">{v.n}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : <p className={s.note}>Sin rivales con suficientes datos para clasificarlos.</p>}
              <p className={s.note}>Resaltado: estilos contra los que tiene récord negativo. Muestras pequeñas: léelo como indicio.</p>
            </Q>

            <Q n={5} q="¿Dónde consigue sus derribos?" sample={`${dec(r.stats.tdAvg, 2)} derribos / 15 min · ${pct(r.stats.tdAcc)} de acierto`}>
              <MiniBars label="Derribos por round" tone="cobalt" format={(v) => dec(v, 2)} items={r.rounds.map((x) => ({ key: `r${x.round}`, label: `R${x.round}`, value: x.td, sub: `n=${x.n}` }))} />
              <p className={s.note}>Por round, sí. Por zona de la jaula (contra la valla o en el centro): <Unavailable reason="sin datos" /> — las estadísticas de caja no registran la posición en la jaula.</p>
            </Q>

            <Q n={6} q="¿Qué distancia utiliza?" sample={`${r.stats.totals.sigLanded} golpes sig. conectados`}>
              <p className={s.caption}>Posición</p>
              <SegmentBar label="Golpes por posición" segments={[
                { key: "d", label: "Distancia", value: r.stats.totals.distance, tone: "bone" },
                { key: "c", label: "Clinch", value: r.stats.totals.clinch, tone: "bone-2" },
                { key: "g", label: "Suelo", value: r.stats.totals.ground, tone: "ink" },
              ]} />
              <p className={s.caption}>Objetivo</p>
              <SegmentBar label="Golpes por objetivo" segments={[
                { key: "h", label: "Cabeza", value: r.stats.totals.head, tone: "bone" },
                { key: "b", label: "Cuerpo", value: r.stats.totals.body, tone: "bone-2" },
                { key: "l", label: "Pierna", value: r.stats.totals.leg, tone: "ink" },
              ]} />
            </Q>

            <Q n={7} q="¿Cuándo baja su ritmo?" sample="golpes sig. intentados, R1 = 100%">
              {r.paceDrop.length ? (
                <MiniBars label="Ritmo relativo por round" baseline={1} max={Math.max(1.3, ...r.paceDrop.map((p) => p.rel))} format={(v) => `${Math.round(v * 100)}%`}
                  items={r.paceDrop.map((p) => ({ key: `r${p.round}`, label: `R${p.round}`, value: p.rel, sub: `n=${p.n}` }))} />
              ) : <p className={s.note}>Sin rounds completos suficientes.</p>}
              <p className={s.note}>La línea discontinua marca el ritmo del primer round. Solo cuentan rounds disputados completos.</p>
            </Q>

            <Q n={8} q="¿Cómo cambia entre rounds?" sample="diferencial de golpes sig. por round">
              <Diverging label="Diferencial por round" leftLabel="Pierde el round" rightLabel="Gana el round" format={(v) => dec(v)}
                rows={r.rounds.map((x) => ({ key: `r${x.round}`, label: `Round ${x.round}`, value: x.diff, sub: `n=${x.n}` }))} />
            </Q>

            <Q n={9} q="¿Qué patrones aparecen?" sample="reglas con muestra mínima">
              {r.insights.length ? (
                <ul className={s.patterns}>
                  {r.insights.map((i) => (
                    <li key={i.id}><strong>{i.headline}</strong><span>{i.evidence}</span><em>n = {i.sample}</em></li>
                  ))}
                </ul>
              ) : <p className={s.note}>Ningún patrón supera el umbral de muestra.</p>}
            </Q>
          </div>
        </>
      )}
    </div>
  );
}
