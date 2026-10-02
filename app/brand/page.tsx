import type { Metadata } from "next";
import { Logo, MARK_SPEC, NucleoMark, OCTAGON } from "@/components/brand/Logo";
import { TaleOfTape } from "@/components/charts/TaleOfTape";
import { SegmentBar } from "@/components/charts/Bars";
import { FighterPlate } from "@/components/fighter/FighterPlate";
import { RankingList } from "@/components/rankings/RankingList";
import {
  ButtonLink, CountryTag, EmptyState, FormStrip, Meter, OutcomeMark, RatingValue, RecordValue, SectionHead, Skeleton, Source, Stat, Tag, Unavailable,
} from "@/components/ui/primitives";
import { Tabs } from "@/components/ui/Tabs";
import { divisionRanking } from "@/lib/data/repository";
import s from "./brand.module.css";

export const metadata: Metadata = {
  title: "Sistema de marca",
  description: "Identidad visual y design system de FIGHTCORE: logo Núcleo, tipografía, color, lenguaje visual y componentes.",
  alternates: { canonical: "/brand" },
};

const COLORS: { name: string; token: string; hex: string; role: string; on?: string; ratio?: string }[] = [
  { name: "Ink 0", token: "--ink-0", hex: "#0B0C0E", role: "Fondo" },
  { name: "Ink 1", token: "--ink-1", hex: "#121418", role: "Superficie" },
  { name: "Ink 2", token: "--ink-2", hex: "#1A1D22", role: "Superficie elevada" },
  { name: "Ink 3", token: "--ink-3", hex: "#262A31", role: "Pistas, bordes fuertes" },
  { name: "Bone", token: "--bone", hex: "#ECE6DA", role: "Texto principal", ratio: "15.8:1" },
  { name: "Bone 2", token: "--bone-2", hex: "#B3ADA2", role: "Texto secundario", ratio: "8.8:1" },
  { name: "Bone 3", token: "--bone-3", hex: "#8E897F", role: "Metadatos", ratio: "5.6:1" },
  { name: "Paper", token: "--paper", hex: "#E9E2D4", role: "Superficie editorial" },
];
const CORNERS = [
  { name: "Ember", token: "--corner-a", hex: "#EC6528", role: "Esquina A · señal de marca" },
  { name: "Cobalt", token: "--corner-b", hex: "#6A8EE8", role: "Esquina B" },
  { name: "Jade", token: "--corner-c", hex: "#2EA67D", role: "Esquina C" },
  { name: "Iris", token: "--corner-d", hex: "#9E7DD4", role: "Esquina D" },
];
const STATUS = [
  { name: "Success", hex: "#5CCB8F", role: "Subidas, estados correctos" },
  { name: "Warning", hex: "#F2B84B", role: "Demo, provisional, pendiente" },
  { name: "Danger", hex: "#FF6B6B", role: "Errores de sistema (nunca «derrota»)" },
];

const BRAND = [
  { name: "Ember", hex: "#EC6528", role: "Núcleo del logo, rellenos, señal principal" },
  { name: "Ember texto", hex: "#FF7A3D", role: "Ember para texto sobre tinta (contraste AA)" },
  { name: "Ember papel", hex: "#A33B0B", role: "Ember para texto sobre papel" },
  { name: "Oro", hex: "#E3C16F", role: "Solo cinturones y títulos" },
];
const RATIO = [
  { name: "Tinta", pct: 70, hex: "#0B0C0E", on: "#ECE6DA" },
  { name: "Hueso", pct: 18, hex: "#ECE6DA", on: "#0B0C0E" },
  { name: "Papel", pct: 5, hex: "#E9E2D4", on: "#0B0C0E" },
  { name: "Ember", pct: 4, hex: "#EC6528", on: "#0B0C0E" },
  { name: "Datos", pct: 3, hex: "#6A8EE8", on: "#0B0C0E" },
];
const rgb = (hex: string) => `RGB ${[1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(" ")}`;

const PRODUCTS = [
  { name: "FIGHTCORE", hex: "#EC6528" },
  { name: "Scout", hex: "#6A8EE8" },
  { name: "Stats", hex: "#2EA67D" },
  { name: "History", hex: "#9E7DD4" },
  { name: "Campeones", hex: "#E3C16F" },
];

