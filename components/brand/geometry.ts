/** Núcleo geometry on the 24-unit grid — shared by the React mark and the icon generator. */
/** Regular octagon, path centre-line from 2 to 22 (corner cut = 20 / (2 + √2)). */
export const OCTAGON = "M7.858 2H16.142L22 7.858V16.142L16.142 22H7.858L2 16.142V7.858Z";
/** Two optical masters: ≥ 28 px and below. */
export const MARK_SPEC = {
  large: { stroke: 2.5, core: 7 },
  small: { stroke: 3.2, core: 8 },
} as const;
