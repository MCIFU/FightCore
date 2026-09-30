/**
 * Name pools for fictional demo fighters. Combinations are generated to avoid
 * attributing invented statistics to real athletes.
 */
export const NAME_POOLS: Record<string, { m: string[]; f: string[]; last: string[] }> = {
  ESP: { m: ["Iker", "Unai", "Héctor", "Rubén", "Álvaro", "Xabier", "Dario", "Pelayo"], f: ["Nerea", "Irene", "Olaia", "Candela"], last: ["Arrieta", "Villalba", "Quintela", "Salcedo", "Oliván", "Barreiro", "Ugarte", "Llamazares", "Cienfuegos"] },
  BRA: { m: ["Caio", "Renan", "Gilberto", "Wanderson", "Josué", "Itamar"], f: ["Luana", "Tainá", "Jéssica"], last: ["Bittencourt", "Sampaio", "Figueira", "Magalhães", "Cavalcanti", "Rezende", "Queiroga"] },
  USA: { m: ["Colton", "Darnell", "Reece", "Tanner", "Malik", "Brody"], f: ["Kendra", "Shayla", "Reagan"], last: ["Whitacre", "Holloman", "Pruett", "Vance", "Castellano", "Brightwater", "Okafor"] },
  RUS: { m: ["Timur", "Ruslan", "Zaur", "Magomedrasul", "Artyom"], f: ["Alina", "Darya"], last: ["Abakarov", "Gadzhiev", "Tsurov", "Volkonsky", "Ismailovich"] },
  GEO: { m: ["Levan", "Giorgi", "Zurab"], f: ["Nino"], last: ["Kvaratsava", "Beridze", "Lomidadze"] },
  POL: { m: ["Kacper", "Szymon", "Bartosz"], f: ["Zofia", "Weronika"], last: ["Wróblewski", "Zawadzki", "Kędziora"] },
  CZE: { m: ["Vojtěch", "Ondřej", "Matěj"], f: ["Tereza"], last: ["Hruška", "Kopecký", "Vondráček"] },
  IRL: { m: ["Cian", "Ruairí", "Darragh"], f: ["Aoife", "Saoirse"], last: ["Mac Giolla", "Rafferty", "Donnellan"] },
  GBR: { m: ["Callum", "Jaden", "Harvey"], f: ["Imogen", "Keira"], last: ["Ashworth", "Pennington", "Okonjo"] },
  FRA: { m: ["Yanis", "Maël", "Bastien"], f: ["Inès", "Maëlle"], last: ["Delacroix-Ba", "Morvan", "Lefébure"] },
  MEX: { m: ["Emiliano", "Santiago", "Brayan"], f: ["Ximena", "Itzel"], last: ["Zamarripa", "Huerta", "Olvera"] },
  JPN: { m: ["Haruto", "Ren", "Daichi"], f: ["Yui", "Hina"], last: ["Kurosawa", "Tanabe", "Ishikura"] },
  KOR: { m: ["Min-jun", "Seo-jin"], f: ["Ji-woo"], last: ["Baek", "Yoon", "Hwang"] },
  CHN: { m: ["Haoran", "Zihan"], f: ["Mengyao", "Xinyi"], last: ["Duan", "Qiao", "Rong"] },
  NZL: { m: ["Nikau", "Tamati"], f: ["Aroha"], last: ["Te Rangi", "Whitlock"] },
  AUS: { m: ["Lachlan", "Brodie"], f: ["Matilda"], last: ["Fairweather", "Dunleavy"] },
  NGA: { m: ["Chidi", "Tobenna"], f: ["Adaeze"], last: ["Nwachukwu", "Adeyemi"] },
  CMR: { m: ["Aristide", "Blaise"], f: [], last: ["Ekambi", "Nkoulou-Mba"] },
  SWE: { m: ["Viggo", "Elias"], f: ["Saga"], last: ["Lindqvist", "Holmgren"] },
  NLD: { m: ["Daan", "Sem"], f: ["Fenna"], last: ["Van der Heijden", "Brouwer"] },
  KAZ: { m: ["Nurlan", "Yerbol"], f: ["Aigerim"], last: ["Seitkali", "Zhakupov"] },
  UZB: { m: ["Sardor", "Jasur"], f: [], last: ["Rakhimov", "Tursunov"] },
  PHL: { m: ["Jericho", "Paolo"], f: ["Mayumi"], last: ["Dimaculangan", "Salonga"] },
  THA: { m: ["Anan", "Kittisak"], f: ["Ploy"], last: ["Srisuk", "Chaiyaporn"] },
  ARG: { m: ["Thiago", "Bautista"], f: ["Martina"], last: ["Iturralde", "Zabala"] },
  CAN: { m: ["Jean-Luc", "Owen"], f: ["Brielle"], last: ["Lachance", "MacAulay"] },
  ITA: { m: ["Lorenzo", "Matteo"], f: ["Giulia"], last: ["Bernasconi", "Ferraro-Lodi"] },
  PRT: { m: ["Tiago", "Duarte"], f: ["Beatriz"], last: ["Carvalhal", "Meireles"] },
};

export const NICKNAMES = [
  "Metrónomo", "The Surveyor", "Grúa", "Northwind", "La Brújula", "Static", "El Relojero", "Undertow",
  "Sísmico", "Quiet Storm", "Ancla", "Lighthouse", "Cuchilla", "Granite", "El Arquitecto", "Vector",
  "Monsoon", "Péndulo", "Iron Tide", "Cartógrafo", "The Chemist", "Tormenta", "Longbow", "El Fantasma",
  "Kestrel", "Bisturí", "Low Tide", "Marea", "Cobalt", "Avalancha", "Fuse", "Diapasón",
];

export const SUBMISSIONS = [
  "Rear-naked choke", "Guillotina", "Triángulo", "Arm-triangle", "Kimura", "D'Arce", "Armbar", "Heel hook", "Anaconda", "Von Flue",
];

export const CITIES: { city: string; country: string }[] = [
  { city: "Las Vegas", country: "USA" }, { city: "Nueva York", country: "USA" }, { city: "Houston", country: "USA" },
  { city: "Londres", country: "GBR" }, { city: "París", country: "FRA" }, { city: "Madrid", country: "ESP" },
  { city: "Barcelona", country: "ESP" }, { city: "Lisboa", country: "PRT" }, { city: "Varsovia", country: "POL" },
  { city: "Praga", country: "CZE" }, { city: "Tokio", country: "JPN" }, { city: "Singapur", country: "SGP" },
  { city: "Abu Dabi", country: "ARE" }, { city: "Río de Janeiro", country: "BRA" }, { city: "Ciudad de México", country: "MEX" },
  { city: "Perth", country: "AUS" }, { city: "Toronto", country: "CAN" }, { city: "Estocolmo", country: "SWE" },
  { city: "Dublín", country: "IRL" }, { city: "Riad", country: "SAU" }, { city: "Manama", country: "BHR" },
  { city: "Bangkok", country: "THA" }, { city: "Glasgow", country: "GBR" }, { city: "Bilbao", country: "ESP" },
  { city: "Ginebra", country: "CHE" }, { city: "Hamburgo", country: "DEU" },
];
