import type { Country, Division, HistoricalEvent, Organization } from "./types";

/**
 * Reference data. Organizations are real entities, described only with
 * editorial metadata we can stand behind. Unknown values stay null.
 */

export const DIVISIONS: Division[] = [
  { id: "M-FLY", slug: "peso-mosca", name: "Peso mosca", short: "FLY", sex: "M", limitLb: 125, limitKg: 56.7, order: 1 },
  { id: "M-BW", slug: "peso-gallo", name: "Peso gallo", short: "BW", sex: "M", limitLb: 135, limitKg: 61.2, order: 2 },
  { id: "M-FW", slug: "peso-pluma", name: "Peso pluma", short: "FW", sex: "M", limitLb: 145, limitKg: 65.8, order: 3 },
  { id: "M-LW", slug: "peso-ligero", name: "Peso ligero", short: "LW", sex: "M", limitLb: 155, limitKg: 70.3, order: 4 },
  { id: "M-WW", slug: "peso-welter", name: "Peso wélter", short: "WW", sex: "M", limitLb: 170, limitKg: 77.1, order: 5 },
  { id: "M-MW", slug: "peso-medio", name: "Peso medio", short: "MW", sex: "M", limitLb: 185, limitKg: 83.9, order: 6 },
  { id: "M-LHW", slug: "peso-semipesado", name: "Peso semipesado", short: "LHW", sex: "M", limitLb: 205, limitKg: 93.0, order: 7 },
  { id: "M-HW", slug: "peso-pesado", name: "Peso pesado", short: "HW", sex: "M", limitLb: 265, limitKg: 120.2, order: 8 },
  { id: "W-SW", slug: "paja-femenino", name: "Peso paja femenino", short: "W-SW", sex: "F", limitLb: 115, limitKg: 52.2, order: 9 },
  { id: "W-FLY", slug: "mosca-femenino", name: "Peso mosca femenino", short: "W-FLY", sex: "F", limitLb: 125, limitKg: 56.7, order: 10 },
  { id: "W-BW", slug: "gallo-femenino", name: "Peso gallo femenino", short: "W-BW", sex: "F", limitLb: 135, limitKg: 61.2, order: 11 },
];

