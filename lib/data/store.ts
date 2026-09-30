import "server-only";
import { buildStore, type Store } from "./build";

export { TODAY, type Store, type RatingPoint } from "./build";

let cached: Store | null = null;

/** Memoized store; built once per server process. */
export function store(): Store {
  if (!cached) cached = buildStore();
  return cached;
}
