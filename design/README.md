# Rediseño · tres conceptos

Prototipos estáticos de la portada, construidos con datos reales del snapshot (`data.json`). **Elegido: B · Octágono**, ya aplicado a toda la web.

| Concepto | Archivo | Capturas |
|---|---|---|
| A · Almanaque | `concepts/a-almanaque.html` | `capturas/a-almanaque-*.png` |
| B · Octágono | `concepts/b-octagono.html` | `capturas/b-octagono-*.png` |
| C · Cartel | `concepts/c-cartel.html` | `capturas/c-cartel-*.png` |

Regenerar: `node design/a.mjs` (y `b`, `c`). Capturas: `node design/shot.mjs <concepto> <carpeta>` y `node design/first.mjs <carpeta>`.

`dump.mts` vuelca los datos desde `lib/data/repository.ts`; necesita ejecutarse con `"type": "module"` en package.json y el paquete `server-only` neutralizado, así que se restaura todo al terminar.
