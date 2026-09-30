"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Progressive reveal: content is visible without JS; with JS we fade sections
 * in as they enter the viewport. Honors prefers-reduced-motion via CSS.
 */
export function Reveal() {
  const path = usePathname();
  useEffect(() => {
    document.documentElement.classList.add("js");
    const els = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]:not([data-in])"));
    if (!("IntersectionObserver" in window)) { els.forEach((e) => e.setAttribute("data-in", "")); return; }
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) { e.target.setAttribute("data-in", ""); io.unobserve(e.target); }
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, [path]);
  return null;
}
