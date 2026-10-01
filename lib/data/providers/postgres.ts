/**
 * PostgreSQL provider: reads the fact tables (db/schema.sql) and rebuilds the
 * same domain objects the demo provider produces. Calculated data (ratings,
 * attributes, rankings) is always recomputed by FIGHTCORE from these facts.
 */
import pg from "pg";
import type { Championship, Event, Fight, Fighter, RoundStats, StrikeStats } from "../../domain/types";
import type { Universe } from "../build";

// Keep DATE columns as ISO strings (the domain uses YYYY-MM-DD everywhere).
pg.types.setTypeParser(1082, (v) => v);

type Row = Record<string, unknown>;
const n = (v: unknown) => (v === null || v === undefined ? null : Number(v));

function stats(r: Row): StrikeStats {
  return {
    sigLanded: Number(r.sig_landed), sigAttempted: Number(r.sig_attempted), totalLanded: Number(r.total_landed), totalAttempted: Number(r.total_attempted),
    head: Number(r.head), body: Number(r.body), leg: Number(r.leg), distance: Number(r.distance), clinch: Number(r.clinch), ground: Number(r.ground),
    kd: Number(r.kd), tdLanded: Number(r.td_landed), tdAttempted: Number(r.td_attempted), subAttempts: Number(r.sub_attempts), ctrlSec: Number(r.ctrl_sec),
  };
}

export async function loadUniverseFromPostgres(connectionString: string): Promise<Universe> {
  const client = new pg.Client({ connectionString });
  await client.connect();
  try {
    const q = async (sql: string) => (await client.query(sql)).rows as Row[];
    const [fr, er, fir, sr, rr, cr] = await Promise.all([
      q("SELECT * FROM fighters ORDER BY id"),
      q("SELECT * FROM events ORDER BY date, id"),
      q("SELECT * FROM fights ORDER BY id"),
      q("SELECT * FROM fight_stats"),
      q("SELECT * FROM rounds ORDER BY fight_id, round"),
      q("SELECT * FROM championships ORDER BY id"),
    ]);

    const fighters: Fighter[] = fr.map((r) => ({
      id: String(r.id), slug: String(r.slug), firstName: String(r.first_name), lastName: String(r.last_name),
      nickname: (r.nickname as string) ?? null, country: String(r.country), sex: r.sex as Fighter["sex"],
      birthDate: String(r.birth_date), heightCm: Number(r.height_cm), reachCm: Number(r.reach_cm), stance: r.stance as Fighter["stance"],
      divisionId: String(r.division_id), orgId: String(r.org_id), status: r.status as Fighter["status"],
      priorRecord: { w: Number(r.prior_w), l: Number(r.prior_l), d: Number(r.prior_d) },
      photo: { src: String(r.photo_src ?? `/portraits/${r.slug}.png`), kind: (r.photo_kind as "illustration" | "licensed") ?? "illustration", credit: String(r.photo_credit ?? ""), updated: String(r.photo_updated ?? "") },
      provenance: r.provenance as Fighter["provenance"],
    }));

    const statsBy = new Map<string, { red?: StrikeStats; blue?: StrikeStats }>();
    for (const r of sr) {
      const e = statsBy.get(String(r.fight_id)) ?? {};
      e[r.corner as "red" | "blue"] = stats(r);
      statsBy.set(String(r.fight_id), e);
    }
    const roundsBy = new Map<string, RoundStats[]>();
    for (const r of rr) {
      const list = roundsBy.get(String(r.fight_id)) ?? [];
      let row = list.find((x) => x.round === Number(r.round));
      if (!row) { row = { round: Number(r.round), red: { sigLanded: 0, sigAttempted: 0, tdLanded: 0, ctrlSec: 0, kd: 0 }, blue: { sigLanded: 0, sigAttempted: 0, tdLanded: 0, ctrlSec: 0, kd: 0 } }; list.push(row); }
      row[r.corner as "red" | "blue"] = { sigLanded: Number(r.sig_landed), sigAttempted: Number(r.sig_attempted), tdLanded: Number(r.td_landed), ctrlSec: Number(r.ctrl_sec), kd: Number(r.kd) };
      roundsBy.set(String(r.fight_id), list);
    }

    const fights: Fight[] = fir.map((r) => {
      const st = statsBy.get(String(r.id));
      return {
        id: String(r.id), eventId: String(r.event_id), date: String(r.date), orgId: String(r.org_id), divisionId: String(r.division_id),
        redId: String(r.red_id), blueId: String(r.blue_id), status: r.status as Fight["status"],
        winnerId: (r.winner_id as string) ?? null, method: (r.method as Fight["method"]) ?? null, submission: (r.submission as string) ?? null,
        round: n(r.end_round), time: n(r.end_time_sec), scheduledRounds: Number(r.scheduled_rounds) as 3 | 5,
        titleFight: Boolean(r.title_fight), slot: r.slot as Fight["slot"], order: Number(r.card_order),
        red: st?.red ?? null, blue: st?.blue ?? null, rounds: (roundsBy.get(String(r.id)) ?? []).sort((a, b) => a.round - b.round),
        scorecards: (r.scorecards as string[]) ?? null,
        redStrengthPre: Number(r.red_strength_pre), blueStrengthPre: Number(r.blue_strength_pre), provenance: r.provenance as Fight["provenance"],
      };
    });

    const card = new Map<string, Fight[]>();
    for (const f of fights) { const l = card.get(f.eventId) ?? []; l.push(f); card.set(f.eventId, l); }
    const events: Event[] = er.map((r) => ({
      id: String(r.id), slug: String(r.slug), name: String(r.name), orgId: String(r.org_id), date: String(r.date),
      city: String(r.city), country: String(r.country), venue: (r.venue as string) ?? null, status: r.status as Event["status"],
      fightIds: (card.get(String(r.id)) ?? []).sort((a, b) => a.order - b.order).map((f) => f.id), provenance: r.provenance as Event["provenance"],
    }));

    const championships: Championship[] = cr.map((r) => ({
      orgId: String(r.org_id), divisionId: String(r.division_id), fighterId: String(r.fighter_id), wonFightId: String(r.won_fight_id),
      from: String(r.date_from), to: (r.date_to as string) ?? null, defenses: Number(r.defenses),
    }));

    return { fighters, fights, events, championships };
  } finally {
    await client.end();
  }
}
