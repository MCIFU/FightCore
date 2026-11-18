import { chromium } from "playwright-core";
const [name, out] = process.argv.slice(2);
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const url = "file://" + process.cwd() + "/design/concepts/" + name + ".html";
for (const [w, h, tag, full] of [[1440, 900, "d", true], [390, 844, "m", true]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: tag === "m" ? 2 : 1, isMobile: tag === "m", hasTouch: tag === "m" });
  const p = await ctx.newPage();
  await p.goto(url, { waitUntil: "load" }); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(700);
  await p.screenshot({ path: `${out}/${name}-${tag}.png`, fullPage: full });
  const ov = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth); if (ov > 0) console.log(tag, "OVERFLOW", ov);
}
await b.close();
