"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * Thin progress bar at the top while moving between pages. Starts on a click
 * on an internal link, ends when the new route is on screen. Replaces a
 * full-page loading screen, which hid already-rendered content on first load.
 */
export function NavProgress() {
  const path = usePathname();
  const [state, setState] = useState<"idle" | "busy" | "done">("idle");

  useEffect(() => {
    setState((s) => (s === "busy" ? "done" : s));
    const t = setTimeout(() => setState((s) => (s === "done" ? "idle" : s)), 400);
    return () => clearTimeout(t);
  }, [path]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as HTMLElement).closest("a");
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin || url.pathname === location.pathname) return;
      setState("busy");
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return <div aria-hidden className="nav-progress" data-state={state} />;
}
