export interface NavItem { href: string; label: string; product?: string; phase?: 1 | 2 | 3 }

/** Primary navigation — kept to five items plus search. */
export const PRIMARY_NAV: NavItem[] = [
  { href: "/fighters", label: "Luchadores", product: "Base de datos", phase: 1 },
  { href: "/rankings", label: "Rankings", product: "Por rating", phase: 1 },
  { href: "/champions", label: "Campeones", product: "Por división", phase: 1 },
  { href: "/events", label: "Eventos", product: "Calendario", phase: 1 },
  { href: "/compare", label: "Comparar", product: "Hasta 4", phase: 1 },
];

export const MORE_NAV: NavItem[] = [
  { href: "/scout", label: "Scout", product: "Informe", phase: 2 },
  { href: "/matchup", label: "Style Matchup", product: "Cruce de estilos", phase: 2 },
  { href: "/stats", label: "Stats", product: "Líderes", phase: 2 },
  { href: "/records", label: "Récords", product: "Marcas", phase: 2 },
  { href: "/map", label: "Mapa del MMA", product: "Por país", phase: 2 },
  { href: "/history", label: "Historia", product: "1993–hoy", phase: 2 },
  { href: "/organizations", label: "Organizaciones", product: "14 con datos", phase: 2 },
  { href: "/methodology", label: "Metodología FCR", product: "Cómo se calcula", phase: 2 },
  { href: "/credits", label: "Fuentes y créditos", phase: 2 },
  { href: "/brand", label: "Sistema de marca", phase: 1 },
];
