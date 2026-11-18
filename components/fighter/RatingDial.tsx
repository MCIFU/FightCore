import { CountUp } from "./CountUp";
import s from "./RatingDial.module.css";

/**
 * FCR dial: a 240° arc from 50 to 100, the travel filled up to the rating, the
 * margin of error as a band and a needle at the value. Server-rendered SVG;
 * only the numeral counts up on the client.
 */
const LO = 50, HI = 100, A0 = 150, SWEEP = 240, R = 84;
const ang = (v: number) => A0 + ((Math.min(HI, Math.max(LO, v)) - LO) / (HI - LO)) * SWEEP;
const pt = (a: number, r = R) => [100 + r * Math.cos((a * Math.PI) / 180), 100 + r * Math.sin((a * Math.PI) / 180)] as const;
const arc = (v0: number, v1: number, r = R) => {
  const a0 = ang(v0), a1 = ang(v1);
  const [x0, y0] = pt(a0, r), [x1, y1] = pt(a1, r);
  return `M${x0.toFixed(2)},${y0.toFixed(2)} A${r},${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1.toFixed(2)},${y1.toFixed(2)}`;
};

export function RatingDial({ value, band }: { value: number; band: number }) {
  const ticks = Array.from({ length: 11 }, (_, i) => LO + i * 5);
  const [nx0, ny0] = pt(ang(value), R - 9), [nx1, ny1] = pt(ang(value), R + 9);
  return (
    <div className={s.dial}>
      <svg viewBox="0 0 200 172" aria-hidden className={s.svg}>
        <path d={arc(LO, HI)} className={s.track} />
        <path d={arc(LO, value)} className={s.travel} pathLength={1} />
        <path d={arc(value - band, value + band, R - 10)} className={s.band} />
        {ticks.map((t) => {
          const [x0, y0] = pt(ang(t), R + 6), [x1, y1] = pt(ang(t), R + (t % 25 === 0 ? 14 : 10));
          return <line key={t} x1={x0} y1={y0} x2={x1} y2={y1} className={t % 25 === 0 ? s.tickMajor : s.tick} />;
        })}
        {[50, 75, 100].map((t) => {
          const [x, y] = pt(ang(t), R + 24);
          return <text key={t} x={x} y={y + 3} className={s.tickLabel}>{t}</text>;
        })}
        <line x1={nx0} y1={ny0} x2={nx1} y2={ny1} className={s.needle} />
      </svg>
      <div className={s.readout}>
        <span className={s.value}><CountUp value={value} /></span>
        <span className={s.unit}>FCR · ±{band.toFixed(1)}</span>
      </div>
    </div>
  );
}
