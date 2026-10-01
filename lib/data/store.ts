import "server-only";
import { buildDemoUniverse } from "../demo/simulate";
import { buildStore, type Store, type Universe } from "./build";

export type { Store, RatingPoint, DatasetInfo } from "./build";

/**
 * Data provider selection. Default: the real UFC snapshot in data/snapshot.
 * `DATA_PROVIDER=demo` uses the fictional demo universe; `DATA_PROVIDER=postgres`
 * + `DATABASE_URL` reads the facts from PostgreSQL. Loaded once per server
 * process (top-level await).
 */
async function loadUniverse(): Promise<Universe> {
  if (process.env.DATA_PROVIDER === "postgres") {
    if (!process.env.DATABASE_URL) throw new Error("DATA_PROVIDER=postgres requires DATABASE_URL");
    const { loadUniverseFromPostgres } = await import("./providers/postgres");
    return loadUniverseFromPostgres(process.env.DATABASE_URL);
  }
  if (process.env.DATA_PROVIDER === "demo") return buildDemoUniverse();
  const { loadUniverseFromSnapshot } = await import("./providers/snapshot");
  return loadUniverseFromSnapshot();
}

const cached: Store = buildStore(await loadUniverse());

/** The store for this process. */
export function store(): Store {
  return cached;
}

/** The date the dataset describes; ratings, ages and rankings are computed at it. */
export const TODAY = cached.today;
export const DATASET = cached.dataset;
