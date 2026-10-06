import type { Metadata } from "next";
import Link from "next/link";
import { SectionHead, Source } from "@/components/ui/primitives";
import { ATTRIBUTES } from "@/lib/analytics/attributes";
import { FACTORS, FCR_VERSION, VALIDATION } from "@/lib/rating/model";
import s from "./methodology.module.css";
import { IS_DEMO, SRC } from "@/lib/data/repository";

export const metadata: Metadata = {
  title: "Metodología del FIGHTCORE Rating",
  description: "Qué es el FIGHTCORE Rating, cómo se calcula, qué datos usa, qué significa cada factor, sus limitaciones y cómo interpretarlo.",
  alternates: { canonical: "/methodology" },
};

export default function MethodologyPage() {
  return (
    <article className={`paper ${s.page}`}>
      <div className="wrap">
        <header className={s.head}>
          <p className="label">FIGHTCORE Rating · Modelo v{FCR_VERSION}</p>
          <h1 className={s.title}>Un número que enseña sus cuentas</h1>
          <p className={`serif ${s.lede}`}>
            El FIGHTCORE Rating (FCR) resume en una escala de 0 a 100 el rendimiento competitivo que un luchador ha demostrado. No es una predicción, ni un juicio sobre quién ganaría, ni «la verdad» sobre quién es mejor. Es una métrica propia, con reglas públicas.
          </p>
        </header>

        <div className={s.cols}>
          <nav aria-label="Índice" className={s.toc}>
            <ol>
              <li><a href="#que-es">Qué es</a></li>
              <li><a href="#calculo">Cómo se calcula</a></li>
              <li><a href="#factores">Los ocho factores</a></li>
              <li><a href="#validacion">¿Funciona?</a></li>
              <li><a href="#margen">El margen de incertidumbre</a></li>
              <li><a href="#atributos">Atributos y firma de estilo</a></li>
              <li><a href="#fuentes">Fuentes y procedencia</a></li>
              <li><a href="#limitaciones">Limitaciones</a></li>
              <li><a href="#interpretar">Cómo interpretarlo</a></li>
            </ol>
          </nav>

          <div className={s.body}>
            <section id="que-es" aria-labelledby="h1s">
              <SectionHead tone="paper" id="h1s" as="h2" round="01" kicker="Definición" title="Qué es" />
              <p className="serif">El FCR mide cómo ha rendido un luchador, contra quién y con qué dominio, dando más peso a lo reciente. Dos luchadores con el mismo récord pueden tener ratings muy distintos si uno ganó a rivales mejores, con más claridad o más recientemente.</p>
              <p className="serif">Se recalcula después de cada combate y conserva su historia, de modo que puede verse cómo evoluciona una carrera.</p>
            </section>

            <section id="calculo" aria-labelledby="h2s">
              <SectionHead tone="paper" id="h2s" as="h2" round="02" kicker="Fórmula" title="Cómo se calcula" />
              <p className="serif">Cada factor se puntúa de 0 a 100 a partir de datos observables. El rating es la suma ponderada:</p>
              <pre className={s.formula} aria-label="FCR igual a la suma de cada factor por su peso">
                FCR = Σ ( factor<sub>i</sub> × peso<sub>i</sub> )     Σ peso = 1
              </pre>
              <p className="serif">Los pesos son fijos y públicos. Cambiar un peso cambia la versión del modelo. En la ficha de cada luchador se muestra cuántos puntos aporta cada factor, y siempre suman exactamente el rating publicado.</p>
              <p className="serif">La <em>fuerza del rival</em> que usan varios factores procede de un índice tipo Elo: cada combate transfiere puntos según lo esperable del resultado. En las decisiones cuenta también cuánto dominó cada uno (golpes, derribos, control); las divididas pesan la mitad, los combates por el título un tercio más, y tras más de 18 meses sin pelear el índice vuelve poco a poco a la media. Se toma en el momento del combate, no con lo que el rival hizo después.</p>
              <p className="serif">Los combates pierden peso con el tiempo: uno de hace 2,5 años cuenta la mitad que uno de hoy. Con pocos combates, cada factor se acerca a un valor neutro en lugar de dispararse por una o dos peleas.</p>
            </section>

            <section id="validacion" aria-labelledby="h2bs">
              <SectionHead tone="paper" id="h2bs" as="h2" kicker="Comprobación" title="¿Funciona?" />
              <p className="serif">Un rating que mide rendimiento debería explicar los resultados. Lo comprobamos con {VALIDATION.fights.toLocaleString("es-ES")} combates desde 2012 (UFC y las demás organizaciones cubiertas) entre luchadores con al menos tres combates previos, usando el rating que cada uno tenía el día antes:</p>
              <dl className={s.sources}>
                <div><dt><strong>{VALIDATION.accuracy.toLocaleString("es-ES")} %</strong></dt><dd>de las veces ganó el de rating más alto.</dd></div>
                <div><dt><strong>{VALIDATION.accuracyBigGap.toLocaleString("es-ES")} %</strong></dt><dd>cuando la diferencia era de {VALIDATION.bigGap} puntos o más.</dd></div>
                <div><dt><strong>{VALIDATION.strength.toLocaleString("es-ES")} %</strong></dt><dd>con el índice de fuerza (tipo Elo) solo.</dd></div>
                <div><dt><strong>{VALIDATION.baseline.toLocaleString("es-ES")} %</strong></dt><dd>referencia sin modelo (gana el que la fuente lista primero).</dd></div>
              </dl>
              <p className="serif">No es una herramienta de predicción: el MMA tiene mucha varianza y un rating hecho de resultados pasados no ve lesiones, cortes de peso ni estilos. La comprobación sirve para decidir qué cambios del modelo son mejoras reales; los pesos de v0.2 salen de ella.</p>
            </section>

            <section id="factores" aria-labelledby="h3s">
              <SectionHead tone="paper" id="h3s" as="h2" round="03" kicker="Componentes" title="Los ocho factores" />
              <table className={s.table}>
                <caption className="visually-hidden">Factores del FCR y sus pesos</caption>
                <thead><tr><th scope="col">Factor</th><th scope="col">Qué mide</th><th scope="col" className={s.r}>Peso</th></tr></thead>
                <tbody>
                  {FACTORS.map((f) => (
                    <tr key={f.key}>
                      <th scope="row">{f.label}</th>
                      <td>{f.description}</td>
                      <td className={s.r}>
                        <span className={s.weight}><span style={{ width: `${f.weight * 400}%` }} /></span>
                        <strong>{Math.round(f.weight * 100)}%</strong>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            <section id="margen" aria-labelledby="h4s">
              <SectionHead tone="paper" id="h4s" as="h2" round="04" kicker="Honestidad estadística" title="El margen de incertidumbre" />
              <p className="serif">Cada rating se publica con un margen: <strong>84.4 ±3.6</strong>. Depende del número de combates registrados (<code>±16 / √(n + 2)</code>). Con pocas peleas el margen es ancho y el rating se marca como <em>provisional</em> (menos de tres combates).</p>
              <p className="serif">Consecuencia práctica: si la diferencia entre dos luchadores es menor que su margen combinado, FIGHTCORE no afirma que uno esté por encima del otro. La herramienta de comparación lo dice explícitamente.</p>
            </section>

            <section id="atributos" aria-labelledby="h5s">
              <SectionHead tone="paper" id="h5s" as="h2" round="05" kicker="Más allá del número" title="Atributos y firma de estilo" />
              <p className="serif">Los atributos no forman parte del rating. Son percentiles (0–100) frente a todos los luchadores con al menos tres combates, calculados con métricas por minuto o por 15 minutos para que las peleas largas y cortas sean comparables.</p>
              <ul className={s.attrs}>
                {ATTRIBUTES.map((a) => <li key={a.key}><strong>{a.label}{a.experimental ? " (experimental)" : ""}.</strong> {a.basis}</li>)}
              </ul>
              <p className="serif"><strong>Sobre «Fight IQ».</strong> No existe una forma honesta de medir la inteligencia de combate con estadísticas de caja. En su lugar usamos <em>Adaptación</em>: cuánto mejora (o empeora) el diferencial de golpeo después del primer round. Mide algo real, pero es una aproximación y la marcamos como experimental.</p>
            </section>

            <section id="fuentes" aria-labelledby="h6s">
              <SectionHead tone="paper" id="h6s" as="h2" round="06" kicker="Procedencia" title="Fuentes y procedencia" />
              <p className="serif">Todo dato de FIGHTCORE declara su origen:</p>
              <dl className={s.sources}>
                <div><dt><Source kind="official" /></dt><dd>Publicado por la organización o la comisión atlética.</dd></div>
                <div><dt><Source kind="imported" /></dt><dd>Obtenido de un proveedor externo, con referencia a la fuente.</dd></div>
                <div><dt><Source kind="calculated" /></dt><dd>Derivado por FIGHTCORE (rating, atributos, observaciones, récords).</dd></div>
                <div><dt><Source kind="editorial" /></dt><dd>Contexto redactado por FIGHTCORE (historia, notas).</dd></div>
                <div><dt><Source kind="demo" /></dt><dd>Dato de demostración generado por simulación. {IS_DEMO ? <strong>Todo el dataset activo lo es.</strong> : "Solo se usa en el modo de desarrollo; no aparece con datos reales."}</dd></div>
              </dl>
              <p className="serif">Si un dato no existe se muestra como <em>sin datos</em>, <em>pendiente</em> o <em>desconocido</em>. Nunca se rellena con estimaciones.</p>
            </section>

            <section id="limitaciones" aria-labelledby="h7s">
              <SectionHead tone="paper" id="h7s" as="h2" round="07" kicker="Lo que no hace" title="Limitaciones" />
              <ul className={s.list}>
                <li>Solo ve lo que registran las estadísticas: no mide lesiones, cortes de peso, campamentos ni contexto personal.</li>
                <li>Las estadísticas de caja no distinguen la calidad de un golpe: un jab y un cruzado limpio cuentan igual.</li>
                <li>El récord previo a la cobertura de FIGHTCORE se suma al récord profesional, pero no alimenta el rating porque no tiene desglose.</li>
                <li>Los luchadores de circuitos regionales pueden quedar infravalorados hasta que se enfrentan a rivales mejor medidos.</li>
                <li>Los pesos se eligieron con la comprobación de resultados, pero redondeados y con «Títulos» y «Finalización» mantenidos como contexto: es un rating de rendimiento, no un modelo de apuestas.</li>
                {!IS_DEMO && <li>La cobertura es UFC (1993–hoy) con estadísticas completas, más los resultados de PFL, Bellator, RIZIN, KSW, Cage Warriors, LFA, Strikeforce, WEC, PRIDE, DREAM, Pancrase y Shooto publicados por ESPN. Esos combates cuentan para el récord, el índice de fuerza y la calidad de rivales, pero no tienen estadísticas de golpeo: el factor Dominio queda en valor neutro hasta que hay datos. Los títulos fuera de UFC salen de los combates que ESPN marca como título; como ESPN no registra cinturones dejados vacantes, un reinado solo cuenta como vigente mientras su dueño siga peleando en esa organización.</li>}
                {!IS_DEMO && <li>Los combates más antiguos de UFC no tienen estadísticas de golpeo registradas; esos combates cuentan para resultados, no para métricas de rendimiento.</li>}
              </ul>
            </section>

            <section id="interpretar" aria-labelledby="h8s">
              <SectionHead tone="paper" id="h8s" as="h2" round="08" kicker="Lectura" title="Cómo interpretarlo" />
              <div className={s.scale}>
                {[["85+", "Rendimiento dominante sostenido frente a élite"], ["70–85", "Nivel de título o aspirante claro"], ["55–70", "Luchador consolidado en primer nivel"], ["40–55", "Competitivo; resultados irregulares o rivales de menor nivel"], ["<40", "En desarrollo, en mala racha o con poca muestra"]].map(([r, t]) => (
                  <div key={r} className={s.scaleRow}><strong>{r}</strong><span>{t}</span></div>
                ))}
              </div>
              <p className="serif">Frecuencia de actualización: tras cada combate registrado. Actividad y forma pueden hacer bajar el rating de un luchador inactivo aunque no pelee.</p>
              <p className="serif"><Link href="/rankings" className={s.link}>Ver los rankings</Link> · <Link href="/compare" className={s.link}>Comparar luchadores</Link></p>
            </section>
          </div>
        </div>
      </div>
    </article>
  );
}
