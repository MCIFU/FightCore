import type { Metadata } from "next";
import { Suspense } from "react";
import { FighterDatabase } from "@/components/fighter/FighterDatabase";
import { SectionHead, Source } from "@/components/ui/primitives";
import { DIVISIONS } from "@/lib/domain/reference";
import { listFighters, SRC } from "@/lib/data/repository";

export const metadata: Metadata = {
  title: "Luchadores",
  description: "Base de datos de luchadores: filtra por división, organización, país, estado, rating y récord.",
  alternates: { canonical: "/fighters" },
};

export default async function FightersPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  // Only what the index renders, and only the status asked for (active by default):
  // the full summaries of ~2,800 fighters would be megabytes of HTML.
  const status = (await searchParams).status ?? "active";
  const fighters = listFighters().filter((f) => status === "all" || f.status === status).map((f) => ({
    id: f.id, slug: f.slug, name: f.name, firstName: f.firstName, lastName: f.lastName, nickname: f.nickname,
    country: f.country, countryName: f.countryName, divisionId: f.divisionId, divisionShort: f.divisionShort, org: f.org,
    status: f.status, age: f.age, record: f.record, rating: f.rating, provisional: f.provisional, rank: f.rank,
    title: f.title ? { org: f.title.org, division: f.title.division, since: f.title.since, defenses: f.title.defenses } : null,
    form: f.form.slice(-5), career: f.career.slice(-10), photo: { src: f.photo.src, kind: f.photo.kind, credit: "", updated: "" }, lastFight: f.lastFight,
  }));
  return (
    <div className="wrap" style={{ paddingTop: "var(--s-7)", paddingBottom: "var(--s-8)" }}>
      <SectionHead
        as="h1" kicker="FIGHTCORE Database" title="Luchadores"
        lede={<>Todos los expedientes en un solo índice. Filtra, ordena y elige la densidad que necesites. <Source kind={SRC} /></>}
      />
      <Suspense>
        <FighterDatabase fighters={fighters} divisions={DIVISIONS.map((d) => ({ id: d.id, name: d.name, short: d.short }))} />
      </Suspense>
    </div>
  );
}
