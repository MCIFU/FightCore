import { searchIndex } from "@/lib/data/repository";

export const dynamic = "force-static";

/** Search index, fetched lazily the first time search opens (~cacheable forever per build). */
export function GET() {
  return Response.json(searchIndex(), {
    headers: { "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400" },
  });
}
