import type { MetadataRoute } from "next";
import { allFighterSlugs, allFightIds, listEvents, TODAY } from "@/lib/data/repository";
import { ORGANIZATIONS } from "@/lib/domain/reference";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://fightcore.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const at = (path: string, priority = 0.5): MetadataRoute.Sitemap[number] => ({ url: `${SITE}${path}`, lastModified: TODAY, priority });
  return [
    at("/", 1),
    ...["/fighters", "/rankings", "/events", "/compare", "/records", "/history", "/organizations", "/methodology"].map((p) => at(p, 0.8)),
    ...allFighterSlugs().map((s) => at(`/fighters/${s}`, 0.7)),
    ...listEvents().map((e) => at(`/events/${e.slug}`, 0.6)),
    ...ORGANIZATIONS.map((o) => at(`/organizations/${o.slug}`, 0.6)),
    ...allFightIds().map((id) => at(`/fights/${id}`, 0.4)),
  ];
}
