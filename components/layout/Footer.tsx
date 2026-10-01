import Link from "next/link";
import { CornerMark } from "@/components/brand/Logo";
import { FCR_VERSION } from "@/lib/rating/model";
import { MORE_NAV, PRIMARY_NAV } from "./nav";
import s from "./Footer.module.css";

export function Footer({ demo, asOf }: { demo: boolean; asOf: string }) {
  return (
    <footer className={s.footer}>
      <div className="wrap">
        <div className={s.top}>
          <div className={s.brandCol}>
            <CornerMark size={40} />
            <p className={`serif ${s.manifesto}`}>
              Datos: lo que ocurrió. Contexto: por qué importa. Insight: qué podemos aprender.
            </p>
          </div>
          <nav aria-label="Pie de página" className={s.cols}>
            <div>
              <p className="label">Producto</p>
              <ul>{PRIMARY_NAV.map((i) => <li key={i.href}><Link href={i.href}>{i.label}</Link></li>)}</ul>
            </div>
            <div>
              <p className="label">Archivo</p>
              <ul>{MORE_NAV.map((i) => <li key={i.href}><Link href={i.href}>{i.label}</Link></li>)}</ul>
            </div>
            <div>
              <p className="label">Transparencia</p>
              <ul>
                <li><Link href="/methodology">Cómo se calcula el FCR</Link></li>
                <li><Link href="/methodology#fuentes">Fuentes y procedencia</Link></li>
                <li><Link href="/methodology#limitaciones">Limitaciones</Link></li>
              </ul>
            </div>
          </nav>
        </div>
        <p className={s.giant} aria-hidden data-word="FIGHTCORE" />
        <div className={s.legal}>
          <p>
            FIGHTCORE es un proyecto independiente. No está afiliado, patrocinado ni respaldado por UFC, PFL, ONE Championship, RIZIN ni por ninguna otra organización mencionada; sus nombres se usan solo para identificarlas.
          </p>
          {demo ? (
            <p>
              Esta versión funciona con un <strong>dataset de demostración</strong>: luchadores, combates y eventos son ficticios y están generados por simulación. FCR v{FCR_VERSION}.
            </p>
          ) : (
            <p>
              Datos a {asOf}: resultados y estadísticas de UFC de <a href="http://ufcstats.com/">UFCStats</a> (vía <a href="https://github.com/Greco1899/scrape_ufc_stats">scrape_ufc_stats</a>); nacionalidades de <a href="https://www.wikidata.org/">Wikidata</a> (CC0); plantilla, campeones actuales y carteleras de <a href="https://en.wikipedia.org/wiki/List_of_current_UFC_fighters">Wikipedia</a> (CC BY-SA 4.0). Retratos oficiales © UFC vía ESPN: <Link href="/credits">créditos</Link>. Rating, atributos y récords calculados por FIGHTCORE · FCR v{FCR_VERSION}.
            </p>
          )}
        </div>
      </div>
    </footer>
  );
}
