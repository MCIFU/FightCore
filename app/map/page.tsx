import type { Metadata } from "next";
import Link from "next/link";
import { FighterAvatar } from "@/components/fighter/FighterAvatar";
import { SectionHead, Source } from "@/components/ui/primitives";
import { mapData, SRC } from "@/lib/data/repository";
import world from "@/lib/geo/world.json";
import s from "./map.module.css";

export const metadata: Metadata = {
  title: "Mapa del MMA",
  description: "Mapa mundial del MMA: de dónde salen los luchadores, dónde se celebran los eventos y de qué países son los campeones.",
  alternates: { canonical: "/map" },
};

/** Sequential single-hue ramp (Ember), light → dark on a dark surface = more → brighter. */
const RAMP = ["var(--ramp-0)", "var(--ramp-1)", "var(--ramp-2)", "var(--ramp-3)", "var(--ramp-4)"];

export default function MapPage() {
  const data = mapData();
  const by = new Map(data.map((d) => [d.code, d]));
  const maxF = Math.max(...data.map((d) => d.fighters));
  const maxE = Math.max(...data.map((d) => d.events));
  // Logarithmic steps: one country (USA) has ten times more fighters than most others.
  const lg = (n: number) => Math.log(n) / Math.log(Math.max(2, maxF));
  const bucket = (n: number) => (n <= 0 ? -1 : Math.min(4, Math.floor(lg(n) * 5 - 0.0001)));
  const pts = world.points as unknown as Record<string, [number, number]>;
  const steps = [0, 0.2, 0.4, 0.6, 0.8].map((k, i) => (i === 0 ? 1 : Math.ceil(Math.max(2, maxF) ** k)));

  return (
    <div className="wrap" style={{ paddingTop: "var(--s-7)", paddingBottom: "var(--s-8)" }}>
      <SectionHead as="h1" kicker="FIGHTCORE History · Mapa" title="Mapa del MMA"
        lede={<>De dónde salen los luchadores, dónde se pelea y de dónde son los campeones. <Source kind={SRC} /></>} />

      <div className={s.mapBlock}>
        <fieldset className={s.layers}>
          <legend className="label">Capa</legend>
          <label><input type="radio" name="layer" value="fighters" defaultChecked /> <span>Luchadores por país</span></label>
          <label><input type="radio" name="layer" value="events" /> <span>Eventos celebrados</span></label>
          <label><input type="radio" name="layer" value="champions" /> <span>Campeones vigentes</span></label>
        </fieldset>

        <figure className={s.figure}>
          <svg viewBox={`0 0 ${world.width} ${world.height}`} className={s.svg} role="group" aria-labelledby="map-cap">
            <g className={s.land}>
              {world.countries.map((c) => {
                const d = c.a3 ? by.get(c.a3) : undefined;
                const b = d ? bucket(d.fighters) : -1;
                const shape = <path d={c.d} style={b >= 0 ? { fill: RAMP[b] } : undefined} className={b >= 0 ? s.has : s.empty} />;
                return d ? (
                  <a key={c.id + c.name} href={`/fighters?country=${d.code}&status=all`} aria-label={`${d.name}: ${d.fighters} luchadores, ${d.events} eventos, ${d.champions} campeones`}>
                    <title>{`${d.name} · ${d.fighters} luchadores · ${d.events} eventos · ${d.champions} campeones`}</title>
                    {shape}
                  </a>
                ) : <g key={c.id + c.name}>{shape}</g>;
              })}
            </g>
            <g className={s.eventsLayer} aria-hidden>
              {data.filter((d) => d.events && pts[d.code]).map((d) => (
                <circle key={d.code} cx={pts[d.code][0]} cy={pts[d.code][1]} r={3 + Math.sqrt(d.events / maxE) * 16} className={s.eventDot} />
              ))}
            </g>
            <g className={s.champLayer} aria-hidden>
              {data.filter((d) => d.champions && pts[d.code]).map((d) => (
                <g key={d.code} transform={`translate(${pts[d.code][0]} ${pts[d.code][1]})`}>
                  <rect x={-9} y={-6} width={18} height={12} className={s.belt} />
                  <text y={4} textAnchor="middle" className={s.beltText}>{d.champions}</text>
                </g>
              ))}
            </g>
          </svg>
          <figcaption id="map-cap" className={s.cap}>
            <span className={s.legendFighters}>
              Luchadores por país:
              {RAMP.map((c, i) => <span key={c} className={s.step}><i style={{ background: c }} />{i === 0 ? "1" : `≥${steps[i]}`}</span>)}
            </span>
            <span className={s.legendEvents}>Círculo ∝ eventos celebrados (agregados en la capital del país).</span>
            <span className={s.legendChamps}>Cinturón = campeones vigentes nacidos en el país.</span>
            <span>Geometría: Natural Earth (dominio público). La tabla inferior contiene los mismos datos.</span>
          </figcaption>
        </figure>
      </div>

      <section aria-labelledby="tbl" className={s.tableBlock}>
        <h2 id="tbl" className={s.h2}>Por país</h2>
        <table className={s.table}>
          <caption className="visually-hidden">Luchadores, eventos y campeones por país</caption>
          <thead><tr><th scope="col">País</th><th scope="col" className={s.r}>Luchadores</th><th scope="col" className={s.r}>En activo</th><th scope="col" className={s.r}>Campeones</th><th scope="col" className={s.r}>Eventos</th><th scope="col">Mejor valorado</th></tr></thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.code}>
                <th scope="row"><Link href={`/fighters?country=${d.code}&status=all`}>{d.name}</Link> <span className={s.code}>{d.code}</span></th>
                <td className={s.r}><span className={s.bar}><span style={{ width: `${(d.fighters / maxF) * 100}%` }} /></span>{d.fighters}</td>
                <td className={s.r}>{d.active}</td>
                <td className={s.r}>{d.champions || "—"}</td>
                <td className={s.r}>{d.events || "—"}</td>
                <td>{d.top ? <Link href={`/fighters/${d.top.slug}`} className={s.top}><FighterAvatar src={d.top.photo.src} name={d.top.name} size={28} champion={d.top.champion} />{d.top.name} <span className={s.code}>{d.top.rating.toFixed(1)}</span></Link> : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
