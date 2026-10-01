/**
 * Procedural portrait generator.
 *
 * FIGHTCORE's demo fighters are fictional, so there is no photograph to show.
 * Each fighter gets an illustrated head-and-shoulders portrait derived
 * deterministically from their profile (country, sex, age, weight class,
 * fighting style). Output is a standalone SVG string on a transparent canvas,
 * rasterised to PNG by scripts/render-portraits.mjs.
 */
import { Rng } from "../demo/rng";

export interface PortraitInput {
  id: string;
  sex: "M" | "F";
  country: string;
  age: number;
  /** 0 (lightest division) … 1 (heaviest). */
  mass: number;
  grappler: boolean;
  brawler: boolean;
}

const SKIN_BY_REGION: Record<string, [string, number][]> = {
  // Weighted skin tones (light → deep); not a claim about any individual.
  nordic: [["#F3D7C4", 3], ["#E9C3A6", 3], ["#D9A988", 1]],
  europe: [["#EFCDB3", 2], ["#E2B795", 3], ["#D2A07C", 2], ["#B98561", 1]],
  latam: [["#D9A67F", 2], ["#C68E66", 3], ["#A8734F", 2], ["#8A5B3C", 1], ["#E2B795", 1]],
  africa: [["#7A4E33", 2], ["#63402A", 3], ["#4E3121", 2], ["#8C5B3B", 1]],
  eastAsia: [["#EDCDAE", 2], ["#E0B892", 3], ["#CFA27A", 2]],
  seAsia: [["#D6A57C", 2], ["#C08D63", 3], ["#A8764F", 2]],
  central: [["#E6C0A0", 2], ["#D4A67F", 3], ["#BE8C64", 2]],
  oceania: [["#E9C3A6", 2], ["#C08D63", 2], ["#8C5B3B", 1]],
  usa: [["#EFCDB3", 3], ["#D9A988", 2], ["#A8734F", 1], ["#6B4430", 2], ["#4E3121", 1]],
};

const REGION: Record<string, keyof typeof SKIN_BY_REGION> = {
  SWE: "nordic", NLD: "nordic", IRL: "nordic", GBR: "europe", POL: "europe", CZE: "europe", RUS: "central", GEO: "central",
  ESP: "europe", FRA: "europe", ITA: "europe", PRT: "europe", CHE: "europe", DEU: "europe", CAN: "europe", AUS: "oceania", NZL: "oceania",
  BRA: "latam", MEX: "latam", ARG: "latam", NGA: "africa", CMR: "africa", JPN: "eastAsia", KOR: "eastAsia", CHN: "eastAsia",
  PHL: "seAsia", THA: "seAsia", KAZ: "central", UZB: "central", USA: "usa",
};

const HAIR_COLORS: Record<string, [string, number][]> = {
  dark: [["#17110D", 5], ["#2A1C14", 3], ["#3B281B", 1]],
  mixed: [["#17110D", 3], ["#2A1C14", 3], ["#4A3120", 2], ["#6E4B2E", 1], ["#A8804F", 1], ["#7A3B1E", 0.4]],
  light: [["#4A3120", 2], ["#6E4B2E", 2], ["#A8804F", 2], ["#C9A66B", 1.5], ["#7A3B1E", 0.6]],
};
const HAIR_REGION: Partial<Record<keyof typeof SKIN_BY_REGION, keyof typeof HAIR_COLORS>> = {
  nordic: "light", europe: "mixed", usa: "mixed", oceania: "mixed",
};

function shade(hex: string, k: number) {
  const n = parseInt(hex.slice(1), 16);
  const f = (c: number) => Math.max(0, Math.min(255, Math.round(k < 0 ? c * (1 + k) : c + (255 - c) * k)));
  const r = f(n >> 16), g = f((n >> 8) & 255), b = f(n & 255);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

function seedOf(id: string) {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619);
  return h >>> 0;
}

