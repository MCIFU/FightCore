import type { Metadata } from "next";
import Link from "next/link";
import { FighterAvatar } from "@/components/fighter/FighterAvatar";
import { SectionHead } from "@/components/ui/primitives";
import { DATASET, IS_DEMO, photoCredits } from "@/lib/data/repository";
import { fmtDate } from "@/lib/format";
import s from "./credits.module.css";

export const metadata: Metadata = {
  title: "Fuentes y créditos",
  description: "De dónde salen los datos de FIGHTCORE y quién hizo cada fotografía, con su licencia.",
  alternates: { canonical: "/credits" },
};

export default function CreditsPage() {
  const photos = photoCredits();
  return (
    <div className="wrap" style={{ paddingTop: "var(--s-7)", paddingBottom: "var(--s-8)" }}>
      <SectionHead as="h1" kicker="FIGHTCORE · Transparencia" title="Fuentes y créditos" lede="Cada dato tiene un origen y cada foto un autor. Esta página los nombra." />

      <section aria-labelledby="c-data" className={s.block}>
        <h2 id="c-data" className={s.h2}>Datos</h2>
        {IS_DEMO ? (
          <p className={s.p}>El dataset activo es la simulación de demostración: no hay fuentes externas.</p>
        ) : (
          <>
            <p className={s.p}>Datos a {fmtDate(DATASET.asOf)}{DATASET.lastEvent ? `; último evento disputado: ${fmtDate(DATASET.lastEvent)}` : ""}.</p>
            <ul className={s.sources}>
              {DATASET.sources.map((src) => (
                <li key={src.name}>
                  <strong>{src.name}</strong>
                  {src.via && <span> · vía {src.via}</span>}
                  {src.license && <span> · {src.license}</span>}
                  <p>{src.covers}</p>
                </li>
              ))}
            </ul>
            <p className={s.p}>Rating, atributos, observaciones, rankings y récords son cálculos de FIGHTCORE sobre esos datos (<Link href="/methodology">metodología</Link>). FIGHTCORE no está afiliado a UFC ni a ninguna de estas fuentes.</p>
          </>
        )}
      </section>

      <section aria-labelledby="c-photos" className={s.block}>
        <h2 id="c-photos" className={s.h2}>Fotografías <span className={s.count}>{photos.length}</span></h2>
        <p className={s.p}>
          Solo se usan fotografías de Wikimedia Commons con licencia libre. FIGHTCORE las recorta a un primer plano de la cabeza y elimina el fondo; las que tienen licencia CC BY-SA se distribuyen modificadas bajo esa misma licencia. Los luchadores sin foto libre muestran sus iniciales: no se usan fotos oficiales ni de agencias.
        </p>
        {photos.length > 0 && (
          <div className={s.tableWrap} tabIndex={0} role="region" aria-label="Créditos fotográficos">
            <table className={s.table}>
              <thead><tr><th scope="col">Luchador</th><th scope="col">Autor</th><th scope="col">Licencia</th><th scope="col">Original</th></tr></thead>
              <tbody>
                {photos.map((p) => (
                  <tr key={p.slug}>
                    <th scope="row"><Link href={`/fighters/${p.slug}`} className={s.who}><FighterAvatar src={p.src} name={p.name} size={32} />{p.name}</Link></th>
                    <td>{p.author}</td>
                    <td>{p.licenseUrl ? <a href={p.licenseUrl} rel="license noopener" target="_blank">{p.license}</a> : p.license}</td>
                    <td><a href={p.sourceUrl} rel="noopener" target="_blank">Commons</a></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
