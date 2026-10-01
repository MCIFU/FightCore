# FIGHTCORE — Concepto de marca y producto

> THE CORE OF MMA · Documento de decisiones v0.1

Este documento fija las decisiones de marca, sistema visual y producto antes de construir. Todo lo implementado en el repositorio deriva de aquí. Cuando una decisión cambia, se cambia aquí primero.

---

## A. Brand concept — cómo debe sentirse

**FIGHTCORE es un instrumento de medida para un deporte caótico.**

El MMA es ruido: 15 o 25 minutos de intercambios, posiciones y decisiones. FIGHTCORE es el aparato que lo registra, lo ordena y lo archiva. La marca se siente como la intersección de tres objetos reales:

| Objeto | Qué aporta |
|---|---|
| **Expediente de scouting** | Rigor, etiquetas, campos, procedencia de cada dato |
| **Instrumento de laboratorio** | Precisión, escalas, líneas finas, lecturas numéricas |
| **Archivo histórico** | Memoria, fechas, capas de tiempo, tono editorial |

Tres palabras de producto (del brief) se convierten en tres **voces tipográficas**:

- **DATA** — lo que ocurrió → números tabulares y monoespaciada.
- **CONTEXT** — por qué importa → serif editorial.
- **INSIGHT** — qué aprendemos → sans de interfaz, directa.

Un usuario debería poder distinguir de un vistazo si está leyendo un dato, un contexto o una conclusión.

**Personalidad:** seria, precisa, sobria, con pulso. Sin hype, sin gritos, sin estética de apuestas.

---

## B. Tres direcciones visuales

### 1 · DOSSIER (archivo claro)
Papel hueso, tinta casi negra, serif editorial dominante, sellos y etiquetas mecanografiadas. Se siente como un expediente físico digitalizado.
- ✅ Muy original en el sector, gran identidad editorial.
- ❌ Poco nocturno (el consumo de MMA es de noche, en móvil, en directo). Las visualizaciones densas pierden impacto sobre papel.

### 2 · INSTRUMENT (oscuro técnico)
Grafito profundo, líneas finas, lecturas numéricas grandes, microtipografía técnica, un único color de señal cálido.
- ✅ Encaja con datos, directo y uso nocturno. Los números brillan.
- ❌ Riesgo real de caer en "dark dashboard" genérico si no tiene lenguaje propio.

### 3 · CANVAS (lona de octágono)
Blanco lona desgastado, manchas de color de esquina, tipografía gigante recortada, fotografía a sangre.
- ✅ Muy físico, muy "combate".
- ❌ Depende de fotografía con licencia que no tenemos; se degrada mucho sin ella. Próximo a estética de cartel promocional.

### Dirección elegida: **INSTRUMENT, con capas de DOSSIER**

Base oscura técnica (dirección 2) para la experiencia de datos, con **secciones invertidas en papel** (dirección 1) para historia, metodología y contexto editorial. El contraste entre "instrumento" y "archivo" es la firma de la marca, y resuelve el riesgo de dashboard genérico porque:

1. Introduce ritmo editorial (cambio de soporte = cambio de voz).
2. El lenguaje de **esquinas** (ver color) y de **rounds** (ver lenguaje) es específico del MMA.
3. No depende de fotografía.

---

## C. Logo — "Corner Mark"

**Concepto:** dos esquinas opuestas de la jaula que se encuentran en un núcleo.

```
 ┏━━          
 ┃     ■      
          ━━┛ 
```

- Las dos escuadras son **las esquinas roja y azul** en diagonal, como en cualquier combate.
- El cuadrado central es **el core**: el punto de encuentro, el centro de la jaula, el dato.
- A la vez es un **retículo / visor**: precisión, análisis, scouting.
- No es un octágono ni un puño. Funciona sin texto, a 16 px y bordado.

**Sistema:**
| Versión | Uso |
|---|---|
| Símbolo | App icon, favicon, avatar social, splash |
| Horizontal (símbolo + FIGHTCORE) | Navegación desktop, cabeceras |
| Compacta (símbolo + FC) | Navegación móvil, espacios estrechos |
| Apilada con tagline | Splash, redes, merchandising |
| Monocroma | Cualquier fondo, grabado, bordado |

El núcleo es el único elemento que puede llevar color (Ember). En monocromo, todo va a un tono.

**Wordmark:** `FIGHTCORE` en Archivo expandido (wdth 125), peso 800, tracking ligeramente positivo. "FIGHT" y "CORE" mismo peso: la marca es una sola palabra, no dos.

