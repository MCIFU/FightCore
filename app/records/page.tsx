import type { Metadata } from "next";
import Link from "next/link";
import { SectionHead, Source } from "@/components/ui/primitives";
import { records } from "@/lib/data/repository";
import s from "./records.module.css";

export const metadata: Metadata = {
  title: "Récords",
  description: "Récords de carrera, golpeo, grappling, tiempo y títulos. Cada récord enlaza al combate o expediente que lo sostiene.",
  alternates: { canonical: "/records" },
};

export default function RecordsPage() {
  const all = records();
  const cats = [...new Set(all.map((r) => r.category))];
  return (
    <div className="wrap" style={{ paddingTop: "var(--s-7)", paddingBottom: "var(--s-8)" }}>
      <SectionHead as="h1" kicker="FIGHTCORE Records" title="Récords"
        lede={<>Cada récord se calcula a partir de los combates registrados y enlaza a su evidencia. <Source kind="demo" /> <Source kind="calculated" /></>} />
      {cats.map((c) => (
        <section key={c} aria-labelledby={`rc-${c}`} className={s.cat}>
          <h2 id={`rc-${c}`} className={s.catTitle}>{c}</h2>
          <ul className={s.list}>
            {all.filter((r) => r.category === c).map((r) => (
              <li key={r.id}>
                <Link href={r.href} className={s.row}>
                  <span className={s.value}>{r.value}</span>
                  <span className={s.unit}>{r.unit}</span>
                  <span className={s.label}>{r.label}</span>
                  <span className={s.holder}>{r.holder.name}<span>{r.holder.divisionShort} · {r.holder.org}</span></span>
                  <span className={s.ctx}>{r.context}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
      <p className={s.note}>Próximamente: récords por organización, por evento y por división, con históricos navegables.</p>
    </div>
  );
}
