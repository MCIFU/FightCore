/** Client-safe formatting helpers. */

const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const MONTHS_LONG = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const WEEKDAYS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];

const parts = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return { y, m, d };
};

export const fmtDate = (iso: string) => {
  const { y, m, d } = parts(iso);
  return `${d} ${MONTHS[m - 1]} ${y}`;
};
export const fmtDateLong = (iso: string) => {
  const { y, m, d } = parts(iso);
  return `${d} de ${MONTHS_LONG[m - 1]} de ${y}`;
};
export const fmtDayMonth = (iso: string) => {
  const { m, d } = parts(iso);
  return { day: String(d).padStart(2, "0"), month: MONTHS[m - 1].toUpperCase() };
};
export const fmtWeekday = (iso: string) => WEEKDAYS[new Date(`${iso}T12:00:00Z`).getUTCDay()];
export const fmtMonthYear = (iso: string) => {
  const { y, m } = parts(iso);
  return `${MONTHS[m - 1]} ${y}`;
};
/** Compact stamp for dense metadata: 2026.09.30 */
export const fmtStamp = (iso: string) => iso.replaceAll("-", ".");

export const fmtClock = (sec: number | null) =>
  sec === null ? "—" : `${Math.floor(sec / 60)}:${String(Math.round(sec % 60)).padStart(2, "0")}`;

export const fmtPct = (x: number, digits = 0) => `${(x * 100).toFixed(digits)}%`;
export const fmtNum = (x: number, digits = 1) => x.toFixed(digits).replace(".", ",");
/** Ratings use a point, as a product convention ("94.7"), to read as a score, not a quantity. */
export const fmtRating = (x: number) => x.toFixed(1);

export const fmtRecord = (r: { w: number; l: number; d: number; nc?: number }) =>
  `${r.w}-${r.l}-${r.d}${r.nc ? ` (${r.nc} NC)` : ""}`;

export const METHOD_LABEL: Record<string, string> = {
  "KO/TKO": "KO/TKO",
  SUB: "Sumisión",
  "U-DEC": "Decisión unánime",
  "S-DEC": "Decisión dividida",
  "M-DEC": "Decisión mayoritaria",
  DQ: "Descalificación",
  DRAW: "Empate",
  NC: "Sin resultado",
};
export const METHOD_SHORT: Record<string, string> = {
  "KO/TKO": "KO/TKO", SUB: "SUB", "U-DEC": "DEC-U", "S-DEC": "DEC-D", "M-DEC": "DEC-M", DQ: "DQ", DRAW: "EMP", NC: "NC",
};

export const OUTCOME_LABEL: Record<string, string> = { W: "Victoria", L: "Derrota", D: "Empate", NC: "Sin resultado" };
export const OUTCOME_SHORT: Record<string, string> = { W: "V", L: "D", D: "E", NC: "NC" };

export const initials = (first: string, last: string) =>
  `${first[0] ?? ""}${last.replace(/^(Mac |Mc|Van der |Te |Delacroix-)/, "")[0] ?? ""}`.toUpperCase();

export const cmToFtIn = (cm: number) => {
  const inches = Math.round(cm / 2.54);
  return `${Math.floor(inches / 12)}′${inches % 12}″`;
};

export const fmtCm = (cm: number | null | undefined) => (cm == null ? "—" : `${cm} cm`);
export const STANCE_LABEL: Record<string, string> = { Orthodox: "Ortodoxa", Southpaw: "Zurda", Switch: "Cambiante" };
export const fmtStance = (st: string | null | undefined) => (st ? STANCE_LABEL[st] ?? st : "—");
/** Public origin: explicit, else the Vercel production domain, else the placeholder. */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL
  ?? (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "https://fightcore.app");
