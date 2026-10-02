/**
 * Generates every app icon from the Núcleo mark (components/brand/Logo.tsx):
 *   app/icon.svg                      favicon (small master)
 *   public/icons/icon-{192,512}.png   PWA / Android
 *   public/icons/maskable-512.png     Android adaptive icon (mark inside the 80 % safe zone)
 *   public/icons/mono-512.png         Android 13 themed icon (single colour, transparent)
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
await png(tile(0.62, { bg: INK }), 192, "public/icons/icon-192.png");
await png(tile(0.62, { bg: INK }), 512, "public/icons/icon-512.png");
await png(tile(0.5, { bg: INK }), 512, "public/icons/maskable-512.png");
await png(tile(0.6, { fg: "#FFFFFF", core: "#FFFFFF" }), 512, "public/icons/mono-512.png");
await png(tile(0.62, { bg: INK }), 180, "public/icons/apple-180.png");
console.log("icons ok");