export const ORGANIZATIONS: Organization[] = [
  { id: "ufc", slug: "ufc", name: "Ultimate Fighting Championship", short: "UFC", country: "USA", region: "Global", activeFrom: 1993, activeTo: null, status: "active", group: "major", note: null, provenance: "editorial" },
  { id: "pfl", slug: "pfl", name: "Professional Fighters League", short: "PFL", country: "USA", region: "Global", activeFrom: 2018, activeTo: null, status: "active", group: "major", note: "Relanzamiento de World Series of Fighting. Adquirió Bellator en 2023.", provenance: "editorial" },
  { id: "one", slug: "one", name: "ONE Championship", short: "ONE", country: "SGP", region: "Asia", activeFrom: 2011, activeTo: null, status: "active", group: "major", note: null, provenance: "editorial" },
  { id: "rizin", slug: "rizin", name: "RIZIN Fighting Federation", short: "RIZIN", country: "JPN", region: "Asia", activeFrom: 2015, activeTo: null, status: "active", group: "major", note: null, provenance: "editorial" },
  { id: "ksw", slug: "ksw", name: "Konfrontacja Sztuk Walki", short: "KSW", country: "POL", region: "Europa", activeFrom: 2004, activeTo: null, status: "active", group: "europe", note: null, provenance: "editorial" },
  { id: "oktagon", slug: "oktagon", name: "OKTAGON MMA", short: "OKTAGON", country: "CZE", region: "Europa", activeFrom: 2016, activeTo: null, status: "active", group: "europe", note: null, provenance: "editorial" },
  { id: "cw", slug: "cage-warriors", name: "Cage Warriors", short: "CW", country: "GBR", region: "Europa", activeFrom: 2002, activeTo: null, status: "active", group: "europe", note: null, provenance: "editorial" },
  { id: "brave", slug: "brave", name: "BRAVE Combat Federation", short: "BRAVE", country: "BHR", region: "Oriente Medio", activeFrom: 2016, activeTo: null, status: "active", group: "europe", note: null, provenance: "editorial" },
  { id: "lfa", slug: "lfa", name: "Legacy Fighting Alliance", short: "LFA", country: "USA", region: "Norteamérica", activeFrom: 2017, activeTo: null, status: "active", group: "major", note: null, provenance: "editorial" },
  { id: "ares", slug: "ares", name: "ARES Fighting Championship", short: "ARES", country: null, region: "Europa / África", activeFrom: null, activeTo: null, status: "active", group: "europe", note: null, provenance: "editorial" },
  { id: "cffc", slug: "cffc", name: "Cage Fury Fighting Championships", short: "CFFC", country: "USA", region: "Norteamérica", activeFrom: null, activeTo: null, status: "active", group: "major", note: null, provenance: "editorial" },
  { id: "invicta", slug: "invicta", name: "Invicta Fighting Championships", short: "INVICTA", country: "USA", region: "Norteamérica", activeFrom: 2012, activeTo: null, status: "active", group: "major", note: "Organización exclusivamente femenina.", provenance: "editorial" },
  { id: "wowfc", slug: "wow-fc", name: "WOW FC", short: "WOW", country: "ESP", region: "España", activeFrom: null, activeTo: null, status: "active", group: "europe", note: null, provenance: "editorial" },
  { id: "warmma", slug: "war-mma", name: "WAR MMA", short: "WAR", country: null, region: "España / Europa", activeFrom: null, activeTo: null, status: "active", group: "europe", note: null, provenance: "editorial" },
  { id: "pride", slug: "pride", name: "PRIDE Fighting Championships", short: "PRIDE", country: "JPN", region: "Asia", activeFrom: 1997, activeTo: 2007, status: "defunct", group: "historical", note: null, provenance: "editorial" },
  { id: "strikeforce", slug: "strikeforce", name: "Strikeforce", short: "SF", country: "USA", region: "Norteamérica", activeFrom: 2006, activeTo: 2013, status: "absorbed", group: "historical", note: "Promotora de kickboxing antes de su primer evento de MMA (2006).", provenance: "editorial" },
  { id: "wec", slug: "wec", name: "World Extreme Cagefighting", short: "WEC", country: "USA", region: "Norteamérica", activeFrom: 2001, activeTo: 2010, status: "absorbed", group: "historical", note: "Sus divisiones ligeras se integraron en UFC.", provenance: "editorial" },
  { id: "bellator", slug: "bellator", name: "Bellator MMA", short: "BELLATOR", country: "USA", region: "Norteamérica", activeFrom: 2009, activeTo: null, status: "absorbed", group: "historical", note: "Adquirida por PFL en 2023.", provenance: "editorial" },
  { id: "elitexc", slug: "elitexc", name: "EliteXC", short: "EXC", country: "USA", region: "Norteamérica", activeFrom: 2007, activeTo: 2008, status: "defunct", group: "historical", note: null, provenance: "editorial" },
  { id: "affliction", slug: "affliction", name: "Affliction Entertainment", short: "AFFL", country: "USA", region: "Norteamérica", activeFrom: 2008, activeTo: 2009, status: "defunct", group: "historical", note: null, provenance: "editorial" },
  { id: "dream", slug: "dream", name: "DREAM", short: "DREAM", country: "JPN", region: "Asia", activeFrom: 2008, activeTo: 2012, status: "defunct", group: "historical", note: null, provenance: "editorial" },
  { id: "pancrase", slug: "pancrase", name: "Pancrase", short: "PANCRASE", country: "JPN", region: "Asia", activeFrom: 1993, activeTo: null, status: "active", group: "historical", note: "Anterior en semanas al primer UFC.", provenance: "editorial" },
  { id: "shooto", slug: "shooto", name: "Shooto", short: "SHOOTO", country: "JPN", region: "Asia", activeFrom: 1989, activeTo: null, status: "active", group: "historical", note: null, provenance: "editorial" },
  { id: "deep", slug: "deep", name: "DEEP", short: "DEEP", country: "JPN", region: "Asia", activeFrom: 2001, activeTo: null, status: "active", group: "historical", note: null, provenance: "editorial" },
];

