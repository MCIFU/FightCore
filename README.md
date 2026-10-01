# FIGHTCORE — The core of MMA

Plataforma de datos, historia y scouting de MMA. Rating propio transparente (FCR), rankings separados de los oficiales, expedientes de luchador, comparación visual y búsqueda global.

> **Dataset de demostración.** Luchadores, combates y eventos son ficticios y proceden de una simulación determinista por rounds (`lib/demo`). Las organizaciones son entidades reales descritas solo con metadatos verificables; los datos desconocidos se muestran como tal. FIGHTCORE no está afiliado a ninguna organización.

## Arrancar

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # modelo FCR, integridad del dataset, búsqueda (+ paridad PostgreSQL si hay DATABASE_URL)
npm run typecheck
npm run build
npm run portraits  # regenera los retratos PNG (public/portraits)
npm run geo        # regenera la geometría del mapa (lib/geo/world.json)
```

### PostgreSQL

```bash
createdb fightcore
DATABASE_URL=postgres://usuario:clave@localhost/fightcore npm run db:seed   # esquema + datos + ratings
DATA_PROVIDER=postgres DATABASE_URL=postgres://… npm run build              # la app lee de PostgreSQL
```

`db/schema.sql` es el esquema canónico (12 tablas: hechos con procedencia + ratings calculados). Sin `DATA_PROVIDER=postgres` la app usa el universo demo en memoria. Un test verifica que ambos proveedores producen exactamente los mismos ratings.

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
| `lib/data/providers` | Proveedor PostgreSQL (el demo vive en `lib/demo`) |
| `lib/portraits` | Generador de retratos ilustrados |
| `lib/geo` | Geometría mundial proyectada para el mapa |
| `scripts` | Seed de base de datos, retratos, geometría |
| `components` | Design system: primitivas, gráficos SVG propios, búsqueda, layout |
| `app` | Rutas (App Router) |

## Rutas

`/` · `/fighters` · `/fighters/[slug]` · `/compare?f=a,b,c,d` · `/rankings` · `/champions` · `/events` · `/events/[slug]` · `/fights/[id]` · `/records?scope=…` · `/history` · `/map` · `/organizations` · `/organizations/[slug]` · `/scout?f=` · `/matchup?a=&b=` · `/stats` · `/methodology` · `/brand` · `/offline`.

## Retratos

Los luchadores del dataset son ficticios, así que no existen fotografías suyas. Cada uno tiene un retrato ilustrado generado de forma determinista a partir de su perfil (país, sexo, edad, peso, estilo), exportado como PNG transparente de 512×512 y marcado en la interfaz como «Ilustración · no es una fotografía». El campo `photo` (`kind: "illustration" | "licensed"`, crédito y fecha) permite sustituirlo por fotografía con licencia cuando se conecten datos reales.

## PWA

Instalable (manifest + iconos). El service worker guarda las páginas visitadas y el índice de búsqueda para uso sin conexión y muestra `/offline` cuando no hay copia.

## Calidad

- WCAG 2.2 AA: 0 infracciones de axe-core en las páginas principales; navegación por teclado, `prefers-reduced-motion`, tablas alternativas en gráficos, resultados nunca codificados solo por color.
- Paleta de esquinas validada para daltonismo (ΔE OKLab ≥ 13).
- Sin librerías de gráficos ni de CSS: SVG y CSS Modules propios. Tipografías autoalojadas con `next/font`.
- SEO: metadata por página, canonical, Open Graph, `sitemap.xml`, `robots.txt`, JSON-LD (`Person`, `SportsEvent`), manifest PWA.
