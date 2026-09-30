import type { Metadata } from "next";
import Link from "next/link";
import { Source } from "@/components/ui/primitives";
import { history } from "@/lib/data/repository";
import { ORGANIZATIONS } from "@/lib/domain/reference";
import s from "./history.module.css";

export const metadata: Metadata = {
  title: "Historia del MMA",
  description: "Archivo interactivo de la historia del MMA: organizaciones, reglas y momentos que definieron el deporte, década a década.",
  alternates: { canonical: "/history" },
};

const KIND: Record<string, string> = { founding: "Fundación", rules: "Reglas", milestone: "Hito", business: "Negocio" };

export default function HistoryPage() {
  const items = history();
  const decades = [...new Set(items.map((h) => Math.floor(h.year / 10) * 10))];
  const span = { from: 1985, to: 2030 };
  const x = (y: number) => ((y - span.from) / (span.to - span.from)) * 100;
  const orgs = ORGANIZATIONS.filter((o) => o.activeFrom);
  return (
    <article className={`paper ${s.page}`}>
      <div className="wrap">
        <header className={s.head}>
          <p className="label">FIGHTCORE History · Archivo</p>
          <h1 className={s.title}>El deporte que se inventó a sí mismo</h1>
          <p className={`serif ${s.lede}`}>En 1993 la pregunta era qué arte marcial ganaría. Tres décadas después, la respuesta es un deporte nuevo, con sus propias reglas, divisiones y estilos. Este archivo recorre cómo llegó hasta aquí.</p>
        </header>

        <section aria-labelledby="orgs-span" className={s.spanBlock}>
          <h2 id="orgs-span" className={s.h2}>Vida de las organizaciones</h2>
          <p className={s.note}>Años de actividad con fecha documentada. Las organizaciones sin fechas confirmadas no aparecen: preferimos un hueco a una fecha inventada.</p>
          <div className={s.spanChart} role="table" aria-label="Años de actividad por organización">
            <div className={s.spanAxis} aria-hidden>{[1990, 2000, 2010, 2020].map((y) => <span key={y} style={{ left: `${x(y)}%` }}>{y}</span>)}</div>
            {orgs.sort((a, b) => a.activeFrom! - b.activeFrom!).map((o) => (
              <div key={o.id} role="row" className={s.spanRow}>
                <span role="rowheader" className={s.spanName}><Link href={`/organizations/${o.slug}`}>{o.short}</Link></span>
                <span role="cell" className={s.spanTrack}>
                  <span className={`${s.spanBar} ${o.activeTo ? s.ended : ""}`} style={{ left: `${x(o.activeFrom!)}%`, width: `${x(o.activeTo ?? 2026) - x(o.activeFrom!)}%` }} />
                  <span className="visually-hidden">{o.activeFrom}–{o.activeTo ?? "hoy"}</span>
                </span>
              </div>
            ))}
          </div>
        </section>

        {decades.map((d) => (
          <section key={d} aria-labelledby={`d${d}`} className={s.decade}>
            <h2 id={`d${d}`} className={s.decadeTitle}>{d}s</h2>
            <ol className={s.items}>
              {items.filter((h) => Math.floor(h.year / 10) * 10 === d).map((h) => (
                <li key={`${h.year}-${h.title}`} id={`y${h.year}`} className={s.item}>
                  <span className={s.year}>{h.year}</span>
                  <div className={s.itemBody}>
                    <span className={s.kind}>{KIND[h.kind]}{h.orgId ? ` · ${ORGANIZATIONS.find((o) => o.id === h.orgId)?.short}` : ""}</span>
                    <h3 className={s.itemTitle}>{h.title}</h3>
                    <p className="serif">{h.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        ))}
        <p className={s.src}><Source kind="editorial" /> Textos propios de FIGHTCORE a partir de hechos ampliamente documentados. Fase 2 añadirá campeones históricos, rivalidades y eventos por década.</p>
      </div>
    </article>
  );
}
