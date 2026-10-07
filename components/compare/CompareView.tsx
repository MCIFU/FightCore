"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useMemo, useState, useTransition } from "react";
import { LineChart } from "@/components/charts/LineChart";
import { TaleOfTape } from "@/components/charts/TaleOfTape";
import { FighterAvatar } from "@/components/fighter/FighterAvatar";
import { ChampionBadge } from "@/components/ui/ChampionBadge";
import { CountryTag, FormStrip, OutcomeMark, RecordValue } from "@/components/ui/primitives";
import type { AttributeKey } from "@/lib/analytics/attributes";
import type { CompareEntry } from "@/lib/data/repository";
import { fmtCm, fmtDate, fmtStance } from "@/lib/format";
import s from "./Compare.module.css";
import { Portrait } from "@/components/fighter/Portrait";

const CORNERS = ["a", "b", "c", "d"] as const;
const CORNER_VAR = ["var(--corner-a)", "var(--corner-b)", "var(--corner-c)", "var(--corner-d)"];
const LETTER = ["A", "B", "C", "D"];

const ATTRS: { key: AttributeKey; label: string }[] = [
  { key: "striking", label: "Golpeo" }, { key: "grappling", label: "Grappling" }, { key: "wrestling", label: "Lucha" },
  { key: "defense", label: "Defensa" }, { key: "finishing", label: "Finalización" }, { key: "pace", label: "Ritmo" },
  { key: "durability", label: "Durabilidad" }, { key: "competition", label: "Competición" }, { key: "adaptation", label: "Adaptación*" },
];

interface RosterItem { slug: string; name: string; division: string; org: string; rating: number; status: string }

/** Position on the 50–100 FCR scale, in %. */
const fcrPos = (v: number) => Math.max(0, Math.min(100, (v - 50) * 2));

