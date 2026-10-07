# FIGHTCORE — Documentación técnica

Plataforma de datos, historia y scouting de MMA. Rating propio transparente (FCR), rankings separados de los oficiales, expedientes de luchador, comparación visual y búsqueda global.

> **Datos reales de UFC (1993–hoy).** Resultados y estadísticas por asalto de [UFCStats](http://ufcstats.com/) vía el espejo [scrape_ufc_stats](https://github.com/Greco1899/scrape_ufc_stats); nacionalidad y foto de Wikidata (CC0); plantilla actual, campeones actuales, récord profesional total y carteleras programadas de Wikipedia (CC BY-SA 4.0). Lo que ninguna fuente dice queda como «sin datos». FIGHTCORE no está afiliado a UFC ni a ninguna organización. El universo simulado sigue disponible para desarrollo con `DATA_PROVIDER=demo`.

## Arrancar

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # modelo FCR, integridad del dataset, búsqueda (+ paridad PostgreSQL si hay DATABASE_URL)
npm run typecheck
npm run build
npm run import:ufc       # descarga y normaliza el snapshot real → data/snapshot/ufc.json.gz
npm run photos:find      # busca en Commons fotos para quien no tiene una en Wikidata
npm run photos:fetch     # fotos de Wikimedia Commons con licencia libre (≈1 petición/s)
npm run photos:process   # recorte de cara + fondo transparente → public/photos/*.webp
npm run portraits        # retratos ilustrados del modo demo (public/portraits)
npm run geo        # regenera la geometría del mapa (lib/geo/world.json)
```

### PostgreSQL

```bash
createdb fightcore
DATABASE_URL=postgres://usuario:clave@localhost/fightcore npm run db:seed   # esquema + datos + ratings
DATA_PROVIDER=postgres DATABASE_URL=postgres://… npm run build              # la app lee de PostgreSQL
```

`db/schema.sql` es el esquema canónico (12 tablas: hechos con procedencia + ratings calculados). El seed carga el snapshot real (`SEED_SOURCE=demo` para el universo simulado). Un test verifica que PostgreSQL y el proveedor en memoria producen exactamente los mismos ratings.

### Proveedores de datos

| `DATA_PROVIDER` | Origen |
|---|---|
| *(vacío)* | Snapshot real en `data/snapshot`: UFC con estadísticas + resultados de otras 13 organizaciones (por defecto) |
| `demo` | Universo simulado determinista (`lib/demo`) |
| `postgres` | Base de datos (`DATABASE_URL`) |

El importador cruza las fuentes así: los combates de UFCStats definen luchadores, eventos y estadísticas; Wikidata se enlaza por nombre y fecha de nacimiento; la plantilla de Wikipedia marca quién está en activo y aporta el récord profesional total (lo previo a UFC = total − UFC). El linaje de cinturones se reconstruye con los combates por título y se coteja con los campeones actuales de Wikipedia (vacantes y ascensos de interinos no pasan por un combate). Los eventos programados salen de la página de cada evento en Wikipedia.

**Otras organizaciones** (`npm run import:orgs`): PFL, Bellator, RIZIN, KSW, Cage Warriors, LFA, Strikeforce, WEC, PRIDE, DREAM, Pancrase y Shooto, desde la API pública de ESPN (eventos, combates en orden de cartelera, resultado, asalto y tiempo; atletas con fecha de nacimiento, altura, alcance, guardia, equipo y estilo). Un atleta de ESPN se une a su ficha UFC por el enlace ya conocido o por nombre + fecha de nacimiento (±2 días, o un único homónimo cuya fecha difiere por una errata típica: año cambiado, día y mes cruzados); los combates con un luchador sin identificar se descartan. Estas organizaciones no publican estadísticas de golpeo: cuentan para récord, índice de fuerza y rating (con el factor Dominio en neutro), no para métricas. Los títulos salen de los combates que ESPN marca como título (`competition.types`), sin torneos ni cinturones regionales; ESPN no registra vacantes, así que un reinado sigue vigente solo si su dueño pelea allí en los últimos 600 días. **ONE Championship, y KSW y RIZIN desde 2025** (`npm run import:wiki-orgs`): ESPN no cubre ONE y dejó de cubrir KSW y RIZIN tras 2024. Se toman de Wikipedia (CC BY-SA 4.0): las páginas «YYYY in ONE Championship», «YYYY in Konfrontacja Sztuk Walki» y «YYYY in Rizin Fighting Federation» y el artículo de cada evento que lo tiene. Solo combates de MMA: los de muay thai, kickboxing, grappling, exhibiciones y reglas especiales se descartan. Las clases de ONE se asignan por nombre (su «flyweight» pesa 61,2 kg). Los títulos y su linaje, de todas las fuentes juntas, se calculan al cargar (`lib/data/lineage.ts`).

**Duplicados** (`lib/data/dedupe.ts`, `npm run check:duplicates`): al cargar, los registros de una misma persona en varias fuentes se funden (mismo nombre normalizado; fechas de nacimiento compatibles o a menos de 2,5 años con la misma división o la contigua; nunca dos combates el mismo día ni enfrentados entre sí). Los homónimos con fechas o pesos incompatibles quedan separados.

`npm run enrich:wiki` añade el lugar de nacimiento desde las fichas de Wikipedia.

## Desplegar en Vercel

1. En vercel.com → **Add New… → Project** → importar el repositorio de GitHub.
2. **Framework:** Next.js (se detecta solo). Build `next build`, sin variables obligatorias.
3. **Production Branch** (Settings → Git): la rama que quieras publicar.
4. Opcional, en Settings → Environment Variables:
   - `NEXT_PUBLIC_SITE_URL` = dominio propio (`https://…`), para enlaces canónicos y Open Graph. Si falta, se usa el dominio de producción de Vercel.
   - `PHOTO_SOURCE=free` para publicar solo fotos con licencia libre (sin retratos oficiales).

El build genera ~1.550 páginas estáticas (unos 3 minutos). El resto de fichas de luchador y combate se generan bajo demanda; el snapshot de datos viaja con cada función (`outputFileTracingIncludes` en `next.config.ts`). Las imágenes se sirven sin el optimizador de Vercel (`images.unoptimized`): los retratos ya están comprimidos y así no se agota la cuota gratuita.

## Actualización semanal de datos

`.github/workflows/weekly-data.yml` se ejecuta cada lunes a las 08:00 hora de España (Europe/Madrid; GitHub solo admite UTC, así que hay dos horarios, 06:00 y 07:00 UTC, y un primer paso deja pasar solo el que corresponde según el horario de verano o de invierno) y a mano desde Actions → «Actualización semanal de datos» → Run workflow:

1. UFC con `--refresh` (UFCStats, Wikidata, Wikipedia), lugares de nacimiento y retratos oficiales de los luchadores nuevos.
2. Otras organizaciones de ESPN y ONE/KSW/RIZIN de Wikipedia. La caché de descargas se guarda entre ejecuciones; los resultados recientes y los carteles caducan (3–5 días), los antiguos no se vuelven a pedir.
3. Recorte de los retratos nuevos (`process-photos.py --official-only`; los ya recortados se conservan).
4. Comprobaciones: tipos, tests, duplicados y build. Si algo falla, no se publica nada.
5. Commit de `data/snapshot` y `public/photos/official` en la rama en la que corre; Vercel vuelve a desplegar.

GitHub solo ejecuta las tareas programadas desde la rama principal del repositorio: el archivo tiene que estar en ella. La primera ejecución tarda más (rellena la caché, unos 30–60 min).

## Modo claro

Botón de sol/luna en la cabecera. Sin elección guardada se sigue la preferencia del sistema; la elección se guarda en el dispositivo. El tema se aplica antes de pintar (`components/layout/theme-script.ts`), así que no hay destello. Los colores son tokens en `app/globals.css` (`:root[data-theme="light"]`).

## Rendimiento y experiencia en móvil

Lighthouse móvil (4G lenta y CPU ×4), build de producción:

| Página | Antes | Ahora | Bloqueo (TBT) |
|---|---|---|---|
| Portada | 43 | 87 | 3.050 → 60 ms |
| Rankings | 69 | 89 | 310 → 70 ms |
| Eventos | 60 | 87 | 430 → 130 ms (43.668 → 569 elementos) |
| Luchadores | 75 | 80 | CLS 0,41 → 0 |
| Perfil | 87 | 87 | |

- Sin `loading.tsx` global: escondía el contenido ya renderizado hasta que corría un script al final del HTML (≈4 s más de LCP en móvil). En su lugar, barra de progreso al navegar (`NavProgress`).
- Pestañas que solo pintan la abierta (`Tabs`); el histórico de eventos va por años (`/events/archivo/[año]`).
- La aparición al hacer scroll ya no oculta lo que está en pantalla al cargar (`Reveal`).
- Fuente de lectura con `display: optional` (sin redibujar texto) y mono sin precarga.
- Transiciones entre páginas (`<ViewTransition>`), cabecera y barra inferior que se apartan al bajar y vuelven al subir (`ScrollDirection`), deslizar entre apartados del perfil, «volver arriba», respuesta visual al tocar, campos de texto sin zoom en iOS y el índice de búsqueda empieza a descargarse al tocar el botón.

## Estructura

| Carpeta | Qué contiene |
|---|---|
| `docs/CONCEPT.md` | Marca, direcciones visuales, logo, tipografía, color, lenguaje visual, arquitectura de home y perfil, concepto FCR |
| `lib/domain` | Tipos del dominio y datos de referencia (divisiones, organizaciones, países, historia) |
| `lib/demo` | Proveedor demo: universo simulado 2013–2026 |
| `lib/rating` | Modelo FCR v0.1 (8 factores, pesos públicos, banda de incertidumbre) |
| `lib/analytics` | Agregados de carrera, atributos por percentil, observaciones de scouting con evidencia |
| `lib/data` | Store y repositorio: la única API que usa la UI. Sustituir el proveedor no toca la UI |
| `db/schema.sql` | Esquema PostgreSQL canónico |
| `lib/data/providers` | Proveedores snapshot (datos reales) y PostgreSQL; el demo vive en `lib/demo` |
| `data/snapshot` | Snapshot real comprimido + metadatos de fotos (autor, licencia, origen) |
| `lib/portraits` | Generador de retratos ilustrados |
| `lib/geo` | Geometría mundial proyectada para el mapa |
| `scripts` | Importador UFC, pipeline de fotos, seed de base de datos, retratos demo, geometría |
| `components` | Design system: primitivas, gráficos SVG propios, búsqueda, layout |
| `app` | Rutas (App Router) |

## Rutas

`/` · `/fighters` · `/fighters/[slug]` · `/compare?f=a,b,c,d` · `/rankings` · `/champions` · `/events` · `/events/[slug]` · `/fights/[id]` · `/records?scope=…` · `/history` · `/map` · `/organizations` · `/organizations/[slug]` · `/scout?f=` · `/matchup?a=&b=` · `/stats` · `/methodology` · `/credits` · `/brand` · `/offline`.

## Fotografías

**Por defecto: retratos oficiales de estudio de UFC** (© UFC), obtenidos de las fichas de atleta de ESPN. `npm run photos:espn` busca a cada luchador por nombre, descarta homónimos comparando la fecha de nacimiento, descarga el retrato (PNG transparente) y guarda también equipo y estilo base; `npm run photos:process` lo recorta a un busto cuadrado de 400×400 que termina en el borde inferior del original. Quien no tiene retrato oficial muestra sus iniciales.

⚠ Estos retratos tienen copyright de UFC. Sirven para uso privado y para enseñar el proyecto; para publicar la web o la app hace falta permiso. `PHOTO_SOURCE=free` cambia a las fotos con licencia libre de Wikimedia Commons (`photos:find`, `photos:fetch`, `photos:process`), con autor y licencia en `/credits`.

Requisitos del procesado: `pip install opencv-python-headless mediapipe==0.10.14` y, opcional, `pngquant`.

## PWA

Instalable (manifest + iconos). El service worker guarda las páginas visitadas y el índice de búsqueda para uso sin conexión y muestra `/offline` cuando no hay copia.

## Calidad

- WCAG 2.2 AA: 0 infracciones de axe-core en las páginas principales; navegación por teclado, `prefers-reduced-motion`, tablas alternativas en gráficos, resultados nunca codificados solo por color.
- Paleta de esquinas validada para daltonismo (ΔE OKLab ≥ 13).
- Sin librerías de gráficos ni de CSS: SVG y CSS Modules propios. Tipografías autoalojadas con `next/font`.
- SEO: metadata por página, canonical, Open Graph, `sitemap.xml`, `robots.txt`, JSON-LD (`Person`, `SportsEvent`), manifest PWA.
