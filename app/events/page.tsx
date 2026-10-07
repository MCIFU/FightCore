import type { Metadata } from "next";
import Link from "next/link";
import { SectionHead, Source, Tag } from "@/components/ui/primitives";
import { Tabs } from "@/components/ui/Tabs";
import { listEvents, SRC, TODAY } from "@/lib/data/repository";
import { fmtDayMonth, fmtWeekday } from "@/lib/format";
import s from "./events.module.css";

export const metadata: Metadata = {
  title: "Eventos",
  description: "Calendario de eventos de MMA: próximos, recientes e históricos, con cartelera y resultados.",
  alternates: { canonical: "/events" },
};

type Ev = ReturnType<typeof listEvents>[number];

export function EventRows({ events }: { events: Ev[] }) {
  return (
    <ol className={s.rows}>
      {events.map((e) => {
        const d = fmtDayMonth(e.date);
        return (
          <li key={e.id}>
            <Link href={`/events/${e.slug}`} className={s.row}>
              <span className={s.date}><span className={s.day}>{d.day}</span><span className={s.mon}>{d.month}<br />{e.date.slice(0, 4)}</span></span>
              <span className={s.org}>{e.orgShort}</span>
              <span className={s.name}>{e.name}<span className={s.city}>{[e.city, e.countryName, fmtWeekday(e.date)].filter(Boolean).join(" · ")}</span></span>
              <span className={s.main}>
                {e.main && <><strong>{e.main.red} vs {e.main.blue}</strong>{e.main.title ? " · título" : ""}<br />{e.fightIds.length} {e.fightIds.length === 1 ? "combate" : "combates"}</>}
              </span>
              <span className={s.status}>{e.status === "upcoming" ? <Tag tone="accent">Programado</Tag> : <Tag>Completado</Tag>}</span>
            </Link>
          </li>
        );
      })}
    </ol>
  );
}

export default function EventsPage() {
  const all = listEvents();
  const orgCount = new Set(all.map((e) => e.orgId)).size;
  const upcoming = all.filter((e) => e.status === "upcoming");
  const done = all.filter((e) => e.status === "completed").reverse();
  const cut = new Date(Date.parse(TODAY) - 365 * 86400000).toISOString().slice(0, 10);
  const recent = done.filter((e) => e.date >= cut);
  const historical = done.filter((e) => e.date < cut);
  const byYear = [...new Set(historical.map((e) => e.date.slice(0, 4)))];

  return (
    <div className="wrap" style={{ paddingTop: "var(--s-7)", paddingBottom: "var(--s-8)" }}>
      <SectionHead as="h1" kicker="FIGHTCORE Events" title="Eventos" lede={<>{all.length} eventos{orgCount === 1 ? ` de ${all[0]?.orgShort ?? ""}` : ` en ${orgCount} organizaciones`}. <Source kind={SRC} /></>} />
      <Tabs
        label="Periodo"
        tabs={[
          { id: "up", label: `Próximos · ${upcoming.length}`, content: <EventRows events={upcoming} /> },
          { id: "recent", label: `Últimos 12 meses · ${recent.length}`, content: <EventRows events={recent} /> },
          {
            id: "hist", label: `Histórico · ${historical.length}`, content: (
              <nav aria-label="Archivo por años">
                <ul className={s.years}>
                  {byYear.map((y) => {
                    const n = historical.filter((e) => e.date.startsWith(y)).length;
                    return <li key={y}><Link href={`/events/archivo/${y}`} className={s.yearLink}><span className={s.yearNum}>{y}</span><span className={s.yearCount}>{n} {n === 1 ? "evento" : "eventos"}</span></Link></li>;
                  })}
                </ul>
              </nav>
            ),
          },
        ]}
      />
    </div>
  );
}
