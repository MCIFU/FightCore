"use client";

import { useEffect, useState } from "react";

/** "Volver arriba" once you're two screens down a long page. */
export function BackToTop() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    let ticking = false;
    const on = () => { if (ticking) return; ticking = true; requestAnimationFrame(() => { ticking = false; setShow(window.scrollY > window.innerHeight * 2); }); };
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  return (
    <button
      type="button" className="back-to-top" data-show={show || undefined} tabIndex={show ? 0 : -1} aria-hidden={!show}
      onClick={() => { window.scrollTo({ top: 0, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }); (document.getElementById("main") as HTMLElement | null)?.focus({ preventScroll: true }); }}
      aria-label="Volver arriba"
    >
      <svg aria-hidden viewBox="0 0 20 20" width="18" height="18"><path d="M10 15V5M5 10l5-5 5 5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="square" /></svg>
    </button>
  );
}
