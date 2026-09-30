# FIGHTCORE — The core of MMA

Plataforma de datos, historia y scouting de MMA. Rating propio transparente (FCR), rankings separados de los oficiales, expedientes de luchador, comparación visual y búsqueda global.

> **Dataset de demostración.** Luchadores, combates y eventos son ficticios y proceden de una simulación determinista por rounds (`lib/demo`). Las organizaciones son entidades reales descritas solo con metadatos verificables; los datos desconocidos se muestran como tal. FIGHTCORE no está afiliado a ninguna organización.

## Arrancar

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # modelo FCR, integridad del dataset, búsqueda
npm run typecheck
npm run build
```

## Estructura

| Carpeta | Qué contiene |
|---|---|
| `docs/CONCEPT.md` | Marca, direcciones visuales, logo, tipografía, color, lenguaje visual, arquitectura de home y perfil, concepto FCR |
| `lib/domain` | Tipos del dominio y datos de referencia (divisiones, organizaciones, países, historia) |
| `lib/demo` | Proveedor demo: universo simulado 2013–2026 |
| `lib/rating` | Modelo FCR v0.1 (8 factores, pesos públicos, banda de incertidumbre) |
| `lib/analytics` | Agregados de carrera, atributos por percentil, observaciones de scouting con evidencia |
| `lib/data` | Store y repositorio: la única API que usa la UI. Sustituir el proveedor no toca la UI |
| `db/schema.prisma` | Modelo relacional para PostgreSQL (fase 2) |
| `components` | Design system: primitivas, gráficos SVG propios, búsqueda, layout |
| `app` | Rutas (App Router) |

## Rutas

`/` · `/fighters` · `/fighters/[slug]` · `/compare?f=a,b,c,d` · `/rankings` · `/events` · `/events/[slug]` · `/fights/[id]` · `/records` · `/history` · `/organizations` · `/organizations/[slug]` · `/methodology` · `/brand` · `/scout` y `/stats` (fase 3, sin contenido de relleno).

## Calidad

- WCAG 2.2 AA: 0 infracciones de axe-core en las páginas principales; navegación por teclado, `prefers-reduced-motion`, tablas alternativas en gráficos, resultados nunca codificados solo por color.
- Paleta de esquinas validada para daltonismo (ΔE OKLab ≥ 13).
- Sin librerías de gráficos ni de CSS: SVG y CSS Modules propios. Tipografías autoalojadas con `next/font`.
- SEO: metadata por página, canonical, Open Graph, `sitemap.xml`, `robots.txt`, JSON-LD (`Person`, `SportsEvent`), manifest PWA.
