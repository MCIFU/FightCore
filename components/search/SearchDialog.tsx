"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import type { SearchDoc, SearchFight } from "@/lib/data/repository";
import { fmtDate } from "@/lib/format";
import { score } from "./match";
import { onOpenSearch, prefetchSearchIndex } from "./searchBus";
import s from "./SearchDialog.module.css";
import { unpack, type PackedIndex } from "@/lib/search-pack";

interface Index { docs: SearchDoc[]; fights: SearchFight[]; names: Record<string, string> }
interface Hit { key: string; group: string; title: string; sub: string; href: string; meta?: string; photo?: string }

const GROUPS: [SearchDoc["t"] | "fight", string][] = [
  ["fighter", "Luchadores"], ["fight", "Combates"], ["event", "Eventos"], ["org", "Organizaciones"], ["history", "Historia"], ["page", "Secciones"],
];
const RECENT_KEY = "fc:recent-searches";

function readRecent(): string[] {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]").slice(0, 5); } catch { return []; }
}
function pushRecent(q: string) {
  try { localStorage.setItem(RECENT_KEY, JSON.stringify([q, ...readRecent().filter((x) => x !== q)].slice(0, 5))); } catch { /* storage unavailable */ }
}

export function SearchDialog({ demo = false }: { demo?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [q, setQ] = useState("");
  const [idx, setIdx] = useState<Index | null>(null);
  const [error, setError] = useState(false);
  const [active, setActive] = useState(0);
  const [recent, setRecent] = useState<string[]>([]);
  const listId = useId();

  const load = useCallback(() => {
    if (idx) return;
    setError(false);
    prefetchSearchIndex().then((p) => setIdx(unpack(p as PackedIndex))).catch(() => setError(true));
  }, [idx]);

  const open = useCallback((query = "") => {
    setQ(query);
    setActive(0);
    setRecent(readRecent());
    load();
    ref.current?.showModal();
    requestAnimationFrame(() => input.current?.focus());
  }, [load]);

  useEffect(() => onOpenSearch(open), [open]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const typing = target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !typing)) {
        e.preventDefault();
        open();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const hits = useMemo<Hit[]>(() => {
    if (!idx || !q.trim()) return [];
    const scored = idx.docs
      .map((d) => ({ d, base: score(q, d.title, `${d.k} ${d.sub}`) }))
      .filter((x) => x.base > 0)
      .map((x) => ({ ...x, sc: x.base + (x.d.r ? x.d.r / 50 : 0) }))
      .sort((a, b) => b.sc - a.sc);
    const out: Hit[] = [];
    const take = (t: SearchDoc["t"], n: number) =>
      scored.filter((x) => x.d.t === t).slice(0, n).forEach(({ d }) =>
        out.push({ key: d.id, group: t, title: d.title, sub: d.sub, href: d.href, photo: d.p, meta: d.c }));
    take("fighter", 5);
    // Related fights: bouts involving the best-matching fighters.
    const topFighters = scored.filter((x) => x.d.t === "fighter").slice(0, 2).map((x) => x.d.id);
    if (topFighters.length) {
      idx.fights
        .filter((f) => topFighters.includes(f.a) || topFighters.includes(f.b))
        .sort((a, b) => b.d.localeCompare(a.d))
        .slice(0, 4)
        .forEach((f) => out.push({
          key: f.id, group: "fight",
          title: `${idx.names[f.a]} vs ${idx.names[f.b]}`,
          sub: `${f.e} · ${fmtDate(f.d)}`,
          meta: f.w ? `${idx.names[f.w]?.split(" ").slice(-1)[0]} · ${f.m}` : f.m,
          href: `/fights/${f.id}`,
        }));
    }
    const evMatches = scored.filter((x) => x.d.t === "event").slice(0, 3);
    const related = topFighters.length
      ? idx.docs.filter((d) => d.t === "event" && d.rel?.some((id) => topFighters.includes(id))).slice(-3).reverse()
      : [];
    [...evMatches.map((x) => x.d), ...related].filter((d, i, arr) => arr.findIndex((x) => x.id === d.id) === i).slice(0, 4)
      .forEach((d) => out.push({ key: d.id, group: "event", title: d.title, sub: d.sub, href: d.href }));
    take("org", 3);
    take("history", 3);
    take("page", 3);
    return out;
  }, [idx, q]);

  const suggestions = useMemo<Hit[]>(() => {
    if (!idx) return [];
    return idx.docs.filter((d) => d.t === "fighter").sort((a, b) => (b.r ?? 0) - (a.r ?? 0)).slice(0, 5)
      .map((d): Hit => ({ key: d.id, group: "fighter", title: d.title, sub: d.sub, href: d.href, photo: d.p, meta: d.c }))
      .concat(idx.docs.filter((d) => d.t === "page").slice(0, 4).map((d) => ({ key: d.id, group: "page", title: d.title, sub: d.sub, href: d.href })));
  }, [idx]);

  const list = q.trim() ? hits : suggestions;
  useEffect(() => setActive(0), [q]);

  const go = (h: Hit) => {
    if (q.trim()) pushRecent(q.trim());
    ref.current?.close();
    router.push(h.href);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(list.length - 1, a + 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); }
    else if (e.key === "Enter" && list[active]) { e.preventDefault(); go(list[active]); }
  };

  useEffect(() => {
    document.getElementById(`${listId}-${active}`)?.scrollIntoView({ block: "nearest" });
  }, [active, listId]);

  let flat = -1;
  return (
    <dialog ref={ref} className={s.dialog} aria-label="Búsqueda global" onClick={(e) => { if (e.target === ref.current) ref.current?.close(); }}>
      <div className={s.panel}>
        <div className={s.bar}>
          <svg aria-hidden viewBox="0 0 20 20" width="18" height="18"><circle cx="8.5" cy="8.5" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.6" /><path d="m13 13 4.5 4.5" stroke="currentColor" strokeWidth="1.6" /></svg>
          <input
            ref={input}
            className={s.input}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Luchador, evento, organización, historia…"
            role="combobox"
            aria-expanded={list.length > 0}
            aria-controls={listId}
            aria-activedescendant={list.length ? `${listId}-${active}` : undefined}
            aria-autocomplete="list"
            autoComplete="off"
            spellCheck={false}
          />
          <button type="button" className={s.close} onClick={() => ref.current?.close()}>
            <span className={s.esc}>ESC</span><span className="visually-hidden">Cerrar búsqueda</span>
          </button>
        </div>

        <div className={s.body}>
          {error && <p className={s.note} role="alert">No se pudo cargar el índice de búsqueda. Comprueba la conexión e inténtalo de nuevo.</p>}
          {!idx && !error && (
            <div className={s.loading} aria-live="polite">
              <span className="visually-hidden">Cargando índice…</span>
              {[70, 52, 64].map((w, i) => <span key={i} className={s.skel} style={{ width: `${w}%` }} />)}
            </div>
          )}
          {idx && !q.trim() && recent.length > 0 && (
            <div className={s.recent}>
              <span className="label">Recientes</span>
              {recent.map((r) => <button key={r} type="button" className={s.chip} onClick={() => setQ(r)}>{r}</button>)}
            </div>
          )}
          {idx && q.trim() && hits.length === 0 && (
            <p className={s.note} role="status">Sin resultados para <strong>“{q}”</strong>. Prueba con un apellido, una ciudad o una organización.</p>
          )}
          <ul id={listId} role="listbox" className={s.list} aria-label="Resultados">
            {GROUPS.map(([g, label]) => {
              const items = list.filter((h) => h.group === g);
              if (!items.length) return null;
              return (
                <li key={g} role="presentation">
                  <p className={s.group} aria-hidden>{q.trim() ? label : g === "fighter" ? "Mejor valorados · FCR" : "Explorar"}</p>
                  <ul role="group" aria-label={label}>
                    {items.map((h) => {
                      flat = list.indexOf(h);
                      const i = flat;
                      return (
                        <li
                          key={h.key}
                          id={`${listId}-${i}`}
                          role="option"
                          aria-selected={i === active}
                          className={s.item}
                          onMouseMove={() => setActive(i)}
                          onClick={() => go(h)}
                        >
                          {h.photo && <img src={h.photo} alt="" width={36} height={36} className={s.face} loading="lazy" />}
                          <span className={s.itemTitle}>{h.title}</span>
                          <span className={s.itemSub}>{h.sub}</span>
                          {h.meta && <span className={s.itemMeta}>{h.meta}</span>}
                        </li>
                      );
                    })}
                  </ul>
                </li>
              );
            })}
          </ul>
        </div>
        <div className={s.foot} aria-hidden>
          <span><kbd>↑</kbd><kbd>↓</kbd> navegar</span>
          <span><kbd>↵</kbd> abrir</span>
          <span><kbd>esc</kbd> cerrar</span>
          <span className={s.footSrc}>Índice · {demo ? "datos demo" : "UFC + 13 organizaciones"}</span>
        </div>
      </div>
    </dialog>
  );
}
