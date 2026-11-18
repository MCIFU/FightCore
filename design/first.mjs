import { chromium } from "playwright-core";
const out = process.argv[2];
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const p = await ctx.newPage();
for (const n of ["a-almanaque", "b-octagono", "c-cartel"]) { await p.goto("file://" + process.cwd() + "/design/concepts/" + n + ".html"); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(500); await p.screenshot({ path: `${out}/${n}-m1.png` }); }
await b.close();
