"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Progressive reveal. Nothing is hidden by CSS on load: what's on screen
 * paints straight away (good for the first paint and LCP). After hydration,
 * only sections still below the fold are hidden and fade in as they enter the
 * viewport. Honors prefers-reduced-motion via CSS.
 */
export function Reveal() {
  const path = usePathname();
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]:not([data-in])"));
    if (!("IntersectionObserver" in window) || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const fold = window.innerHeight;
    const later = els.filter((e) => e.getBoundingClientRect().top > fold);
    for (const e of later) e.setAttribute("data-pending", "");
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) { e.target.removeAttribute("data-pending"); e.target.setAttribute("data-in", ""); io.unobserve(e.target); }
    }, { rootMargin: "0px 0px -6% 0px", threshold: 0.02 });
    later.forEach((e) => io.observe(e));
    return () => { io.disconnect(); later.forEach((e) => e.removeAttribute("data-pending")); };
  }, [path]);
  return null;
}
