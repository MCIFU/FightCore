"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useId, useMemo, useState, useTransition } from "react";
import s from "./FighterPicker.module.css";

export interface PickerItem { slug: string; name: string; division: string; org: string; rating: number; photo: string }

/** Accessible combobox that writes the chosen fighter into a URL param. */
export function FighterPicker({ roster, param, label, current, exclude = [] }: { roster: PickerItem[]; param: string; label: string; current?: string; exclude?: string[] }) {
  const router = useRouter();
  const path = usePathname();
  const params = useSearchParams();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [pending, start] = useTransition();
  const id = useId();
  const norm = (x: string) => x.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const options = useMemo(() => roster.filter((r) => !exclude.includes(r.slug) && (!q || norm(`${r.name} ${r.division} ${r.org}`).includes(norm(q)))).slice(0, 8), [roster, q, exclude]);
  const choose = (slug: string) => {
    const p = new URLSearchParams(params.toString());
    p.set(param, slug);
    setQ(""); setOpen(false);
    start(() => router.push(`${path}?${p}`, { scroll: false }));
  };
  const cur = roster.find((r) => r.slug === current);
  return (
    <div className={`${s.picker} ${pending ? s.pending : ""}`}>
      <label htmlFor={`${id}-in`} className="label">{label}</label>
      <div className={s.box}>
        {cur && <img src={cur.photo} alt="" width={36} height={36} className={s.face} />}
        <input
          id={`${id}-in`}
          className={s.input}
          placeholder={cur ? cur.name : "Buscar luchador…"}
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); setActive(0); }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(options.length - 1, a + 1)); }
            if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); }
            if (e.key === "Enter" && options[active]) { e.preventDefault(); choose(options[active].slug); }
            if (e.key === "Escape") setOpen(false);
          }}
          role="combobox"
          aria-expanded={open && options.length > 0}
          aria-controls={`${id}-list`}
          aria-activedescendant={open && options[active] ? `${id}-o-${active}` : undefined}
          aria-autocomplete="list"
          autoComplete="off"
        />
      </div>
      {open && options.length > 0 && (
        <ul id={`${id}-list`} role="listbox" className={s.list}>
          {options.map((o, i) => (
            <li key={o.slug} id={`${id}-o-${i}`} role="option" aria-selected={i === active} className={s.opt} onMouseDown={(e) => { e.preventDefault(); choose(o.slug); }} onMouseMove={() => setActive(i)}>
              <img src={o.photo} alt="" width={32} height={32} className={s.optFace} loading="lazy" />
              <span>{o.name}</span>
              <span className={s.meta}>{o.division} · {o.org} · {o.rating.toFixed(1)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
