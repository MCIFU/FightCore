import Link from "next/link";
import { ButtonLink, SectionHead, Tag } from "@/components/ui/primitives";
import s from "./Roadmap.module.css";

/**
 * Honest placeholder for product areas scheduled in later phases. Explains
 * what the area will answer and links to what already exists today.
 */
export function Roadmap({ product, phase, title, lede, questions, today }: {
  product: string; phase: number; title: string; lede: string; questions: string[]; today: { href: string; label: string; note: string }[];
}) {
  return (
    <div className="wrap" style={{ paddingTop: "var(--s-7)", paddingBottom: "var(--s-8)" }}>
      <SectionHead as="h1" kicker={`FIGHTCORE ${product}`} title={title} lede={lede} />
      <p className={s.phase}><Tag tone="warning">Fase {phase} · en diseño</Tag> Esta sección aún no está construida. No mostramos una versión vacía con datos de relleno.</p>
      <div className={s.grid}>
        <section aria-labelledby="rq">
          <h2 id="rq" className={s.h2}>Preguntas que responderá</h2>
          <ol className={s.q}>
            {questions.map((q, i) => <li key={q}><span className={s.n}>{String(i + 1).padStart(2, "0")}</span>{q}</li>)}
          </ol>
        </section>
        <section aria-labelledby="rt">
          <h2 id="rt" className={s.h2}>Lo que ya puedes usar</h2>
          <ul className={s.today}>
            {today.map((t) => (
              <li key={t.href}><Link href={t.href} className={s.link}><strong>{t.label}</strong><span>{t.note}</span><span aria-hidden>→</span></Link></li>
            ))}
          </ul>
          <ButtonLink href="/" variant="ghost">Volver al inicio</ButtonLink>
        </section>
      </div>
    </div>
  );
}
