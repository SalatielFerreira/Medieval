'use strict';
// Tribunal e leis (Reinado → ⚖️ Leis e tribunal): o rei cria leis e julga casos na sala do trono.
//  • Leis: até 5 em vigor. Cada uma agrada uns grupos e irrita outros (nobreza, clero, povo, mercadores, guildas,
//    submundo), mexe na felicidade, no tesouro e na lealdade das famílias desses grupos; algumas mudam o jogo
//    (o vinho fica mais caro, as feiras mais baratas, os duelos viram crime, os crimes diminuem).
//  • Tribunal: todo mês chegam casos com provas mais ou menos fortes. Absolver, multar, prender, exilar, enforcar ou,
//    com a lei, o julgamento por combate. Condenar um inocente ou soltar um culpado mexe com a fama de justo do rei,
//    e às vezes a verdade aparece depois.

const LAW_MAX = 5;
const LAWS = {
  duelos:   { name: 'Proibir os duelos', icon: '🚫', desc: 'Duelos de honra viram crime no reino.', g: { clero: 1, povo: 0.5, nobreza: -1.5 }, happy: 0.3, crime: -0.05 },
  vinho:    { name: 'Imposto sobre o vinho', icon: '🍷', desc: 'Vinho, cerveja e hidromel pagam imposto: +20% no preço e mais ouro no tesouro.', g: { povo: -1, mercadores: -1 }, income: 0.18, happy: -0.4 },
  culto:    { name: 'Liberdade de culto', icon: '🕊️', desc: 'Cada um reza para o deus que quiser.', g: { clero: -1.5, povo: 0.8, mercadores: 0.5 }, happy: 0.6 },
  recolher: { name: 'Toque de recolher', icon: '🌙', desc: 'Ninguém na rua depois do anoitecer: bem menos crimes.', g: { povo: -1, submundo: -2, mercadores: -0.5 }, crime: -0.35, happy: -0.5 },
  armas:    { name: 'Proibir o porte de armas', icon: '🗡️', desc: 'Só soldados andam armados: menos brigas e roubos.', g: { nobreza: -1, submundo: -1.5, povo: 0.3 }, crime: -0.2 },
  feira:    { name: 'Feira livre', icon: '🎪', desc: 'Sem taxas nas feiras: compras 10% mais baratas no reino, menos ouro no tesouro.', g: { mercadores: 2, guildas: -1 }, income: -0.06 },
  escola:   { name: 'Escola para todos', icon: '📚', desc: 'O reino paga mestres para as crianças.', g: { povo: 1.2, clero: 0.5 }, income: -0.08, happy: 0.8 },
  caca:     { name: 'Caça real', icon: '🦌', desc: 'As florestas são do rei: caçar sem licença dá multa.', g: { nobreza: 1.2, povo: -1 }, income: 0.04 },
  divida:   { name: 'Fim da prisão por dívida', icon: '⛓️', desc: 'Quem deve não vai mais preso.', g: { povo: 1.5, mercadores: -1.5 }, happy: 0.5 },
  combate:  { name: 'Julgamento por combate', icon: '⚔️', desc: 'O acusado pode provar a inocência na espada.', g: { nobreza: 1, clero: -1 } },
};
const CRIMES = [
  ['roubo', 'roubou a loja de', 'mercadores', 'grave'], ['briga', 'espancou', 'povo', 'leve'], ['contrabando', 'contrabandeou sal e vinho de', 'mercadores', 'leve'],
  ['heresia', 'pregou contra a fé diante de', 'clero', 'leve'], ['caça', 'caçou na floresta do rei, denunciado por', 'nobreza', 'leve'], ['dívida', 'não pagou o que devia a', 'mercadores', 'leve'],
  ['morte', 'matou o cavalo e ameaçou a família de', 'povo', 'grave'], ['furto', 'furtou galinhas de', 'povo', 'leve'], ['incêndio', 'pôs fogo no celeiro de', 'povo', 'grave'],
];
const VERDICTS = [['absolver', '🕊️ Absolver'], ['multa', '💰 Multa (60 🪙)'], ['prisao', '⛓️ Prisão (6 meses)'], ['exilio', '🚪 Exílio'], ['forca', '🪢 Forca'], ['combate', '⚔️ Julgamento por combate']];

