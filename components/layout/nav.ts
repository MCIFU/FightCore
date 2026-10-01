export interface NavItem { href: string; label: string; product?: string; phase?: 1 | 2 | 3 }

/** Primary navigation — kept to five items plus search. */
export const PRIMARY_NAV: NavItem[] = [
  { href: "/fighters", label: "Luchadores", product: "Database", phase: 1 },
  { href: "/rankings", label: "Rankings", product: "Rankings", phase: 1 },
  { href: "/champions", label: "Campeones", product: "Rankings", phase: 1 },
  { href: "/events", label: "Eventos", product: "Events", phase: 1 },
  { href: "/compare", label: "Comparar", product: "Compare", phase: 1 },
];

export const MORE_NAV: NavItem[] = [
  { href: "/scout", label: "Scout", product: "Scout", phase: 2 },
  { href: "/matchup", label: "Style Matchup", product: "Scout", phase: 2 },
  { href: "/stats", label: "Stats", product: "Stats", phase: 2 },
  { href: "/records", label: "Récords", product: "Records", phase: 2 },
  { href: "/map", label: "Mapa del MMA", product: "History", phase: 2 },
  { href: "/history", label: "Historia", product: "History", phase: 2 },
  { href: "/organizations", label: "Organizaciones", product: "Database", phase: 2 },
  { href: "/methodology", label: "Metodología FCR", product: "Rating", phase: 2 },
  { href: "/brand", label: "Sistema de marca", phase: 1 },
];
