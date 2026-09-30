/**
 * FIGHTCORE domain model.
 *
 * Mirrors the relational schema in db/schema.prisma. Every entity that carries
 * facts declares its provenance so the UI can always say where a number comes from.
 */

export type Provenance = "official" | "imported" | "calculated" | "editorial" | "demo";

export type ISODate = string; // YYYY-MM-DD

export type Sex = "M" | "F";

export interface Country {
  code: string; // ISO 3166-1 alpha-3
  name: string; // Spanish display name
  lat: number;
  lon: number;
}

export interface Division {
  id: string;
  slug: string;
  name: string;
  short: string;
  sex: Sex;
  limitLb: number;
  limitKg: number;
  order: number;
}

export type OrgStatus = "active" | "defunct" | "absorbed";

export interface Organization {
  id: string;
  slug: string;
  name: string;
  short: string;
  country: string | null;
  region: string;
  /** Year of first event, when known with confidence. */
  activeFrom: number | null;
  activeTo: number | null;
  status: OrgStatus;
  group: "major" | "europe" | "historical";
  note: string | null;
  provenance: Provenance;
}

export type Stance = "Orthodox" | "Southpaw" | "Switch";
export type FighterStatus = "active" | "inactive" | "retired";

export interface Fighter {
  id: string;
  slug: string;
  firstName: string;
  lastName: string;
  nickname: string | null;
  country: string;
  sex: Sex;
  birthDate: ISODate;
  heightCm: number;
  reachCm: number;
  stance: Stance;
  divisionId: string;
  orgId: string;
  status: FighterStatus;
  /** Record accumulated before FIGHTCORE coverage starts (regional/amateur-pro). */
  priorRecord: { w: number; l: number; d: number };
  provenance: Provenance;
}

export type Method = "KO/TKO" | "SUB" | "U-DEC" | "S-DEC" | "M-DEC" | "DRAW" | "NC";
export type Outcome = "W" | "L" | "D" | "NC";

export interface StrikeStats {
  sigLanded: number;
  sigAttempted: number;
  totalLanded: number;
  totalAttempted: number;
  head: number;
  body: number;
  leg: number;
  distance: number;
  clinch: number;
  ground: number;
  kd: number;
  tdLanded: number;
  tdAttempted: number;
  subAttempts: number;
  ctrlSec: number;
}

export interface RoundStats {
  round: number;
  red: Pick<StrikeStats, "sigLanded" | "sigAttempted" | "tdLanded" | "ctrlSec" | "kd">;
  blue: Pick<StrikeStats, "sigLanded" | "sigAttempted" | "tdLanded" | "ctrlSec" | "kd">;
}

export type FightStatus = "completed" | "scheduled";

export interface Fight {
  id: string;
  eventId: string;
  date: ISODate;
  orgId: string;
  divisionId: string;
  redId: string;
  blueId: string;
  status: FightStatus;
  winnerId: string | null;
  method: Method | null;
  submission: string | null;
  round: number | null;
  /** Seconds elapsed in the final round. */
  time: number | null;
  scheduledRounds: 3 | 5;
  titleFight: boolean;
  slot: "main" | "co-main" | "main-card" | "prelims";
  order: number;
  red: StrikeStats | null;
  blue: StrikeStats | null;
  rounds: RoundStats[];
  /** Judges' round tallies for decisions (red-blue), e.g. "29-28". */
  scorecards: string[] | null;
  /** Results-based strength (Elo) before the fight — input to opponent quality. */
  redStrengthPre: number;
  blueStrengthPre: number;
  provenance: Provenance;
}

export interface Event {
  id: string;
  slug: string;
  name: string;
  orgId: string;
  date: ISODate;
  city: string;
  country: string;
  venue: string | null;
  status: "completed" | "upcoming";
  fightIds: string[];
  provenance: Provenance;
}

export interface Championship {
  orgId: string;
  divisionId: string;
  fighterId: string;
  wonFightId: string;
  from: ISODate;
  to: ISODate | null;
  defenses: number;
}

export interface HistoricalEvent {
  year: number;
  date: ISODate | null;
  title: string;
  body: string;
  orgId: string | null;
  kind: "founding" | "rules" | "milestone" | "business";
  provenance: Provenance;
}

/** Fight seen from one fighter's side. Computed, not stored. */
export interface FighterBout {
  fight: Fight;
  event: Event;
  corner: "red" | "blue";
  opponentId: string;
  outcome: Outcome | null;
  own: StrikeStats | null;
  opp: StrikeStats | null;
  ownStrengthPre: number;
  oppStrengthPre: number;
}