const Laws = {
  L() { const u = G.urban || (G.urban = {}); return u.law || (u.law = { active: [], cases: [], justice: 0, log: [], wrong: [], since: {} }); },
  has(k) { return this.L().active.includes(k); },
  // vale nas terras de um reino seu
  inForce(k, ci) { return this.has(k) && G.civs[ci] && G.civs[ci].ruler === 'player'; },
  log(t) { const L = this.L().log; L.unshift({ day: G.day, t }); if (L.length > 16) L.length = 16; },
  rep(g, n) { if (typeof Society !== 'undefined') Society.rep(g, n); },
  famGroup(f) { const h = Families.head(f); return h && typeof Society !== 'undefined' ? Society.groupOf(h) : 'povo'; },
  enact(k) {
    const L = this.L(), d = LAWS[k]; if (!d || this.has(k)) return;
    if (L.active.length >= LAW_MAX) { UI.msg(`No máximo ${LAW_MAX} leis ao mesmo tempo: revogue uma antes.`, 'bad'); return; }
    if ((L.since[k] || -9) > G.day - 2) { UI.msg('Essa lei acabou de mudar: espere um pouco.', 'bad'); return; }
    L.active.push(k); L.since[k] = G.day;
    for (const [g, n] of Object.entries(d.g)) this.rep(g, n * 3);
    this.log(`📜 Lei nova: ${d.name}.`); UI.msg(`📜 ${d.icon} ${d.name} agora é lei no reino.`, 'gold');
    if (Reign.chron) Reign.chron(`📜 Decretou a lei: ${d.name}.`);
  },
  revoke(k) {
    const L = this.L(), d = LAWS[k]; if (!this.has(k)) return;
    L.active = L.active.filter(x => x !== k); L.since[k] = G.day;
    for (const [g, n] of Object.entries(d.g)) this.rep(g, -n * 2);
    this.log(`🗑️ Revogou: ${d.name}.`); UI.msg(`🗑️ ${d.name} deixou de valer.`);
  },
  // ---------------------------------------------------------------- todo mês
  monthTick() {
    const L = this.L(), ruled = G.civs.filter(c => c.ruler === 'player' && !c.anarchy);
    if (!ruled.length) { L.cases = []; return; }
    for (const k of L.active) {
      const d = LAWS[k];
      for (const [g, n] of Object.entries(d.g)) this.rep(g, n * 0.6);
      for (const c of ruled) { if (d.happy) c.happy = U.clamp(c.happy + d.happy, 0, 100); if (d.income) c.treasury = Math.max(0, c.treasury + Math.round(c.pop * d.income)); }
      for (const f of Object.values(Families.F())) if (!f.player && ruled.some(c => c.id === f.civ)) { const n = d.g[this.famGroup(f)]; if (n) f.loyalty = U.clamp(f.loyalty + n * 1.2, 0, 100); }
    }
    // a fama de justo do rei
    if (L.justice) { this.rep('povo', L.justice / 25); for (const c of ruled) c.happy = U.clamp(c.happy + L.justice / 40, 0, 100); }
    // a verdade às vezes aparece
    for (const w of L.wrong.slice()) if (Math.random() < 0.25) { L.wrong = L.wrong.filter(x => x !== w); L.justice -= 3; this.rep('povo', -2); this.log(`😔 Descobriu-se que ${w.name} era inocente.`); UI.msg(`😔 Descobriu-se que ${w.name}, que você condenou, era inocente. O povo murmura.`, 'bad', true); }
    // casos novos
    const crime = Math.max(0.2, 1 + L.active.reduce((a, k) => a + (LAWS[k].crime || 0), 0));
    let n = (Math.random() < 0.7 * crime ? 1 : 0) + (Math.random() < 0.35 * crime ? 1 : 0);
    while (n-- > 0 && L.cases.length < 5) this.newCase(ruled);
    // casos esquecidos: o povo perde a confiança
    for (const cs of L.cases.slice()) if (G.day - cs.day >= 3) { L.cases = L.cases.filter(x => x !== cs); L.justice -= 1; this.log(`⌛ O caso de ${cs.name} ficou sem julgamento.`); }
  },
  newCase(ruled) {
    const vis = World.villages.map((v, i) => i).filter(i => !World.villages[i].free && ruled.some(c => c.id === World.villages[i].civ));
    if (!vis.length) return;
    const vi = U.pick(vis), R = People.residents(vi).filter(p => p.age >= 16 && !p.capanga && !p.kin);
    if (R.length < 2) return;
    const a = U.pick(R), b = U.pick(R.filter(p => p !== a)), C = U.pick(CRIMES), ev = U.rint(15, 95);
    this.L().cases.push({ id: G.day * 100 + U.rint(0, 99), pid: a.id, name: People.full(a), vid: b.id, victim: People.full(b), vi, crime: C[0], text: `${C[1]} ${b.name}`, g: C[2], grave: C[3] === 'grave', ev, wit: Math.round(ev / 25), guilty: Math.random() < ev / 100, day: G.day, fam: a.fam });
  },
  judge(id, v) {
    const L = this.L(), cs = L.cases.find(x => x.id === id); if (!cs) return;
    if (v === 'combate' && !this.has('combate')) return;
    const p = G.people[cs.pid], f = Families.get(cs.fam), victim = G.people[cs.vid];
    L.cases = L.cases.filter(x => x !== cs);
    const fam = n => { if (f && !f.player) f.loyalty = U.clamp(f.loyalty + n, 0, 100); };
    let txt = '';
    if (v === 'combate') {
      const win = Math.random() < (cs.guilty ? 0.3 : 0.7);
      if (win) { v = 'absolver'; txt = `⚔️ ${cs.name} venceu o campeão do rei: Deus mostrou a inocência.`; } else { if (p && p.alive) People.die(p, 'no julgamento por combate'); txt = `⚔️ ${cs.name} caiu no julgamento por combate.`; this.rep('nobreza', 1); this.log(txt); UI.msg(txt, 'gold', true); L.justice += cs.guilty ? 2 : -3; return; }
    }
    if (v === 'absolver') {
      if (cs.guilty) { L.justice -= 2; this.rep(cs.g, -1.5); if (victim) People.addAff(victim, -10); } else { L.justice += 2; fam(5); }
      txt = txt || `🕊️ ${cs.name} foi absolvido(a).`;
    } else {
      const sev = { multa: 1, prisao: 2, exilio: 3, forca: 4 }[v];
      if (v === 'multa') { const c = G.civs[World.villages[cs.vi].civ]; if (c) c.treasury += 60; if (p) p.purse = Math.max(0, People.purse(p) - 60); }
      if (v === 'prisao' && p) p.jail = G.day + 6;
      if (v === 'exilio' && p) { p.home = { type: 'wild' }; p.shop = null; People.addAff(p, -40); }
      if (v === 'forca' && p && p.alive) { People.die(p, 'enforcado por ordem do rei'); this.rep('clero', -1); }
      if (cs.guilty) { L.justice += sev >= 3 && !cs.grave ? 0 : 2; this.rep(cs.g, 1 + sev * 0.3); if (sev >= 3 && !cs.grave) { this.rep('povo', -1); fam(-10); } else fam(-4 * sev); }
      else { L.justice -= 1 + sev; fam(-8 * sev); this.rep(p ? (typeof Society !== 'undefined' ? Society.groupOf(p) : 'povo') : 'povo', -sev * 0.7); L.wrong.push({ name: cs.name, day: G.day }); }
      txt = { multa: `💰 ${cs.name} pagou multa.`, prisao: `⛓️ ${cs.name} foi para a prisão.`, exilio: `🚪 ${cs.name} foi exilado(a).`, forca: `🪢 ${cs.name} foi enforcado(a).` }[v];
    }
    L.justice = U.clamp(L.justice, -50, 50);
    this.log(txt); UI.msg(txt, 'gold');
  },
  justiceName() { const j = this.L().justice; return j >= 25 ? 'Justo' : j >= 8 ? 'Correto' : j > -8 ? 'Comum' : j > -25 ? 'Duvidoso' : 'Tirano'; },
  // ---------------------------------------------------------------- a página
  page() {
    const L = this.L(), esc = UI.esc.bind(UI);
    const chip = d => Object.entries(d.g).map(([g, n]) => `<i class="${n > 0 ? 'ok' : 'bad'}">${SOC_GROUPS[g] ? SOC_GROUPS[g].icon : ''} ${n > 0 ? '+' : '−'}</i>`).join('') + (d.income ? `<i class="${d.income > 0 ? 'ok' : 'bad'}">🪙 ${d.income > 0 ? '+' : '−'}</i>` : '') + (d.happy ? `<i class="${d.happy > 0 ? 'ok' : 'bad'}">😊 ${d.happy > 0 ? '+' : '−'}</i>` : '') + (d.crime ? '<i class="ok">🛡️ menos crimes</i>' : '');
    const cases = L.cases.map(cs => `<div class="card law-case ${cs.grave ? 'grave' : ''}"><div class="sec">⚖️ ${esc(cs.crime)} <span>${esc(World.villages[cs.vi] ? World.villages[cs.vi].name : '')} · espera desde ${Calendar.short(cs.day)}</span></div>
        <p><b>${esc(cs.name)}</b> é acusado(a) de que ${esc(cs.text)}. Acusação de <b>${esc(cs.victim)}</b>.</p>
        <div class="law-ev"><span>Provas</span><i class="pbar"><i style="width:${cs.ev}%"></i></i><b>${cs.ev}%</b><small>${cs.wit} testemunha(s) · ${cs.ev >= 70 ? 'provas fortes' : cs.ev >= 40 ? 'provas duvidosas' : 'quase nada contra'}</small></div>
        <div class="act-row">${VERDICTS.filter(([k]) => k !== 'combate' || this.has('combate')).map(([k, l]) => `<button class="${k === 'forca' ? 'danger' : ''}" data-act="lawJudge" data-i="${cs.id}" data-v="${k}">${l}</button>`).join('')}</div></div>`).join('');
    return `<div class="card law-top"><div class="sec">⚖️ A sua fama de juiz: <b>${this.justiceName()}</b> <span>${L.justice > 0 ? '+' : ''}${L.justice}</span></div><p class="dt-desc">Condenar culpados e absolver inocentes deixa o povo confiante (felicidade e reputação). Errar o contrário, ou deixar casos esperando mais de 3 meses, faz o povo murmurar.</p></div>
      <div class="sec" style="margin:8px 2px">🏛️ Tribunal <span>${L.cases.length} caso(s)</span></div>${cases || '<div class="card"><p class="muted">Nenhum caso esperando julgamento. Novos casos chegam todo mês.</p></div>'}
      <div class="sec" style="margin:12px 2px 6px">📜 Leis em vigor <span>${L.active.length}/${LAW_MAX}</span></div>
      <div class="law-grid">${Object.entries(LAWS).map(([k, d]) => `<div class="card law ${this.has(k) ? 'on' : ''}"><div class="sec">${d.icon} ${esc(d.name)}</div><p class="dt-desc">${esc(d.desc)}</p><div class="law-g">${chip(d)}</div>
        ${this.has(k) ? `<button data-act="lawRevoke" data-k="${k}">🗑️ Revogar</button>` : `<button class="primary" data-act="lawEnact" data-k="${k}" ${L.active.length >= LAW_MAX ? 'disabled' : ''}>📜 Decretar</button>`}</div>`).join('')}</div>
      ${L.log.length ? `<div class="card"><div class="sec">📒 Decisões</div>${L.log.slice(0, 8).map(l => `<div class="bank-log"><small>${Calendar.short(l.day)}</small> ${esc(l.t)}</div>`).join('')}</div>` : ''}`;
  },
};

