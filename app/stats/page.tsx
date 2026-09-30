import type { Metadata } from "next";
import { Roadmap } from "@/components/layout/Roadmap";

export const metadata: Metadata = { title: "Stats", description: "FIGHTCORE Stats: exploración de estadísticas de MMA.", alternates: { canonical: "/stats" } };

export default function StatsPage() {
  return (
    <Roadmap
      product="Stats" phase={3} title="Stats"
      lede="Exploración libre del dataset: líderes por métrica, distribuciones por división y cortes por organización y época."
      questions={["¿Quién lidera cada métrica, con muestra mínima?", "¿Cómo se distribuye una métrica en cada división?", "¿Ha cambiado el deporte con los años?", "¿Qué organizaciones terminan más combates?"]}
      today={[
        { href: "/records", label: "Récords", note: "Máximos de carrera, golpeo, grappling y tiempo" },
        { href: "/rankings", label: "Rankings", note: "Por división y pound-for-pound" },
        { href: "/fighters", label: "Base de datos", note: "Filtra y ordena todos los expedientes" },
      ]}
    />
  );
}
