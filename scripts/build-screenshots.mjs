/**
 * Store screenshots for the installable app (manifest "screenshots"; PWABuilder
 * and Google Play show them). Captured from a running production build:
 *
 *   npm run build && npm start            (another terminal)
 *   npm run screenshots                   → public/screenshots/*.webp
 *
 * Uses the Chromium that Playwright finds (or CHROME_PATH).
 */
import { mkdirSync } from "node:fs";
import { chromium } from "playwright-core";
import sharp from "sharp";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const OUT = "public/screenshots";
mkdirSync(OUT, { recursive: true });

// narrow: 360×780 CSS px at 3× → 1080×2340 (ratio 2.17, under the 2.3 limit); wide: 1280×720 at 1.5× → 1920×1080.
const SHOTS = [
  { name: "narrow-1-inicio", url: "/", w: 360, h: 780, dpr: 3 },
  { name: "narrow-2-luchador", url: "/fighters/islam-makhachev", w: 360, h: 780, dpr: 3 },
  { name: "narrow-3-rankings", url: "/rankings", w: 360, h: 780, dpr: 3, y: 330 },
  { name: "narrow-4-campeones", url: "/champions", w: 360, h: 780, dpr: 3, y: 380 },
  { name: "wide-1-inicio", url: "/", w: 1280, h: 720, dpr: 1.5 },
  { name: "wide-2-luchador", url: "/fighters/islam-makhachev", w: 1280, h: 720, dpr: 1.5 },
];

const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
for (const s of SHOTS) {
  const ctx = await browser.newContext({ viewport: { width: s.w, height: s.h }, deviceScaleFactor: s.dpr, isMobile: s.w < 700, hasTouch: s.w < 700, colorScheme: "dark" });
  const page = await ctx.newPage();
  await page.goto(BASE + s.url, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  if (s.y) await page.evaluate((y) => window.scrollTo(0, y), s.y);
  await page.waitForTimeout(1500);
  const png = await page.screenshot();
  await sharp(png).webp({ quality: 82 }).toFile(`${OUT}/${s.name}.webp`);
  await ctx.close();
  console.log(`${s.name}.webp`);
}
await browser.close();
