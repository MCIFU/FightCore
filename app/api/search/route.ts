import { searchIndex } from "@/lib/data/repository";
import { pack } from "@/lib/search-pack";

export const dynamic = "force-static";

/** Search index, fetched lazily the first time search opens (~cacheable forever per build). */
export function GET() {
  return Response.json(pack(searchIndex()), {
    headers: { "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400" },
  });
}