---

## D. Tipografía

Tres familias, todas con licencia OFL (Google Fonts), autoalojadas vía `next/font` (sin peticiones a terceros en runtime).

| Rol | Familia | Configuración |
|---|---|---|
| Display / nombres | **Archivo** variable (eje width 62–125) | wdth 62–75, peso 800, MAYÚSCULAS, lh 0.84, tracking −0.01em |
| Wordmark / etiquetas de marca | Archivo | wdth 125, peso 800, tracking +0.02em |
| Headings | Archivo | wdth 100, peso 700, lh 1.05, tracking −0.02em |
| UI / body funcional | Archivo | wdth 100, peso 400–500, 15–16 px, lh 1.5 |
| Contexto editorial | **Newsreader** (serif, óptica variable) | 17–22 px, lh 1.45, itálica para citas y notas |
| Metadata / coordenadas | **JetBrains Mono** | 11–12 px, MAYÚSCULAS, tracking +0.08em |
| Números estadísticos | Archivo | wdth 75, peso 700, `tabular-nums`, lh 0.9 |

**El número como objeto.** Un `94.7` se compone así: parte entera en Archivo condensado 700 a tamaño completo; separador y decimal al 55 % del tamaño, en color muted; unidad o banda de confianza (`±2.1`) en mono. Esto crea una silueta reconocible en todo el producto.

Por qué un eje de anchura: permite nombres larguísimos (`VASCONCELOS-ARRIETA`) en una línea sin cambiar de familia, y una jerarquía de "condensado = identidad / normal = lectura / expandido = marca".

---

## E. Color

**Regla principal: no negro+rojo.** El color no decora: codifica.

### Sistema de esquinas
En MMA cada luchador ocupa una esquina. FIGHTCORE convierte eso en su sistema de color para comparación:

| Token | Hex | Uso |
|---|---|---|
| `--corner-a` **Ember** | `#EC6528` | Luchador A / señal primaria de marca |
| `--corner-b` **Cobalt** | `#6A8EE8` | Luchador B |
| `--corner-c` **Jade** | `#2EA67D` | Luchador C (comparación de 3–4) |
| `--corner-d` **Iris** | `#9E7DD4` | Luchador D |

Ember es cálido pero no rojo (evita sangre/apuestas); Cobalt es frío y legible. La paleta se validó con un comprobador de daltonismo (banda de luminosidad, croma y ΔE OKLab ≥ 13 entre pares adyacentes en protanopía, deuteranopía y tritanopía). La primera propuesta usaba Bone como 4.º color y fallaba en croma: se sustituyó por Iris.

Para texto sobre fondo oscuro se usa un paso más claro de Ember (`--ember: #FF7A3D`, 7,5:1). Sobre papel, `--ember-ink: #A33B0B` (≥ 4,5:1).

### Neutros
| Token | Hex | Uso |
|---|---|---|
| `--ink-0` | `#0B0C0E` | Fondo |
| `--ink-1` | `#121418` | Superficie |
| `--ink-2` | `#1A1D22` | Superficie elevada |
| `--ink-3` | `#262A31` | Bordes fuertes |
| `--bone` | `#ECE6DA` | Texto principal (15,8:1 sobre ink-0) |
| `--bone-2` | `#B3ADA2` | Texto secundario (8,8:1) |
| `--bone-3` | `#8E897F` | Texto terciario / metadata (5,6:1 sobre ink-0; 4,9:1 sobre ink-2, AA) |
| `--paper` | `#E9E2D4` | Superficie editorial invertida |
| `--paper-ink` | `#15130F` | Texto sobre papel |

### Semánticos
| Token | Hex | Uso |
|---|---|---|
| `--success` | `#5CCB8F` | Estados correctos, subidas de ranking |
| `--warning` | `#F2B84B` | Datos provisionales, pendientes |
| `--danger` | `#FF6B6B` | Errores de sistema (nunca para "derrota") |

**Resultados (W/L/D/NC) nunca dependen solo del color.** Victoria = bloque sólido, derrota = contorno, empate = mitad, NC = tachado. Además siempre llevan letra.

---

## F. Design language — reglas visuales

