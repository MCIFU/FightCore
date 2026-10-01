import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FIGHTCORE — The core of MMA",
    short_name: "FIGHTCORE",
    description: "Datos, historia y scouting del MMA.",
    start_url: "/",
    display: "standalone",
    background_color: "#0B0C0E",
    theme_color: "#0B0C0E",
    lang: "es",
    categories: ["sports", "reference"],
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
    orientation: "portrait",
    shortcuts: [
      { name: "Campeones", url: "/champions" },
      { name: "Scout", url: "/scout" },
      { name: "Rankings", url: "/rankings" },
      { name: "Comparar", url: "/compare" },
      { name: "Luchadores", url: "/fighters" },
    ],
  };
}
