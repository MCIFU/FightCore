import type { Metadata } from "next";
import Link from "next/link";
import { YearTrend } from "@/components/charts/YearTrend";
import { FighterAvatar } from "@/components/fighter/FighterAvatar";
import { SectionHead, Source } from "@/components/ui/primitives";
import { Tabs } from "@/components/ui/Tabs";
import { STAT_METRICS, STAT_MIN_BOUTS, STAT_MIN_MINUTES, statsOverview } from "@/lib/data/repository";
import s from "./stats.module.css";

export const metadata: Metadata = {
  title: "Stats",
  description: "Líderes estadísticos con muestra mínima, distribuciones por división, evolución por año y comparativa por organización.",
  alternates: { canonical: "/stats" },
};

const fmt = (kind: string, v: number) => (kind === "pct" ? `${Math.round(v * 100)}%` : v.toFixed(2).replace(".", ","));
const pct = (v: number) => `${Math.round(v * 100)}%`;

export default function StatsPage() {
  const o = statsOverview();
  const maxSig = Math.max(...o.byDivision.map((d) => d.sigPerMin));
  return (
    <div className="wrap" style={{ paddingTop: "var(--s-7)", paddingBottom: "var(--s-8)" }}>
      <SectionHead as="h1" kicker="FIGHTCORE Stats" title="Stats"
        lede={<>Explora el dataset. Los líderes exigen al menos {STAT_MIN_BOUTS} combates y {STAT_MIN_MINUTES} minutos para que una pelea suelta no gane un ranking. <Source kind="demo" /> <Source kind="calculated" /></>} />

      <section aria-labelledby="lead" className={s.block}>
        <h2 id="lead" className={s.h2}>Líderes por métrica <span>{o.pool} luchadores cumplen la muestra mínima</span></h2>
        <Tabs label="Métrica" variant="scroll" tabs={STAT_METRICS.map((m) => ({
          id: m.key, label: m.label.replace(" por ", "/").replace(" minuto", " min"), hint: m.label,
          content: (
            <ol className={s.leaders}>
              {o.leaders[m.key].map((l, i) => (
                <li key={l.fighter.id} className={s.leader}>
                  <span className={s.pos}>{String(i + 1).padStart(2, "0")}</span>
                  <FighterAvatar src={l.fighter.photo.src} size={40} champion={l.fighter.champion} />
                  <span className={s.who}><Link href={`/fighters/${l.fighter.slug}`}>{l.fighter.name}</Link><span>{l.fighter.divisionShort} · {l.fighter.org} · n = {l.sample}</span></span>
                  <span className={s.bar} aria-hidden><span style={{ width: `${(l.value / o.leaders[m.key][0].value) * 100}%` }} /></span>
                  <span className={s.val}>{fmt(m.fmt, l.value)}</span>
                </li>
              ))}
            </ol>
          ),
        }))} />
      </section>

      <section aria-labelledby="div" className={s.block}>
        <h2 id="div" className={s.h2}>Por división <span>métodos de resultado y volumen de golpeo</span></h2>
        <table className={s.table}>
          <caption className="visually-hidden">Métodos de resultado y ritmo por división</caption>
          <thead><tr><th scope="col">División</th><th scope="col">Métodos</th><th scope="col" className={s.r}>KO</th><th scope="col" className={s.r}>SUB</th><th scope="col" className={s.r}>DEC</th><th scope="col">Golpes sig./min (ambos)</th><th scope="col" className={s.r}>n</th></tr></thead>
          <tbody>
            {o.byDivision.map((d) => (
              <tr key={d.division.id}>
                <th scope="row">{d.division.name}</th>
                <td><span className={s.stack} aria-hidden><span className={s.sKo} style={{ flexGrow: d.ko }} /><span className={s.sSub} style={{ flexGrow: d.sub }} /><span className={s.sDec} style={{ flexGrow: d.dec }} /></span></td>
                <td className={s.r}>{pct(d.ko)}</td><td className={s.r}>{pct(d.sub)}</td><td className={s.r}>{pct(d.dec)}</td>
                <td><span className={s.hbar}><span style={{ width: `${(d.sigPerMin / maxSig) * 100}%` }} /></span> <span className="num">{d.sigPerMin.toFixed(1).replace(".", ",")}</span></td>
                <td className={s.r}>{d.n}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className={s.legend}><i className={s.sKo} /> KO/TKO <i className={s.sSub} /> Sumisión <i className={s.sDec} /> Decisión</p>
      </section>

      <section aria-labelledby="yr" className={s.block}>
        <h2 id="yr" className={s.h2}>Evolución por año <span>¿se finaliza más o menos que antes?</span></h2>
        <YearTrend rows={o.byYear} />
      </section>

      <section aria-labelledby="org" className={s.block}>
        <h2 id="org" className={s.h2}>Por organización <span>ordenado por tasa de finalización; mínimo 20 combates</span></h2>
        <ol className={s.orgs}>
          {o.byOrg.map((x) => (
            <li key={x.org}>
              <Link href={`/organizations/${x.slug}`} className={s.orgName}>{x.org}</Link>
              <span className={s.stack} aria-hidden><span className={s.sKo} style={{ flexGrow: x.ko }} /><span className={s.sSub} style={{ flexGrow: x.sub }} /><span className={s.sDec} style={{ flexGrow: x.dec }} /></span>
              <span className={s.orgVal}><strong>{pct(x.ko + x.sub)}</strong> finalizaciones · n = {x.n}</span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
