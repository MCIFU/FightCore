"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CornerMark, Logo } from "@/components/brand/Logo";
import { openSearch } from "@/components/search/searchBus";
import { MORE_NAV, PRIMARY_NAV } from "./nav";
import s from "./Header.module.css";

export function Header({ stamp, demo }: { stamp: string; demo: boolean }) {
  const path = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setMoreOpen(false); setMenuOpen(false); }, [path]);

  useEffect(() => {
    if (!moreOpen) return;
    const onDown = (e: MouseEvent) => { if (!moreRef.current?.contains(e.target as Node)) setMoreOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setMoreOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [moreOpen]);

  useEffect(() => {
    document.documentElement.style.overflow = menuOpen ? "hidden" : "";
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setMenuOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  const active = (href: string) => path === href || path.startsWith(`${href}/`);

  return (
    <>
      <div className={s.masthead}>
        <div className={`wrap ${s.mastInner}`}>
          <span>Edición {stamp}</span>
          <span className={s.mastMid}>Performance intelligence · MMA</span>
          {demo
            ? <span className={s.demo}><span aria-hidden className={s.demoDot} />Dataset de demostración</span>
            : <span className={s.live}><span aria-hidden className={s.liveDot} />Datos reales · UFC</span>}
        </div>
      </div>
      <header className={s.header}>
        <div className={`wrap ${s.inner}`}>
          <Link href="/" className={s.brand} aria-label="FIGHTCORE, inicio">
            <Logo className={s.logoFull} />
            <span className={s.logoCompact}><Logo variant="compact" /></span>
          </Link>

          <nav aria-label="Principal" className={s.nav}>
            <ul className={s.navList}>
              {PRIMARY_NAV.map((i) => (
                <li key={i.href}>
                  <Link href={i.href} className={s.navLink} aria-current={active(i.href) ? "page" : undefined}>{i.label}</Link>
                </li>
              ))}
              <li className={s.moreWrap} ref={moreRef as never}>
                <button
                  type="button"
                  className={s.navLink}
                  aria-expanded={moreOpen}
                  aria-controls="nav-more"
                  onClick={() => setMoreOpen((v) => !v)}
                >
                  Más <span aria-hidden className={s.caret} />
                </button>
                <div id="nav-more" className={s.more} hidden={!moreOpen}>
                  <ul>
                    {MORE_NAV.map((i) => (
                      <li key={i.href}>
                        <Link href={i.href} className={s.moreLink} aria-current={active(i.href) ? "page" : undefined}>
                          <span>{i.label}</span>
                          {i.phase && i.phase > 2 ? <span className={s.phase}>Fase {i.phase}</span> : null}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </li>
            </ul>
          </nav>

          <button type="button" className={s.search} onClick={() => openSearch()} aria-label="Buscar (atajo: tecla barra o Ctrl+K)">
            <svg aria-hidden viewBox="0 0 20 20" width="16" height="16"><circle cx="8.5" cy="8.5" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.6" /><path d="m13 13 4.5 4.5" stroke="currentColor" strokeWidth="1.6" /></svg>
            <span className={s.searchText}>Buscar luchadores, eventos…</span>
            <kbd className={s.kbd}>/</kbd>
          </button>

          <button
            type="button"
            className={s.menuBtn}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <span className="visually-hidden">{menuOpen ? "Cerrar menú" : "Abrir menú"}</span>
            <span aria-hidden className={`${s.burger} ${menuOpen ? s.burgerOpen : ""}`}><span /><span /></span>
          </button>
        </div>
      </header>

      <div id="mobile-menu" className={s.sheet} hidden={!menuOpen}>
        <nav aria-label="Menú móvil" className="wrap">
          <ul className={s.sheetList}>
            {[...PRIMARY_NAV, ...MORE_NAV].map((i, idx) => (
              <li key={i.href}>
                <Link href={i.href} className={s.sheetLink} aria-current={active(i.href) ? "page" : undefined}>
                  <span className={s.sheetIdx}>{String(idx + 1).padStart(2, "0")}</span>
                  <span>{i.label}</span>
                  {i.product && <span className={s.sheetProduct}>FC {i.product}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* App-style bottom bar on phones: thumb-reach for the four core jobs. */}
      <nav aria-label="Accesos rápidos" className={s.tabbar}>
        <Link href="/" aria-current={path === "/" ? "page" : undefined}><CornerMark size={18} mono /><span>Inicio</span></Link>
        <Link href="/fighters" aria-current={active("/fighters") ? "page" : undefined}><TabIcon d="M10 3a3 3 0 1 1 0 6 3 3 0 0 1 0-6ZM4 17c0-3.3 2.7-5 6-5s6 1.7 6 5" /><span>Luchadores</span></Link>
        <button type="button" onClick={() => openSearch()} className={s.tabSearch}><TabIcon d="M8.5 3a5.5 5.5 0 1 1 0 11 5.5 5.5 0 0 1 0-11ZM13 13l4.5 4.5" /><span>Buscar</span></button>
        <Link href="/rankings" aria-current={active("/rankings") ? "page" : undefined}><TabIcon d="M3 17V9h4v8M8 17V4h4v13M13 17v-6h4v6" /><span>Rankings</span></Link>
        <Link href="/compare" aria-current={active("/compare") ? "page" : undefined}><TabIcon d="M3 10h6M11 10h6M9 5v10M11 5v10" /><span>Comparar</span></Link>
      </nav>
    </>
  );
}

function TabIcon({ d }: { d: string }) {
  return <svg aria-hidden viewBox="0 0 20 20" width="18" height="18"><path d={d} fill="none" stroke="currentColor" strokeWidth="1.6" /></svg>;
}
