/**
 * Builds lib/geo/world.json: projected SVG paths for every country
 * (Natural Earth 1:110m via world-atlas, public domain) plus projected
 * anchor points for the countries FIGHTCORE references. Run once:
 * npm run geo
 */
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { geoEqualEarth, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import { COUNTRIES } from "../lib/domain/reference.ts";

const require = createRequire(import.meta.url);
const topo = JSON.parse(readFileSync(require.resolve("world-atlas/countries-110m.json"), "utf8"));
const NUMERIC: Record<string, string> = {
  "724": "ESP", "076": "BRA", "840": "USA", "643": "RUS", "268": "GEO", "616": "POL", "203": "CZE", "372": "IRL", "826": "GBR",
  "250": "FRA", "484": "MEX", "392": "JPN", "410": "KOR", "156": "CHN", "554": "NZL", "036": "AUS", "566": "NGA", "120": "CMR",
  "752": "SWE", "528": "NLD", "398": "KAZ", "860": "UZB", "608": "PHL", "764": "THA", "032": "ARG", "124": "CAN", "380": "ITA",
  "620": "PRT", "702": "SGP", "784": "ARE", "682": "SAU", "048": "BHR", "756": "CHE", "276": "DEU",
};
const W = 960, H = 470;
const fc = feature(topo, topo.objects.countries) as unknown as GeoJSON.FeatureCollection;
fc.features = fc.features.filter((f) => f.properties?.name !== "Antarctica");
const projection = geoEqualEarth().fitSize([W, H], fc);
const path = geoPath(projection);
const round = (d: string) => d.replace(/(\d+\.\d{1})\d+/g, "$1");
const countries = fc.features.map((f) => ({ id: String(f.id ?? ""), a3: NUMERIC[String(f.id)] ?? null, name: String(f.properties?.name ?? ""), d: round(path(f) ?? "") })).filter((c) => c.d);
const points = Object.fromEntries(COUNTRIES.map((c) => {
  const p = projection([c.lon, c.lat])!;
  return [c.code, [Math.round(p[0] * 10) / 10, Math.round(p[1] * 10) / 10]];
}));
writeFileSync("lib/geo/world.json", JSON.stringify({ width: W, height: H, countries, points }));
console.log(`${countries.length} countries, ${Object.keys(points).length} anchors`);