export function CompareView({ entries, roster, demo = false }: { entries: CompareEntry[]; roster: RosterItem[]; demo?: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const listId = useId();
  const slugs = entries.map((e) => e.summary.slug);

  const setSlugs = (next: string[]) => start(() => router.replace(`/compare?f=${next.join(",")}`, { scroll: false }));
  const add = (slug: string) => { if (!slugs.includes(slug) && slugs.length < 4) setSlugs([...slugs, slug]); setQuery(""); setOpen(false); };
  const remove = (slug: string) => setSlugs(slugs.filter((x) => x !== slug));

  const options = useMemo(() => {
    const q = query.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
    return roster.filter((r) => !slugs.includes(r.slug) && (!q || r.name.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().includes(q) || r.division.toLowerCase().includes(q))).slice(0, 8);
  }, [roster, query, slugs]);

  const pair = entries.length === 2 ? entries : null;

  // Common opponents across the selection.
  const common = useMemo(() => {
    const map = new Map<string, { name: string; slug: string; results: (string | null)[] }>();
    entries.forEach((e, i) => {
      for (const o of e.opponents) {
        if (!map.has(o.id)) map.set(o.id, { name: o.name, slug: o.slug, results: entries.map(() => null) });
        const row = map.get(o.id)!;
        row.results[i] = row.results[i] ? `${row.results[i]}${o.outcome ?? ""}` : o.outcome;
      }
    });
    return [...map.values()].filter((r) => r.results.filter(Boolean).length >= 2);
  }, [entries]);

  // Statistical tie check: rating gap vs combined uncertainty.
  const sorted = [...entries].sort((a, b) => b.rating.value - a.rating.value);
  const gap = sorted.length >= 2 ? sorted[0].rating.value - sorted[1].rating.value : 0;
  const margin = sorted.length >= 2 ? Math.hypot(sorted[0].rating.band, sorted[1].rating.band) : 0;

  const pct = (x: number) => `${Math.round(x * 100)}%`;
  const dec = (x: number, d = 2) => x.toFixed(d).replace(".", ",");
  const STATS = [
    { label: "Golpes sig./min", get: (e: CompareEntry) => e.stats.slpm, fmt: (v: number) => dec(v) },
    { label: "Encajados/min", get: (e: CompareEntry) => e.stats.sapm, fmt: (v: number) => dec(v), invert: true },
    { label: "Precisión", get: (e: CompareEntry) => e.stats.strAcc, fmt: pct },
    { label: "Defensa golpeo", get: (e: CompareEntry) => e.stats.strDef, fmt: pct },
    { label: "Derribos/15", get: (e: CompareEntry) => e.stats.tdAvg, fmt: (v: number) => dec(v) },
    { label: "Def. derribo", get: (e: CompareEntry) => e.stats.tdDef, fmt: pct },
    { label: "Sumisiones/15", get: (e: CompareEntry) => e.stats.subAvg, fmt: (v: number) => dec(v) },
    { label: "Control", get: (e: CompareEntry) => e.stats.ctrlShare, fmt: pct },
    { label: "Finalización", get: (e: CompareEntry) => e.stats.finishRate, fmt: pct },
    { label: "Calidad rivales", get: (e: CompareEntry) => e.opponentQuality, fmt: (v: number) => String(Math.round(v)) },
    { label: "Actividad 24m", get: (e: CompareEntry) => e.activity, fmt: (v: number) => String(v) },
  ];

  return (
    <div className={`${s.page} ${pending ? s.pending : ""}`}>
      <header className={`wrap ${s.head}`}>
        <p className="label">FIGHTCORE Compare</p>
        <h1 className={s.title}>Comparar</h1>
        <p className={`serif ${s.lede}`}>Hasta cuatro luchadores en el mismo instrumento. Cada uno ocupa una esquina y un color; la letra siempre acompaña al color.</p>

        <div className={s.picker}>
          <ul className={s.chips} aria-label="Luchadores seleccionados">
            {entries.map((e, i) => (
              <li key={e.summary.slug} className={`${s.chip} ${s[`c_${CORNERS[i]}`]}`}>
                <span className={s.chipLetter} aria-hidden>{LETTER[i]}</span>
                <FighterAvatar src={e.summary.photo.src} name={e.summary.name} size={32} />
                <Link href={`/fighters/${e.summary.slug}`} className={s.chipName}>{e.summary.name}</Link>
                <button type="button" className={s.chipX} onClick={() => remove(e.summary.slug)} aria-label={`Quitar a ${e.summary.name}`}>×</button>
              </li>
            ))}
          </ul>
          {entries.length < 4 && (
            <div className={s.add}>
              <label htmlFor={`${listId}-in`} className="visually-hidden">Añadir luchador a la comparación</label>
              <input
                id={`${listId}-in`}
                className={s.addInput}
                placeholder={entries.length ? "Añadir luchador…" : "Busca un luchador para empezar…"}
                value={query}
                onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
                onFocus={() => setOpen(true)}
                onBlur={() => setTimeout(() => setOpen(false), 150)}
                onKeyDown={(e) => { if (e.key === "Enter" && options[0]) { e.preventDefault(); add(options[0].slug); } if (e.key === "Escape") setOpen(false); }}
                role="combobox"
                aria-expanded={open}
                aria-controls={listId}
                aria-autocomplete="list"
                autoComplete="off"
              />
              {open && options.length > 0 && (
                <ul id={listId} role="listbox" className={s.options}>
                  {options.map((o) => (
                    <li key={o.slug} role="option" aria-selected={false} onMouseDown={(e) => { e.preventDefault(); add(o.slug); }} className={s.option}>
                      <span>{o.name}</span>
                      <span className={s.optMeta}>{o.division} · {o.org} · {o.rating.toFixed(1)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </header>

      {entries.length < 2 ? (
        <div className="wrap"><p className={s.empty}>Añade al menos dos luchadores para comparar.</p></div>
      ) : (
        <div className="wrap">
          {/* ───── Corners ───── */}
          <section className={s.corners} aria-label="Resumen">
            {entries.map((e, i) => (
              <article key={e.summary.slug} className={`${s.corner} ${s[`c_${CORNERS[i]}`]}`}>
                <span className={s.cornerBar} aria-hidden />
                <Portrait src={e.summary.photo.src} name={e.summary.name} alt="" sizes="180px" className={s.cFace} />
                <span className={s.cornerLetter} aria-hidden>{LETTER[i]}</span>
                {e.summary.title && <ChampionBadge title={e.summary.title} variant="tag" />}
                <Link href={`/fighters/${e.summary.slug}`} className={s.cName}>
                  <span className={s.cFirst}>{e.summary.firstName}</span>
                  <span className={s.cLast}>{e.summary.lastName}</span>
                </Link>
                <span className={s.cMeta}><CountryTag code={e.summary.country} name={e.summary.countryName} /> {e.summary.divisionShort} · {e.summary.org}</span>
                <p role="img" className={s.cRating} aria-label={`FCR ${e.rating.value.toFixed(1)} más o menos ${e.rating.band}`}>
                  <span aria-hidden>{e.rating.value.toFixed(1).split(".")[0]}<small>.{e.rating.value.toFixed(1).split(".")[1]}</small></span>
                  <span className={s.cBand} aria-hidden>±{e.rating.band.toFixed(1)}</span>
                </p>
                <div className={s.cRow}><RecordValue r={e.summary.record} size="sm" /><FormStrip form={e.summary.form} /></div>
              </article>
            ))}
          </section>

          {/* ───── Rating scale with uncertainty ───── */}
          <section className={s.block} aria-labelledby="cmp-scale">
            <div className={s.blockHead}>
              <h2 id="cmp-scale" className={s.h2}>FIGHTCORE Rating en la misma escala</h2>
              <p className={s.note}>
                {gap < margin
                  ? <>La diferencia entre los dos primeros ({gap.toFixed(1)} puntos) es menor que su margen combinado (±{margin.toFixed(1)}). <strong>Los datos no permiten separarlos con confianza.</strong></>
                  : <>La diferencia entre los dos primeros ({gap.toFixed(1)} puntos) supera su margen combinado (±{margin.toFixed(1)}).</>}
              </p>
            </div>
            <div className={s.scale} role="img" aria-label={entries.map((e) => `${e.summary.name}: ${e.rating.value.toFixed(1)} ±${e.rating.band}`).join("; ")}>
              <div className={s.scaleAxis}>{[50, 60, 70, 80, 90, 100].map((t) => <span key={t} style={{ left: `${fcrPos(t)}%` }}>{t}</span>)}</div>
              {entries.map((e, i) => (
                <div key={e.summary.slug} className={`${s.scaleRow} ${s[`c_${CORNERS[i]}`]}`}>
                  <span className={s.scaleRange} style={{ left: `${fcrPos(e.rating.value - e.rating.band)}%`, width: `${e.rating.band * 4}%` }} />
                  <span className={s.scalePoint} style={{ left: `${fcrPos(e.rating.value)}%` }}>{LETTER[i]}</span>
                </div>
              ))}
            </div>
          </section>

          {/* ───── Attribute lanes ───── */}
          <section className={s.block} aria-labelledby="cmp-attr">
            <div className={s.blockHead}>
              <h2 id="cmp-attr" className={s.h2}>Atributos</h2>
              <p className={s.note}>Percentil 0–100 frente a todos los luchadores con ≥3 combates. *Adaptación es experimental.</p>
            </div>
            <table className={s.lanes}>
              <caption className="visually-hidden">Atributos por luchador</caption>
              <thead className="visually-hidden"><tr><th scope="col">Atributo</th>{entries.map((e) => <th key={e.summary.slug} scope="col">{e.summary.name}</th>)}</tr></thead>
              <tbody>
                {ATTRS.map((a) => {
                  const vals = entries.map((e) => e.attributes?.[a.key] ?? null);
                  const best = Math.max(...vals.map((v) => v ?? -1));
                  return (
                    <tr key={a.key}>
                      <th scope="row" className={s.laneLabel}>{a.label}</th>
                      <td className={s.laneCell} aria-hidden>
                        <span className={s.laneTrack}>
                          {[25, 50, 75].map((t) => <span key={t} className={s.laneGrid} style={{ left: `${t}%` }} />)}
                          {vals.map((v, i) => {
                            if (v === null) return null;
                            // Nudge dots that would sit on top of an earlier one.
                            const clash = vals.slice(0, i).filter((o) => o !== null && Math.abs(o - v) < 3).length;
                            return (
                              <span key={i} className={`${s.laneDot} ${s[`c_${CORNERS[i]}`]}`} style={{ left: `${v}%`, zIndex: v === best ? 3 : 2, marginLeft: clash ? `${(v > 50 ? -1 : 1) * clash * 24}px` : undefined }}>{LETTER[i]}</span>
                            );
                          })}
                        </span>
                      </td>
                      {vals.map((v, i) => (
                        <td key={i} className={`${s.laneVal} ${v === best ? s.lead : ""}`}>
                          <span className="visually-hidden">{entries[i].summary.name}: </span>{v ?? "—"}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>

          {/* ───── Stats: tape for 2, matrix for 3–4 ───── */}
          <section className={s.block} aria-labelledby="cmp-stats">
            <div className={s.blockHead}>
              <h2 id="cmp-stats" className={s.h2}>Estadísticas de carrera</h2>
              <p className={s.note}>En negrita, quien lidera cada métrica.</p>
            </div>
            {pair ? (
              <div className={s.tape}>
                <div className={s.tapeNames} aria-hidden>
                  <span className={s.c_a}><i /> {pair[0].summary.name}</span>
                  <span className={s.c_b}>{pair[1].summary.name} <i /></span>
                </div>
                <TaleOfTape
                  nameA={pair[0].summary.name}
                  nameB={pair[1].summary.name}
                  rows={STATS.map((st) => ({ label: st.label, a: st.get(pair[0]), b: st.get(pair[1]), fa: st.fmt(st.get(pair[0])), fb: st.fmt(st.get(pair[1])), invert: st.invert }))}
                />
              </div>
            ) : (
              <div className={s.matrixWrap}>
                <table className={s.matrix}>
                  <caption className="visually-hidden">Estadísticas de carrera</caption>
                  <thead><tr><th scope="col">Métrica</th>{entries.map((e, i) => <th key={e.summary.slug} scope="col" className={s[`c_${CORNERS[i]}`]}><i aria-hidden />{LETTER[i]} · {e.summary.lastName}</th>)}</tr></thead>
                  <tbody>
                    {STATS.map((st) => {
                      const vals = entries.map(st.get);
                      const best = st.invert ? Math.min(...vals) : Math.max(...vals);
                      return (
                        <tr key={st.label}>
                          <th scope="row">{st.label}</th>
                          {vals.map((v, i) => <td key={i} className={v === best ? s.lead : ""}>{st.fmt(v)}</td>)}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* ───── Methods ───── */}
          <section className={s.block} aria-labelledby="cmp-methods">
            <div className={s.blockHead}><h2 id="cmp-methods" className={s.h2}>Cómo ganan</h2></div>
            <ul className={s.methods}>
              {entries.map((e, i) => {
                const w = e.stats.winsBy;
                const total = w.ko + w.sub + w.dec || 1;
                return (
                  <li key={e.summary.slug} className={s.methodRow}>
                    <span className={`${s.methodName} ${s[`c_${CORNERS[i]}`]}`}><i aria-hidden />{e.summary.lastName}</span>
                    <span className={s.methodBar} role="img" aria-label={`${e.summary.name}: KO/TKO ${w.ko}, sumisión ${w.sub}, decisión ${w.dec}`}>
                      <span style={{ flexGrow: w.ko }} className={s.mKo} />
                      <span style={{ flexGrow: w.sub }} className={s.mSub} />
                      <span style={{ flexGrow: w.dec }} className={s.mDec} />
                    </span>
                    <span className={s.methodNums}>
                      <span>KO {Math.round((w.ko / total) * 100)}%</span>
                      <span>SUB {Math.round((w.sub / total) * 100)}%</span>
                      <span>DEC {Math.round((w.dec / total) * 100)}%</span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>

          {/* ───── Evolution overlay ───── */}
          <section className={s.block} aria-labelledby="cmp-evo">
            <div className={s.blockHead}><h2 id="cmp-evo" className={s.h2}>Evolución del rating</h2><p className={s.note}>Tras cada combate. Útil para ver quién llega en ascenso.</p></div>
            <LineChart
              series={entries.map((e, i) => ({ id: e.summary.slug, label: `${LETTER[i]} · ${e.summary.name}`, color: CORNER_VAR[i], points: e.history.map((h) => ({ x: Date.parse(h.date), y: h.value })) }))}
              yDomain={[50, 100]}
              yLabel="FIGHTCORE Rating"
              formatX={(x) => fmtDate(new Date(x).toISOString().slice(0, 10))}
              formatY={(y) => y.toFixed(1)}
              caption="Evolución del FIGHTCORE Rating"
            />
          </section>

          {/* ───── Physical ───── */}
          <section className={s.block} aria-labelledby="cmp-phys">
            <div className={s.blockHead}><h2 id="cmp-phys" className={s.h2}>Físico y perfil</h2></div>
            <div className={s.matrixWrap}>
              <table className={s.matrix}>
                <caption className="visually-hidden">Físico y perfil</caption>
                <thead><tr><th scope="col">Dato</th>{entries.map((e, i) => <th key={e.summary.slug} scope="col" className={s[`c_${CORNERS[i]}`]}><i aria-hidden />{LETTER[i]} · {e.summary.lastName}</th>)}</tr></thead>
                <tbody>
                  <tr><th scope="row">Edad</th>{entries.map((e) => <td key={e.summary.slug}>{e.summary.age ?? "—"}</td>)}</tr>
                  <tr><th scope="row">Altura</th>{entries.map((e) => <td key={e.summary.slug}>{fmtCm(e.heightCm)}</td>)}</tr>
                  <tr><th scope="row">Alcance</th>{entries.map((e) => <td key={e.summary.slug}>{fmtCm(e.reachCm)}</td>)}</tr>
                  <tr><th scope="row">Guardia</th>{entries.map((e) => <td key={e.summary.slug}>{fmtStance(e.stance)}</td>)}</tr>
                  <tr><th scope="row">Títulos (V-D)</th>{entries.map((e) => <td key={e.summary.slug}>{e.stats.titleRecord.w}-{e.stats.titleRecord.l}</td>)}</tr>
                  <tr><th scope="row">Mejor racha</th>{entries.map((e) => <td key={e.summary.slug}>{e.stats.longestWinStreak}</td>)}</tr>
                  <tr><th scope="row">Minutos en jaula</th>{entries.map((e) => <td key={e.summary.slug}>{Math.round(e.stats.minutes)}</td>)}</tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* ───── Common opponents ───── */}
          <section className={s.block} aria-labelledby="cmp-common">
            <div className={s.blockHead}>
              <h2 id="cmp-common" className={s.h2}>Rivales comunes</h2>
              <p className={s.note}>La única comparación directa que ofrecen los resultados. Aun así, cambian el momento y la forma de cada uno.</p>
            </div>
            {common.length ? (
              <div className={s.matrixWrap}>
                <table className={s.matrix}>
                  <caption className="visually-hidden">Resultados contra rivales comunes</caption>
                  <thead><tr><th scope="col">Rival</th>{entries.map((e, i) => <th key={e.summary.slug} scope="col" className={s[`c_${CORNERS[i]}`]}><i aria-hidden />{LETTER[i]} · {e.summary.lastName}</th>)}</tr></thead>
                  <tbody>
                    {common.map((c) => (
                      <tr key={c.slug}>
                        <th scope="row"><Link href={`/fighters/${c.slug}`}>{c.name}</Link></th>
                        {c.results.map((r, i) => (
                          <td key={i}>{r ? <span className={s.outs}>{r.split("").map((o, k) => <OutcomeMark key={k} o={o as "W" | "L" | "D"} size="sm" />)}</span> : <span className={s.none}>—</span>}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <p className={s.emptyInline}>No tienen rivales en común en los combates registrados.</p>}
          </section>

          <p className={s.foot}>{demo ? "Datos de demostración. " : "Combates y estadísticas de UFC. "}FCR calculado por FIGHTCORE. Una comparación no es una predicción.</p>
        </div>
      )}
    </div>
  );
}
