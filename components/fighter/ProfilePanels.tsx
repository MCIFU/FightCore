"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import s from "./ProfilePanels.module.css";

export interface Panel { id: string; label: string; hint: string; content: ReactNode; aliases?: string[] }

/**
 * Fighter profile sections as tabs: one panel visible at a time, so the page
 * stays short. The active panel lives in the URL hash (#rating), so links and
 * the back button work; old section anchors map to their panel via aliases.
 * Without JavaScript every panel is shown, one after another.
 */
export function ProfilePanels({ panels, label }: { panels: Panel[]; label: string }) {
  const [active, setActive] = useState<string | null>(null);
  const top = useRef<HTMLDivElement>(null);

  /** Puts the tab bar right under the sticky site header. */
  const headerHeight = () => document.querySelector("header")?.getBoundingClientRect().height ?? 60;
  const scrollToBar = () => {
    const el = top.current;
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - headerHeight() });
  };

  const resolve = useCallback((hash: string) => {
    const id = hash.replace(/^#/, "");
    return panels.find((p) => p.id === id || p.aliases?.includes(id))?.id ?? null;
  }, [panels]);

  useEffect(() => {
    const sync = () => {
      const id = resolve(location.hash);
      setActive(id ?? panels[0].id);
      if (id) requestAnimationFrame(() => scrollToBar());
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, [panels, resolve]);

  const choose = (id: string, focus = false) => {
    setActive(id);
    history.replaceState(null, "", `#${id}`);
    const el = top.current;
    // Keep the tab bar in view when switching from far down a long panel.
    if (el && el.getBoundingClientRect().top < headerHeight()) scrollToBar();
    if (focus) document.getElementById(`tab-${id}`)?.focus();
  };

  const onKey = (e: React.KeyboardEvent, i: number) => {
    const n = panels.length;
    const to = e.key === "ArrowRight" ? (i + 1) % n : e.key === "ArrowLeft" ? (i - 1 + n) % n : e.key === "Home" ? 0 : e.key === "End" ? n - 1 : -1;
    if (to < 0) return;
    e.preventDefault();
    choose(panels[to].id, true);
  };

  const current = active ?? panels[0].id;

  // Swipe left/right on a panel to move between sections (phones). Ignored when
  // the gesture starts inside something that scrolls sideways (tables, charts).
  const touch = useRef<{ x: number; y: number; t: number } | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    for (let el = e.target as HTMLElement | null; el && el !== e.currentTarget; el = el.parentElement) {
      if (el.scrollWidth > el.clientWidth + 2 && getComputedStyle(el).overflowX !== "visible") { touch.current = null; return; }
      if (el.dataset.noswipe !== undefined || el.tagName === "svg") { touch.current = null; return; }
    }
    const t = e.touches[0];
    touch.current = { x: t.clientX, y: t.clientY, t: Date.now() };
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const start = touch.current; touch.current = null;
    if (!start) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - start.x, dy = t.clientY - start.y;
    if (Math.abs(dx) < 70 || Math.abs(dy) > Math.abs(dx) * 0.6 || Date.now() - start.t > 600) return;
    const i = panels.findIndex((p) => p.id === current);
    const to = dx < 0 ? i + 1 : i - 1;
    if (to >= 0 && to < panels.length) choose(panels[to].id);
  };

  return (
    <div ref={top} className={s.root}>
      <div className={s.bar}>
        <div className="wrap">
          <div role="tablist" aria-label={label} className={s.tabs}>
            {panels.map((p, i) => (
              <button
                key={p.id} id={`tab-${p.id}`} type="button" role="tab"
                aria-selected={current === p.id} aria-controls={`panel-${p.id}`} tabIndex={current === p.id ? 0 : -1}
                className={s.tab} onClick={() => choose(p.id)} onKeyDown={(e) => onKey(e, i)}
              >
                <span className={s.idx}>{String(i + 1).padStart(2, "0")}</span>
                <span className={s.text}><span className={s.label}>{p.label}</span><span className={s.hint}>{p.hint}</span></span>
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="wrap" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        {panels.map((p) => (
          <div
            key={p.id} id={`panel-${p.id}`} role="tabpanel" aria-labelledby={`tab-${p.id}`}
            hidden={active !== null && active !== p.id} className={s.panel}
          >
            {p.content}
          </div>
        ))}
      </div>
    </div>
  );
}
