// Shared helpers for the redesign concept prototypes (real snapshot data only).
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

export const D = JSON.parse(readFileSync(new URL("./data.json", import.meta.url)));
export const photo = (p) => (p ? `../../public${p}` : null);

const MES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const MESL = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const DIA = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
const DIAL = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const d = (s) => new Date(s + "T12:00:00Z");
export const day = (s) => d(s).getUTCDate();
export const mon = (s) => MES[d(s).getUTCMonth()];
export const monL = (s) => MESL[d(s).getUTCMonth()];
export const dow = (s) => DIA[d(s).getUTCDay()];
export const dowL = (s) => DIAL[d(s).getUTCDay()];
export const short = (s) => `${day(s)} ${mon(s)}`;
export const long = (s) => `${day(s)} de ${monL(s)} de ${d(s).getUTCFullYear()}`;
export const TODAY = "2026-11-18";
export const daysTo = (s) => Math.round((d(s) - d(TODAY)) / 864e5);
export const num = (v, n = 1) => v.toLocaleString("es-ES", { minimumFractionDigits: n, maximumFractionDigits: n });
export const clock = (sec) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
export const method = (m) => ({ "U-DEC": "decisión unánime", "S-DEC": "decisión dividida", "M-DEC": "decisión mayoritaria", "KO/TKO": "KO/TKO", SUB: "sumisión" })[m] ?? m;
export const methodShort = (m) => ({ "U-DEC": "DEC (U)", "S-DEC": "DEC (D)", "M-DEC": "DEC (M)" })[m] ?? m;
export const divShort = (s) => s.replace("Peso ", "").replace(" femenino", " fem.");
export const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;");
export const winLose = (r) => (r.winner === "blue" ? [r.blue, r.red] : [r.red, r.blue]);

export function write(name, html) {
  mkdirSync(new URL("./concepts/", import.meta.url), { recursive: true });
  writeFileSync(new URL(`./concepts/${name}.html`, import.meta.url), html);
}

/** The FIGHTCORE mark (same geometry as app/icon.svg). */
export const mark = (fg = "currentColor", core = "#ec6528") =>
  `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7.858 2H16.142L22 7.858V16.142L16.142 22H7.858L2 16.142V7.858Z" fill="none" stroke="${fg}" stroke-width="3.2"/><rect x="8" y="8" width="8" height="8" fill="${core}"/></svg>`;
