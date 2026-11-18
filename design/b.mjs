// Concepto B · OCTÁGONO — un instrumento de medida para el MMA.
import { D, photo, short, day, mon, dow, num, clock, methodShort, divShort, esc, winLose, write, mark, TODAY, daysTo } from "./lib.mjs";

const ev = D.upcoming.find((e) => e.org === "UFC");
const { red: R, blue: B } = ev.main;
const ufcChamps = D.champs.filter((c) => c.org === "UFC");
const oct = (cx, cy, r) => { const k = r * 0.4142; return `M${cx - k},${cy - r}H${cx + k}L${cx + r},${cy - k}V${cy + k}L${cx + k},${cy + r}H${cx - k}L${cx - r},${cy + k}V${cy - k}Z`; };
const form = (f) => f.map((x) => `<i class="f-${x}" title="${x === "W" ? "Victoria" : x === "L" ? "Derrota" : x}">${x === "W" ? "V" : x === "L" ? "D" : x}</i>`).join("");
const tape = [
  ["FCR", num(R.rating), num(B.rating), R.rating, B.rating],
  ["Ranking div.", `nº ${R.rank}`, `nº ${B.rank}`, -R.rank, -B.rank],
  ["Récord", R.rec, B.rec, null, null],
  ["Edad", `${R.age}`, `${B.age}`, null, null],
];

