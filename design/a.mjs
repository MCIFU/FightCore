// Concepto A · ALMANAQUE — el periódico de referencia del MMA.
import { D, photo, short, long, dowL, day, mon, monL, num, clock, method, methodShort, divShort, esc, winLose, write, mark, TODAY, daysTo } from "./lib.mjs";

const lead = D.results[0]; // Gane def. Hokit, UFC 334 (title)
const second = D.results[2]; // Harrison def. Nunes
const [lw, ll] = winLose(lead);
const [sw, sl] = winLose(second);
const ganeP4P = D.p4p.find((r) => r.f.slug === lw.slug);
const harr = D.champs.find((c) => c.f?.slug === sw.slug);
const ufcChamps = D.champs.filter((c) => c.org === "UFC");
const nextUfc = D.upcoming.find((e) => e.org === "UFC");

const fn = (n) => `<sup class="fn"><a href="#src-${n}">${n}</a></sup>`;
const mv = (r) => (r.mv === "up" ? `<span class="up" title="Sube ${r.d}">▲${r.d}</span>` : r.mv === "down" ? `<span class="down" title="Baja ${-r.d}">▼${-r.d}</span>` : `<span class="eq" title="Sin cambios">—</span>`);

const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>FIGHTCORE · Concepto A · Almanaque</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,400..900&family=JetBrains+Mono:wght@400;500;700&family=Newsreader:ital,opsz,wght@0,6..72,400..800;1,6..72,400..800&display=swap" rel="stylesheet">
<style>
:root{--paper:#f2ede3;--paper-2:#e8e1d3;--ink:#16130f;--ink-2:#544d42;--ink-3:#7a7265;--rule:#16130f;--hair:rgb(22 19 15/.18);--red:#b3301c;--ember:#ec6528;
--serif:"Newsreader",Georgia,serif;--sans:"Archivo",system-ui,sans-serif;--mono:"JetBrains Mono",ui-monospace,monospace;--g:clamp(16px,3vw,48px)}
*{box-sizing:border-box;margin:0}body{background:var(--paper);color:var(--ink);font-family:var(--serif);-webkit-font-smoothing:antialiased;font-size:17px;line-height:1.5}
a{color:inherit;text-decoration:none}img{display:block;max-width:100%}
.wrap{max-width:1400px;margin:0 auto;padding:0 var(--g)}
.mono{font-family:var(--mono);font-size:11px;letter-spacing:.06em;text-transform:uppercase;font-feature-settings:"tnum","zero"}
.kicker{font-family:var(--sans);font-weight:700;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--red)}
.fn{line-height:0}.fn a{font-family:var(--mono);font-size:.62em;color:var(--red);padding:0 1px}
/* Masthead */
.top{display:flex;justify-content:space-between;gap:16px;padding:14px 0 12px;border-bottom:1px solid var(--hair);color:var(--ink-2)}
.mast{display:grid;grid-template-columns:1fr auto 1fr;align-items:end;padding:28px 0 18px;border-bottom:3px double var(--rule)}
.mast .l,.mast .r{font-family:var(--serif);font-style:italic;font-size:15px;color:var(--ink-2);line-height:1.35}
.mast .r{text-align:right}
.name{display:flex;align-items:center;gap:clamp(10px,1.4vw,20px);font-family:var(--sans);font-weight:900;font-variation-settings:"wdth" 125;font-size:clamp(40px,7.4vw,112px);letter-spacing:-.02em;line-height:.8}
.name svg{width:.62em;height:.62em;flex:none}
nav.sections{display:flex;justify-content:center;gap:clamp(14px,2.4vw,36px);padding:12px 0;border-bottom:1px solid var(--rule);font-family:var(--sans);font-size:13.5px;font-weight:600;letter-spacing:.02em}
nav.sections a{position:relative;padding:4px 0}
nav.sections a::after{content:"";position:absolute;left:0;right:0;bottom:0;height:2px;background:var(--red);transform:scaleX(0);transform-origin:left;transition:transform .35s cubic-bezier(.22,1,.36,1)}
nav.sections a:hover::after,nav.sections a[aria-current]::after{transform:scaleX(1)}
nav.sections .search{display:flex;align-items:center;gap:8px;color:var(--ink-2);font-weight:500}
/* Front page */
.front{display:grid;grid-template-columns:minmax(0,2.7fr) minmax(0,1fr);gap:0;padding:30px 0 40px;border-bottom:1px solid var(--rule)}
.leadbody{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(0,1fr);gap:32px;margin-top:6px}
.copy{border-left:1px solid var(--hair);padding-left:32px}
.front>*{padding:0 28px}.front>*:first-child{padding-left:0}.front>*:last-child{padding-right:0}
.front>*+*{border-left:1px solid var(--hair)}
h1.hl{font-family:var(--serif);font-weight:700;font-size:clamp(40px,5.2vw,84px);line-height:.94;letter-spacing:-.028em;margin:14px 0 26px;font-variation-settings:"opsz" 72;max-width:17ch}
h1.hl em{font-weight:400}
.deck{font-size:21px;line-height:1.4;color:var(--ink-2);font-variation-settings:"opsz" 24}
.deck b{color:var(--ink);font-weight:600}
.byline{margin-top:20px;padding-top:12px;border-top:1px solid var(--hair);display:flex;justify-content:space-between;color:var(--ink-3)}
figure.lead .ph{position:relative;aspect-ratio:1/1;background:var(--paper-2);overflow:hidden}
figure.lead .ph img{position:absolute;left:0;top:0;width:100%;height:100%;object-fit:cover;object-position:50% 0;filter:grayscale(1) contrast(1.15);mix-blend-mode:multiply;transform:scale(1.04);transition:transform 1.2s cubic-bezier(.22,1,.36,1)}
figure.lead:hover .ph img{transform:scale(1.08)}
figure.lead .score{display:grid;grid-template-columns:repeat(3,1fr);background:var(--ink);color:var(--paper)}
figure.lead .score div{padding:12px 16px}figure.lead .score div+div{border-left:1px solid rgb(242 237 227/.18)}
figure.lead .score b{display:block;font-family:var(--sans);font-size:26px;font-weight:800;letter-spacing:-.01em;margin-top:2px;font-feature-settings:"tnum"}
figcaption{margin-top:8px;font-family:var(--serif);font-style:italic;font-size:13px;color:var(--ink-3)}
.col h2{font-family:var(--sans);font-weight:800;font-size:12px;letter-spacing:.14em;text-transform:uppercase;padding-bottom:8px;border-bottom:2px solid var(--rule);display:flex;justify-content:space-between}
.agenda li{list-style:none;display:grid;grid-template-columns:48px 1fr;gap:12px;padding:14px 0;border-bottom:1px solid var(--hair)}
.agenda{padding:0}
.agenda .d{font-family:var(--sans);font-weight:800;font-size:30px;line-height:.9;letter-spacing:-.03em;text-align:center}
.agenda .d small{display:block;font-family:var(--mono);font-weight:400;font-size:10px;letter-spacing:.08em;margin-top:5px;color:var(--ink-3);text-transform:uppercase}
.agenda .ev{font-family:var(--sans);font-weight:700;font-size:15px;line-height:1.2}
.agenda .bout{font-family:var(--serif);font-size:15px;color:var(--ink-2);margin-top:3px}
.agenda .bout i{color:var(--ink-3)}
.agenda .meta{margin-top:5px;color:var(--ink-3)}
.belt{display:inline-block;width:14px;height:8px;border:1.5px solid var(--red);border-radius:2px;margin-right:6px;vertical-align:1px}
.second{margin-top:20px;padding-top:14px;border-top:1px solid var(--rule)}
.second h3{font-family:var(--serif);font-weight:700;font-size:26px;line-height:1.05;letter-spacing:-.015em;margin:8px 0}
.second p{font-size:16px;color:var(--ink-2)}
/* Ladder */
.sec{padding:40px 0;border-bottom:1px solid var(--rule)}
.sechead{display:grid;grid-template-columns:auto 1fr auto;gap:20px;align-items:baseline;margin-bottom:22px}
.sechead h2{font-family:var(--serif);font-weight:700;font-size:clamp(34px,3.6vw,54px);letter-spacing:-.025em;line-height:1}
.sechead h2 em{font-weight:400}
.sechead p{font-size:16px;color:var(--ink-2);max-width:56ch;font-style:italic}
.sechead a{font-family:var(--sans);font-weight:700;font-size:13px;border-bottom:1.5px solid var(--ink);padding-bottom:2px}
.split{display:grid;grid-template-columns:minmax(0,1.55fr) minmax(0,1fr);gap:48px}
table.ladder{width:100%;border-collapse:collapse;font-family:var(--sans)}
.ladder th{font-family:var(--mono);font-weight:400;font-size:10.5px;letter-spacing:.08em;text-transform:uppercase;color:var(--ink-3);text-align:left;padding:0 10px 8px;border-bottom:2px solid var(--rule)}
.ladder td{padding:11px 10px;border-bottom:1px solid var(--hair);vertical-align:middle}
.ladder tr{transition:background .2s}.ladder tbody tr:hover{background:var(--paper-2)}
.ladder .rk{font-weight:800;font-size:22px;letter-spacing:-.03em;width:44px;font-feature-settings:"tnum"}
.ladder .who{display:flex;align-items:center;gap:12px}
.ladder .who img{width:40px;height:40px;object-fit:cover;object-position:50% 12%;background:var(--paper-2);filter:grayscale(1) contrast(1.1);mix-blend-mode:multiply;border-radius:50%}
.ladder .nm{font-weight:700;font-size:16px;line-height:1.1}
.ladder .dv{font-family:var(--serif);font-style:italic;font-size:14px;color:var(--ink-3)}
.ladder .rec{font-family:var(--mono);font-size:13px}
.ladder .fcr{font-weight:800;font-size:19px;font-feature-settings:"tnum";text-align:right;width:70px}
.ladder .bar{width:24%}.bar i{display:block;height:4px;background:var(--hair);position:relative}.bar i b{position:absolute;inset:0 auto 0 0;background:var(--ink)}
.up{color:#1d6b43;font-family:var(--mono);font-size:12px}.down{color:var(--red);font-family:var(--mono);font-size:12px}.eq{color:var(--ink-3);font-family:var(--mono);font-size:12px}
.climb{list-style:none;padding:0;margin-top:8px}.climb li{display:flex;justify-content:space-between;padding:9px 0;border-top:1px solid var(--hair);font-family:var(--sans);font-weight:600;font-size:15px}
.method{align-self:start;padding:22px;background:var(--paper-2);border-top:2px solid var(--rule)}
.method h3{font-family:var(--sans);font-size:12px;font-weight:800;letter-spacing:.14em;text-transform:uppercase}
.method p{margin-top:10px;font-size:15.5px;color:var(--ink-2)}
.method .eq2{margin:14px 0;font-family:var(--mono);font-size:13px;line-height:1.7;color:var(--ink)}
/* Results */
.results{columns:2;column-gap:48px;column-rule:1px solid var(--hair)}
.res{break-inside:avoid;padding:14px 0;border-bottom:1px solid var(--hair);display:grid;grid-template-columns:1fr auto;gap:4px 16px}
.res .ev{grid-column:1/-1;color:var(--ink-3)}
.res .w{font-family:var(--sans);font-weight:800;font-size:18px;letter-spacing:-.01em}
.res .l{font-family:var(--serif);font-size:16px;color:var(--ink-2)}
.res .m{text-align:right;font-family:var(--mono);font-size:12.5px;align-self:center;grid-row:2/4;grid-column:2}
.res .m small{display:block;color:var(--ink-3)}
/* Honour roll */
.honor{display:grid;grid-template-columns:1.25fr 1fr;gap:0 48px;border-top:2px solid var(--rule);padding-top:4px}
.hcol h3{padding:12px 0 8px;color:var(--ink-3)}
.hcol a{display:grid;grid-template-columns:56px 1fr auto;align-items:center;gap:2px 16px;padding:8px 0;border-top:1px solid var(--hair);transition:background .2s}
.hcol a:hover{background:var(--paper-2)}
.honor .ph{width:56px;height:56px;background:var(--paper-2);overflow:hidden}
.honor img{width:100%;height:100%;object-fit:cover;object-position:50% 14%;filter:grayscale(1) contrast(1.12);mix-blend-mode:multiply;transition:filter .4s}
.honor a:hover img{filter:none}
.honor .dv{color:var(--red);grid-column:2;grid-row:1;align-self:end}
.hcol .ph{grid-row:1/3}.hcol .nm{grid-column:2;grid-row:2;align-self:start}.hcol .def{grid-column:3;grid-row:1/3}
.honor .nm{font-family:var(--sans);font-weight:800;font-size:18px;letter-spacing:-.01em;line-height:1.1}
.honor .since{display:none}
.honor .def{font-family:var(--sans);font-weight:800;font-size:22px;text-align:right;font-feature-settings:"tnum";padding-right:8px}.honor .def small{font-family:var(--mono);font-weight:400;font-size:10px;color:var(--ink-3);margin-left:4px;letter-spacing:.06em}
.others{margin-top:28px;padding:20px;background:var(--ink);color:var(--paper)}.others h3{color:#b9b1a3}.others p{margin:8px 0 14px;font-size:15.5px}.others a{font-family:var(--sans);font-weight:700;font-size:13px;border-bottom:1.5px solid var(--ember)}
footer{padding:36px 0 120px;display:grid;grid-template-columns:1fr 1fr;gap:48px;font-size:14px;color:var(--ink-2)}
footer ol{padding-left:18px}footer li{margin:4px 0}
footer .mono{color:var(--ink-3)}
.tabbar{display:none}
/* Responsive */
@media (max-width:1080px){.front{grid-template-columns:1fr}.front>.c3{border-left:0;padding:28px 0 0;margin-top:28px;border-top:1px solid var(--rule)}.split{grid-template-columns:1fr}}
@media (max-width:720px){
 body{font-size:16px}.top .hide{display:none}
 .mast{grid-template-columns:1fr;justify-items:center;padding:18px 0 12px;gap:6px}.mast .l,.mast .r{display:none}
 .name{font-size:clamp(34px,11vw,52px)}
 nav.sections{justify-content:flex-start;overflow-x:auto;scrollbar-width:none;gap:20px;margin:0 calc(var(--g)*-1);padding:12px var(--g)}nav.sections a{white-space:nowrap}
 .front{padding-top:20px}.front>*{padding:0!important;border-left:0!important}
 .leadbody{grid-template-columns:1fr;gap:18px}.copy{border:0;padding:0}figure.lead{margin:0 calc(var(--g)*-1)}figcaption{padding:0 var(--g)}
 .ladder td{padding:10px 6px}.ladder .rec{white-space:nowrap;font-size:12px}.ladder .who img{width:34px;height:34px}.ladder .nm{font-size:15px}.ladder .rk{width:30px;font-size:19px}
 h1.hl{font-size:40px}.deck{font-size:18px}
 .results{columns:1}.sechead{grid-template-columns:1fr}.sechead p{display:none}
 .ladder .bar,.ladder .dvcol,.ladder th.bar{display:none}
 .honor{grid-template-columns:1fr}.hcol a{gap:2px 12px;grid-template-columns:48px 1fr auto}.hcol .ph{width:48px;height:48px}.hcol .nm{font-size:16px}
 footer{grid-template-columns:1fr}
 .tabbar{display:grid;grid-template-columns:repeat(5,1fr);position:fixed;left:0;right:0;bottom:0;background:var(--paper);border-top:2px solid var(--rule);padding:8px 4px calc(8px + env(safe-area-inset-bottom));font-family:var(--sans);font-size:11px;font-weight:600;text-align:center}
 .tabbar a{display:grid;gap:3px;justify-items:center;color:var(--ink-2)}.tabbar a[aria-current]{color:var(--ink)}
 .tabbar svg{width:20px;height:20px}
 .tabbar a[aria-current]::before{content:"";width:18px;height:2px;background:var(--red);margin-bottom:2px}
}
</style></head><body>
<div class="wrap">
 <div class="top mono"><span>${dowL(TODAY)} ${long(TODAY)}</span><span class="hide">Datos al ${short("2026-11-16")} · UFC y 13 organizaciones más</span><span>Semana 47</span></div>
 <header class="mast">
  <div class="l">El MMA en datos,<br>con fuentes a pie de página.</div>
  <a class="name" href="#">${mark("#16130f", "#ec6528")}FIGHTCORE</a>
  <div class="r">Rankings por rating propio.<br>Sin fotos sin licencia.</div>
 </header>
 <nav class="sections"><a href="#" aria-current="page">Portada</a><a href="#">Luchadores</a><a href="#">Clasificaciones</a><a href="#">Campeones</a><a href="#">Eventos</a><a href="#">Comparar</a><a href="#">Historia</a><span class="search">⌕ Buscar</span></nav>

 <section class="front">
  <article class="lead-story">
   <div class="kicker">Peso pesado · UFC 334 · ${short(lead.date)}</div>
   <h1 class="hl">${lw.last}, campeón del peso pesado. <em>${ll.last} cae a los puntos tras cinco asaltos.</em></h1>
   <div class="leadbody">
    <figure class="lead"><div class="ph"><img src="${photo(lw.photo)}" alt="Retrato de ${lw.name}"></div>
     <div class="score"><div class="mono">FCR<b>${num(lw.rating)}</b></div><div class="mono">P4P<b>nº ${ganeP4P.rank}</b></div><div class="mono">Récord<b>${lw.rec}</b></div></div>
     <figcaption>${lw.name}. Retrato oficial © UFC, vía ESPN.</figcaption>
    </figure>
    <div class="copy">
     <p class="deck"><b>${lw.name}</b> venció a ${ll.name} por ${method(lead.method)} tras ${lead.round} asaltos el ${long(lead.date).replace(" de 2026", "")}${fn(1)} y lleva el cinturón del peso pesado. En la clasificación libra por libra de FIGHTCORE sube ${ganeP4P.d} puestos, hasta el <b>nº ${ganeP4P.rank}</b> (FCR ${num(ganeP4P.rating)})${fn(4)}.</p>
     <div class="byline mono"><span>Récord ${lw.rec}</span><a href="#">Ficha del combate →</a></div>
     <div class="second">
      <div class="kicker">Gallo femenino · UFC 334</div>
      <h3>${sw.last} somete a ${sl.last} en el cuarto asalto</h3>
      <p>${sw.name} cerró el combate por ${method(second.method)} a los ${clock(second.time)} del asalto ${second.round}${fn(1)} y suma ${harr.def === 1 ? "su primera defensa" : `${harr.def} defensas`} del título.</p>
     </div>
     <div class="second">
      <div class="kicker">Peso pesado · PFL Dubái</div>
      <h3>${winLose(D.results[1])[0].last} gana a ${winLose(D.results[1])[1].last} a cinco asaltos</h3>
      <p>Combate por el título, resuelto por ${method(D.results[1].method)}${fn(2)}.</p>
     </div>
    </div>
   </div>
  </article>
  <aside class="c3 col">
   <h2><span>Agenda</span><span class="mono" style="font-weight:400;letter-spacing:.06em">Próximos 3 semanas</span></h2>
   <ul class="agenda">
   ${D.upcoming.map((e) => `<li><div class="d">${day(e.date)}<small>${mon(e.date)}</small></div><div><div class="ev">${esc(e.name.replace(/:.*/, ""))}</div><div class="bout">${e.main.title ? '<span class="belt" title="Por el título"></span>' : ""}${e.main.red.last} <i>v</i> ${e.main.blue.last}</div><div class="meta mono">${e.org} · ${e.city} · ${e.n} combates</div></div></li>`).join("")}
   </ul>
  </aside>
 </section>

 <section class="sec">
  <div class="sechead"><h2>Libra por libra <em>· masculino</em></h2><p>Ordenado por el FIGHTCORE Rating: resultados, nivel de los rivales y actividad. Movimiento respecto a hace 120 días.</p><a href="#">Todas las divisiones</a></div>
  <div class="split">
   <table class="ladder"><thead><tr><th>Nº</th><th></th><th>Luchador</th><th>Récord</th><th class="bar">Escala 80–100</th><th style="text-align:right">FCR</th></tr></thead><tbody>
   ${D.p4p.map((r) => `<tr><td class="rk">${r.rank}</td><td>${mv(r)}</td><td><div class="who"><img src="${photo(r.f.photo)}" alt=""><div><div class="nm">${r.f.name}</div><div class="dv">${r.f.div}</div></div></div></td><td class="rec">${r.f.rec}</td><td class="bar"><i><b style="width:${((r.rating - 80) / 20) * 100}%"></b></i></td><td class="fcr">${num(r.rating)}</td></tr>`).join("")}
   </tbody></table>
   <aside class="method">
    <h3>Cómo se calcula</h3>
    <p>El FCR parte de 50 y se mueve con cada combate según el resultado, el método y la fuerza del rival en ese momento. Un combate mueve como mucho 3 puntos.</p>
    <p class="eq2">FCR = 50 + compuesto / 2<br>acierto histórico: 61,7 %<br>sobre 6.240 combates</p>
    <p>Cada cifra enlaza a su fuente. Nada se rellena a mano.</p>
    <h3 style="margin-top:22px">Mayores subidas · 120 días</h3>
    <ul class="climb">${D.p4p.filter((r) => r.mv === "up").sort((a, b) => b.d - a.d).slice(0, 3).map((r) => `<li><span>${r.f.name}</span><span class="up">▲${r.d} → nº ${r.rank}</span></li>`).join("")}</ul>
   </aside>
  </div>
 </section>

 <section class="sec">
  <div class="sechead"><h2>Resultados <em>· última semana</em></h2><p>Combates estelares y por el título de UFC, PFL, ONE y RIZIN.</p><a href="#">Todos los eventos</a></div>
  <div class="results">
  ${D.results.map((r) => { const [w, l] = winLose(r); return `<div class="res"><div class="ev mono">${short(r.date)} · ${r.org} · ${esc(r.event.replace(/:.*/, ""))}${r.title ? " · título" : ""}</div><div class="w">${w.name}</div><div class="l">derrota a ${l.name}</div><div class="m">${methodShort(r.method)}<small>R${r.round} · ${clock(r.time)}</small></div></div>`; }).join("")}
  </div>
 </section>

 <section class="sec">
  <div class="sechead"><h2>Cuadro de honor <em>· UFC</em></h2><p>Campeones vigentes por división, con la fecha en que ganaron el cinturón.</p><a href="#">ONE, PFL, KSW, RIZIN…</a></div>
  <div class="honor">
   ${[["Masculino", ufcChamps.filter((c) => !/fem/.test(c.div))], ["Femenino", ufcChamps.filter((c) => /fem/.test(c.div))]].map(([t, list], i) => `${i ? '<div>' : ""}<div class="hcol"><h3 class="mono">${t}</h3>${list.map((c) => `<a href="#"><div class="ph"><img src="${photo(c.f.photo)}" alt=""></div><div class="dv mono">${divShort(c.div)}</div><div class="nm">${c.f.name}</div><div class="since">desde el ${short(c.since)} ${c.since.slice(0, 4)}</div><div class="def">${c.def}<small>def.</small></div></a>`).join("")}</div>`).join("")}
   <aside class="others"><h3 class="mono">Otras organizaciones</h3><p>Los cinturones de ONE, PFL, KSW, RIZIN, LFA y otras ligas se reconstruyen combate a combate a partir de los resultados publicados.</p><a href="#">Ver todos los campeones →</a></aside></div>
  </div>
 </section>

 <footer>
  <div><p class="mono">Fuentes</p><ol id="srcs"><li id="src-1">UFCStats — resultados y estadísticas de la UFC.</li><li id="src-2">ESPN — eventos de PFL, ONE y otras.</li><li id="src-3">Wikipedia / Wikidata — fechas de nacimiento, ONE, KSW y RIZIN.</li><li id="src-4">FIGHTCORE Rating v0.3 — metodología pública.</li></ol></div>
  <div><p class="mono">Aviso</p><p>FIGHTCORE es un proyecto independiente. No está afiliado a UFC, PFL, ONE ni a ninguna otra organización. Retratos oficiales © UFC vía ESPN.</p></div>
 </footer>
</div>
<nav class="tabbar"><a href="#" aria-current="page"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 5h16M4 10h16M4 15h10M4 20h10"/></svg>Portada</a><a href="#"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></svg>Luchadores</a><a href="#"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/></svg>Buscar</a><a href="#"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M5 20V10M12 20V4M19 20v-7"/></svg>Rankings</a><a href="#"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="5" width="18" height="15"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>Eventos</a></nav>
</body></html>`;
write("a-almanaque", html);
