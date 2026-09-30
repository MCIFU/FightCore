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