export function portraitSvg(p: PortraitInput): string {
  const r = new Rng(seedOf(p.id));
  const region = REGION[p.country] ?? "europe";
  const skin = r.weighted(SKIN_BY_REGION[region]);
  const skinShadow = shade(skin, -0.16);
  const skinDeep = shade(skin, -0.3);
  const skinLight = shade(skin, 0.1);
  const lip = shade(skin, -0.22);
  let hair = r.weighted(HAIR_COLORS[HAIR_REGION[region] ?? "dark"]);
  const grey = p.age >= 36 ? Math.min(0.8, (p.age - 35) * 0.12) : 0;
  const hairMix = grey ? mix(hair, "#9C978F", grey) : hair;
  hair = hairMix;
  const hairShadow = shade(hair, -0.35);
  const brow = shade(p.sex === "M" ? hair : hair, -0.1);

  const F = p.sex === "F";
  // Geometry.
  const cx = 256;
  const W = (F ? 70 : 76) + p.mass * (F ? 6 : 12) + r.range(-3, 3); // half cheek width
  const J = W * (F ? 0.78 : 0.86) + r.range(-3, 3); // jaw half-width
  const C = F ? 22 + r.range(-3, 3) : 28 + p.mass * 6 + r.range(-3, 3); // chin half-width
  const top = 120 + r.range(-4, 4);
  const chinY = 346 + r.range(-4, 6) + p.mass * 4;
  const neckW = (F ? 40 : 50) + p.mass * (F ? 8 : 26);
  const shoulder = (F ? 170 : 190) + p.mass * (F ? 20 : 50);
  const trap = F ? 18 : 30 + p.mass * 34;

  const head = `M ${cx} ${top} C ${cx + W * 0.95} ${top} ${cx + W} ${top + 50} ${cx + W} ${top + 108}
    C ${cx + W} ${top + 152} ${cx + J} ${chinY - 58} ${cx + C} ${chinY - 10} Q ${cx} ${chinY + 8} ${cx - C} ${chinY - 10}
    C ${cx - J} ${chinY - 58} ${cx - W} ${top + 152} ${cx - W} ${top + 108} C ${cx - W} ${top + 50} ${cx - W * 0.95} ${top} ${cx} ${top} Z`;

  const neckTop = chinY - 40;
  const neck = `M ${cx - neckW} ${neckTop} L ${cx - neckW - 4} 420 L ${cx + neckW + 4} 420 L ${cx + neckW} ${neckTop} Z`;
  const shoulders = `M ${cx - shoulder - 60} 512 C ${cx - shoulder - 40} 452 ${cx - shoulder + 10} ${420 - trap * 0.2} ${cx - neckW - 6} ${392 - trap * 0.6}
    L ${cx + neckW + 6} ${392 - trap * 0.6} C ${cx + shoulder - 10} ${420 - trap * 0.2} ${cx + shoulder + 40} 452 ${cx + shoulder + 60} 512 Z`;

  // Features.
  const eyeY = top + 118 + r.range(-3, 3);
  const eyeX = 34 + r.range(-2, 3);
  const eyeW = F ? 13 : 12;
  const eyeH = F ? 5.5 : 4.6;
  const browY = eyeY - 20 - r.range(0, 4);
  const browTilt = r.range(-3, 5);
  const browThick = (F ? 4 : 6.5) + r.range(0, 2);
  const noseY = eyeY + 46 + r.range(-2, 4);
  const noseW = (F ? 13 : 16) + p.mass * 4 + (p.brawler ? 3 : 0);
  const noseBend = p.brawler && r.chance(0.5) ? r.range(-4, 4) : 0;
  const mouthY = noseY + 30 + r.range(-2, 3);
  const mouthW = (F ? 19 : 21) + r.range(-2, 3);

  const eye = (sx: number) => {
    const x = cx + sx * eyeX;
    return `<path d="M ${x - eyeW} ${eyeY} Q ${x} ${eyeY - eyeH * 2.1} ${x + eyeW} ${eyeY} Q ${x} ${eyeY + eyeH * 1.3} ${x - eyeW} ${eyeY} Z" fill="#F4EEE6"/>
      <circle cx="${x + sx * 1}" cy="${eyeY - 0.5}" r="${eyeH + 0.6}" fill="#2A1D15"/>
      <circle cx="${x + sx * 1 - 1.6}" cy="${eyeY - 2}" r="1.3" fill="#FFFFFF" opacity="0.8"/>
      <path d="M ${x - eyeW - 1} ${eyeY + 0.5} Q ${x} ${eyeY - eyeH * 2.3} ${x + eyeW + 1} ${eyeY}" fill="none" stroke="${skinDeep}" stroke-width="${F ? 2.6 : 2.2}" stroke-linecap="round"/>
      <path d="M ${x - eyeW + 3} ${eyeY + eyeH * 1.8} Q ${x} ${eyeY + eyeH * 2.6} ${x + eyeW - 2} ${eyeY + eyeH * 1.6}" fill="none" stroke="${skinShadow}" stroke-width="1.4" opacity="0.7"/>`;
  };
  const browPath = (sx: number) => {
    const x0 = cx + sx * (eyeX - 16), x1 = cx + sx * (eyeX + 17);
    return `<path d="M ${x0} ${browY + 3} Q ${cx + sx * eyeX} ${browY - 5 - browTilt} ${x1} ${browY + 1 + browTilt * 0.4}" fill="none" stroke="${brow}" stroke-width="${browThick}" stroke-linecap="round"/>`;
  };

  // Hair styles.
  const styleM = r.weighted<string>([["buzz", 4], ["short", 3], ["fade", 3], ["bald", p.age > 30 ? 2.5 : 0.8], ["curly", region === "africa" || region === "latam" || region === "usa" ? 2 : 0.4], ["waves", 1]]);
  const styleF = r.weighted<string>([["tied", 4], ["braids", region === "africa" || region === "usa" || region === "latam" ? 2.5 : 1], ["short", 1.5], ["bun", 2]]);
  const style = F ? styleF : styleM;
  const hairline = top + 34 + (p.age > 33 && !F ? r.range(4, 14) : r.range(0, 6));
  const cap = (extra: number, low: number) => `M ${cx - W - 2} ${hairline + low} C ${cx - W - 4} ${top - 10 - extra} ${cx + W + 4} ${top - 10 - extra} ${cx + W + 2} ${hairline + low}
      C ${cx + W * 0.6} ${hairline - 8} ${cx - W * 0.6} ${hairline - 8} ${cx - W - 2} ${hairline + low} Z`;
  let hairBack = "";
  let hairFront = "";
  switch (style) {
    case "buzz":
      hairFront = `<path d="${cap(2, 28)}" fill="${hair}" opacity="0.55"/>`; break;
    case "short":
      hairFront = `<path d="${cap(14, 30)}" fill="${hair}"/><path d="M ${cx - W * 0.5} ${top - 2} Q ${cx} ${top - 12} ${cx + W * 0.6} ${top + 2}" stroke="${hairShadow}" stroke-width="3" fill="none" opacity="0.5"/>`; break;
    case "fade":
      hairFront = `<path d="${cap(4, 34)}" fill="${hair}" opacity="0.35"/><path d="M ${cx - W * 0.82} ${hairline + 4} C ${cx - W * 0.7} ${top - 20} ${cx + W * 0.7} ${top - 20} ${cx + W * 0.82} ${hairline + 4} C ${cx + W * 0.4} ${hairline - 10} ${cx - W * 0.4} ${hairline - 10} ${cx - W * 0.82} ${hairline + 4} Z" fill="${hair}"/>`; break;
    case "curly": {
      const bumps = Array.from({ length: 9 }, (_, i) => {
        const a = Math.PI * (1.05 + (i / 8) * 0.9);
        return `<circle cx="${cx + Math.cos(a) * (W + 4)}" cy="${top + 58 + Math.sin(a) * 70}" r="${22 + r.range(-3, 4)}" fill="${hair}"/>`;
      }).join("");
      hairFront = `<path d="${cap(24, 30)}" fill="${hair}"/>${bumps}`; break;
    }
    case "waves":
      hairFront = `<path d="${cap(8, 30)}" fill="${hair}"/>${[0, 1, 2].map((i) => `<path d="M ${cx - W * 0.7} ${top + 6 + i * 11} Q ${cx} ${top - 4 + i * 11} ${cx + W * 0.7} ${top + 6 + i * 11}" stroke="${hairShadow}" stroke-width="2" fill="none" opacity="0.45"/>`).join("")}`; break;
    case "bald":
      hairFront = `<ellipse cx="${cx - W * 0.35}" cy="${top + 26}" rx="${W * 0.35}" ry="14" fill="#FFFFFF" opacity="0.13"/>`;
      hairBack = `<path d="M ${cx - W - 1} ${top + 120} C ${cx - W - 2} ${top + 90} ${cx - W + 4} ${top + 80} ${cx - W + 8} ${top + 78} L ${cx - W + 8} ${top + 118} Z" fill="${hair}" opacity="0.4"/>`; break;
    case "tied":
      hairBack = `<ellipse cx="${cx + W * 0.2}" cy="${top + 4}" rx="30" ry="24" fill="${hair}"/>`;
      hairFront = `<path d="${cap(18, 42)}" fill="${hair}"/><path d="M ${cx - 8} ${top - 4} Q ${cx - W * 0.5} ${top + 14} ${cx - W + 2} ${hairline + 36}" stroke="${hairShadow}" stroke-width="2.5" fill="none" opacity="0.5"/>`; break;
    case "bun":
      hairBack = `<circle cx="${cx}" cy="${top - 20}" r="30" fill="${hair}"/><circle cx="${cx}" cy="${top - 20}" r="30" fill="${hairShadow}" opacity="0.25"/>`;
      hairFront = `<path d="${cap(16, 42)}" fill="${hair}"/>`; break;
    case "braids":
      hairBack = [-1, 1].map((sx) => `<path d="M ${cx + sx * (W - 6)} ${top + 90} Q ${cx + sx * (W + 20)} ${top + 200} ${cx + sx * (W + 8)} ${top + 290}" stroke="${hair}" stroke-width="20" fill="none" stroke-linecap="round"/>`).join("");
      hairFront = `<path d="${cap(12, 40)}" fill="${hair}"/>${[-0.5, -0.17, 0.17, 0.5].map((f) => `<path d="M ${cx + f * W * 1.6} ${hairline} Q ${cx + f * W * 1.1} ${top + 10} ${cx + f * W * 0.4} ${top - 6}" stroke="${hairShadow}" stroke-width="2" fill="none" opacity="0.6"/>`).join("")}`; break;
    case "short-f":
    default:
      hairFront = `<path d="${cap(16, 50)}" fill="${hair}"/>`;
  }

  // Facial hair (men only).
  const facial = F ? "none" : r.weighted<string>([["none", 3], ["stubble", 3], ["beard", 2], ["goatee", 1], ["moustache", 0.6]]);
  let beard = "";
  const jaw = `M ${cx - W + 4} ${top + 150} C ${cx - J} ${chinY - 50} ${cx - C - 4} ${chinY - 6} ${cx} ${chinY + 4} C ${cx + C + 4} ${chinY - 6} ${cx + J} ${chinY - 50} ${cx + W - 4} ${top + 150}
    L ${cx + W * 0.62} ${mouthY - 22} Q ${cx} ${mouthY - 34} ${cx - W * 0.62} ${mouthY - 22} Z`;
  if (facial === "stubble") beard = `<path d="${jaw}" fill="${hair}" opacity="0.2"/>`;
  if (facial === "beard") beard = `<path d="${jaw}" fill="${hair}" opacity="0.92"/><path d="M ${cx - mouthW - 2} ${mouthY - 2} Q ${cx} ${mouthY + 10} ${cx + mouthW + 2} ${mouthY - 2} Q ${cx} ${mouthY + 3} ${cx - mouthW - 2} ${mouthY - 2} Z" fill="${lip}"/>`;
  if (facial === "goatee") beard = `<path d="M ${cx - 20} ${mouthY + 10} Q ${cx} ${chinY + 8} ${cx + 20} ${mouthY + 10} Q ${cx} ${mouthY + 18} ${cx - 20} ${mouthY + 10} Z" fill="${hair}" opacity="0.9"/><path d="M ${cx - mouthW} ${mouthY - 8} Q ${cx} ${mouthY - 16} ${cx + mouthW} ${mouthY - 8} Q ${cx} ${mouthY - 4} ${cx - mouthW} ${mouthY - 8} Z" fill="${hair}" opacity="0.9"/>`;
  if (facial === "moustache") beard = `<path d="M ${cx - mouthW - 2} ${mouthY - 5} Q ${cx} ${mouthY - 17} ${cx + mouthW + 2} ${mouthY - 5} Q ${cx} ${mouthY - 7} ${cx - mouthW - 2} ${mouthY - 5} Z" fill="${hair}" opacity="0.9"/>`;

  // Ears (cauliflower ear on some grapplers).
  const cauli = p.grappler && r.chance(0.55);
  const ear = (sx: number) => {
    const x = cx + sx * (W + 3);
    return `<ellipse cx="${x}" cy="${eyeY + 16}" rx="${cauli ? 15 : 12}" ry="26" fill="${skin}"/>
      <ellipse cx="${x + sx * 2}" cy="${eyeY + 16}" rx="${cauli ? 8 : 6}" ry="16" fill="${skinShadow}" opacity="0.7"/>
      ${cauli ? `<circle cx="${x + sx * 3}" cy="${eyeY + 6}" r="6" fill="${skinLight}"/><circle cx="${x + sx * 1}" cy="${eyeY + 20}" r="5" fill="${skinLight}"/>` : ""}`;
  };

  const scar = r.chance(p.brawler ? 0.5 : 0.18) ? `<path d="M ${cx - eyeX - 6} ${browY - 8} l 8 12" stroke="${skinLight}" stroke-width="2.4" stroke-linecap="round"/>` : "";
  const lines = p.age >= 33 ? `<path d="M ${cx - noseW - 10} ${noseY + 6} Q ${cx - noseW - 18} ${mouthY - 4} ${cx - mouthW - 8} ${mouthY + 4}" stroke="${skinShadow}" stroke-width="1.8" fill="none" opacity="0.8"/>
    <path d="M ${cx + noseW + 10} ${noseY + 6} Q ${cx + noseW + 18} ${mouthY - 4} ${cx + mouthW + 8} ${mouthY + 4}" stroke="${skinShadow}" stroke-width="1.8" fill="none" opacity="0.8"/>` : "";

  // Women wear a rash guard with a scoop neck; men are shown bare-chested, as at weigh-ins.
  const top_ = F
    ? `<g clip-path="url(#b)"><path d="M 0 396 L ${cx - neckW - 22} 396 Q ${cx} 440 ${cx + neckW + 22} 396 L 512 396 L 512 520 L 0 520 Z" fill="#1A1D22"/></g>
       <path d="M ${cx - neckW - 22} 396 Q ${cx} 440 ${cx + neckW + 22} 396" stroke="#EC6528" stroke-width="4" fill="none"/>`
    : `<path d="M ${cx - 70} 448 Q ${cx - 30} 440 ${cx - 8} 452 M ${cx + 70} 448 Q ${cx + 30} 440 ${cx + 8} 452" stroke="${skinShadow}" stroke-width="3" fill="none" stroke-linecap="round" opacity="0.8"/>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="66 52 380 380" width="512" height="512">
  <defs><clipPath id="h"><path d="${head}"/></clipPath><clipPath id="b"><path d="${shoulders}"/><path d="${neck}"/></clipPath></defs>
  ${hairBack}
  <path d="${shoulders}" fill="${skin}"/>
  <g clip-path="url(#b)"><path d="M ${cx + 20} 330 L 520 330 L 520 520 L ${cx + 60} 520 Z" fill="${skinShadow}" opacity="0.55"/></g>
  <path d="${neck}" fill="${skin}"/>
  <path d="M ${cx + neckW * 0.25} ${neckTop} L ${cx + neckW} ${neckTop} L ${cx + neckW + 4} 420 L ${cx + neckW * 0.45} 420 Z" fill="${skinShadow}" opacity="0.8"/>
  <path d="M ${cx - neckW * 0.55} ${neckTop + 40} Q ${cx - neckW * 0.2} ${neckTop + 70} ${cx - 6} 404 M ${cx + neckW * 0.55} ${neckTop + 40} Q ${cx + neckW * 0.2} ${neckTop + 70} ${cx + 6} 404" stroke="${skinShadow}" stroke-width="2.5" fill="none" opacity="0.7"/>
  <path d="M ${cx - neckW} ${neckTop + 20} Q ${cx} ${neckTop + 50} ${cx + neckW} ${neckTop + 20} L ${cx + neckW} ${neckTop} L ${cx - neckW} ${neckTop} Z" fill="${skinDeep}" opacity="0.35"/>
  ${top_}
  ${ear(-1)}${ear(1)}
  <path d="${head}" fill="${skin}"/>
  <g clip-path="url(#h)">
    <path d="M ${cx + W * 0.35} ${top - 20} C ${cx + W * 0.7} ${top + 120} ${cx + W * 0.4} ${chinY - 40} ${cx + C * 0.4} ${chinY + 20} L ${cx + W + 30} ${chinY + 30} L ${cx + W + 30} ${top - 20} Z" fill="${skinShadow}" opacity="0.6"/>
    <ellipse cx="${cx - W * 0.45}" cy="${eyeY + 34}" rx="${W * 0.3}" ry="22" fill="${skinLight}" opacity="0.35"/>
    ${beard}
  </g>
  ${hairFront}
  ${browPath(-1)}${browPath(1)}
  ${eye(-1)}${eye(1)}
  <path d="M ${cx + noseBend - 3} ${eyeY + 8} Q ${cx + noseBend + 6} ${noseY - 16} ${cx + noseBend + 8} ${noseY - 2}" stroke="${skinShadow}" stroke-width="2.4" fill="none" stroke-linecap="round"/>
  <path d="M ${cx - noseW + noseBend} ${noseY} Q ${cx - noseW * 0.5 + noseBend} ${noseY + 10} ${cx + noseBend} ${noseY + 6} Q ${cx + noseW * 0.5 + noseBend} ${noseY + 10} ${cx + noseW + noseBend} ${noseY}" stroke="${skinDeep}" stroke-width="2.6" fill="none" stroke-linecap="round"/>
  <ellipse cx="${cx - noseW * 0.45 + noseBend}" cy="${noseY + 3}" rx="4" ry="2.4" fill="${skinDeep}" opacity="0.8"/>
  <ellipse cx="${cx + noseW * 0.45 + noseBend}" cy="${noseY + 3}" rx="4" ry="2.4" fill="${skinDeep}" opacity="0.8"/>
  ${lines}
  <path d="M ${cx - mouthW} ${mouthY} Q ${cx} ${mouthY + 4} ${cx + mouthW} ${mouthY}" stroke="${shade(lip, -0.25)}" stroke-width="3" fill="none" stroke-linecap="round"/>
  <path d="M ${cx - mouthW * 0.7} ${mouthY + 6} Q ${cx} ${mouthY + (F ? 16 : 13)} ${cx + mouthW * 0.7} ${mouthY + 6}" stroke="${lip}" stroke-width="${F ? 5 : 3}" fill="none" stroke-linecap="round" opacity="${F ? 0.9 : 0.6}"/>
  ${scar}
</svg>`;
}

function mix(a: string, b: string, t: number) {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const ch = (s: number) => Math.round(((pa >> s) & 255) * (1 - t) + ((pb >> s) & 255) * t);
  return `#${((ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).padStart(6, "0")}`;
}
