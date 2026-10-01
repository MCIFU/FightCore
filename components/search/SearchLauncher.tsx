"use client";

import { openSearch } from "./searchBus";
import s from "./SearchLauncher.module.css";

const DEMO_EXAMPLES = ["Lachance", "UFC Demo", "Peso wélter", "PRIDE", "Tokio"];
const REAL_EXAMPLES = ["Topuria", "Shevchenko", "UFC 300", "Peso wélter", "Las Vegas"];

/** Hero-size search entry point. Opens the global dialog. */
export function SearchLauncher({ demo = false }: { demo?: boolean }) {
  const EXAMPLES = demo ? DEMO_EXAMPLES : REAL_EXAMPLES;
  return (
    <div className={s.wrap}>
      <button type="button" className={s.launcher} onClick={() => openSearch()}>
        <svg aria-hidden viewBox="0 0 20 20" width="20" height="20"><circle cx="8.5" cy="8.5" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.6" /><path d="m13 13 4.5 4.5" stroke="currentColor" strokeWidth="1.6" /></svg>
        <span className={s.text}>Busca un luchador, evento, organización o época</span>
        <kbd className={s.kbd} aria-hidden>/</kbd>
      </button>
      <p className={s.examples}>
        <span className="label">Prueba</span>
        {EXAMPLES.map((e) => (
          <button key={e} type="button" className={s.ex} onClick={() => openSearch(e)}>{e}</button>
        ))}
      </p>
    </div>
  );
}
