import type { MetadataRoute } from "next";

/**
 * Web app manifest, complete for installing from the browser and for packaging
 * with PWABuilder (Android / Google Play, iOS, Windows). See docs/APP-MOVIL.md.
 * Icons: npm run icons · Screenshots: npm run screenshots.
 */
const ICON_SIZES = [48, 72, 96, 128, 144, 152, 192, 256, 384, 512];

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "FIGHTCORE — The core of MMA",
    short_name: "FIGHTCORE",
    description: "Datos, historia y scouting del MMA: fichas de luchadores, rankings por rating, campeones de UFC, PFL, ONE y más, eventos y comparador.",
    lang: "es",
    dir: "ltr",
    start_url: "/?source=app",
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "minimal-ui"],
    orientation: "any",
    background_color: "#0B0C0E",
    theme_color: "#0B0C0E",
    categories: ["sports", "reference", "news"],
    prefer_related_applications: false,
    launch_handler: { client_mode: ["navigate-existing", "auto"] },
    icons: [
      ...ICON_SIZES.map((n) => ({ src: `/icons/icon-${n}.png`, sizes: `${n}x${n}`, type: "image/png", purpose: "any" as const })),
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icons/maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/icons/mono-512.png", sizes: "512x512", type: "image/png", purpose: "monochrome" },
    ],
    screenshots: [
      { src: "/screenshots/narrow-1-inicio.webp", sizes: "1080x2340", type: "image/webp", form_factor: "narrow", label: "Inicio: combate destacado, próximos eventos y resultados" },
      { src: "/screenshots/narrow-2-luchador.webp", sizes: "1080x2340", type: "image/webp", form_factor: "narrow", label: "Ficha de luchador con retrato, rating y datos" },
      { src: "/screenshots/narrow-3-rankings.webp", sizes: "1080x2340", type: "image/webp", form_factor: "narrow", label: "Rankings por FIGHTCORE Rating" },
      { src: "/screenshots/narrow-4-campeones.webp", sizes: "1080x2340", type: "image/webp", form_factor: "narrow", label: "Campeones de UFC, ONE y PFL por división" },
      { src: "/screenshots/wide-1-inicio.webp", sizes: "1920x1080", type: "image/webp", form_factor: "wide", label: "Inicio en pantalla grande" },
      { src: "/screenshots/wide-2-luchador.webp", sizes: "1920x1080", type: "image/webp", form_factor: "wide", label: "Ficha de luchador en pantalla grande" },
    ],
    shortcuts: [
      { name: "Luchadores", short_name: "Luchadores", description: "Base de datos de luchadores", url: "/fighters?source=shortcut", icons: [{ src: "/icons/shortcut-fighters.png", sizes: "96x96", type: "image/png" }] },
      { name: "Rankings", short_name: "Rankings", description: "FIGHTCORE Rankings por división", url: "/rankings?source=shortcut", icons: [{ src: "/icons/shortcut-rankings.png", sizes: "96x96", type: "image/png" }] },
      { name: "Campeones", short_name: "Campeones", description: "Cinturones vigentes", url: "/champions?source=shortcut", icons: [{ src: "/icons/shortcut-champions.png", sizes: "96x96", type: "image/png" }] },
      { name: "Eventos", short_name: "Eventos", description: "Próximos eventos y resultados", url: "/events?source=shortcut", icons: [{ src: "/icons/shortcut-events.png", sizes: "96x96", type: "image/png" }] },
    ],
    // Text shared to the app (e.g. a fighter's name) opens the fighter search.
    share_target: { action: "/fighters", method: "GET", params: { title: "title", text: "q" } },
  };
}
