"use client";

import { useEffect, useState } from "react";

const DAY = 86_400_000;
const at = (iso: string) => Date.parse(`${iso}T12:00:00Z`);

/**
 * Days until a date. The server renders it against the data snapshot's date;
 * in the browser it re-counts against the viewer's real date, so a page built
 * days ago never shows a stale countdown.
 */
export function DaysTo({ date, from, format = "number" }: { date: string; from: string; format?: "number" | "words" }) {
  const [n, setN] = useState(() => Math.round((at(date) - at(from)) / DAY));
  useEffect(() => {
    const now = new Date();
    const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 12);
    setN(Math.round((at(date) - today) / DAY));
  }, [date]);
  if (format === "words") return <>{n < 0 ? "celebrado" : n === 0 ? "hoy" : n === 1 ? "mañana" : `en ${n} días`}</>;
  return <>{String(Math.max(0, n)).padStart(2, "0")}</>;
}
