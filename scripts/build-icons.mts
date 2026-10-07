/**
 * Generates every app icon from the Núcleo mark (components/brand/Logo.tsx):
 *   app/icon.svg                      favicon (small master)
 *   public/icons/icon-{48…512}.png    PWA / Android / stores, every size the stores ask for
 *   public/icons/maskable-{192,512}.png
 *   public/icons/maskable-512.png     Android adaptive icon (mark inside the 80 % safe zone)
 *   public/icons/mono-512.png         Android 13 themed icon (single colour, transparent)
 *   public/icons/shortcut-*.png       96 px icons of the app shortcuts (long-press menu)
 *   npm run icons
 */
import { writeFileSync } from "node:fs";
import sharp from "sharp";
import { MARK_SPEC, OCTAGON } from "../components/brand/geometry.ts";

const INK = "#0B0C0E", BONE = "#ECE6DA", EMBER = "#EC6528";
const mark = (spec: { stroke: number; core: number }, fg: string, core: string) =>
  `<path d="${OCTAGON}" fill="none" stroke="${fg}" stroke-width="${spec.stroke}" stroke-linejoin="miter"/>` +
  `<rect x="${12 - spec.core / 2}" y="${12 - spec.core / 2}" width="${spec.core}" height="${spec.core}" fill="${core}"/>`;

/** Mark centred on a square tile; `inset` = share of the tile the mark spans. */
const tile = (inset: number, opts: { bg?: string; rx?: number; fg?: string; core?: string; small?: boolean } = {}) => {
  const k = inset / 24, off = (1 - inset) / 2;
  const bg = opts.bg ? `<rect width="1" height="1" rx="${opts.rx ?? 0}" fill="${opts.bg}"/>` : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1">${bg}<g transform="translate(${off} ${off}) scale(${k})">${mark(opts.small ? MARK_SPEC.small : MARK_SPEC.large, opts.fg ?? BONE, opts.core ?? EMBER)}</g></svg>`;
};

writeFileSync("app/icon.svg", tile(0.78, { bg: INK, rx: 0.2, small: true }).replace('viewBox="0 0 1 1"', 'viewBox="0 0 1 1" width="32" height="32"'));
const png = (svg: string, size: number, out: string) => sharp(Buffer.from(svg), { density: 2400 }).resize(size, size).png({ compressionLevel: 9 }).toFile(out);
export const ICON_SIZES = [48, 72, 96, 128, 144, 152, 192, 256, 384, 512];
for (const n of ICON_SIZES) await png(tile(0.62, { bg: INK, small: n < 96 }), n, `public/icons/icon-${n}.png`);
for (const n of [192, 512]) await png(tile(0.5, { bg: INK }), n, `public/icons/maskable-${n}.png`);

// App shortcuts: one glyph each, bone on ink, ember accent (24-unit grid, 96 px).
const glyph = (body: string) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect width="24" height="24" fill="${INK}"/><g fill="none" stroke="${BONE}" stroke-width="1.8" stroke-linecap="square">${body}</g></svg>`;
const SHORTCUTS: Record<string, string> = {
  fighters: `<circle cx="12" cy="9" r="3.4"/><path d="M5.5 19.5c.8-3.6 3.4-5.4 6.5-5.4s5.7 1.8 6.5 5.4"/><rect x="11" y="8" width="2" height="2" fill="${EMBER}" stroke="none"/>`,
  rankings: `<path d="M6 19v-6M12 19V6M18 19v-9"/><rect x="11" y="4" width="2" height="2" fill="${EMBER}" stroke="none"/>`,
  champions: `<rect x="4.5" y="8.5" width="15" height="7"/><rect x="9.5" y="10" width="5" height="4" fill="${EMBER}" stroke="none"/><path d="M2.5 12h2M19.5 12h2"/>`,
  events: `<rect x="4.5" y="6" width="15" height="13.5"/><path d="M4.5 10h15M8.5 4v3.5M15.5 4v3.5"/><rect x="11" y="13" width="2" height="2" fill="${EMBER}" stroke="none"/>`,
  search: `<circle cx="10.5" cy="10.5" r="5.2"/><path d="m14.5 14.5 5 5"/><rect x="9.5" y="9.5" width="2" height="2" fill="${EMBER}" stroke="none"/>`,
};
for (const [k, body] of Object.entries(SHORTCUTS)) await png(glyph(body), 96, `public/icons/shortcut-${k}.png`);
await png(tile(0.6, { fg: "#FFFFFF", core: "#FFFFFF" }), 512, "public/icons/mono-512.png");
await png(tile(0.62, { bg: INK }), 180, "public/icons/apple-180.png");
console.log("icons ok");
