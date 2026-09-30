"use client";

import { useEffect, useRef, useState } from "react";
import s from "./SectionNav.module.css";

/** Sticky in-page navigation with scroll-spy. Anchors work without JS. */
export function SectionNav({ items, label }: { items: { id: string; label: string }[]; label: string }) {
  const [active, setActive] = useState(items[0]?.id);
  const listRef = useRef<HTMLUListElement>(null);
  useEffect(() => {
    const els = items.map((i) => document.getElementById(i.id)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver((entries) => {
      const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (visible[0]) setActive(visible[0].target.id);
    }, { rootMargin: "-30% 0px -60% 0px" });
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, [items]);
  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-id="${active}"]`);
    if (el && listRef.current) {
      const l = listRef.current;
      l.scrollTo({ left: el.offsetLeft - l.clientWidth / 2 + el.clientWidth / 2, behavior: "smooth" });
    }
  }, [active]);
  return (
    <nav aria-label={label} className={s.nav}>
      <div className="wrap">
        <ul ref={listRef} className={s.list}>
          {items.map((i, n) => (
            <li key={i.id} data-id={i.id}>
              <a href={`#${i.id}`} className={s.link} aria-current={active === i.id ? "location" : undefined}>
                <span className={s.idx}>{String(n + 1).padStart(2, "0")}</span>{i.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