export const COUNTRIES: Country[] = [
  { code: "ESP", name: "España", lat: 40.4, lon: -3.7 },
  { code: "BRA", name: "Brasil", lat: -15.8, lon: -47.9 },
  { code: "USA", name: "Estados Unidos", lat: 38.9, lon: -77.0 },
  { code: "RUS", name: "Rusia", lat: 55.8, lon: 37.6 },
  { code: "GEO", name: "Georgia", lat: 41.7, lon: 44.8 },
  { code: "POL", name: "Polonia", lat: 52.2, lon: 21.0 },
  { code: "CZE", name: "Chequia", lat: 50.1, lon: 14.4 },
  { code: "IRL", name: "Irlanda", lat: 53.3, lon: -6.3 },
  { code: "GBR", name: "Reino Unido", lat: 51.5, lon: -0.1 },
  { code: "FRA", name: "Francia", lat: 48.9, lon: 2.4 },
  { code: "MEX", name: "México", lat: 19.4, lon: -99.1 },
  { code: "JPN", name: "Japón", lat: 35.7, lon: 139.7 },
  { code: "KOR", name: "Corea del Sur", lat: 37.6, lon: 127.0 },
  { code: "CHN", name: "China", lat: 39.9, lon: 116.4 },
  { code: "NZL", name: "Nueva Zelanda", lat: -41.3, lon: 174.8 },
  { code: "AUS", name: "Australia", lat: -35.3, lon: 149.1 },
  { code: "NGA", name: "Nigeria", lat: 9.1, lon: 7.5 },
  { code: "CMR", name: "Camerún", lat: 3.9, lon: 11.5 },
  { code: "SWE", name: "Suecia", lat: 59.3, lon: 18.1 },
  { code: "NLD", name: "Países Bajos", lat: 52.4, lon: 4.9 },
  { code: "KAZ", name: "Kazajistán", lat: 51.2, lon: 71.4 },
  { code: "UZB", name: "Uzbekistán", lat: 41.3, lon: 69.2 },
  { code: "PHL", name: "Filipinas", lat: 14.6, lon: 121.0 },
  { code: "THA", name: "Tailandia", lat: 13.8, lon: 100.5 },
  { code: "ARG", name: "Argentina", lat: -34.6, lon: -58.4 },
  { code: "CAN", name: "Canadá", lat: 45.4, lon: -75.7 },
  { code: "ITA", name: "Italia", lat: 41.9, lon: 12.5 },
  { code: "PRT", name: "Portugal", lat: 38.7, lon: -9.1 },
  { code: "SGP", name: "Singapur", lat: 1.35, lon: 103.8 },
  { code: "ARE", name: "Emiratos Árabes Unidos", lat: 24.5, lon: 54.4 },
  { code: "SAU", name: "Arabia Saudí", lat: 24.7, lon: 46.7 },
  { code: "BHR", name: "Baréin", lat: 26.2, lon: 50.6 },
  { code: "CHE", name: "Suiza", lat: 46.9, lon: 7.4 },
  { code: "DEU", name: "Alemania", lat: 52.5, lon: 13.4 },
];

/**
 * Editorial milestones. Only widely documented facts; kept short and written
 * in our own words. Provenance: editorial.
 */
export const HISTORY: HistoricalEvent[] = [
  { year: 1989, date: null, title: "Shooto celebra sus primeros combates profesionales", body: "Japón formaliza un deporte híbrido de golpeo y sumisión años antes del boom estadounidense.", orgId: "shooto", kind: "founding", provenance: "editorial" },
  { year: 1993, date: "1993-11-12", title: "UFC 1 en Denver", body: "Un torneo de estilos sin categorías de peso plantea la pregunta que el deporte lleva tres décadas respondiendo.", orgId: "ufc", kind: "founding", provenance: "editorial" },
  { year: 1997, date: "1997-10-11", title: "PRIDE nace en el Tokyo Dome", body: "Japón se convierte en el centro de gravedad del MMA durante casi una década.", orgId: "pride", kind: "founding", provenance: "editorial" },
  { year: 2001, date: null, title: "Reglas unificadas", body: "Las comisiones de Nueva Jersey fijan el marco de reglas, rounds y faltas que acabará adoptando casi todo el mundo.", orgId: null, kind: "rules", provenance: "editorial" },
  { year: 2005, date: null, title: "El reality que cambió la audiencia", body: "La televisión abierta en EE. UU. convierte el MMA en un deporte de masas.", orgId: "ufc", kind: "milestone", provenance: "editorial" },
  { year: 2007, date: null, title: "PRIDE desaparece", body: "El cierre de PRIDE traslada talento y centro de poder a Norteamérica.", orgId: "pride", kind: "business", provenance: "editorial" },
  { year: 2011, date: null, title: "ONE aterriza en Singapur", body: "Asia recupera una promotora de alcance continental.", orgId: "one", kind: "founding", provenance: "editorial" },
  { year: 2013, date: "2013-02-23", title: "Primer combate femenino en UFC", body: "Las divisiones femeninas pasan de circuitos especializados al escaparate principal.", orgId: "ufc", kind: "milestone", provenance: "editorial" },
  { year: 2015, date: null, title: "RIZIN recoge el legado japonés", body: "Tokio vuelve a tener una gran promotora de fin de año.", orgId: "rizin", kind: "founding", provenance: "editorial" },
  { year: 2018, date: null, title: "PFL y el formato de temporada", body: "Una liga con fase regular y playoffs propone otra forma de decidir quién es el mejor.", orgId: "pfl", kind: "founding", provenance: "editorial" },
  { year: 2023, date: null, title: "PFL adquiere Bellator", body: "La consolidación redibuja el mapa de las grandes organizaciones.", orgId: "pfl", kind: "business", provenance: "editorial" },
];

export const divisionById = new Map(DIVISIONS.map((d) => [d.id, d]));
export const orgById = new Map(ORGANIZATIONS.map((o) => [o.id, o]));
export const countryByCode = new Map(COUNTRIES.map((c) => [c.code, c]));
