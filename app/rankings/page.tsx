import type { Metadata } from "next";
import Link from "next/link";
import { FighterAvatar } from "@/components/fighter/FighterAvatar";
import { RankingList } from "@/components/rankings/RankingList";
import { EmptyState, SectionHead, Source } from "@/components/ui/primitives";
import { Tabs } from "@/components/ui/Tabs";
import { DIVISIONS } from "@/lib/domain/reference";
import { currentChampions, divisionRanking, IS_DEMO, poundForPound, rankedDivisions, RANKING_LOOKBACK_DAYS, SRC, TODAY } from "@/lib/data/repository";
import { fmtDate } from "@/lib/format";
import s from "./rankings.module.css";

export const metadata: Metadata = {
  title: "Rankings",
  description: "FIGHTCORE Rankings por división y pound-for-pound, con margen de incertidumbre. Separados siempre de los rankings oficiales.",
  alternates: { canonical: "/rankings" },
};

export default function RankingsPage() {
  const champs = currentChampions();
  return (
    <div className="wrap" style={{ paddingTop: "var(--s-7)" }}>
      <SectionHead
        as="h1" kicker="FIGHTCORE Rankings" title="Rankings"
        lede="Dos listas que nunca se mezclan: la oficial de cada organización y la de FIGHTCORE, ordenada por rating. Una mide decisiones comerciales y deportivas; la otra, rendimiento demostrado."
      />

      <div className={s.split}>
        <section aria-labelledby="official" className={s.official}>
          <div className={s.blockHead}>
            <h2 id="official" className={s.h2}>Rankings oficiales</h2>
            <Source kind="official" />
          </div>
          <EmptyState
            title="Sin proveedor oficial conectado"
            body="FIGHTCORE mostrará aquí los rankings publicados por cada organización, con su fecha y fuente, cuando exista una integración con licencia. No los reconstruimos ni los estimamos."
          />
          <h3 className={s.h3}>Campeones vigentes del dataset · <Link href="/champions" className={s.more}>tabla completa →</Link></h3>
          <ul className={s.champs}>
            {champs.map((c) => (
              <li key={`${c.orgId}-${c.divisionId}`}>
                <Link href={`/fighters/${c.fighter.slug}`} className={s.champRow}>
                  <FighterAvatar src={c.fighter.photo.src} name={c.fighter.name} size={40} champion />
                  <span className={s.champOrg}>{c.org}</span>
                  <span className={s.champDiv}>{c.division.name}</span>
                  <span className={s.champName}>{c.fighter.name}</span>
                  <span className={s.champMeta}>desde {fmtDate(c.from)} · {c.defenses} def.</span>
                </Link>
              </li>
            ))}
          </ul>
          <p className={s.src}><Source kind={SRC} /> {IS_DEMO ? "Títulos de la simulación, no reales." : "Linaje reconstruido a partir de los combates por título; campeones actuales cotejados con Wikipedia."}</p>
        </section>

        <section aria-labelledby="fcr" className={s.fc}>
          <div className={s.blockHead}>
            <h2 id="fcr" className={s.h2}>FIGHTCORE Rankings</h2>
            <Source kind="calculated" />
          </div>
          <p className={s.rules}>
            Requisitos: al menos 3 combates en cobertura y actividad en los últimos 540 días. ▲▼ comparan con el ranking de hace {RANKING_LOOKBACK_DAYS} días; NEW indica que entonces no cumplía los requisitos. Actualizado a {fmtDate(TODAY)}.
          </p>
          <Tabs
            label="División"
            variant="scroll"
            tabs={[
              { id: "p4p", label: "P4P ♂", hint: "Pound for pound masculino", content: <RankingList rows={poundForPound("M", 20)} showDivision caption="Pound for pound masculino" /> },
              { id: "p4pw", label: "P4P ♀", hint: "Pound for pound femenino", content: <RankingList rows={poundForPound("F", 15)} showDivision caption="Pound for pound femenino" /> },
              ...rankedDivisions().map((d) => ({ id: d.id, label: d.short, hint: `${d.name} · ${d.limitKg} kg`, content: <DivisionBlock id={d.id} /> })),
            ]}
          />
        </section>
      </div>
    </div>
  );
}

function DivisionBlock({ id }: { id: string }) {
  const d = DIVISIONS.find((x) => x.id === id)!;
  const rows = divisionRanking(id, 15);
  return (
    <div>
      <p className={s.divHead}><strong>{d.name}</strong> · límite {d.limitKg.toString().replace(".", ",")} kg ({d.limitLb} lb) · {rows.length} clasificados</p>
      {rows.length ? <RankingList rows={rows} caption={d.name} /> : <EmptyState title="Sin luchadores elegibles" body="Ningún luchador de esta división cumple hoy los requisitos." />}
    </div>
  );
}