const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>FIGHTCORE · Concepto B · Octágono</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,400..900&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
<style>
:root{--bg:#07080a;--s1:#0d0f12;--s2:#14171c;--s3:#1d2128;--line:rgb(232 230 225/.09);--line2:rgb(232 230 225/.18);--tx:#ebe8e2;--tx2:#9a9ea6;--tx3:#6c717a;--ember:#ff5f1f;--ember2:#ff8a4d;--steel:#8fb3d9;--gold:#d9b25f;
--wide:"Archivo",system-ui,sans-serif;--mono:"JetBrains Mono",ui-monospace,monospace;--g:clamp(16px,3vw,48px);--cut:14px}
*{box-sizing:border-box;margin:0}html{background:var(--bg)}body{background:var(--bg);color:var(--tx);font-family:var(--wide);-webkit-font-smoothing:antialiased;line-height:1.45;overflow-x:clip}
a{color:inherit;text-decoration:none}img{display:block;max-width:100%}
.mono{font-family:var(--mono);font-size:11px;letter-spacing:.1em;text-transform:uppercase;font-feature-settings:"tnum","zero"}
.wide{font-variation-settings:"wdth" 125;text-transform:uppercase;letter-spacing:-.01em}
.cut{clip-path:polygon(var(--cut) 0,calc(100% - var(--cut)) 0,100% var(--cut),100% calc(100% - var(--cut)),calc(100% - var(--cut)) 100%,var(--cut) 100%,0 calc(100% - var(--cut)),0 var(--cut))}
.wrap{max-width:1480px;margin:0 auto;padding:0 var(--g)}
/* header */
header{position:sticky;top:0;z-index:20;background:rgb(7 8 10/.82);backdrop-filter:blur(14px) saturate(1.3);border-bottom:1px solid var(--line)}
.hb{display:flex;align-items:center;gap:32px;height:64px}
.logo{display:flex;align-items:center;gap:10px;font-weight:900;font-variation-settings:"wdth" 125;font-size:19px;letter-spacing:-.01em}.logo svg{width:24px;height:24px}
nav.main{display:flex;gap:4px;font-size:14px;font-weight:500;color:var(--tx2)}
nav.main a{padding:8px 12px;position:relative;transition:color .2s}nav.main a:hover,nav.main a[aria-current]{color:var(--tx)}
nav.main a[aria-current]::after{content:"";position:absolute;left:12px;right:12px;bottom:-13px;height:2px;background:var(--ember)}
.search{margin-left:auto;display:flex;align-items:center;gap:10px;width:300px;height:38px;padding:0 12px;background:var(--s1);border:1px solid var(--line2);color:var(--tx3);font-size:14px}
.search kbd{margin-left:auto;font-family:var(--mono);font-size:11px;border:1px solid var(--line2);padding:1px 6px;color:var(--tx2)}
.live{display:flex;align-items:center;gap:8px;color:var(--tx2)}.live::before{content:"";width:6px;height:6px;background:#3ad08a;box-shadow:0 0 0 4px rgb(58 208 138/.15)}
/* hero */
.hero{position:relative;min-height:calc(100svh - 64px);display:grid;grid-template-rows:auto 1fr auto;padding-top:28px;overflow:hidden;isolation:isolate}
.hero::before{content:"";position:absolute;inset:0;z-index:-2;background:
 radial-gradient(60% 70% at 22% 55%,rgb(255 95 31/.16),transparent 70%),
 radial-gradient(60% 70% at 78% 55%,rgb(143 179 217/.14),transparent 70%),
 linear-gradient(var(--bg),var(--bg))}
.hero::after{content:"";position:absolute;inset:0;z-index:-1;background-image:linear-gradient(var(--line) 1px,transparent 1px),linear-gradient(90deg,var(--line) 1px,transparent 1px);background-size:64px 64px;mask-image:radial-gradient(70% 60% at 50% 50%,#000 30%,transparent 80%);opacity:.6}
.hero .wrap{width:100%}
.hmeta{display:flex;justify-content:space-between;align-items:flex-start;gap:24px}
.hmeta .ttl{font-weight:800;font-size:13px;letter-spacing:.18em;text-transform:uppercase;color:var(--ember2)}
.hmeta h1{font-weight:900;font-variation-settings:"wdth" 125;font-size:clamp(18px,1.7vw,24px);text-transform:uppercase;margin-top:8px;letter-spacing:.01em}
.count{display:flex;gap:2px;text-align:center}
.count div{background:var(--s1);border:1px solid var(--line);padding:10px 14px;min-width:74px}
.count b{display:block;font-weight:800;font-size:34px;line-height:1;font-feature-settings:"tnum";font-variation-settings:"wdth" 100}
.count span{color:var(--tx3);font-size:10px}
.stage{position:relative;display:grid;grid-template-columns:1fr minmax(260px,24vw) 1fr;align-items:end;margin-top:8px}
.fighter{position:relative;height:min(64vh,620px);display:flex;align-items:flex-end}
.fighter img{height:100%;width:auto;max-width:none;object-fit:contain;filter:grayscale(.35) contrast(1.08) brightness(.95);-webkit-mask-image:linear-gradient(#000 62%,transparent 98%);mask-image:linear-gradient(#000 62%,transparent 98%)}
.fighter.r{justify-content:flex-end}.fighter.b{justify-content:flex-start}
.fighter.r img{filter:grayscale(.35) contrast(1.08) brightness(.95) drop-shadow(-18px 0 40px rgb(255 95 31/.35))}
.fighter.b img{transform:scaleX(-1);filter:grayscale(.35) contrast(1.08) brightness(.95) drop-shadow(-18px 0 40px rgb(143 179 217/.3))}
.center{align-self:center;position:relative;display:grid;place-items:center;aspect-ratio:1}
.center svg{position:absolute;inset:0;width:100%;height:100%}
.center .ring{fill:none;stroke:var(--line2);stroke-width:1}.center .ring2{fill:none;stroke:var(--ember);stroke-width:1.5;stroke-dasharray:4 7;animation:spin 40s linear infinite;transform-origin:50% 50%}
@keyframes spin{to{transform:rotate(360deg)}}
.center .vs{font-weight:900;font-variation-settings:"wdth" 125;font-size:clamp(40px,4.4vw,72px);letter-spacing:-.04em;line-height:1}
.center .div{color:var(--tx2);margin-top:8px;text-align:center}
.names{display:grid;grid-template-columns:1fr 1fr;gap:24px;border-top:1px solid var(--line2);padding:20px 0 0;position:relative}
.names h2{font-weight:900;font-variation-settings:"wdth" 125;font-size:clamp(40px,5.3vw,92px);line-height:.82;letter-spacing:-.035em;text-transform:uppercase}
.names .bn{text-align:right}
.names .first{font-weight:500;font-size:18px;color:var(--tx2);display:block;margin-bottom:10px;letter-spacing:0;text-transform:none;font-variation-settings:"wdth" 100}
.names .flag{color:var(--tx3);margin-left:8px}
.tape{display:grid;grid-template-columns:1fr;gap:0;margin:22px 0 28px;border-top:1px solid var(--line)}
.tape .row{display:grid;grid-template-columns:1fr 140px 1fr;align-items:center;gap:16px;padding:9px 0;border-bottom:1px solid var(--line)}
.tape .v{font-weight:700;font-size:18px;font-feature-settings:"tnum";display:flex;align-items:center;gap:12px}
.tape .v.bv{justify-content:flex-end;flex-direction:row-reverse}
.tape .k{text-align:center;color:var(--tx3)}
.tape .rail{flex:1;height:2px;background:var(--line);position:relative}
.tape .rail i{position:absolute;top:-1px;height:4px}
.tape .rv .rail i{right:0;background:var(--ember)}.tape .bv .rail i{left:0;background:var(--steel)}
.tape .rv .rail{transform:scaleX(-1)}
.formrow{display:flex;gap:3px}.formrow i{font-style:normal;font-family:var(--mono);font-size:11px;width:22px;height:22px;display:grid;place-items:center;border:1px solid var(--line2);color:var(--tx2)}.formrow .f-W{background:var(--tx);color:var(--bg);border-color:var(--tx)}
.cta{display:flex;gap:10px;justify-content:center;padding-bottom:28px}
.btn{display:inline-flex;align-items:center;gap:10px;height:46px;padding:0 22px;font-weight:700;font-size:14px;letter-spacing:.02em;background:var(--ember);color:#0b0b0b;transition:transform .2s,background .2s}.btn:hover{background:var(--ember2);transform:translateY(-1px)}
.btn.ghost{background:transparent;color:var(--tx);border:1px solid var(--line2)}.btn.ghost:hover{border-color:var(--tx)}
/* ticker */
.ticker{border-block:1px solid var(--line);background:var(--s1);overflow:hidden;white-space:nowrap}
.ticker .track{display:inline-flex;animation:tick 60s linear infinite}
.ticker:hover .track{animation-play-state:paused}
@keyframes tick{to{transform:translateX(-50%)}}
.ticker .it{display:inline-flex;align-items:center;gap:12px;padding:14px 28px;border-right:1px solid var(--line);font-size:14px}
.ticker .it b{font-weight:700}.ticker .it .m{color:var(--ember2)}
/* sections */
.sec{padding:96px 0 0}
.sh{display:flex;align-items:flex-end;justify-content:space-between;gap:24px;margin-bottom:28px}
.sh .idx{color:var(--ember2);margin-bottom:12px;display:block}
.sh h2{font-weight:900;font-variation-settings:"wdth" 125;font-size:clamp(34px,4.4vw,68px);line-height:.88;letter-spacing:-.03em;text-transform:uppercase}
.sh p{color:var(--tx2);max-width:44ch;font-size:15px}
.sh a.more{display:inline-flex;gap:8px;align-items:center;font-weight:600;font-size:14px;border-bottom:1px solid var(--ember);padding-bottom:3px;white-space:nowrap}
/* p4p instrument */
.instr{border-top:1px solid var(--line2)}
.scale{display:grid;grid-template-columns:72px 1fr 340px 120px;gap:20px;padding:10px 0;border-bottom:1px solid var(--line);color:var(--tx3)}
.scale .ticks{display:flex;justify-content:space-between}
.pr{display:grid;grid-template-columns:72px 1fr 340px 120px;gap:20px;align-items:center;padding:12px 0;border-bottom:1px solid var(--line);transition:background .25s;position:relative}
.pr:hover{background:linear-gradient(90deg,rgb(255 95 31/.07),transparent 60%)}
.pr .rk{font-weight:900;font-variation-settings:"wdth" 125;font-size:40px;line-height:1;letter-spacing:-.04em;font-feature-settings:"tnum";color:var(--tx)}
.pr .who{display:flex;align-items:center;gap:16px;min-width:0}
.pr .av{width:56px;height:56px;flex:none;background:var(--s2);overflow:hidden}
.pr .av img{width:100%;height:100%;object-fit:cover;object-position:50% 8%;filter:grayscale(.4)}
.pr .nm{font-weight:800;font-size:19px;line-height:1.1;letter-spacing:-.01em}
.pr .sub{color:var(--tx3);margin-top:4px}
.pr .mv{font-family:var(--mono);font-size:11px;margin-left:8px}.up{color:#3ad08a}.dn{color:#ff6b6b}
.gauge{position:relative;height:28px}
.gauge::before{content:"";position:absolute;left:0;right:0;top:50%;height:1px;background:var(--line2)}
.gauge .tk{position:absolute;top:8px;bottom:8px;width:1px;background:var(--line2)}
.gauge .needle{position:absolute;top:2px;bottom:2px;width:3px;background:var(--ember);box-shadow:0 0 14px var(--ember)}
.gauge .fill{position:absolute;left:0;top:50%;height:1px;background:linear-gradient(90deg,transparent,var(--ember))}
.pr .val{text-align:right;font-weight:800;font-size:30px;font-feature-settings:"tnum";letter-spacing:-.02em}
.pr .val small{display:block;color:var(--tx3);font-weight:400}
/* champions */
.belts{display:grid;grid-template-columns:repeat(7,1fr);gap:10px}
.belt.lead{grid-column:span 2;grid-row:span 2}.belt.lead .nm{font-size:40px}.belt.lead img{width:84%;bottom:96px}.belt.lead .tag{position:relative;align-self:flex-start;margin-bottom:auto;background:var(--gold);color:#111;padding:5px 9px;font-weight:700}
.belt{--cut:18px;position:relative;background:var(--s1);aspect-ratio:3/4;overflow:hidden;display:flex;flex-direction:column;justify-content:flex-end;padding:18px;transition:background .3s}
.belt::before{content:"";position:absolute;left:18px;right:18px;top:0;height:2px;background:linear-gradient(90deg,transparent,var(--gold),transparent);opacity:.8}
.belt img{position:absolute;left:50%;bottom:78px;width:92%;transform:translateX(-50%);filter:grayscale(.5) contrast(1.05);-webkit-mask-image:linear-gradient(#000 60%,transparent);mask-image:linear-gradient(#000 60%,transparent);transition:filter .4s,transform .6s cubic-bezier(.22,1,.36,1)}
.belt:hover{background:var(--s2)}.belt:hover img{filter:none;transform:translateX(-50%) scale(1.03)}
.belt .dv{color:var(--gold);position:relative}
.belt .nm{position:relative;font-weight:900;font-variation-settings:"wdth" 100;font-size:17px;line-height:1;text-transform:uppercase;margin-top:6px;letter-spacing:-.01em}
.belt .d{position:relative;display:flex;justify-content:space-between;font-size:10px;letter-spacing:.06em;color:var(--tx3);margin-top:10px;padding-top:10px;border-top:1px solid var(--line)}
/* timeline */
.rail{position:relative}
.events{display:grid;grid-template-columns:repeat(6,minmax(220px,1fr));gap:0;border-top:1px solid var(--line2);overflow-x:auto;scroll-snap-type:x mandatory;scrollbar-width:none}
.evc{scroll-snap-align:start;padding:22px 20px 26px 0;border-right:1px solid var(--line);position:relative}
.evc+.evc{padding-left:20px}
.evc::before{content:"";position:absolute;top:-6px;left:0;width:11px;height:11px;background:var(--bg);border:1.5px solid var(--tx3);clip-path:polygon(30% 0,70% 0,100% 30%,100% 70%,70% 100%,30% 100%,0 70%,0 30%)}
.evc+.evc::before{left:20px}
.evc.next::before{background:var(--ember);border-color:var(--ember)}
.evc .when{display:flex;align-items:baseline;gap:10px}
.evc .dd{font-weight:900;font-variation-settings:"wdth" 125;font-size:44px;line-height:1;letter-spacing:-.04em}
.evc .org{color:var(--ember2);margin-top:14px}
.evc .nm{font-weight:700;font-size:16px;line-height:1.2;margin-top:4px}
.evc .main{margin-top:10px;font-weight:800;text-transform:uppercase;font-variation-settings:"wdth" 112;font-size:15px}
.evc .main i{font-style:normal;color:var(--tx3);font-weight:500;margin-right:6px}
.evc .pl{color:var(--tx3);margin-top:8px}
footer{margin-top:120px;border-top:1px solid var(--line);padding:40px 0 120px;color:var(--tx3);font-size:13px;display:flex;justify-content:space-between;gap:24px}
.tabbar{display:none}
@media (max-width:1100px){.belts{grid-template-columns:repeat(4,1fr)}.scale,.pr{grid-template-columns:56px 1fr 200px 90px}.pr .rk{font-size:32px}}
@media (max-width:760px){
 nav.main,.search,.live{display:none}.hb{height:56px;justify-content:space-between}
 .hero{min-height:auto;padding-top:18px}
 .hmeta{flex-direction:column;gap:14px}.count div{min-width:0;flex:1;padding:8px}.count{width:100%}.count b{font-size:26px}
 .hmeta h1{font-size:20px}.stage{grid-template-columns:1fr 1fr;margin-top:10px}.stage>.fighter{min-width:0;overflow:hidden}.center{position:absolute;left:50%;top:38%;width:120px;transform:translate(-50%,-50%);z-index:2}.center .div{display:none}.center .vs{font-size:34px}
 .fighter{height:auto}.fighter img{width:100%;height:auto}.fighter.r img{transform:translateX(10%)}.fighter.b img{transform:scaleX(-1) translateX(10%)}
 .names{grid-template-columns:1fr;gap:10px}.names h2{font-size:clamp(34px,11vw,52px)}.names .first{font-size:14px;margin-bottom:6px}
 .tape .row{grid-template-columns:1fr 84px 1fr;gap:8px}.tape .v{font-size:15px;gap:6px}.tape .rail{display:none}
 .cta{flex-direction:column}.btn{justify-content:center}
 .sec{padding-top:64px}.sh{flex-direction:column;align-items:flex-start}
 .scale{display:none}.pr{grid-template-columns:40px 1fr auto;gap:12px}.pr .gauge{grid-column:2/4;grid-row:2;height:18px}.pr .rk{font-size:26px}.pr .av{width:44px;height:44px}.pr .nm{font-size:16px}.pr .val{font-size:22px}
 .belt.lead{grid-row:auto;grid-column:auto}.belt.lead .nm{font-size:21px}.belt.lead img{width:92%;bottom:62px}.belt.lead .tag{position:absolute;top:14px;left:14px}
 .belts{grid-auto-flow:column;grid-template-columns:none;grid-auto-columns:62%;overflow-x:auto;scroll-snap-type:x mandatory;margin:0 calc(var(--g)*-1);padding:0 var(--g);scrollbar-width:none}.belt{scroll-snap-align:start}
 .events{grid-template-columns:repeat(6,72%);margin:0 calc(var(--g)*-1);padding:0 var(--g)}
 footer{flex-direction:column}
 .tabbar{display:grid;grid-template-columns:repeat(5,1fr);position:fixed;left:8px;right:8px;bottom:calc(8px + env(safe-area-inset-bottom));z-index:30;background:rgb(13 15 18/.86);backdrop-filter:blur(16px);border:1px solid var(--line2);padding:8px 4px;font-size:10.5px;font-weight:600;text-align:center;--cut:10px}
 .tabbar a{display:grid;gap:4px;justify-items:center;color:var(--tx3)}.tabbar a[aria-current]{color:var(--tx)}.tabbar a[aria-current] svg{color:var(--ember)}
 .tabbar svg{width:20px;height:20px}
}
@media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
</style></head><body>
<header><div class="wrap hb"><a class="logo" href="#">${mark("#ebe8e2", "#ff5f1f")}FIGHTCORE</a>
<nav class="main"><a href="#" aria-current="page">Inicio</a><a href="#">Luchadores</a><a href="#">Rankings</a><a href="#">Campeones</a><a href="#">Eventos</a><a href="#">Comparar</a></nav>
<div class="search cut" style="--cut:6px"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>Buscar luchador, evento…<kbd>/</kbd></div>
<span class="live mono">Datos · ${short("2026-11-16")}</span></div></header>

<section class="hero"><div class="wrap" style="display:contents">
 <div class="wrap hmeta"><div><div class="ttl">Próximo combate estelar · UFC</div><h1>${esc(ev.name.replace(/:.*/, ""))} · ${ev.city}, ${ev.country}</h1><div class="mono" style="color:var(--tx3);margin-top:6px">${dow(ev.date)} ${short(ev.date)} · ${esc(ev.venue)} · ${ev.n} combates</div></div>
  <div class="count mono" aria-label="Faltan ${daysTo(ev.date)} días"><div><b>${String(daysTo(ev.date)).padStart(2, "0")}</b><span>${daysTo(ev.date) === 1 ? "día" : "días"}</span></div><div><b>${dow(ev.date).toUpperCase()}</b><span>${short(ev.date)}</span></div></div></div>
 <div class="wrap stage">
  <div class="fighter r"><img src="${photo(R.photo)}" alt="${R.name}"></div>
  <div class="center"><svg viewBox="0 0 200 200"><path class="ring" d="${oct(100, 100, 98)}"/><path class="ring2" d="${oct(100, 100, 86)}"/><path class="ring" d="${oct(100, 100, 70)}"/></svg><div><div class="vs">VS</div><div class="div mono">${ev.main.div}<br>5 asaltos</div></div></div>
  <div class="fighter b"><img src="${photo(B.photo)}" alt="${B.name}"></div>
 </div>
 <div class="wrap">
  <div class="names"><h2><span class="first">${R.first} <span class="mono flag">${R.country}</span></span>${R.last}</h2><h2 class="bn"><span class="first"><span class="mono flag">${B.country}</span> ${B.first}</span>${B.last}</h2></div>
  <div class="tape">
   ${tape.map(([k, a, b, x, y]) => { const max = x !== null ? Math.max(Math.abs(x), Math.abs(y)) : 1; const w = (v) => (x === null ? 0 : x > 0 ? ((v - 60) / 40) * 100 : (1 - (Math.abs(v) - 1) / 20) * 100); return `<div class="row"><div class="v rv">${x !== null ? `<span class="rail"><i style="width:${w(x)}%"></i></span>` : "<span class=rail style=visibility:hidden></span>"}${a}</div><div class="k mono">${k}</div><div class="v bv">${x !== null ? `<span class="rail"><i style="width:${w(y)}%"></i></span>` : "<span class=rail style=visibility:hidden></span>"}${b}</div></div>`; }).join("")}
   <div class="row"><div class="v rv" style="justify-content:flex-end"><span class="formrow">${form(R.form)}</span></div><div class="k mono">Últimos 5</div><div class="v bv" style="justify-content:flex-end;flex-direction:row"><span class="formrow">${form(B.form)}</span></div></div>
  </div>
  <div class="cta"><a class="btn cut" style="--cut:8px" href="#">Analizar el combate →</a><a class="btn ghost" href="#">Ver la cartelera completa</a></div>
 </div>
</div></section>

<div class="ticker" aria-label="Últimos resultados"><div class="track">${[0, 1].map(() => D.results.map((r) => { const [w, l] = winLose(r); return `<span class="it"><span class="mono" style="color:var(--tx3)">${short(r.date)} · ${r.org}</span><b>${w.name}</b><span style="color:var(--tx3)">def.</span>${l.name}<span class="m mono">${methodShort(r.method)} · R${r.round} ${clock(r.time)}</span></span>`; }).join("")).join("")}</div></div>

<main class="wrap">
 <section class="sec">
  <div class="sh"><div><span class="idx mono">01 · FIGHTCORE Rating</span><h2>Libra<br>por libra</h2></div><p>Una sola escala para todas las divisiones y organizaciones. El FCR mide resultados, método y nivel de los rivales; cada combate lo mueve como mucho 3 puntos.</p><a class="more" href="#">Rankings por división →</a></div>
  <div class="instr">
   <div class="scale mono"><span>Nº</span><span>Luchador</span><span class="ticks"><span>80</span><span>85</span><span>90</span><span>95</span><span>100</span></span><span style="text-align:right">FCR</span></div>
   ${D.p4p.map((r) => `<a class="pr" href="#"><span class="rk">${String(r.rank).padStart(2, "0")}</span><span class="who"><span class="av cut" style="--cut:8px"><img src="${photo(r.f.photo)}" alt=""></span><span><span class="nm">${r.f.name}</span><span class="mv ${r.mv === "up" ? "up" : r.mv === "down" ? "dn" : ""}">${r.mv === "up" ? "▲" + r.d : r.mv === "down" ? "▼" + -r.d : ""}</span><div class="sub mono">${divShort(r.f.div)} · ${r.f.rec} · ${r.f.country}</div></span></span><span class="gauge">${[0, 25, 50, 75, 100].map((t) => `<span class="tk" style="left:${t}%"></span>`).join("")}<span class="fill" style="width:${((r.rating - 80) / 20) * 100}%"></span><span class="needle" style="left:calc(${((r.rating - 80) / 20) * 100}% - 1px)"></span></span><span class="val">${num(r.rating)}</span></a>`).join("")}
  </div>
 </section>

 <section class="sec">
  <div class="sh"><div><span class="idx mono">02 · Cinturones</span><h2>Campeones<br>UFC</h2></div><p>Once divisiones. El campeón vigente, cuándo ganó el cinturón y cuántas veces lo ha defendido.</p><a class="more" href="#">ONE, PFL, KSW, RIZIN →</a></div>
  <div class="belts">${[...ufcChamps].sort((a, b) => b.since.localeCompare(a.since)).map((c, i) => `<a class="belt cut${i === 0 ? " lead" : ""}" href="#">${i === 0 ? `<span class="tag mono">Nuevo campeón · ${short(c.since)}</span>` : ""}<img src="${photo(c.f.photo)}" alt="${c.f.name}"><span class="dv mono">${divShort(c.div)}</span><span class="nm">${c.f.name}</span><span class="d mono"><span>Desde ${short(c.since)} ${c.since.slice(2, 4)}</span><span>${c.def} def.</span></span></a>`).join("")}</div>
 </section>

 <section class="sec">
  <div class="sh"><div><span class="idx mono">03 · Calendario</span><h2>Próximos<br>eventos</h2></div><p>UFC, ONE y KSW en las próximas tres semanas.</p><a class="more" href="#">Calendario completo →</a></div>
  <div class="events">${D.upcoming.map((e, i) => `<a class="evc${i === 0 ? " next" : ""}" href="#"><div class="when"><span class="dd">${day(e.date)}</span><span class="mono" style="color:var(--tx2)">${mon(e.date)} · ${dow(e.date)}</span></div><div class="org mono">${e.org}${i === 0 ? " · hoy" : ` · en ${daysTo(e.date)} días`}</div><div class="nm">${esc(e.name.replace(/:.*/, ""))}</div><div class="main">${e.main.red.last}<br><i>vs</i>${e.main.blue.last}</div><div class="pl mono">${e.city} · ${e.n} combates</div></a>`).join("")}</div>
 </section>
</main>
<footer class="wrap"><span>FIGHTCORE · proyecto independiente, sin relación con UFC, PFL, ONE u otras organizaciones.</span><span>Retratos oficiales © UFC vía ESPN · Datos: UFCStats, ESPN, Wikipedia.</span></footer>
<nav class="tabbar cut"><a href="#" aria-current="page"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M8.5 3h7L21 8.5v7L15.5 21h-7L3 15.5v-7z"/></svg>Inicio</a><a href="#"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></svg>Luchadores</a><a href="#"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/></svg>Buscar</a><a href="#"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M5 20V10M12 20V4M19 20v-7"/></svg>Rankings</a><a href="#"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3" y="5" width="18" height="15"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>Eventos</a></nav>

</body></html>`;
write("b-octagono", html);
