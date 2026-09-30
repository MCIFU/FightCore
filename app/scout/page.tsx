import type { Metadata } from "next";
import { Roadmap } from "@/components/layout/Roadmap";

export const metadata: Metadata = { title: "Scout", description: "FIGHTCORE Scout: investigación de luchadores respaldada por datos.", alternates: { canonical: "/scout" } };

export default function ScoutPage() {
  return (
    <Roadmap
      product="Scout" phase={3} title="Scout"
      lede="Una mesa de trabajo para investigar a un luchador o preparar un cruce. Cada conclusión llevará su evidencia; si los datos no alcanzan, no habrá conclusión."
      questions={["¿Cómo gana y cómo pierde?", "¿Dónde genera su ventaja: distancia, clinch o suelo?", "¿Qué tipo de rival le complica?", "¿Dónde consigue sus derribos?", "¿Cuándo baja su ritmo y cómo cambia entre rounds?", "¿Qué patrones se repiten en sus derrotas?"]}
      today={[
        { href: "/fighters", label: "Lectura rápida en cada expediente", note: "Observaciones por reglas, con muestra (n) visible" },
        { href: "/compare", label: "Comparar", note: "Hasta cuatro luchadores y rivales comunes" },
        { href: "/methodology", label: "Metodología", note: "Qué medimos y qué no" },
      ]}
    />
  );
}
