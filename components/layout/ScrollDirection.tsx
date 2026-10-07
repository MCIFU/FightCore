"use client";

import { useEffect } from "react";

/**
 * Marks <html data-scroll="down|up"> as the page scrolls. On phones the header
 * and the bottom bar slide away while reading downwards and come back as soon
 * as you scroll up a little (CSS in Header.module.css).
 */
export function ScrollDirection() {
  useEffect(() => {
    const root = document.documentElement;
    let last = window.scrollY, ticking = false;
    const update = () => {
      ticking = false;
      const y = window.scrollY;
      const menuOpen = document.querySelector('[aria-controls="mobile-menu"][aria-expanded="true"]');
      if (y < 80 || menuOpen) root.dataset.scroll = "up";
      else if (y - last > 10) root.dataset.scroll = "down";
      else if (last - y > 10) root.dataset.scroll = "up";
      else return;
      last = y;
    };
    const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { window.removeEventListener("scroll", onScroll); delete root.dataset.scroll; };
  }, []);
  return null;
}
