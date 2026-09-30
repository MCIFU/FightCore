import type { Metadata } from "next";
import { CompareView } from "@/components/compare/CompareView";
import { compareData, defaultCompareSlugs, listFighters } from "@/lib/data/repository";

export const metadata: Metadata = {
  title: "Comparar luchadores",
  description: "Compara de 2 a 4 luchadores: FIGHTCORE Rating, atributos, récord, métodos, evolución y rivales comunes.",
  alternates: { canonical: "/compare" },
};

export default async function ComparePage({ searchParams }: { searchParams: Promise<{ f?: string }> }) {
  const { f } = await searchParams;
  const requested = (f ?? "").split(",").map((x) => x.trim()).filter(Boolean);
  const slugs = requested.length ? requested : defaultCompareSlugs();
  const entries = compareData(slugs);
  const roster = listFighters()
    .filter((x) => x.bouts >= 3)
    .map((x) => ({ slug: x.slug, name: x.name, division: x.divisionShort, org: x.org, rating: x.rating, status: x.status }))
    .sort((a, b) => b.rating - a.rating);
  return <CompareView key={slugs.join(",")} entries={entries} roster={roster} />;
}
