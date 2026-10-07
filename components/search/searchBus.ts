/** Tiny decoupled trigger so any component can open global search. */
const EVT = "fc:search-open";

export function openSearch(query?: string) {
  window.dispatchEvent(new CustomEvent(EVT, { detail: query ?? "" }));
}

export function onOpenSearch(fn: (q: string) => void) {
  const h = (e: Event) => fn((e as CustomEvent<string>).detail);
  window.addEventListener(EVT, h);
  return () => window.removeEventListener(EVT, h);
}

/** The search index, downloaded once. Called early (a finger on the search button) and again when the dialog opens. */
let warm: Promise<unknown> | null = null;
export function prefetchSearchIndex(): Promise<unknown> {
  if (!warm) {
    warm = fetch("/api/search").then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))));
    warm.catch(() => { warm = null; });
  }
  return warm;
}
