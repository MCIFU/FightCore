-- FIGHTCORE relational schema (PostgreSQL ≥ 14).
-- Facts carry provenance; calculated tables are rebuilt from facts.
-- Idempotent: safe to run on an empty or existing database.

BEGIN;

DO $$ BEGIN
  CREATE TYPE provenance AS ENUM ('official', 'imported', 'calculated', 'editorial', 'demo');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS countries (
  code        char(3) PRIMARY KEY,           -- ISO 3166-1 alpha-3
  name        text NOT NULL,
  lat         real NOT NULL,
  lon         real NOT NULL
);

CREATE TABLE IF NOT EXISTS organizations (
  id          text PRIMARY KEY,
  slug        text UNIQUE NOT NULL,
  name        text NOT NULL,
  short       text NOT NULL,
  country     char(3) REFERENCES countries(code),
  region      text NOT NULL,
  active_from int,                            -- NULL = unknown, never guessed
  active_to   int,
  status      text NOT NULL CHECK (status IN ('active', 'defunct', 'absorbed')),
  grp         text NOT NULL CHECK (grp IN ('major', 'europe', 'historical')),
  note        text,
  provenance  provenance NOT NULL
);

CREATE TABLE IF NOT EXISTS divisions (
  id          text PRIMARY KEY,
  slug        text UNIQUE NOT NULL,
  name        text NOT NULL,
  short       text NOT NULL,
  sex         char(1) NOT NULL CHECK (sex IN ('M', 'F')),
  limit_lb    int NOT NULL,
  limit_kg    numeric(5,1) NOT NULL,
  ord         int NOT NULL
);

CREATE TABLE IF NOT EXISTS fighters (
  id            text PRIMARY KEY,
  slug          text UNIQUE NOT NULL,
  first_name    text NOT NULL,
  last_name     text NOT NULL,
  nickname      text,
  country       char(3) NOT NULL REFERENCES countries(code),
  sex           char(1) NOT NULL CHECK (sex IN ('M', 'F')),
  birth_date    date,
  height_cm     int,
  reach_cm      int,
  stance        text,
  division_id   text NOT NULL REFERENCES divisions(id),
  org_id        text NOT NULL REFERENCES organizations(id),
  status        text NOT NULL CHECK (status IN ('active', 'inactive', 'retired')),
  prior_w       int NOT NULL DEFAULT 0,
  prior_l       int NOT NULL DEFAULT 0,
  prior_d       int NOT NULL DEFAULT 0,
  photo_src     text,
  photo_kind    text CHECK (photo_kind IN ('illustration', 'licensed')),
  photo_credit  text,
  photo_updated date,
  provenance    provenance NOT NULL
);

CREATE TABLE IF NOT EXISTS events (
  id          text PRIMARY KEY,
  slug        text UNIQUE NOT NULL,
  name        text NOT NULL,
  org_id      text NOT NULL REFERENCES organizations(id),
  date        date NOT NULL,
  city        text NOT NULL,
  country     char(3) NOT NULL REFERENCES countries(code),
  venue       text,
  status      text NOT NULL CHECK (status IN ('completed', 'upcoming')),
  provenance  provenance NOT NULL
);
CREATE INDEX IF NOT EXISTS events_date_idx ON events (date);

CREATE TABLE IF NOT EXISTS fights (
  id                text PRIMARY KEY,
  event_id          text NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  date              date NOT NULL,
  org_id            text NOT NULL REFERENCES organizations(id),
  division_id       text NOT NULL REFERENCES divisions(id),
  red_id            text NOT NULL REFERENCES fighters(id),
  blue_id           text NOT NULL REFERENCES fighters(id),
  status            text NOT NULL CHECK (status IN ('completed', 'scheduled')),
  winner_id         text REFERENCES fighters(id),
  method            text CHECK (method IN ('KO/TKO', 'SUB', 'U-DEC', 'S-DEC', 'M-DEC', 'DRAW', 'NC')),
  submission        text,
  end_round         int,
  end_time_sec      int,
  scheduled_rounds  int NOT NULL CHECK (scheduled_rounds IN (3, 5)),
  title_fight       boolean NOT NULL DEFAULT false,
  slot              text NOT NULL,
  card_order        int NOT NULL,
  scorecards        text[],
  red_strength_pre  real NOT NULL,
  blue_strength_pre real NOT NULL,
  provenance        provenance NOT NULL,
  CHECK (red_id <> blue_id)
);
CREATE INDEX IF NOT EXISTS fights_red_idx ON fights (red_id);
CREATE INDEX IF NOT EXISTS fights_blue_idx ON fights (blue_id);
CREATE INDEX IF NOT EXISTS fights_event_idx ON fights (event_id);

-- One row per fighter per completed fight: the box score.
CREATE TABLE IF NOT EXISTS fight_stats (
  fight_id        text NOT NULL REFERENCES fights(id) ON DELETE CASCADE,
  corner          text NOT NULL CHECK (corner IN ('red', 'blue')),
  sig_landed      int NOT NULL, sig_attempted   int NOT NULL,
  total_landed    int NOT NULL, total_attempted int NOT NULL,
  head int NOT NULL, body int NOT NULL, leg int NOT NULL,
  distance int NOT NULL, clinch int NOT NULL, ground int NOT NULL,
  kd int NOT NULL, td_landed int NOT NULL, td_attempted int NOT NULL,
  sub_attempts int NOT NULL, ctrl_sec int NOT NULL,
  PRIMARY KEY (fight_id, corner)
);

CREATE TABLE IF NOT EXISTS rounds (
  fight_id    text NOT NULL REFERENCES fights(id) ON DELETE CASCADE,
  round       int NOT NULL,
  corner      text NOT NULL CHECK (corner IN ('red', 'blue')),
  sig_landed  int NOT NULL, sig_attempted int NOT NULL, td_landed int NOT NULL, ctrl_sec int NOT NULL, kd int NOT NULL,
  PRIMARY KEY (fight_id, round, corner)
);

CREATE TABLE IF NOT EXISTS championships (
  id            serial PRIMARY KEY,
  org_id        text NOT NULL REFERENCES organizations(id),
  division_id   text NOT NULL REFERENCES divisions(id),
  fighter_id    text NOT NULL REFERENCES fighters(id),
  won_fight_id  text NOT NULL REFERENCES fights(id),
  date_from     date NOT NULL,
  date_to       date,
  defenses      int NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS historical_events (
  id          serial PRIMARY KEY,
  year        int NOT NULL,
  date        date,
  title       text NOT NULL,
  body        text NOT NULL,
  org_id      text REFERENCES organizations(id),
  kind        text NOT NULL,
  provenance  provenance NOT NULL
);

-- Calculated: FIGHTCORE Rating history (seq 0..n after each fight, -1 = today).
CREATE TABLE IF NOT EXISTS fighter_ratings (
  fighter_id    text NOT NULL REFERENCES fighters(id) ON DELETE CASCADE,
  model_version text NOT NULL,
  seq           int NOT NULL,
  as_of         date NOT NULL,
  after_fight   text REFERENCES fights(id),
  value         real NOT NULL,
  band          real NOT NULL,
  factors       jsonb,
  PRIMARY KEY (fighter_id, model_version, seq)
);

CREATE TABLE IF NOT EXISTS dataset_meta (
  key   text PRIMARY KEY,
  value text NOT NULL
);

COMMIT;
