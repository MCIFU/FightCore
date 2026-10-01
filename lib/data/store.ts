import "server-only";
import { buildDemoUniverse } from "../demo/simulate";
import { buildStore, type Store, type Universe } from "./build";

export { TODAY, type Store, type RatingPoint } from "./build";

/**
 * Data provider selection. `DATA_PROVIDER=postgres` + `DATABASE_URL` reads
 * the facts from PostgreSQL; anything else uses the deterministic demo
 * universe. Loaded once per server process (top-level await).
 */
async function loadUniverse(): Promise<Universe> {
  if (process.env.DATA_PROVIDER === "postgres") {
    if (!process.env.DATABASE_URL) throw new Error("DATA_PROVIDER=postgres requires DATABASE_URL");
    const { loadUniverseFromPostgres } = await import("./providers/postgres");
    return loadUniverseFromPostgres(process.env.DATABASE_URL);
  }
  return buildDemoUniverse();
}

const cached: Store = buildStore(await loadUniverse());

/** The store for this process. */
export function store(): Store {
  return cached;
}
