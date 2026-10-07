import type { Metadata } from "next";
import { FighterDatabase } from "@/components/fighter/FighterDatabase";
import { SectionHead, Source } from "@/components/ui/primitives";
import { DIVISIONS } from "@/lib/domain/reference";
import { listFighters, SRC } from "@/lib/data/repository";

export const metadata: Metadata = {
  title: "Luchadores",
  description: "Base de datos de luchadores: filtra por división, organización, país, estado, rating y récord.",
  alternates: { canonical: "/fighters" },
};

export default async function FightersPage({ searchParams }: { searchParams: Promise<{ status?: string; country?: string; division?: string; org?: string }> }) {
  // Only what the index renders, and only the status asked for (active by default):
  // full summaries of ~7,000 fighters would be megabytes of HTML. With "all", the
  // country / division / organization filters in the URL also narrow it server-side.
  const sp = await searchParams;
  const status = sp.status ?? "active";
  const byStatus = listFighters().filter((f) => status === "all" || f.status === status);
  const countries = [...new Map(byStatus.flatMap((f) => (f.country ? [[f.country, f.countryName ?? f.country] as [string, string]] : []))).entries()]
    .sort((a, b) => a[1].localeCompare(b[1], "es"));
  const orgs = [...new Set(byStatus.map((f) => f.org))].sort();
  const narrow = status === "all"
    ? byStatus.filter((f) => (!sp.country || f.country === sp.country) && (!sp.division || f.divisionId === sp.division) && (!sp.org || f.org.toLowerCase() === sp.org.toLowerCase()))
    : byStatus;
  const fighters = narrow.map((f) => ({
    id: f.id, slug: f.slug, name: f.name, firstName: f.firstName, lastName: f.lastName, nickname: f.nickname,
    country: f.country, countryName: f.countryName, divisionId: f.divisionId, divisionShort: f.divisionShort, org: f.org,
    status: f.status, age: f.age, record: f.record, rating: f.rating, provisional: f.provisional, rank: f.rank,
    title: f.title ? { org: f.title.org, division: f.title.division, since: f.title.since, defenses: f.title.defenses } : null,
    form: f.form.slice(-5), career: [], photo: { src: f.photo.src, kind: f.photo.kind, credit: "", updated: "" }, lastFight: f.lastFight,
  }));
  return (
    <div className="wrap" style={{ paddingTop: "var(--s-7)", paddingBottom: "var(--s-8)" }}>
      <SectionHead
        as="h1" kicker="FIGHTCORE Database" title="Luchadores"
        lede={<>Todos los expedientes en un solo índice. Filtra, ordena y elige la densidad que necesites. <Source kind={SRC} /></>}
      />
      {/* Dynamic page (reads searchParams): no Suspense needed, so the list is in the first HTML and nothing jumps. */}
      <FighterDatabase fighters={fighters} countries={countries} orgs={orgs} divisions={DIVISIONS.map((d) => ({ id: d.id, name: d.name, short: d.short }))} />
    </div>
  );
}