const FAMILY = ["Rating", "Rankings", "Scout", "Stats", "Records", "History", "Compare", "Events", "Database"];

export default function BrandPage() {
  const sample = divisionRanking("M-WW", 4);
  const sampleFighter = sample[0].fighter;
  return (
    <div className={s.page}>
      <header className={`wrap ${s.head}`}>
        <p className="label">Sistema de marca · v1.0</p>
        <h1 className={s.title}>Un instrumento para un deporte caótico</h1>
        <p className={`serif ${s.lede}`}>FIGHTCORE es la intersección de tres objetos: el expediente de scouting, el instrumento de laboratorio y el archivo histórico. Todo lo que ves aquí sale de esa idea.</p>
      </header>

      {/* LOGO */}
      <section className="wrap" aria-labelledby="b-logo">
        <SectionHead id="b-logo" round="C" kicker="Logo" title="Núcleo" lede="El octágono es la jaula; el cuadrado, el núcleo: lo esencial de cada combate, medido. Dos formas planas que se reconocen a 16 px, en un solo color y bordadas." />
        <div className={s.logoGrid}>
          <figure className={`${s.tile} ${s.tileHero}`}><NucleoMark size={200} /><figcaption>Símbolo · principal</figcaption></figure>
          <figure className={s.tile}><Logo /><figcaption>Horizontal</figcaption></figure>
          <figure className={s.tile}><Logo variant="stacked" /><figcaption>Apilada con lema</figcaption></figure>
          <figure className={s.tile}><Logo variant="compact" /><figcaption>Compacta</figcaption></figure>
          <figure className={s.tile}><Logo variant="wordmark" /><figcaption>Solo logotipo</figcaption></figure>
          <figure className={`${s.tile} ${s.tilePaper} paper`}><span className={s.onPaper}><Logo /></span><figcaption>Sobre papel</figcaption></figure>
          <figure className={`${s.tile} ${s.tileEmber}`}><span className={s.onEmber}><NucleoMark size={80} core="#ECE6DA" /></span><figcaption>Inversa sobre Ember</figcaption></figure>
          <figure className={s.tile}><span className={s.monoBone}><NucleoMark size={80} mono /></span><figcaption>Monocroma</figcaption></figure>
          <figure className={`${s.tile} ${s.tileBone}`}><span className={s.monoInk}><NucleoMark size={80} mono /></span><figcaption>Monocroma tinta</figcaption></figure>
        </div>

        <h3 className={s.h3}>Construcción</h3>
        <div className={s.construction}>
          <svg viewBox="-2 -2 28 28" width="260" height="260" aria-hidden>
            {Array.from({ length: 25 }, (_, i) => <line key={`v${i}`} x1={i} x2={i} y1={0} y2={24} stroke="var(--line)" strokeWidth="0.04" />)}
            {Array.from({ length: 25 }, (_, i) => <line key={`h${i}`} y1={i} y2={i} x1={0} x2={24} stroke="var(--line)" strokeWidth="0.04" />)}
            <rect x="-2" y="-2" width="28" height="28" fill="none" stroke="var(--corner-b)" strokeWidth="0.06" strokeDasharray="0.4 0.3" />
            <path d={OCTAGON} fill="none" stroke="var(--bone)" strokeWidth={MARK_SPEC.large.stroke} />
            <rect x="8.5" y="8.5" width="7" height="7" fill="var(--corner-a)" />
          </svg>
          <dl className={s.specList}>
            <div><dt>Rejilla</dt><dd>24 × 24 unidades</dd></div>
            <div><dt>Octágono</dt><dd>Regular · trazo 2,5 u · esquinas a inglete</dd></div>
            <div><dt>Núcleo</dt><dd>Cuadrado de 7 u, centrado</dd></div>
            <div><dt>Versión pequeña</dt><dd>&lt; 28 px: trazo 3,2 u y núcleo de 8 u para que no se empaste</dd></div>
            <div><dt>Zona de respeto</dt><dd>2 u alrededor (línea azul): nada entra en ese margen</dd></div>
            <div><dt>Tamaño mínimo</dt><dd>16 px en pantalla · 6 mm impreso</dd></div>
            <div><dt>Logotipo</dt><dd>Archivo Expanded ExtraBold (ancho 125, peso 800), espaciado +4 %, siempre en mayúsculas</dd></div>
            <div><dt>Separación</dt><dd>Símbolo–logotipo = media altura del símbolo</dd></div>
          </dl>
        </div>

        <h3 className={s.h3}>Color del núcleo por producto</h3>
        <p className={s.note}>El octágono nunca cambia. El núcleo puede tomar el color de la línea de producto; Ember es la marca principal.</p>
        <ul className={s.products}>
          {PRODUCTS.map((p) => (
            <li key={p.name}><NucleoMark size={56} core={p.hex} /><span><strong>{p.name}</strong><code>{p.hex}</code></span></li>
          ))}
        </ul>

        <h3 className={s.h3}>App y favicon</h3>
        <div className={s.icons}>
          <figure><span className={s.appIcon}><NucleoMark size={68} /></span><figcaption>iOS</figcaption></figure>
          <figure><span className={`${s.appIcon} ${s.round}`}><NucleoMark size={56} /></span><figcaption>Android adaptativo</figcaption></figure>
          <figure><span className={`${s.appIcon} ${s.round} ${s.themed}`}><NucleoMark size={56} mono /></span><figcaption>Android 13 tema</figcaption></figure>
          <figure><span className={s.favicons}>{[16, 24, 32, 48].map((z) => <span key={z} className={s.fav} style={{ width: z, height: z }}><NucleoMark size={Math.round(z * 0.8)} /></span>)}</span><figcaption>Favicon 16 · 24 · 32 · 48</figcaption></figure>
        </div>
      </section>

      {/* NAMING */}
      <section className={`wrap ${s.section}`} aria-labelledby="b-name">
        <SectionHead id="b-name" round="N" kicker="Naming" title="Una familia, no nombres sueltos" />
        <ul className={s.family}>
          {FAMILY.map((f) => (
            <li key={f}><span className={s.famFc}>FIGHTCORE</span><span className={s.famName}>{f}</span></li>
          ))}
        </ul>
      </section>

      {/* TYPE */}
      <section className={`wrap ${s.section}`} aria-labelledby="b-type">
        <SectionHead id="b-type" round="D" kicker="Tipografía" title="Tres voces" lede="Una sola familia de marca, Archivo, con su eje de anchura: expandida para el logotipo, estrecha para titulares, normal para la interfaz. Más una serif para el contexto y una mono para los datos. El lector sabe qué está leyendo antes de leerlo." />
        <div className={s.typeGrid}>
          <div className={`${s.spec} ${s.specWide}`}>
            <span className="label">Logotipo · Archivo Expanded · ancho 125 · 800 · +4 % · mayúsculas</span>
            <p className={s.specLogo}>FIGHTCORE</p>
            <p className={s.specGlyphs}>ABCDEFGHIJKLMNÑOPQRSTUVWXYZ 0123456789</p>
          </div>
          <div className={s.spec}>
            <span className="label">Display · Archivo wdth 62 · 800 · MAYÚSCULAS · lh 0.84</span>
            <p className={s.specDisplay}>Vasconcelos</p>
          </div>
          <div className={s.spec}>
            <span className="label">Número estadístico · Archivo wdth 75 · 700 · tabular</span>
            <p className={s.specNum}><RatingValue value={94.7} band={2.1} size="xl" /></p>
          </div>
          <div className={s.spec}>
            <span className="label">Heading · Archivo wdth 100 · 700 · −0.02em</span>
            <p className={s.specHeading}>Cómo gana. Cómo pierde.</p>
          </div>
          <div className={s.spec}>
            <span className="label">Contexto · Newsreader · 17–22 px · lh 1.45</span>
            <p className={s.specSerif}>Encaja 2,3 derribos de media en derrotas frente a 0,4 en victorias. <em>Sus derrotas llegan cuando le derriban.</em></p>
          </div>
          <div className={s.spec}>
            <span className="label">UI · Archivo wdth 100 · 400–600 · 15–16 px</span>
            <p className={s.specUi}>Filtrar por división, organización y estado. Ordenar por FCR.</p>
          </div>
          <div className={s.spec}>
            <span className="label">Metadata · JetBrains Mono · 11 px · +0.08em</span>
            <p className="mono" style={{ fontSize: 13 }}>UFC 331 · 2026.09.19 · R1 2:22 · 34.0°N 118.2°O</p>
          </div>
        </div>
      </section>

      {/* COLOR */}
      <section className={`wrap ${s.section}`} aria-labelledby="b-color">
        <SectionHead id="b-color" round="E" kicker="Color" title="El color codifica, no decora" lede="Neutros de instrumento, papel para el archivo y un sistema de esquinas para comparar. Paleta de esquinas validada para daltonismo (ΔE ≥ 13 entre pares adyacentes)." />
        <h3 className={s.h3}>Proporción</h3>
        <p className={s.note}>En cualquier pantalla: casi todo tinta y hueso; Ember solo donde hay que mirar primero.</p>
        <div className={s.ratio} role="img" aria-label="Proporción de uso: tinta 70 %, hueso 18 %, papel 5 %, Ember 4 %, colores de datos 3 %">
          {RATIO.map((r) => <span key={r.name} style={{ flexGrow: r.pct, background: r.hex, color: r.on }}><b>{r.name}</b> {r.pct} %</span>)}
        </div>

        <h3 className={s.h3}>Marca</h3>
        <ul className={s.swatches}>
          {BRAND.map((c) => (
            <li key={c.name} className={s.swatch}>
              <span className={s.chip} style={{ background: c.hex }} />
              <strong>{c.name}</strong><code>{c.hex} · {rgb(c.hex)}</code><span>{c.role}</span>
            </li>
          ))}
        </ul>
        <h3 className={s.h3}>Neutros</h3>
        <ul className={s.swatches}>
          {COLORS.map((c) => (
            <li key={c.token} className={s.swatch}>
              <span className={s.chip} style={{ background: c.hex }} />
              <strong>{c.name}</strong><code>{c.hex} · {rgb(c.hex)}</code><span>{c.role}{c.ratio ? ` · ${c.ratio} sobre Ink 0` : ""}</span>
            </li>
          ))}
        </ul>
        <h3 className={s.h3}>Esquinas</h3>
        <ul className={s.swatches}>
          {CORNERS.map((c, i) => (
            <li key={c.token} className={s.swatch}>
              <span className={s.chip} style={{ background: c.hex }}><b>{"ABCD"[i]}</b></span>
              <strong>{c.name}</strong><code>{c.hex}</code><span>{c.role}</span>
            </li>
          ))}
        </ul>
        <h3 className={s.h3}>Estado</h3>
        <ul className={s.swatches}>
          {STATUS.map((c) => (
            <li key={c.name} className={s.swatch}><span className={s.chip} style={{ background: c.hex }} /><strong>{c.name}</strong><code>{c.hex}</code><span>{c.role}</span></li>
          ))}
        </ul>
      </section>

      {/* LANGUAGE */}
      <section className={`wrap ${s.section}`} aria-labelledby="b-lang">
        <SectionHead id="b-lang" round="F" kicker="Lenguaje visual" title="Diez reglas" />
        <ol className={s.rules}>
          {[
            ["Rounds como estructura", "Las secciones largas se numeran como rounds. El tiempo real (4:12) es metadato."],
            ["Corner marks", "Las escuadras del logo enmarcan lo esencial. Una por vista."],
            ["Hairlines, no cajas", "Líneas de 1 px y rejilla de 12 columnas. Sin sombras decorativas."],
            ["El dato manda", "Lo más grande de cada bloque es un número o un nombre, nunca un icono."],
            ["Microtipografía técnica", "Índices, fuentes, coordenadas. Mono en mayúsculas con tracking."],
            ["Procedencia visible", "Oficial, importado, calculado, editorial o demo. Siempre."],
            ["Papel = contexto", "Historia y metodología cambian de soporte y de voz."],
            ["Sin fotos sin licencia", "La placa de expediente es identidad: iniciales, rejilla, carrera en código de barras."],
            ["Movimiento con función", "Count-up, interpolación, transición. Nada con reduced motion."],
            ["Nunca solo color", "Victoria sólida, derrota en contorno, empate a medias. Letras junto a colores."],
          ].map(([t, b], i) => (
            <li key={t}><span className={s.ruleNo}>{String(i + 1).padStart(2, "0")}</span><strong>{t}</strong><span>{b}</span></li>
          ))}
        </ol>
      </section>

      {/* COMPONENTS */}
      <section className={`wrap ${s.section}`} aria-labelledby="b-ds">
        <SectionHead id="b-ds" round="DS" kicker="Design system" title="Componentes" />
        <div className={s.ds}>
          <Demo title="Botones">
            <div className={s.row}><ButtonLink href="/brand">Primario</ButtonLink><ButtonLink href="/brand" variant="ghost">Secundario</ButtonLink><ButtonLink href="/brand" variant="quiet">Terciario →</ButtonLink></div>
          </Demo>
          <Demo title="Etiquetas y procedencia">
            <div className={s.row}><Tag>Neutra</Tag><Tag tone="accent">Nº 1 · FC Rankings</Tag><Tag tone="solid">Título</Tag><Tag tone="warning">Experimental</Tag></div>
            <div className={s.row}><Source kind="official" /><Source kind="imported" /><Source kind="calculated" /><Source kind="editorial" /><Source kind="demo" /></div>
          </Demo>
          <Demo title="Rating">
            <div className={s.row}><RatingValue value={84.4} band={3.6} size="lg" /><RatingValue value={62.1} band={5.7} size="md" /><RatingValue value={41.8} size="sm" provisional /></div>
          </Demo>
          <Demo title="Récord, forma y resultados">
            <div className={s.row}><RecordValue r={{ w: 18, l: 6, d: 1 }} size="md" /><FormStrip form={["W", "W", "L", "D", "W"]} size="md" /></div>
            <div className={s.row}><OutcomeMark o="W" /><OutcomeMark o="L" /><OutcomeMark o="D" /><OutcomeMark o="NC" /><OutcomeMark o={null} /></div>
          </Demo>
          <Demo title="Métricas">
            <dl className={s.row}><Stat label="Golpes sig./min" value="4,21" unit="SLpM" context="Media división 3,6" /><Stat label="Precisión" value="48%" context="+9% vs división" /></dl>
            <Meter value={72} reference={55} label="Percentil de golpeo" />
          </Demo>
          <Demo title="Distribución">
            <SegmentBar label="Por posición" segments={[{ key: "d", label: "Distancia", value: 60, tone: "bone" }, { key: "c", label: "Clinch", value: 15, tone: "bone-2" }, { key: "g", label: "Suelo", value: 25, tone: "ink" }]} />
          </Demo>
          <Demo title="Tale of the tape" wide>
            <TaleOfTape nameA="A" nameB="B" rows={[{ label: "Golpeo", a: 81, b: 64, max: 100 }, { label: "Lucha", a: 42, b: 88, max: 100 }, { label: "Defensa", a: 70, b: 71, max: 100 }]} />
          </Demo>
          <Demo title="Pestañas">
            <Tabs label="Demo" tabs={[{ id: "a", label: "Carrera", content: <p className="serif">Panel de carrera.</p> }, { id: "b", label: "Organización", content: <p className="serif">Panel de organización.</p> }, { id: "c", label: "División", content: <p className="serif">Panel de división.</p> }]} />
          </Demo>
          <Demo title="Placa de expediente">
            <div style={{ maxWidth: 180 }}><FighterPlate id={sampleFighter.id} firstName={sampleFighter.firstName} lastName={sampleFighter.lastName} country={sampleFighter.country} division={sampleFighter.divisionShort} career={sampleFighter.career} photo={sampleFighter.photo} title={sampleFighter.title} /></div>
          </Demo>
          <Demo title="País y dato no disponible">
            <div className={s.row}><CountryTag code="ESP" name="España" /><CountryTag code="JPN" name="Japón" /><Unavailable reason="sin datos" /><Unavailable reason="pendiente" /></div>
          </Demo>
          <Demo title="Carga">
            <div style={{ display: "grid", gap: 8 }}><Skeleton w="70%" /><Skeleton w="45%" /><Skeleton w="60%" h={40} /></div>
          </Demo>
          <Demo title="Estado vacío">
            <EmptyState title="Sin resultados" body="Ningún combate cumple estos filtros." />
          </Demo>
          <Demo title="Fila de ranking" wide>
            <RankingList rows={sample} caption="Ejemplo de ranking" />
          </Demo>
        </div>
      </section>
    </div>
  );
}

function Demo({ title, children, wide }: { title: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className={`${s.demo} ${wide ? s.demoWide : ""}`}>
      <p className="label">{title}</p>
      <div className={s.demoBody}>{children}</div>
    </div>
  );
}
