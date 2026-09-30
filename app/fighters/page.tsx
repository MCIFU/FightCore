import type { Metadata } from "next";
import { Suspense } from "react";
import { FighterDatabase } from "@/components/fighter/FighterDatabase";
import { SectionHead, Source } from "@/components/ui/primitives";
import { DIVISIONS } from "@/lib/domain/reference";
import { listFighters } from "@/lib/data/repository";

export const metadata: Metadata = {
  title: "Luchadores",
  description: "Base de datos de luchadores: filtra por división, organización, país, estado, rating y récord.",
  alternates: { canonical: "/fighters" },
};

export default function FightersPage() {
  const fighters = listFighters();
  return (
    <div className="wrap" style={{ paddingTop: "var(--s-7)", paddingBottom: "var(--s-8)" }}>
      <SectionHead
        as="h1" kicker="FIGHTCORE Database" title="Luchadores"
        lede={<>Todos los expedientes en un solo índice. Filtra, ordena y elige la densidad que necesites. <Source kind="demo" /></>}
      />
      <Suspense>
        <FighterDatabase fighters={fighters} divisions={DIVISIONS.map((d) => ({ id: d.id, name: d.name, short: d.short }))} />
      </Suspense>
    </div>
  );
}