1. **Rounds como estructura.** Las secciones largas se numeran como rounds (`R1`, `R2`…) y el tiempo (`4:12`) aparece como metadato real. Es el ritmo natural del deporte.
2. **Corner marks.** Las escuadras del logo enmarcan los elementos clave (rating, combate destacado). Se usan con moderación: máximo un encuadre por vista.
3. **Hairlines, no cajas.** La estructura se construye con líneas de 1 px y rejilla editorial de 12 columnas, no con tarjetas con sombra.
4. **El dato manda.** El elemento más grande de cada bloque es un número o un nombre, nunca un icono.
5. **Microtipografía técnica.** Etiquetas mono con índice (`03 / RATING`), fuentes de datos (`SRC · DEMO`), coordenadas de ciudad en eventos.
6. **Procedencia visible.** Cada bloque de datos declara su origen: `OFFICIAL`, `IMPORTED`, `CALCULATED`, `EDITORIAL` o `DEMO`.
7. **Papel = contexto.** Las secciones de historia y metodología se invierten a papel y cambian a voz serif.
8. **Sin fotografía sin licencia.** Solo fotos de Wikimedia Commons con licencia libre, recortadas a cabeza y hombros con fondo transparente dentro de la "placa de expediente" (rejilla, país, coordenadas y carrera en código de barras), siempre con autor, licencia y enlace al original. Sin foto libre, la placa muestra las iniciales. Los luchadores ficticios del modo demo usan un retrato ilustrado etiquetado como ilustración.
11. **Oro solo para títulos.** `--gold` y el icono de cinturón se reservan a los campeones vigentes; nunca se usan para otra cosa.
9. **Movimiento con función.** Count-up del rating, interpolación de gráficos, transición de ranking. Todo desactivado con `prefers-reduced-motion`.
10. **Nada de degradados decorativos, glassmorphism ni neones.**

---

## G. Homepage — arquitectura y composición

La home es un **número de revista del día**, leída como una pelea de 5 rounds:

| Bloque | Contenido | Composición |
|---|---|---|
| Masthead | Fecha, "edición", búsqueda central | Banda fina tipo cabecera de periódico |
| **Hero** | FIGHTCORE / THE CORE OF MMA + combate destacado | Tipografía gigante a la izquierda, "tale of the tape" instrumental a la derecha con barras enfrentadas A/B |
| R1 · Próximos eventos | Eventos futuros | Línea temporal horizontal con fechas como marcas, no tarjetas |
| R2 · Últimos resultados | Resultados recientes | Libro de resultados: filas densas `KO/TKO · R2 · 3:41` |
| R3 · Rankings | FIGHTCORE Rankings por división | Lista con rating, banda de confianza y movimiento |
| R4 · Luchadores | 3 luchadores destacados | Placas de expediente asimétricas (1 grande + 2) |
| R5 · Récords | Récords del dataset | Números gigantes editoriales |
| Tendencias | Lo que se mueve | Columna lateral compacta |
| Historia | Acceso al archivo | Sección invertida en papel, línea 1993 → hoy |
| Explorar | Universo de datos | Índice tipográfico tipo índice de libro, con recuentos |

---

## H. Fighter profile — arquitectura

La página es un **expediente** y responde, en orden, a las preguntas del brief:

| # | Pregunta | Sección |
|---|---|---|
| 0 | ¿Quién es? ¿Qué nivel tiene? | Hero: placa, nombre, apodo, país, división, récord, ranking, org, **FCR** |
| 1 | ¿Qué dicen los datos? | **Lectura rápida**: 3–5 observaciones generadas por reglas, con evidencia (`n=`) |
| 2 | ¿Qué nivel tiene exactamente? | **Rating**: número, banda de confianza, contribución de cada factor (barra apilada) y atributos por percentil |
| 3 | ¿Cómo gana / cómo pierde? | **Récord**: carrera vs organización vs división; métodos de victoria y derrota |
| 4 | ¿Cómo pelea? | **Estilo**: dónde golpea (distancia/clinch/suelo), a qué objetivo, firma de estilo |
| 5 | ¿Con qué calidad? | **Rendimiento**: métricas con contexto (vs división / vs carrera / últimos 5) |
| 6 | ¿Cómo llega? | **Forma**: últimos 5 con método, rival, evento y rating antes→después |
| 7 | ¿Cómo ha evolucionado? | **Carrera** (timeline interactiva) + **Evolución** (series) |
| 8 | ¿Contra quién? | **Rivales**: tabla filtrable y navegable |
| 9 | ¿Cómo se compara? | Acceso directo a Compare con rivales sugeridos |

Navegación interna fija con anclas. En móvil: pestañas horizontales con scroll y tablas convertidas en listas.