{
  // a aba Leis e tribunal no Reinado
  const sh0 = Reign.show.bind(Reign);
  Reign.show = function (tab) {
    const t = tab || UI.sel.rgTab || 'council';
    let a = null; const op = UI.open; UI.open = (...x) => { a = x; };
    try { sh0(t === 'law' ? 'council' : tab); } finally { UI.open = op; }
    if (!a) return;
    let b = a[1].replace(/(<div class="tabs">)/, '$1').replace(/(<button[^>]*data-act="rgTab" data-t="council"[^>]*>)/, `<button class="${t === 'law' ? 'on' : ''}" data-act="rgTab" data-t="law">⚖️ Leis e tribunal${Laws.L().cases.length ? ` (${Laws.L().cases.length})` : ''}</button>$1`);
    if (t === 'law') { UI.sel.rgTab = 'law'; b = b.replace(/(<button[^>]*) class="on"([^>]*data-t="council")/, '$1 class=""$2'); const i = b.indexOf('<div class="tabs">'), j = b.indexOf('</div>', i) + 6; b = b.slice(0, j) + Laws.page(); }
    return UI.open(a[0], b, a[2], [t], a[4]);
  };
  // efeitos das leis no jogo
  const pr0 = Game.price.bind(Game);
  Game.price = function (ci, k) {
    const r = pr0(ci, k);
    if (Laws.inForce('vinho', ci) && ['wine', 'ale', 'mead', 'beer', 'aged_wine'].includes(k)) r.buy = Math.round(r.buy * 1.2);
    if (Laws.inForce('feira', ci)) r.buy = Math.max(1, Math.round(r.buy * 0.9));
    return r;
  };
  if (typeof Society !== 'undefined') {
    const sd0 = Society.startDuel.bind(Society);
    Society.startDuel = function (p) {
      const tx = Math.floor(P.x / TILE), ty = Math.floor(P.y / TILE), ci = World.inb(tx, ty) ? World.terr[World.idx(tx, ty)] : -1;
      if (Laws.inForce('duelos', ci)) { UI.msg('🚫 Os duelos são proibidos no seu reino (a sua própria lei).', 'bad'); this.challengeFromPlayer = false; return; }
      return sd0(p);
    };
  }
  const mt0 = Lifesim.monthTick.bind(Lifesim);
  Lifesim.monthTick = function () { mt0(); Laws.monthTick(); };
  const a0 = UI.act.bind(UI);
  UI.act = function (a, d) {
    if (a === 'lawEnact') { Laws.enact(d.k); Reign.show('law'); return; }
    if (a === 'lawRevoke') { Laws.revoke(d.k); Reign.show('law'); return; }
    if (a === 'lawJudge') { Laws.judge(+d.i, d.v); Reign.show('law'); return; }
    return a0(a, d);
  };
}
