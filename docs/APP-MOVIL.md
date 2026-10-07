# App móvil con PWABuilder

FIGHTCORE ya es una PWA completa: se instala desde el navegador y PWABuilder la empaqueta como app de **Android (Google Play)**, **iOS** y **Windows** sin cambiar el código. La app abre la web publicada a pantalla completa y se actualiza sola cada vez que se actualiza la web (también con la actualización semanal de datos).

## Lo que ya está preparado

| Requisito de PWABuilder | Dónde |
|---|---|
| Manifest completo: id, nombre, descripción, idioma, `start_url`, `scope`, `display` + `display_override`, orientación, colores, categorías, `launch_handler`, `share_target` | `app/manifest.ts` → `/manifest.webmanifest` |
| Iconos 48–512 px, maskable 192/512, monocromo (Android 13), SVG | `public/icons/` (`npm run icons`) |
| Capturas para la tienda: 4 de móvil (1080×2340) y 2 de escritorio (1920×1080) | `public/screenshots/` (`npm run screenshots`) |
| Accesos directos con icono (mantener pulsado el icono de la app) | Luchadores, Rankings, Campeones, Eventos |
| Service worker con modo sin conexión (páginas y retratos visitados, página `/offline`) | `public/sw.js` |
| Digital Asset Links para Android (abrir sin barra del navegador) | `/.well-known/assetlinks.json` (variables de entorno) |
| iOS: pantalla completa, nombre e icono | `appleWebApp` en `app/layout.tsx`, `app/apple-icon.png` |
| Botón «atrás» propio en la cabecera cuando corre como app | `components/layout/AppBack.tsx` |
| HTTPS | Vercel |

## Android (Google Play), paso a paso

1. **Publica la web** en Vercel con su dominio definitivo (la app abre esa dirección; si cambia el dominio, hay que regenerar la app).
2. Entra en <https://www.pwabuilder.com>, pega la URL y pulsa **Start**. Debe salir el manifest, el service worker y la seguridad en verde.
3. **Package For Stores → Android → Generate Package**. Opciones recomendadas:
   - **Package ID**: `app.fightcore.twa` (o el dominio al revés, p. ej. `com.tudominio.fightcore`; no se puede cambiar después de publicar).
   - **App name**: FIGHTCORE · **Launcher name**: FIGHTCORE.
   - **Theme color / background**: `#0B0C0E` (ya vienen del manifest).
   - **Display mode**: Standalone · **Notifications**: desactivadas (la web no envía notificaciones).
   - **Signing key**: *Create new* (la primera vez).
4. Descarga el ZIP. Contiene:
   - `app-release-bundle.aab` → lo que se sube a Google Play.
   - `signing.keystore` + `signing-key-info.txt` → **guárdalos fuera del repositorio y haz copia**: sin ellos no podrás publicar actualizaciones de la app.
   - `assetlinks.json` → contiene la huella SHA-256 de tu clave.
5. **Vincula la app con la web** en Vercel → Settings → Environment Variables (Production) y vuelve a desplegar:
   - `ANDROID_PACKAGE_NAME` = el Package ID del paso 3.
   - `ANDROID_SHA256_FINGERPRINTS` = la huella del `assetlinks.json` del ZIP (`AB:CD:…`).
   Comprueba que `https://tu-dominio/.well-known/assetlinks.json` la muestra.
6. **Google Play Console** (cuenta de desarrollador, pago único de 25 $): crea la app, sube el `.aab` en *Prueba interna* y rellena la ficha (las capturas de `public/screenshots/` sirven).
7. Google firma las apps con su propia clave (*Play App Signing*). En Play Console → *Integridad de la app* → *Firma de apps*, copia la **huella SHA-256 de la clave de firma de apps** y añádela a `ANDROID_SHA256_FINGERPRINTS` separada por coma: `TU_HUELLA,HUELLA_DE_GOOGLE`. Vuelve a desplegar.
8. Instala la versión de prueba interna en el móvil: si se abre sin barra del navegador arriba, el vínculo está bien.

## iOS y Windows

- **iOS**: PWABuilder genera un proyecto de Xcode; hace falta un Mac con Xcode y una cuenta de Apple Developer (99 $/año) para publicarlo en el App Store. Mientras tanto, en iPhone se instala desde Safari → Compartir → *Añadir a pantalla de inicio*.
- **Windows**: PWABuilder genera el paquete para Microsoft Store (cuenta de Partner Center).

## Antes de publicar en tiendas

Los retratos oficiales son © de cada organización (UFC, PFL…). En una tienda de apps es más probable una reclamación que en una web. Para la versión de tienda se puede publicar la web con `PHOTO_SOURCE=free` (solo fotos con licencia libre) o retirar los retratos.

## Mantenimiento

- Iconos: `npm run icons`. Capturas: `npm run build && npm start` y, en otra terminal, `npm run screenshots`.
- Cambiar el manifest o el service worker no exige regenerar la app: la app carga la web. Solo hace falta un paquete nuevo si cambia el dominio, el Package ID o se quiere subir la versión en la tienda.
