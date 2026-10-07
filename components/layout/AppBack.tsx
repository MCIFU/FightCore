"use client";

import { usePathname, useRouter } from "next/navigation";

/**
 * Back arrow in the header, shown only when FIGHTCORE runs as an installed app
 * (display-mode: standalone), where there's no browser back button. Hidden on
 * the home page.
 */
export function AppBack({ className }: { className?: string }) {
  const router = useRouter();
  const path = usePathname();
  if (path === "/") return null;
  return (
    <button
      type="button" className={className} aria-label="Volver"
      onClick={() => (window.history.length > 1 ? router.back() : router.push("/"))}
    >
      <svg aria-hidden viewBox="0 0 20 20" width="18" height="18"><path d="M12.5 4.5 7 10l5.5 5.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="square" /></svg>
    </button>
  );
}
