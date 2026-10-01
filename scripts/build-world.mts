/**
 * Builds the geography FIGHTCORE ships with (Natural Earth via world-atlas,
 * public domain; ISO 3166 names via i18n-iso-countries):
 *   lib/domain/countries.json — every ISO country: alpha-3, Spanish name, centroid
 *   lib/geo/world.json        — projected SVG paths (1:110m) + projected anchors
 * Run once: npm run geo
 */
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { geoArea, geoCentroid, geoEqualEarth, geoPath } from "d3-geo";
import { feature } from "topojson-client";

const require = createRequire(import.meta.url);
const iso = require("i18n-iso-countries");
iso.registerLocale(require("i18n-iso-countries/langs/es.json"));

/** Shorter or more common Spanish names than the ISO long forms. */
const NAME_OVERRIDES: Record<string, string> = {
  CZE: "Chequia", KOR: "Corea del Sur", PRK: "Corea del Norte", SYR: "Siria", COD: "R. D. del Congo", COG: "Congo",
  BOL: "Bolivia", VEN: "Venezuela", IRN: "Irán", TZA: "Tanzania", MDA: "Moldavia", LAO: "Laos", VNM: "Vietnam",
  RUS: "Rusia", USA: "Estados Unidos", GBR: "Reino Unido", NLD: "Países Bajos", BIH: "Bosnia y Herzegovina",
};

const load = (f: string) => {
  const topo = JSON.parse(readFileSync(require.resolve(`world-atlas/${f}`), "utf8"));
  const fc = feature(topo, topo.objects.countries) as unknown as GeoJSON.FeatureCollection;
  fc.features = fc.features.filter((x) => x.properties?.name !== "Antarctica");
  return fc;
};
const a3Of = (id: unknown) => (id == null || id === "" ? null : (iso.numericToAlpha3(String(Number(id))) as string | undefined) ?? null);

// Centroids from the 1:50m set (it includes small states such as Bahrain or Singapore).
const centroid = new Map<string, [number, number]>();
for (const f of load("countries-50m.json").features) {
  const a3 = a3Of(f.id);
  if (!a3 || centroid.has(a3)) continue;
  // Largest polygon only, so overseas territories don't drag the anchor (France, USA, Norway…).
  const g = f.geometry;
  if (g.type === "MultiPolygon") {
    const parts = g.coordinates.map((c) => ({ type: "Polygon" as const, coordinates: c }));
    parts.sort((a, b) => geoArea(b) - geoArea(a));
    centroid.set(a3, geoCentroid(parts[0]));
  } else centroid.set(a3, geoCentroid(f));
}
const all = Object.keys(iso.getAlpha3Codes()) as string[];
const countries = all
  .map((code) => {
    const c = centroid.get(code);
    return c ? { code, name: NAME_OVERRIDES[code] ?? iso.getName(iso.alpha3ToAlpha2(code), "es"), lat: Math.round(c[1] * 10) / 10, lon: Math.round(c[0] * 10) / 10 } : null;
  })
  .filter((c): c is NonNullable<typeof c> => !!c?.name)
  .sort((a, b) => a.code.localeCompare(b.code));
writeFileSync("lib/domain/countries.json", JSON.stringify(countries));

const W = 960, H = 470;
const fc = load("countries-110m.json");
const projection = geoEqualEarth().fitSize([W, H], fc);
const path = geoPath(projection);
const round = (d: string) => d.replace(/(\d+\.\d{1})\d+/g, "$1");
const shapes = fc.features.map((f) => ({ id: String(f.id ?? ""), a3: a3Of(f.id), name: String(f.properties?.name ?? ""), d: round(path(f) ?? "") })).filter((c) => c.d);
const points = Object.fromEntries(countries.map((c) => {
  const p = projection([c.lon, c.lat])!;
  return [c.code, [Math.round(p[0] * 10) / 10, Math.round(p[1] * 10) / 10]];
}));
writeFileSync("lib/geo/world.json", JSON.stringify({ width: W, height: H, countries: shapes, points }));
console.log(`${countries.length} countries, ${shapes.length} shapes`);
