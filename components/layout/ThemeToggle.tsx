"use client";

import { useEffect, useState } from "react";

type Theme = "dark" | "light";
const COLOR: Record<Theme, string> = { dark: "#0b0c0e", light: "#f6f3ec" };

/**
 * Light / dark switch. The theme is set before first paint by THEME_SCRIPT
 * (system preference unless the viewer chose one); this button flips it and
 * remembers the choice on this device.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const [theme, setTheme] = useState<Theme | null>(null);
  useEffect(() => {
    const t = (document.documentElement.dataset.theme as Theme) ?? "dark";
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", COLOR[t]);
    setTheme(t);
  }, []);
  const next: Theme = theme === "light" ? "dark" : "light";
  const flip = () => {
    document.documentElement.dataset.theme = next;
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", COLOR[next]);
    try { localStorage.setItem("fc:theme", next); } catch { /* storage unavailable */ }
    setTheme(next);
  };
  return (
    <button type="button" className={className} onClick={flip} aria-label={next === "light" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"} title={next === "light" ? "Modo claro" : "Modo oscuro"}>
      {/* Shows the mode you'd switch to. Before hydration, a neutral half-disc. */}
      <svg aria-hidden viewBox="0 0 20 20" width="18" height="18">
        {theme === null ? (
          <><circle cx="10" cy="10" r="6" fill="none" stroke="currentColor" strokeWidth="1.6" /><path d="M10 4a6 6 0 0 1 0 12Z" fill="currentColor" /></>
        ) : next === "light" ? (
          <><circle cx="10" cy="10" r="3.6" fill="none" stroke="currentColor" strokeWidth="1.6" />
            {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => <line key={a} x1="10" y1="1.8" x2="10" y2="4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" transform={`rotate(${a} 10 10)`} />)}</>
        ) : (
          <path d="M15.5 12.6A6.5 6.5 0 0 1 7.4 4.5a6.5 6.5 0 1 0 8.1 8.1Z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        )}
      </svg>
    </button>
  );
}
