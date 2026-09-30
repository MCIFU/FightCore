"use client";

import { useEffect, useRef, useState } from "react";

/** Measures an element's content width so SVG charts draw in real pixels (text never scales). */
export function useWidth<T extends HTMLElement>(fallback = 800) {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(fallback);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(Math.max(280, Math.round(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
}
