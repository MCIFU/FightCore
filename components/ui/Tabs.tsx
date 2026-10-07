"use client";

import { useId, useRef, useState, type ReactNode } from "react";
import s from "./Tabs.module.css";

export interface TabDef { id: string; label: ReactNode; content: ReactNode; hint?: string }

/**
 * WAI-ARIA tabs with automatic activation, roving tabindex, Home/End support.
 * Only the open panel is rendered at first; a panel stays mounted once visited.
 * Pages with many tabs (rankings by division) were painting thousands of
 * hidden elements on load, which made phones stutter.
 */
export function Tabs({ tabs, label, initial, variant = "line", onChange }: { tabs: TabDef[]; label: string; initial?: string; variant?: "line" | "pill" | "scroll"; onChange?: (id: string) => void }) {
  const [active, setActiveRaw] = useState(initial ?? tabs[0]?.id);
  const [seen, setSeen] = useState(() => new Set([initial ?? tabs[0]?.id]));
  const setActive = (id: string) => { setActiveRaw(id); setSeen((s) => (s.has(id) ? s : new Set(s).add(id))); };
  const base = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const select = (i: number) => {
    const t = tabs[(i + tabs.length) % tabs.length];
    setActive(t.id);
    onChange?.(t.id);
    refs.current[(i + tabs.length) % tabs.length]?.focus();
  };

  const onKey = (e: React.KeyboardEvent, i: number) => {
    if (e.key === "ArrowRight") { e.preventDefault(); select(i + 1); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); select(i - 1); }
    else if (e.key === "Home") { e.preventDefault(); select(0); }
    else if (e.key === "End") { e.preventDefault(); select(tabs.length - 1); }
  };

  return (
    <div className={s.tabs}>
      <div role="tablist" aria-label={label} className={`${s.list} ${s[variant]}`}>
        {tabs.map((t, i) => (
          <button
            key={t.id}
            ref={(el) => { refs.current[i] = el; }}
            role="tab"
            type="button"
            id={`${base}-tab-${t.id}`}
            aria-selected={active === t.id}
            aria-controls={`${base}-panel-${t.id}`}
            tabIndex={active === t.id ? 0 : -1}
            className={s.tab}
            title={t.hint}
            onClick={() => { setActive(t.id); onChange?.(t.id); }}
            onKeyDown={(e) => onKey(e, i)}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tabs.map((t) => (
        <div
          key={t.id}
          role="tabpanel"
          id={`${base}-panel-${t.id}`}
          aria-labelledby={`${base}-tab-${t.id}`}
          hidden={active !== t.id}
          tabIndex={0}
          className={s.panel}
        >
          {seen.has(t.id) ? t.content : null}
        </div>
      ))}
    </div>
  );
}
