import type { Metadata } from "next";
import Link from "next/link";
import { FighterAvatar } from "@/components/fighter/FighterAvatar";
import { ChampionBadge } from "@/components/ui/ChampionBadge";
import { SectionHead, Source } from "@/components/ui/primitives";
import { championsTable, IS_DEMO, SRC, type ChampionCell } from "@/lib/data/repository";
import { fmtDate } from "@/lib/format";
import s from "./champions.module.css";

export const metadata: Metadata = {
  title: "Campeones por división",
  description: "Tabla de campeones vigentes de cada división y organización, con defensas, antigüedad y el número 1 del FIGHTCORE Rating como referencia separada.",
  alternates: { canonical: "/champions" },
};

function Cell({ c, org }: { c: ChampionCell; org: string }) {
  if (c.state === "champion" && c.fighter) {
    return (
      <Link href={`/fighters/${c.fighter.slug}`} className={s.champ}>
        <FighterAvatar src={c.fighter.photo.src} name={c.fighter.name} size={48} champion />
        <span className={s.champText}>
          <span className={s.champName}>{c.fighter.name}</span>
          <span className={s.champMeta}>
            desde {fmtDate(c.since!)} · {c.defenses} {c.defenses === 1 ? "defensa" : "defensas"}
          </span>
          <span className={s.champMeta}>{c.fighter.record.w}-{c.fighter.record.l}-{c.fighter.record.d} · FCR {c.fighter.rating.toFixed(1)}</span>
        </span>
      </Link>
    );
  }
  if (c.state === "vacant") {
    return (
      <span className={s.vacant}>
        <strong>Vacante</strong>
        <span className={s.champMeta}>{c.reigns} {c.reigns === 1 ? "reinado" : "reinados"} previos · último: {c.lastChampion}</span>
      </span>
    );
  }
  return <span className={s.none} title={`Sin título registrado de ${org} en esta división`}>—<span className="visually-hidden">Sin título registrado</span></span>;
}

export default function ChampionsPage() {
  const { orgs: allOrgs, rows, count } = championsTable();
  const MAJORS = ["ufc", "pfl", "one"];
  const orgs = allOrgs.filter((o) => MAJORS.includes(o.id));
  const regional = allOrgs.filter((o) => !MAJORS.includes(o.id)).map((o) => ({
    org: o,
    belts: rows.map((r) => ({ division: r.division, cell: r.cells[o.id] })).filter((x) => x.cell.state !== "none"),
  })).filter((x) => x.belts.length);
  const groups = [
    { id: "M", label: "Masculino" },
    { id: "F", label: "Femenino" },
  ] as const;
  return (
    <div className="wrap" style={{ paddingTop: "var(--s-7)", paddingBottom: "var(--s-8)" }}>
      <SectionHead
        as="h1" kicker="FIGHTCORE Rankings · Títulos" title="Campeones"
        lede={<>{count} cinturones vigentes{allOrgs.length === 1 ? ` de ${allOrgs[0].short}` : ` en ${allOrgs.length} organizaciones`}. La última columna no es un título: es el número 1 del FIGHTCORE Rating en la división, como referencia independiente. <Source kind={SRC} /></>}
      />
      <p className={s.legend}>
        <ChampionBadge title={{ org: "ORG", division: "División" }} variant="icon" /> Campeón vigente · <strong>Vacante</strong> = el título existió pero hoy no tiene dueño · — = la organización no ha registrado ese título.
      </p>

      {groups.map((g) => (
        <section key={g.id} aria-labelledby={`g-${g.id}`} className={s.group}>
          <h2 id={`g-${g.id}`} className={s.groupTitle}>{g.label}</h2>
          <div className={s.tableWrap}>
            <table className={s.table}>
              <caption className="visually-hidden">Campeones vigentes por división, {g.label.toLowerCase()}</caption>
              <thead>
                <tr>
                  <th scope="col">División</th>
                  {orgs.map((o) => <th key={o.id} scope="col"><Link href={`/organizations/${o.slug}`}>{o.short}</Link></th>)}
                  <th scope="col" className={s.fcrHead}>Nº 1 FCR</th>
                </tr>
              </thead>
              <tbody>
                {rows.filter((r) => r.division.sex === g.id).map((r) => (
                  <tr key={r.division.id}>
                    <th scope="row" className={s.div}>
                      <span className={s.divName}>{r.division.name.replace(" femenino", "")}</span>
                      <span className={s.divLimit}>{r.division.limitKg.toString().replace(".", ",")} kg · {r.division.limitLb} lb</span>
                    </th>
                    {orgs.map((o) => (
                      <td key={o.id} data-org={o.short}><Cell c={r.cells[o.id]} org={o.short} /></td>
                    ))}
                    <td className={s.fcrCell} data-org="Nº 1 FCR">
                      {r.fcrTop ? (
                        <Link href={`/fighters/${r.fcrTop.slug}`} className={s.fcr}>
                          <span>{r.fcrTop.name}</span>
                          <span className={s.champMeta}>FCR {r.fcrTop.rating.toFixed(1)} ±{r.fcrTop.band.toFixed(1)} · {r.fcrTop.org}</span>
                        </Link>
                      ) : <span className={s.none}>—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
      {regional.length > 0 && (
        <section aria-labelledby="g-reg" className={s.group}>
          <h2 id="g-reg" className={s.groupTitle}>Organizaciones regionales</h2>
          <div className={s.regional}>
            {regional.map((r) => (
              <div key={r.org.id} className={s.regOrg}>
                <h3 className={s.regTitle}><Link href={`/organizations/${r.org.slug}`}>{r.org.short}</Link><span>{r.org.name}</span></h3>
                <ul className={s.regList}>
                  {r.belts.map((b) => (
                    <li key={b.division.id}>
                      <span className={s.regDiv}>{b.division.name}</span>
                      <Cell c={b.cell} org={r.org.short} />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}
      <p className={s.foot}>{IS_DEMO ? "Títulos del dataset de demostración." : "Cobertura: UFC. Linaje reconstruido a partir de los combates por título (UFCStats) y campeones actuales cotejados con Wikipedia; un cinturón que se deja vacante sin combate figura desde la fecha que indica Wikipedia."} <Link href="/rankings">Ver rankings</Link></p>
    </div>
  );
}