---

## I. FIGHTCORE Rating (FCR) — concepto

**Qué es:** una métrica propia 0–100 que resume el rendimiento competitivo demostrado de un luchador. **No es** una predicción ni "la verdad sobre quién es mejor".

**Modelo v0.1 — ocho factores transparentes:**

| Factor | Peso | Qué mide |
|---|---|---|
| Performance | 20 % | Dominio estadístico por combate (diferencial de golpes, derribos, control, knockdowns) |
| Opponent quality | 20 % | Fuerza media de los rivales en el momento del combate |
| Win quality | 15 % | Victorias ponderadas por rival y método |
| Recent form | 15 % | Últimos 5 combates con decaimiento temporal |
| Championship | 10 % | Rendimiento en combates por título y main events |
| Finishing | 8 % | Tasa de finalización con suavizado por muestra |
| Defense | 7 % | Defensa de golpeo, de derribo y durabilidad |
| Activity | 5 % | Actividad en los últimos 24 meses |

**Decisiones diferenciales:**
- **Banda de confianza.** Cada rating se publica como `94.7 ±2.1`. Con pocas peleas, la banda es ancha y el rating es *provisional* (<3 combates). Esto es más honesto que cualquier ranking publicado hoy.
- **Contribución visible.** Siempre se puede ver cuántos puntos aporta cada factor.
- **Versionado.** El modelo lleva versión (`FCR v0.1`). Un cambio de modelo se documenta en `/methodology`.
- **Histórico.** El rating se recalcula tras cada combate, lo que permite ver su evolución.

**Crítica al brief:** "Fight IQ" no se puede medir honestamente con estadísticas de caja. Lo sustituyo por **Adaptación**: variación del diferencial de rendimiento entre el primer round y los siguientes. Es medible, se explica y se marca como experimental.

---

## Datos reales

Desde octubre de 2026 el proveedor por defecto es un **snapshot real de UFC** (1993–hoy): resultados y estadísticas por asalto de UFCStats, nacionalidad y foto vía Wikidata, plantilla, campeones actuales, récord profesional total y carteleras programadas de Wikipedia. Cada fuente se nombra en `/credits`. Decisiones:

- **Cobertura UFC, no "todo el MMA".** Es la única organización con estadísticas por asalto públicas y verificables. Las demás organizaciones siguen como entidades editoriales y declaran "fuera de la cobertura actual" en vez de mostrar datos inventados.
- **Fotos oficiales descartadas.** Las de UFC, agencias o webs como Tapology tienen derechos reservados; el brief prohíbe usar fotos sin licencia. Se usan solo fotos libres de Commons.
- **Sin dato, sin número.** Altura, alcance, país o fecha de nacimiento que ninguna fuente da quedan como "—"; el récord previo a UFC solo se suma cuando Wikipedia da el total profesional.
- **Linaje de cinturones.** Se reconstruye con los combates por título y se coteja con los campeones actuales de Wikipedia, porque vacantes y ascensos de interinos no pasan por un combate.

## Datos de demostración

Para desarrollo sigue disponible (`DATA_PROVIDER=demo`) un **universo simulado determinista**: ~140 luchadores ficticios que compiten entre 2013 y 2026 bajo un motor de simulación por rounds. Todo el dataset lleva procedencia `DEMO` y la interfaz lo indica permanentemente.

- **Luchadores, combates y eventos: ficticios.** No se usan nombres de luchadores reales para no atribuir estadísticas inventadas a personas reales.
- **Organizaciones: reales como entidades**, solo con metadatos editoriales verificables (país, años de actividad). Los eventos demo usan nomenclatura explícita (`UFC Demo 14`) para no confundirse con eventos reales.
- **Datos desconocidos se muestran como desconocidos** (p. ej. recintos, algunos años de fundación).

## Stack

- Next.js (App Router) + React + TypeScript.
- CSS Modules + custom properties (sin framework CSS: evita el aspecto de plantilla y peso innecesario).
- Gráficos SVG propios (sin librería): menos de 10 KB, accesibles, con identidad propia. Revisar si aparecen necesidades que justifiquen una librería.
- Capa de datos detrás de un repositorio (`lib/data`). Proveedores intercambiables: snapshot real (por defecto), demo en memoria o PostgreSQL (`DATA_PROVIDER=postgres`), con esquema SQL canónico en `db/schema.sql` y sin ORM (acceso de solo lectura, volumen pequeño).
