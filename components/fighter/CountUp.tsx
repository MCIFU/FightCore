"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Counts a rating up from 0 when it enters the viewport. Renders the final
 * value on the server and for reduced-motion users, so nothing depends on JS.
 */
export function CountUp({ value, decimals = 1, duration = 1100 }: { value: number; decimals?: number; duration?: number }) {
  const [shown, setShown] = useState(value);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const t0 = performance.now();
      const tick = (t: number) => {
        const k = Math.min(1, (t - t0) / duration);
        const eased = 1 - Math.pow(1 - k, 4);
        setShown(value * eased);
        if (k < 1) raf = requestAnimationFrame(tick);
      };
      setShown(0);
      raf = requestAnimationFrame(tick);
    }, { threshold: 0.4 });
    io.observe(el);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [value, duration]);
  const [int, dec] = shown.toFixed(decimals).split(".");
  return (
    <span ref={ref} aria-hidden data-countup>
      <span data-part="int">{int}</span>
      {decimals > 0 && <span data-part="dec">.{dec}</span>}
    </span>
  );
}
