/**
 * Renders every fighter portrait to a transparent 512×512 PNG in
 * public/portraits/<slug>.png. Deterministic: re-running produces the same
 * files. Usage: npm run portraits [-- --sheet out.html]
 */
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";
import { buildDemoUniverse, DEMO_TODAY } from "../lib/demo/simulate";
import { portraitSvg } from "../lib/portraits/face";
import { portraitInputs } from "../lib/portraits/inputs";

const out = join(process.cwd(), "public", "portraits");
rmSync(out, { recursive: true, force: true }); // drop portraits of renamed fighters
mkdirSync(out, { recursive: true });
const inputs = portraitInputs(buildDemoUniverse(), DEMO_TODAY);
const sheetArg = process.argv.indexOf("--sheet");

const svgs: string[] = [];
for (const p of inputs) {
  const svg = portraitSvg(p);
  svgs.push(svg);
  await sharp(Buffer.from(svg), { density: 144 })
    .resize(512, 512)
    .png({ compressionLevel: 9, palette: true, quality: 90, effort: 10 })
    .toFile(join(out, `${p.slug}.png`));
}
if (sheetArg > 0) {
  writeFileSync(process.argv[sheetArg + 1], `<body style="margin:0;background:#1a1d22;display:grid;grid-template-columns:repeat(12,1fr)">${svgs.map((s, i) => `<div style="border:1px solid #333;color:#aaa;font:10px monospace">${s.replace('width="512" height="512"', 'width="100%"')}${inputs[i].slug} ${inputs[i].age}</div>`).join("")}</body>`);
}
console.log(`${inputs.length} portraits → public/portraits`);
