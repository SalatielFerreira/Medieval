'use strict';
// Reinado (Portfólio → 👑 Reinado): governar pessoas e decisões, não só números.
//  • Conselho real: tesoureiro, general, sacerdote e mestre espião trazem um dilema por mês; cada um tem lealdade e
//    ambição, e o desleal e ambicioso trama contra você.
//  • Audiências: súditos de todos os grupos pedem justiça, favores e terras ou acusam alguém.
//  • Vassalos e feudos: vilas entregues a nobres pagam tributo e mandam soldados; barões insatisfeitos se revoltam.
//  • Espionagem e complôs: espiões nos outros reinos (informações, sabotagem, roubo, assassinato) e complôs contra você.
//  • Herdeiros: tutor de guerra, diplomacia, administração ou fé; filhos preteridos guardam rancor.
//  • Diplomacia: tratados (comércio, não agressão, livre passagem), reinos vassalos com tributo, reféns e casamentos
//    reais com direito ao trono do outro reino.
//  • Economia de Estado: orçamento por área, cunhagem (desvalorizar dá ouro e traz inflação) e alfândega.
//  • Exército: generais com traços, moral, treinamento e deserção.
//  • Corte e legado: bailes, torneios reais, bobo da corte, o castelo crescendo em níveis, títulos de Alto Rei e
//    Imperador e a crônica do reinado.

const ROYAL_COUNCIL = {
  treasurer: { name: 'Tesoureiro', f: 'Tesoureira', icon: '💰', ranks: ['merchant', 'trader'] },
  general:   { name: 'General', f: 'Generala', icon: '⚔️', ranks: ['knight', 'sergeant', 'soldier'] },
  priest:    { name: 'Sacerdote', f: 'Sacerdotisa', icon: '⛪', ranks: ['priest'] },
  spy:       { name: 'Mestre Espião', f: 'Mestra Espiã', icon: '🗡️', ranks: ['wanderer', 'mercenary', 'hunter'] },
};
const GEN_TRAITS = { agressivo: ['Agressivo', '+10% de dano'], defensor: ['Defensor', '+12% de vida'], estrategista: ['Estrategista', '+2 catapultas de graça'], veterano: ['Veterano', '+15 de moral'] };
const TUTORS = { guerra: ['⚔️', 'Guerra', 'força e liderança: vira general'], diplomacia: ['🤝', 'Diplomacia', 'adulto, melhora as relações com todos os reinos'], admin: ['💰', 'Administração', 'adulto, aumenta a renda do reino em 3%'], fe: ['⛪', 'Fé', 'adulto, agrada o clero todo mês'] };
const CASTLE_LV = [null, null, { stone_block: 60, gold: 400 }, { stone_block: 100, marble_block: 20, gold: 800 }, { marble_block: 40, glass: 20, gold: 1500 }, { marble_block: 80, gold_bar: 10, gold: 3000 }];

const Reign = {
  R() { G.urban = G.urban || {}; return G.urban.reign || (G.urban.reign = { council: {}, dilemma: null, aud: [], fiefs: {}, spies: {}, plots: [], tutors: {}, heir: null, treaties: [], hostages: [], claims: {}, budget: { army: 1, court: 1, works: 1, church: 1 }, debase: 0, inflUntil: 0, customs: 0, army: { morale: 60, training: 30 }, generals: [], court: { jester: false, ball: -9, tourney: -9, castle: {} }, chron: [], title: 0, debt: 0 }); },
  realms() { return G.civs.filter(c => c.ruler === 'player'); },
  main() { const m = G.mainRealm; return (m !== undefined && m !== null && G.civs[m] && G.civs[m].ruler === 'player') ? G.civs[m] : this.realms()[0] || null; },
  isKing() { return this.realms().length > 0; },
  chron(t) { const L = this.R().chron; L.unshift({ d: G.day, t }); if (L.length > 60) L.length = 60; },
  rep(g, n) { if (typeof Society !== 'undefined') Society.rep(g, n); },
  vOf(p) { return p && p.home && p.home.type === 'village' ? World.villages[p.home.idx] : null; },
  inRealm(p) { const v = this.vOf(p), cs = this.realms().map(c => c.id); return v ? cs.includes(v.civ) : p.home && p.home.type === 'castle' && cs.includes(p.home.civ); },
  subjects() { return G.people.filter(p => p.alive && p.age >= 18 && !p.kin && !p.capanga && this.inRealm(p)); },
  // ---------------------------------------------------------------- conselho
  member(k) { const id = this.R().council[k]; const p = id !== undefined ? G.people[id] : null; return p && p.alive ? p : null; },
  fillCouncil() {
    const R = this.R(), sub = this.subjects();
    for (const [k, d] of Object.entries(ROYAL_COUNCIL)) {
      if (this.member(k)) continue;
      let p = sub.filter(q => d.ranks.includes(q.rank) && !Object.values(R.council).includes(q.id)).sort((a, b) => b.age - a.age)[0];
      if (!p) { const c = this.main(); p = People.create({ rank: d.ranks[0], civ: c.id, home: { type: 'castle', civ: c.id }, age: U.rint(32, 58) }); }
      p.loyal = p.loyal !== undefined ? p.loyal : U.rint(45, 75); p.amb = p.amb !== undefined ? p.amb : U.rint(10, 85);
      R.council[k] = p.id;
    }
  },
  appoint(k, pid) { const p = G.people[pid]; if (!p) return; const old = this.member(k); if (old) { People.addAff(old, -15); old.loyal = 10; } p.loyal = U.rint(55, 80); p.amb = p.amb !== undefined ? p.amb : U.rint(10, 80); this.R().council[k] = p.id; People.addAff(p, 10); UI.msg(`👑 ${People.full(p)} é ${ROYAL_COUNCIL[k].name.toLowerCase()} do reino.`, 'gold'); },
  DILEMMAS: [
    { id: 'colheita', who: 'treasurer', t: 'A colheita falhou em parte do reino. O que fazemos com os celeiros reais?', o: [['Abrir os celeiros ao povo', c => { c.treasury -= 120; c.happy = Math.min(100, c.happy + 8); Reign.rep('povo', 5); return 'O povo agradece de joelhos.'; }], ['Vender o trigo caro', c => { c.treasury += 200; c.happy -= 8; Reign.rep('povo', -6); Reign.rep('mercadores', 3); return 'O tesouro encheu; nas vilas, resmungos.'; }]] },
    { id: 'terras', who: 'priest', t: 'O bispo pede terras da coroa para um mosteiro.', o: [['Doar as terras', c => { c.treasury -= 120; Reign.rep('clero', 8); Reign.rep('nobreza', -3); G.piety = (G.piety || 0) + 5; return 'O clero canta o seu nome.'; }], ['Recusar', c => { Reign.rep('clero', -6); return 'O bispo sai calado e ressentido.'; }]] },
    { id: 'soldo', who: 'general', t: 'Os soldados pedem aumento de soldo.', o: [['Pagar o aumento', c => { c.treasury -= 100; Reign.R().army.morale += 15; return 'A tropa vibra.'; }], ['Negar', c => { Reign.R().army.morale -= 15; return 'A tropa murmura nos quartéis.'; }], ['Punir os cabeças', c => { Reign.R().army.morale -= 5; Reign.R().army.training += 5; Reign.rep('povo', -2); return 'A ordem voltou, à força.'; }]] },
    { id: 'espiao', who: 'spy', t: 'Capturamos um espião estrangeiro na capital.', o: [['Executar', c => { const o = Reign.rivalCiv(c); if (o >= 0) Game.addRelation(o, -10); Reign.rep('nobreza', 2); return 'Um aviso aos outros reinos.'; }], ['Trocar por ouro', c => { c.treasury += 120; return 'O outro reino pagou caro para tê-lo de volta.'; }], ['Virar agente duplo', c => { const o = Reign.rivalCiv(c); if (o >= 0) Reign.R().spies[o] = { since: G.day }; return 'Agora ele trabalha para nós.'; }]] },
    { id: 'emprestimo', who: 'treasurer', t: 'Banqueiros oferecem um empréstimo à coroa.', o: [['Aceitar 400 🪙 (devolve 480)', c => { c.treasury += 400; Reign.R().debt += 480; Reign.rep('mercadores', 3); return 'O tesouro respira.'; }], ['Recusar', c => 'Nada de dívidas.']] },
    { id: 'bandidos', who: 'general', t: 'Bandidos atacam aldeias na fronteira.', o: [['Mandar tropas', c => { c.garrison = Math.max(0, c.garrison - 2); c.happy = Math.min(100, c.happy + 5); Court.addFame(2); return 'Os bandidos foram caçados.'; }], ['Ignorar', c => { c.happy -= 6; Reign.rep('povo', -3); return 'As aldeias se sentem abandonadas.'; }]] },
    { id: 'heresia', who: 'priest', t: 'Um pregador diz coisas estranhas nas praças.', o: [['Tolerar', c => { Reign.rep('clero', -5); Reign.rep('povo', 2); return 'O povo gosta de liberdade.'; }], ['Expulsar', c => { Reign.rep('clero', 5); Reign.rep('povo', -2); return 'O pregador foi embora.'; }], ['Levar a julgamento', c => { Reign.rep('clero', 8); Reign.rep('povo', -5); return 'O tribunal da fé decidiu.'; }]] },
    { id: 'monopolio', who: 'treasurer', t: 'Uma guilda pede o monopólio do sal do reino.', o: [['Conceder', c => { c.treasury += 150; Reign.rep('guildas', 6); Reign.rep('mercadores', -5); return 'A guilda pagou bem.'; }], ['Negar', c => { Reign.rep('guildas', -5); Reign.rep('mercadores', 2); return 'Mercado livre.'; }]] },
    { id: 'suspeito', who: 'spy', t: 'Um nobre anda se reunindo às escondidas.', o: [['Vigiar (40 🪙)', c => { c.treasury -= 40; Reign.R().watch = G.day + 3; return 'Olhos atentos nele.'; }], ['Prender', c => { Reign.rep('nobreza', -6); Reign.R().plots = Reign.R().plots.filter(p => p.kind !== 'baron'); return 'Preso. A nobreza estranha.'; }], ['Ignorar', c => 'Deve ser intriga.']] },
    { id: 'muralhas', who: 'general', t: 'As muralhas da capital estão velhas.', o: [['Reformar (200 🪙)', c => { c.treasury -= 200; c.invest.walls = (c.invest.walls || 0) + 1; return 'Muralhas novas: o portão aguenta mais nos cercos.'; }], ['Adiar', c => 'Fica para depois.']] },
    { id: 'santo', who: 'priest', t: 'É dia do padroeiro. A igreja pede uma festa.', o: [['Patrocinar (100 🪙)', c => { c.treasury -= 100; c.happy = Math.min(100, c.happy + 6); Reign.rep('clero', 4); return 'Festa bonita.'; }], ['Não patrocinar', c => { Reign.rep('clero', -2); return 'Festa modesta.'; }]] },
    { id: 'taxanobre', who: 'treasurer', t: 'O tesouro sugere cobrar imposto também da nobreza.', o: [['Cobrar', c => { c.treasury += 180; Reign.rep('nobreza', -8); for (const f of Object.values(Reign.R().fiefs)) f.loyal -= 10; return 'Os nobres pagaram, de cara feia.'; }], ['Isentar', c => { Reign.rep('nobreza', 4); return 'A nobreza agradece.'; }]] },
  ],
  rivalCiv(c) { const o = G.civs.filter(x => x.ruler !== 'player').sort((a, b) => Diplo.rel(c.id, a.id) - Diplo.rel(c.id, b.id))[0]; return o ? o.id : -1; },
  answer(i) {
    const R = this.R(), d = R.dilemma; if (!d) return; const D = this.DILEMMAS.find(x => x.id === d.id), c = G.civs[d.ci]; if (!D || !c) return;
    const res = D.o[i][1](c); c.treasury = Math.max(0, c.treasury);
    const m = this.member(D.who); if (m) m.loyal = U.clamp((m.loyal || 50) + (i === 0 ? 5 : -5), 0, 100);
    R.dilemma = null; this.chron(`${ROYAL_COUNCIL[D.who].icon} ${D.t} — ${D.o[i][0]}.`);
    UI.msg(`👑 ${D.o[i][0]}: ${res}`, 'gold');
  },
  // ---------------------------------------------------------------- audiências
  AUD: [
    { g: 'povo', t: p => `${p.name}, camponês, pede que o imposto baixe: "a família passa fome".`, o: [['Baixar o imposto', c => { c.tax = Math.max(0.05, c.tax - 0.02); Reign.rep('povo', 5); }], ['Negar', c => Reign.rep('povo', -3)]] },
    { g: 'povo', t: p => `${p.name}, viúva, pede ajuda para criar os filhos.`, o: [['Dar 30 🪙', c => { c.treasury -= 30; Reign.rep('povo', 3); Reign.rep('clero', 1); }], ['Mandar ao convento', c => Reign.rep('clero', 1)]] },
    { g: 'mercadores', t: p => `${p.name}, mercador, pede uma estrada calçada até a feira.`, o: [['Pagar 150 🪙', c => { c.treasury -= 150; c.tradeBonus = true; Reign.rep('mercadores', 5); }], ['Negar', c => Reign.rep('mercadores', -3)]] },
    { g: 'nobreza', t: p => `${p.name}, nobre, pede terras para a família.`, o: [['Entregar uma vila como feudo', (c, p) => { const v = Reign.freeVillage(); if (v >= 0) Reign.grantFief(v, p.id); else Reign.rep('nobreza', 1); }], ['Prometer para depois', (c, p) => { People.addAff(p, -5); }], ['Negar', (c, p) => { Reign.rep('nobreza', -3); People.addAff(p, -15); }]] },
    { g: 'clero', t: p => `${p.name}, padre, pede o dízimo obrigatório no reino.`, o: [['Conceder', c => { Reign.rep('clero', 6); Reign.rep('povo', -3); }], ['Negar', c => Reign.rep('clero', -4)]] },
    { g: 'guildas', t: p => `${p.name} pede um alvará para a guilda dela abrir oficinas.`, o: [['Conceder (+60 🪙)', c => { c.treasury += 60; Reign.rep('guildas', 5); }], ['Negar', c => Reign.rep('guildas', -3)]] },
    { g: 'submundo', t: p => `${p.name} implora perdão para um irmão preso por furto.`, o: [['Perdoar', c => { Reign.rep('submundo', 6); Reign.rep('povo', -2); Reign.rep('nobreza', -2); }], ['Negar', c => Reign.rep('submundo', -4)], ['Enforcar o ladrão', c => { Reign.rep('submundo', -8); Reign.rep('povo', 2); }]] },
    { g: 'acusa', t: (p, q) => `${p.name} acusa ${q.name} de roubar as suas ovelhas.`, o: [['Condenar o acusado', (c, p, q) => { People.addAff(q, -20); People.addAff(p, 10); Reign.rep('povo', q.guilty ? 3 : -3); }], ['Absolver', (c, p, q) => { People.addAff(p, -10); People.addAff(q, 10); Reign.rep('povo', q.guilty ? -3 : 3); }], ['Investigar (30 🪙)', (c, p, q) => { c.treasury -= 30; Reign.rep('povo', 4); (q.guilty ? People.addAff(p, 12) : People.addAff(q, 12)); UI.msg(q.guilty ? `🔎 A investigação provou: ${q.name} roubou mesmo.` : `🔎 A investigação provou: ${q.name} é inocente.`, 'gold'); }]] },
  ],
  newAudiences() {
    const R = this.R(), sub = this.subjects(); R.aud = [];
    for (let k = 0; k < 2 && sub.length > 2; k++) {
      const ai = Math.floor(Math.random() * this.AUD.length), A = this.AUD[ai];
      let p = sub.filter(q => (typeof Society !== 'undefined' ? Society.groupOf(q) : 'povo') === A.g)[0] || U.pick(sub), q = null;
      if (A.g === 'acusa') { p = U.pick(sub); q = U.pick(sub.filter(x => x !== p)); q.guilty = Math.random() < 0.5; }
      R.aud.push({ ai, p: p.id, q: q ? q.id : null });
    }
  },
  hear(k, i) {
    const R = this.R(), a = R.aud[k]; if (!a) return; const A = this.AUD[a.ai], c = this.main(), p = G.people[a.p], q = a.q !== null ? G.people[a.q] : null;
    A.o[i][1](c, p, q); c.treasury = Math.max(0, c.treasury); R.aud.splice(k, 1);
    this.chron(`⚖️ Audiência: ${A.t(p, q)} — ${A.o[i][0]}.`);
  },
  // ---------------------------------------------------------------- vassalos e feudos
  freeVillage() { const cs = this.realms().map(c => c.id); return World.villages.findIndex(v => cs.includes(v.civ) && !this.R().fiefs[World.villages.indexOf(v)]); },
  nobles() { return G.people.filter(p => p.alive && p.age >= 20 && !p.kin && !p.capanga && (p.rank === 'knight' || (typeof NOBLE_RANKS !== 'undefined' && NOBLE_RANKS.includes(p.rank) && p.rank !== 'ruler')) && !Object.values(this.R().fiefs).some(f => f.pid === p.id)); },
  grantFief(vi, pid) {
    const v = World.villages[vi], p = G.people[pid]; if (!v || !p) return;
    this.R().fiefs[vi] = { pid, loyal: 65, since: G.day, rank: 0 }; p.baron = vi; People.addAff(p, 20); this.rep('nobreza', 3);
    UI.msg(`🏰 ${People.full(p)} recebeu ${v.name} como feudo: paga tributo todo mês e manda soldados na guerra.`, 'gold'); this.chron(`🏰 ${v.name} virou feudo de ${People.full(p)}.`);
  },
  revoke(vi) { const f = this.R().fiefs[vi]; if (!f) return; const p = G.people[f.pid]; if (p) { People.addAff(p, -40); p.baron = undefined; } delete this.R().fiefs[vi]; this.rep('nobreza', -4); UI.msg(`🏰 Você tomou de volta ${World.villages[vi].name}.`, 'bad'); },
  honor(vi) { const f = this.R().fiefs[vi], c = this.main(); if (!f || c.treasury < 100) { UI.msg('Honrarias custam 100 🪙 do tesouro.', 'bad'); return; } c.treasury -= 100; f.loyal = Math.min(100, f.loyal + 15); f.rank = Math.min(2, (f.rank || 0) + 1); const p = G.people[f.pid]; if (p) People.addAff(p, 10); UI.msg(`🎖️ ${p ? p.name : ''} recebeu honrarias: agora é ${['Barão', 'Conde', 'Marquês'][f.rank]}.`, 'gold'); },
  tribute(vi) { const n = People.residents(vi).length; return Math.round(5 + n * 0.6); },
  levy() { return Math.min(15, Object.values(this.R().fiefs).filter(f => !f.rebel).length * 3); },
  // ---------------------------------------------------------------- espionagem e complôs
  plantSpy(ci) { const c = this.main(); if (c.treasury < 80) { UI.msg('Um espião custa 80 🪙 do tesouro.', 'bad'); return; } c.treasury -= 80; this.R().spies[ci] = { since: G.day }; UI.msg(`🗡️ Um espião se infiltrou na corte de ${CIV_DEFS[ci].short}.`, 'gold'); },
  spySkill() { const s = this.member('spy'); return (s ? (s.loyal || 50) / 2 : 10) + Object.keys(this.R().spies).length * 4 + (this.R().court.jester ? 10 : 0) + (this.R().watch >= G.day ? 20 : 0); },
  mission(ci, kind) {
    const R = this.R(), c = this.main(), t = G.civs[ci]; if (!R.spies[ci] || !t) return;
    const cost = { sabotage: 100, steal: 60, kill: 300 }[kind], ch = { sabotage: 0.6, steal: 0.65, kill: 0.35 }[kind] + this.spySkill() / 400;
    if (c.treasury < cost) { UI.msg(`A missão custa ${cost} 🪙 do tesouro.`, 'bad'); return; }
    c.treasury -= cost;
    if (Math.random() > ch) { delete R.spies[ci]; Game.addRelation(ci, -20); if (kind === 'kill' && !Diplo.atWar(ci, c.id)) Diplo.declareWar(ci, c.id, 'tentativa de assassinato'); UI.msg(`🗡️ O espião foi pego em ${CIV_DEFS[ci].short}! (−20 de relação${kind === 'kill' ? ' e guerra' : ''})`, 'bad', true); this.chron(`🗡️ Espião capturado em ${CIV_DEFS[ci].short}.`); return; }
    if (kind === 'sabotage') { t.garrison = Math.max(0, t.garrison - 3); const l = Math.round(t.treasury * 0.15); t.treasury -= l; UI.msg(`🔥 Sabotagem em ${CIV_DEFS[ci].short}: −3 soldados e −${l} 🪙 no tesouro deles.`, 'gold'); }
    if (kind === 'steal') { const g = Math.min(400, Math.round(t.treasury * 0.1)); t.treasury -= g; c.treasury += g; const noble = G.people.find(p => p.alive && p.home && p.home.type === 'castle' && p.home.civ === ci && p.age >= 18); if (noble && typeof Society !== 'undefined') Society.learn(noble, 'espião'); UI.msg(`💰 O espião roubou ${g} 🪙 de ${CIV_DEFS[ci].short}${noble ? ' e um segredo da corte deles' : ''}.`, 'gold'); }
    if (kind === 'kill') { const v = G.people.find(p => p.alive && p.civ === ci && p.rank === 'heir') || (typeof Heroes !== 'undefined' ? Heroes.of(ci)[0] : null); if (v) { People.die(v, 'envenenado'); UI.msg(`☠️ ${People.full(v)} de ${CIV_DEFS[ci].short} morreu "de repente".`, 'gold', true); this.chron(`☠️ ${People.full(v)} morreu em ${CIV_DEFS[ci].short}, envenenado.`); } }
  },
  PLOT_TXT: { embezzle: 'desvia ouro do tesouro', coup: 'reúne nobres para um golpe', poison: 'planeja envenenar você', baron: 'arma os vassalos contra a coroa', heir: 'quer o trono antes da hora', queen: 'conspira com o reino de origem' },
  newPlot(pid, kind) { const R = this.R(); if (R.plots.some(p => p.pid === pid)) return; R.plots.push({ pid, kind, day: G.day, found: false }); },
  resolvePlot(i, how) {
    const R = this.R(), pl = R.plots[i]; if (!pl) return; const p = G.people[pl.pid];
    if (how === 'arrest') { if (p) { p.jail = G.day + 6; People.addAff(p, -40); for (const k in R.council) if (R.council[k] === p.id) delete R.council[k]; } this.rep('nobreza', -4); UI.msg(`⛓️ ${p ? p.name : 'O conspirador'} foi preso.`, 'gold'); }
    if (how === 'exile') { if (p) { p.home = { type: 'wild' }; People.addAff(p, -60); for (const k in R.council) if (R.council[k] === p.id) delete R.council[k]; } this.rep('nobreza', -2); UI.msg(`🚪 ${p ? p.name : 'O conspirador'} foi exilado.`, 'gold'); }
    if (how === 'pardon') { if (p) { p.loyal = 60; p.amb = Math.max(0, (p.amb || 50) - 30); People.addAff(p, 20); } this.rep('nobreza', 2); UI.msg(`🕊️ Você perdoou ${p ? p.name : ''}: a lealdade voltou.`, 'gold'); }
    R.plots.splice(i, 1); this.fillCouncil(); this.chron(`🗡️ Complô de ${p ? People.full(p) : '?'}: ${{ arrest: 'preso', exile: 'exilado', pardon: 'perdoado' }[how]}.`);
  },
  plotStrike(pl) {
    const c = this.main(), p = G.people[pl.pid]; if (!p || !p.alive) return;
    const msg = { embezzle: () => { const l = Math.round(c.treasury * 0.25); c.treasury -= l; return `${p.name} fugiu com ${l} 🪙 do tesouro!`; }, coup: () => { c.happy -= 10; for (const f of Object.values(this.R().fiefs)) f.loyal -= 15; return `${p.name} tentou um golpe: o reino ficou abalado e os vassalos, divididos.`; },
      poison: () => { P.hp = Math.max(1, Math.round(P.hp * 0.4)); return `Envenenaram a sua taça! Você sobreviveu por pouco. Foi ${p.name}.`; }, baron: () => { for (const f of Object.values(this.R().fiefs)) f.loyal -= 20; return `${p.name} incitou os barões contra você.`; },
      heir: () => { this.rep('nobreza', -6); for (const f of Object.values(this.R().fiefs)) f.loyal -= 10; return `${p.name} tenta ganhar a nobreza para tomar o trono: a corte está dividida.`; }, queen: () => { const l = Math.round(c.treasury * 0.1); c.treasury -= l; return `${p.name} mandou ${l} 🪙 do tesouro para o reino de origem.`; } }[pl.kind];
    if (msg) { const t = msg(); UI.banner('🗡️ Complô!'); UI.msg(`🗡️ ${t}`, 'bad', true); this.chron(`🗡️ ${t}`); }
    p.loyal = 30; p.amb = Math.max(0, (p.amb || 50) - 20);
  },
  // ---------------------------------------------------------------- herdeiros
  kids() { return G.people.filter(c => c.alive && c.kin === 'child'); },
  setTutor(id, k) { const R = this.R(); if (k) R.tutors[id] = k; else delete R.tutors[id]; const c = G.people[id]; UI.msg(k ? `📚 ${c.name} agora estuda ${TUTORS[k][1].toLowerCase()} (25 🪙 por mês).` : `${c.name} ficou sem tutor.`); },
  // ---------------------------------------------------------------- diplomacia
  treaty(a, b, kind) { return this.R().treaties.find(t => t.kind === kind && ((t.a === a && t.b === b) || (t.a === b && t.b === a))); },
  sign(ci, kind) {
    const c = this.main(), need = { commerce: 20, nonagg: 0, passage: 10 }[kind];
    if (G.civs[ci].relation < need) { UI.msg(`${CIV_DEFS[ci].short} só aceita com relação ${need}+.`, 'bad'); return; }
    if (this.treaty(c.id, ci, kind)) return;
    this.R().treaties.push({ a: c.id, b: ci, kind, day: G.day }); Game.addRelation(ci, 5);
    UI.msg(`📜 Tratado ${{ commerce: 'de comércio', nonagg: 'de não agressão', passage: 'de livre passagem' }[kind]} assinado com ${CIV_DEFS[ci].short}.`, 'gold'); this.chron(`📜 Tratado com ${CIV_DEFS[ci].short}: ${{ commerce: 'comércio', nonagg: 'não agressão', passage: 'livre passagem' }[kind]}.`);
  },
  breakTreaty(ci, kind) { const R = this.R(), t = this.treaty(this.main().id, ci, kind); if (!t) return; R.treaties = R.treaties.filter(x => x !== t); Game.addRelation(ci, -15); this.rep('nobreza', -3); for (const o of G.civs) if (o.ruler !== 'player' && o.id !== ci) Game.addRelation(o.id, -3); UI.msg(`📜 Você rompeu o tratado com ${CIV_DEFS[ci].short}: a sua palavra vale menos agora.`, 'bad'); },
  demandVassal(ci) {
    const c = this.main(), t = G.civs[ci], ratio = Diplo.strength(ci) / Math.max(1, Diplo.strength(c.id));
    if (ratio > 0.7) { UI.msg(`${CIV_DEFS[ci].short} é forte demais para aceitar (força ${Math.round(ratio * 100)}% da sua).`, 'bad'); return; }
    if (Math.random() < 0.85 - ratio) { t.overlord = c.id; Game.addRelation(ci, -10); UI.msg(`👑 ${CIV_DEFS[ci].name} aceitou ser vassalo: paga 10% do tesouro por mês e manda soldados nas suas guerras.`, 'gold', true); this.chron(`👑 ${CIV_DEFS[ci].name} virou reino vassalo.`); Diplo.chronicle(`👑 ${CIV_DEFS[ci].name} jurou vassalagem a ${G.name}.`, true); }
    else { Game.addRelation(ci, -20); UI.msg(`${CIV_DEFS[ci].short} recusou com desprezo (−20 de relação).`, 'bad'); }
  },
  hostage(ci) {
    const p = G.people.find(q => q.alive && q.civ === ci && (q.rank === 'heir' || q.rank === 'knight') && !q.hostage);
    if (!p) { UI.msg('Não há nobre para mandar como refém.', 'bad'); return; }
    if (G.civs[ci].relation < 15) { UI.msg(`${CIV_DEFS[ci].short} só manda refém com relação 15+.`, 'bad'); return; }
    p.hostage = ci; this.R().hostages.push(p.id); UI.msg(`🤝 ${People.full(p)} veio viver na sua corte como refém: ${CIV_DEFS[ci].short} não vai romper tratados nem atacar você.`, 'gold');
  },
  royalWed(ci) {
    const kid = this.kids().find(k => k.age >= 16 && k.spouse === null), them = G.people.find(q => q.alive && q.civ === ci && q.rank === 'heir' && q.spouse === null && q.age >= 16 && (!kid || q.sex !== kid.sex));
    if (!kid || !them) { UI.msg(!kid ? 'Você não tem filho solteiro com 16+ anos.' : `${CIV_DEFS[ci].short} não tem herdeiro solteiro do sexo oposto.`, 'bad'); return; }
    if (G.civs[ci].relation < 30) { UI.msg(`${CIV_DEFS[ci].short} só aceita com relação 30+.`, 'bad'); return; }
    People.marry(kid, them); if (!Diplo.allied(this.main().id, ci)) Diplo.ally(this.main().id, ci); this.R().claims[ci] = { kid: kid.id, ruler: G.civs[ci].rulerId };
    UI.banner('💍 Casamento real!'); UI.msg(`💍 ${kid.name} casou com ${People.full(them)}, herdeiro de ${CIV_DEFS[ci].short}: os reinos são aliados e a sua dinastia tem direito ao trono deles.`, 'gold', true);
    this.chron(`💍 Casamento real: ${kid.name} e ${People.full(them)} (${CIV_DEFS[ci].short}).`); Diplo.chronicle(`💍 Casamento real entre as casas de ${G.name} e de ${CIV_DEFS[ci].short}.`, true);
  },
  // ---------------------------------------------------------------- economia de Estado
  debase() { const R = this.R(), c = this.main(); const g = 300 * (R.debase + 1); c.treasury += g; R.debase = Math.min(3, R.debase + 1); R.inflUntil = G.day + 4 * R.debase; for (const x of this.realms()) x.inflation = true; this.rep('mercadores', -6); this.rep('povo', -4); UI.msg(`🪙 Moeda desvalorizada: +${g} 🪙 no tesouro, mas os preços vão subir por ${4 * R.debase} meses.`, 'bad', true); this.chron(`🪙 A coroa desvalorizou a moeda (+${g} 🪙).`); },
  strongCoin() { const R = this.R(), c = this.main(), cost = 200 * R.debase; if (!R.debase) return; if (c.treasury < cost) { UI.msg(`Recuperar a moeda custa ${cost} 🪙.`, 'bad'); return; } c.treasury -= cost; R.debase = 0; R.inflUntil = 0; for (const x of this.realms()) x.inflation = false; this.rep('mercadores', 5); UI.msg('🪙 Moeda forte de novo: os preços voltaram ao normal.', 'gold'); },
  budgetCost() { const b = this.R().budget; return (b.army + b.court + b.works + b.church) * 40; },
  // ---------------------------------------------------------------- exército
  genTrait(p) { const ks = Object.keys(GEN_TRAITS); return ks[Math.floor(U.hash2(p.id, 21, 3) * ks.length)]; },
  generals() { return this.R().generals.map(id => G.people[id]).filter(p => p && p.alive); },
  genCands() { const cs = this.realms().map(c => c.id); return G.people.filter(p => p.alive && p.age >= 20 && !this.R().generals.includes(p.id) && ((p.hero && cs.includes(p.hero.civ)) || (p.rank === 'knight' && p.home && cs.includes(p.home.civ)) || (this.R().tutors[p.id] === 'guerra' && p.age >= 16))).slice(0, 6); },
  // ---------------------------------------------------------------- corte
  ball() { const R = this.R(), c = this.main(); if (G.day - R.court.ball < 3) { UI.msg('O último baile foi há pouco: espere 3 meses.', 'bad'); return; } if (c.treasury < 200) { UI.msg('O baile custa 200 🪙 do tesouro.', 'bad'); return; } c.treasury -= 200; R.court.ball = G.day; this.rep('nobreza', 5); for (const f of Object.values(R.fiefs)) f.loyal = Math.min(100, f.loyal + 10); for (const k in R.council) { const m = this.member(k); if (m) m.loyal = Math.min(100, (m.loyal || 50) + 5); } UI.banner('💃 Baile real!'); UI.msg('💃 Um baile no castelo: a nobreza dançou até o amanhecer (nobreza +5, vassalos e conselho mais leais).', 'gold'); this.chron('💃 Baile real no castelo.'); },
  tourney() { const R = this.R(), c = this.main(); if (G.day - R.court.tourney < 6) { UI.msg('Torneios reais são a cada 6 meses.', 'bad'); return; } if (c.treasury < 300) { UI.msg('O torneio custa 300 🪙 do tesouro.', 'bad'); return; } c.treasury -= 300; R.court.tourney = G.day; Court.addFame(5); c.happy = Math.min(100, c.happy + 5); this.rep('povo', 3); const h = typeof Heroes !== 'undefined' ? Heroes.of(c.id)[0] : null; if (h) Heroes.deed(h, `venceu o torneio real de ${G.name}`, 12, true); UI.banner('🏇 Torneio real!'); UI.msg(`🏇 Torneio real: +5 de fama, o povo vibrou${h ? ` e ${Heroes.name(h)} foi o campeão` : ''}.`, 'gold'); this.chron(`🏇 Torneio real${h ? ` — campeão: ${Heroes.name(h)}` : ''}.`); },
  castleLv(ci) { return this.R().court.castle[ci] || 1; },
  upgradeCastle(ci) {
    const lv = this.castleLv(ci), cost = CASTLE_LV[lv + 1], c = G.civs[ci]; if (!cost) return;
    const items = Object.fromEntries(Object.entries(cost).filter(([k]) => k !== 'gold'));
    if (c.treasury < cost.gold || !Inv.has(items)) { UI.msg(`Nível ${lv + 1}: ${cost.gold} 🪙 do tesouro + ${Object.entries(items).map(([k, n]) => `${n} ${ITEMS[k].name}`).join(', ')}.`, 'bad'); return; }
    c.treasury -= cost.gold; Inv.pay(items); this.R().court.castle[ci] = lv + 1; Court.addFame(4 * lv);
    UI.banner(`🏰 Castelo nível ${lv + 1}!`); UI.msg(`🏰 O castelo de ${CIV_DEFS[ci].short} cresceu para o nível ${lv + 1}: mais torres, mais prestígio (+${4 * lv} de fama), o povo mais feliz e o portão mais forte nos cercos.`, 'gold', true); this.chron(`🏰 O castelo de ${CIV_DEFS[ci].short} chegou ao nível ${lv + 1}.`);
  },
  titleName() { const n = this.realms().length; return n >= 3 ? (P.sex === 'f' ? 'Imperatriz' : 'Imperador') : n === 2 ? (P.sex === 'f' ? 'Alta Rainha' : 'Alto Rei') : (P.sex === 'f' ? 'Rainha' : 'Rei'); },
  // ---------------------------------------------------------------- o mês
  monthTick() {
    const R = this.R(); if (!this.isKing()) return;
    const c = this.main(); this.fillCouncil();
    // dilema do conselho (o anterior sem resposta: o conselheiro decide por você)
    if (R.dilemma) { const D = this.DILEMMAS.find(x => x.id === R.dilemma.id); if (D) { D.o[0][1](G.civs[R.dilemma.ci] || c); this.chron(`${ROYAL_COUNCIL[D.who].icon} Sem resposta, o ${ROYAL_COUNCIL[D.who].name.toLowerCase()} decidiu: ${D.o[0][0]}.`); } R.dilemma = null; }
    const D = U.pick(this.DILEMMAS); R.dilemma = { id: D.id, ci: c.id, day: G.day };
    this.newAudiences();
    UI.msg(`👑 O conselho tem um dilema e ${R.aud.length} súditos pedem audiência (Portfólio → 👑 Reinado).`, 'gold');
    // orçamento
    const b = R.budget, cost = this.budgetCost();
    if (c.treasury >= cost) { c.treasury -= cost; R.army.training = Math.min(100, R.army.training + b.army * 4); R.army.morale = Math.min(100, R.army.morale + b.army * 3); for (const f of Object.values(R.fiefs)) f.loyal = Math.min(100, f.loyal + b.court * 2); this.rep('nobreza', b.court * 0.5); this.rep('clero', b.church); G.piety = (G.piety || 0) + b.church; for (const x of this.realms()) for (const v of Diplo.villagesOf(x.id)) v.prosper = (v.prosper || 0) + b.works * 0.6; }
    else { R.army.morale -= 10; UI.msg('👑 O tesouro não cobriu o orçamento: soldo atrasado e obras paradas.', 'bad', true); }
    R.army.training = Math.max(0, R.army.training - 2); R.army.morale = U.clamp(R.army.morale + this.generals().filter(g => this.genTrait(g) === 'veterano').length * 2 - (b.army === 0 && c.garrison > 15 ? 5 : 0), 0, 100);
    if (R.army.morale < 25 && c.garrison > 4) { const n = U.rint(2, 4); c.garrison -= n; UI.msg(`🏃 ${n} soldados desertaram: a moral da tropa está no chão (${Math.round(R.army.morale)}).`, 'bad', true); }
    // dívida da coroa
    if (R.debt > 0) { const p = Math.min(60, R.debt, c.treasury); c.treasury -= p; R.debt -= p; }
    // moeda e alfândega
    if (R.debase && G.day > R.inflUntil) { for (const x of this.realms()) x.inflation = false; }
    if (R.customs) { const g = Math.round(R.customs / 100 * (this.realms().reduce((a, x) => a + x.pop, 0) * 0.4 + (G.caravans || []).length * 25)); c.treasury += g; this.rep('mercadores', -R.customs / 8); for (const o of G.civs) if (o.ruler !== 'player') Game.addRelation(o.id, -R.customs / 20); }
    // tratados: comércio e passagem rendem; vassalos pagam tributo
    for (const t of R.treaties) { const g = Math.round(Game.civForecast(c).income * (t.kind === 'commerce' ? 0.05 : t.kind === 'passage' ? 0.03 : 0)); c.treasury += g; if (t.kind !== 'nonagg') Game.addRelation(t.b, 0.3); }
    for (const v of G.civs) if (v.overlord === c.id && v.ruler !== 'player') { const g = Math.round(v.treasury * 0.1); v.treasury -= g; c.treasury += g; }
    // feudos: tributo, lealdade e revoltas
    let rebels = [];
    for (const [vi, f] of Object.entries(R.fiefs)) {
      const p = G.people[f.pid]; if (!p || !p.alive) { delete R.fiefs[vi]; continue; }
      f.loyal = U.clamp(f.loyal - 2, 0, 100);
      if (f.rebel) { f.rebelMonths = (f.rebelMonths || 0) + 1; if (f.rebelMonths >= 3) { const v = World.villages[vi], other = G.civs.filter(o => o.ruler !== 'player').sort((a, bb) => U.dist(World.capitals[a.id].x, World.capitals[a.id].y, v.x, v.y) - U.dist(World.capitals[bb.id].x, World.capitals[bb.id].y, v.x, v.y))[0]; if (other) Diplo.captureVillage(v, other.id); delete R.fiefs[vi]; UI.msg(`🏴 ${v.name} se separou do reino com o barão rebelde e jurou lealdade a ${CIV_DEFS[other.id].short}.`, 'bad', true); this.chron(`🏴 ${v.name} se separou do reino.`); } continue; }
      c.treasury += this.tribute(+vi);
      if (f.loyal < 25) rebels.push(vi);
      if (f.loyal < 20 && Math.random() < 0.3) this.newPlot(f.pid, 'baron');
    }
    if (rebels.length >= 2 || rebels.some(vi => R.fiefs[vi].loyal < 10)) for (const vi of rebels) if (!R.fiefs[vi].rebel) { R.fiefs[vi].rebel = true; c.happy -= 4; UI.banner('🏴 Revolta dos barões!'); UI.msg(`🏴 O barão de ${World.villages[vi].name} se revoltou: parou de pagar tributo. Negocie ou esmague a revolta em 3 meses (Reinado → Vassalos).`, 'bad', true); this.chron(`🏴 Revolta do barão de ${World.villages[vi].name}.`); }
    // conselheiros desleais e ambiciosos tramam; herdeiros ressentidos também
    for (const k in R.council) { const m = this.member(k); if (!m) continue; m.loyal = U.clamp((m.loyal || 50) + (b.court - 1), 0, 100); if (m.loyal < 25 && (m.amb || 0) > 55 && Math.random() < 0.3) this.newPlot(m.id, k === 'treasurer' ? 'embezzle' : k === 'spy' ? 'poison' : 'coup'); }
    const kids = this.kids();
    for (const k of kids) { if (k.age >= 14 && !R.tutors[k.id] && kids.some(o => R.tutors[o.id])) k.resent = (k.resent || 0) + 5; if (R.heir !== null && R.heir !== k.id && k.age >= 16) k.resent = (k.resent || 0) + 2; if (k.age >= 20 && (k.resent || 0) >= 40 && Math.random() < 0.2) this.newPlot(k.id, 'heir'); }
    const sp = typeof Society !== 'undefined' ? Society.spouse() : null; if (sp && sp.maidenFam !== undefined && (sp.rom || 0) < 25 && Math.random() < 0.08) this.newPlot(sp.id, 'queen');
    // descobrir complôs (o mestre espião, o bobo e a vigilância ajudam); os não descobertos atacam depois de 2 meses
    for (const pl of R.plots.slice()) {
      if (!pl.found && Math.random() < this.spySkill() / 100) { pl.found = true; const p = G.people[pl.pid]; UI.banner('🗡️ Complô descoberto!'); UI.msg(`🗡️ O seu mestre espião descobriu: ${p ? People.full(p) : 'alguém'} ${this.PLOT_TXT[pl.kind]}. Decida o destino em Reinado → Espionagem.`, 'gold', true); }
      else if (!pl.found && G.day - pl.day >= 2) { this.plotStrike(pl); R.plots = R.plots.filter(x => x !== pl); }
    }
    // tutores dos filhos
    for (const [id, k] of Object.entries(R.tutors)) { const kid = G.people[id]; if (!kid || !kid.alive) { delete R.tutors[id]; continue; } if (P.gold >= 25) P.gold -= 25; else continue; Ranking.stats(kid); if (k === 'guerra') kid.str = Math.min(95, kid.str + 1); else kid.int = Math.min(95, kid.int + 1); kid.edu = k; if (kid.age >= 16) { if (k === 'diplomacia') for (const o of G.civs) if (o.ruler !== 'player') Game.addRelation(o.id, 0.5); if (k === 'admin') c.treasury += Math.round(Game.civForecast(c).income * 0.03); if (k === 'fe') this.rep('clero', 0.5); } }
    // bobo da corte
    if (R.court.jester) { if (c.treasury >= 15) { c.treasury -= 15; c.happy = Math.min(100, c.happy + 2); } else R.court.jester = false; }
    // castelo: felicidade pelo nível
    for (const x of this.realms()) x.happy = Math.min(100, x.happy + (this.castleLv(x.id) - 1) * 0.5);
    // reivindicações por casamento real: o rei do outro reino morreu?
    for (const [ci, cl] of Object.entries(R.claims)) { const t = G.civs[ci], kid = G.people[cl.kid]; if (!t || t.ruler === 'player' || !kid || !kid.alive) { delete R.claims[ci]; continue; } if (t.rulerId !== cl.ruler) { delete R.claims[ci]; if (Math.random() < 0.5) { Game.becomeRuler(+ci, `Pelo casamento de ${kid.name}, a coroa de ${CIV_DEFS[ci].short} passa à sua dinastia.`); this.chron(`👑 ${CIV_DEFS[ci].name} foi herdado pelo casamento real.`); } else { Diplo.declareWar(+ci, c.id, 'guerra de sucessão'); UI.msg(`⚔️ A nobreza de ${CIV_DEFS[ci].short} não aceitou o direito da sua dinastia: guerra de sucessão!`, 'bad', true); } } }
    // títulos maiores
    const tl = Math.min(3, this.realms().length); if (tl > R.title) { if (tl >= 2) { UI.banner(`👑 ${this.titleName()}!`); UI.msg(`👑 Com ${tl} reinos, você agora é ${this.titleName()}.`, 'gold', true); Court.addFame(10 * tl); this.chron(`👑 ${G.name} se proclamou ${this.titleName()}.`); Diplo.chronicle(`👑 ${G.name} se proclamou ${this.titleName()}.`, true); } R.title = tl; }
  },
  // ---------------------------------------------------------------- janela
  show(tab) {
    if (!this.isKing()) { UI.open('👑 Reinado', '<p>O reinado é para quem governa um reino. Conquiste ou funde um.</p>', 'showReign', [], ''); return; }
    tab = tab || UI.sel.rgTab || 'council'; UI.sel.rgTab = tab; this.fillCouncil();
    const R = this.R(), c = this.main(), esc = UI.esc.bind(UI), btn = (act, label, extra, dis) => `<button data-act="${act}" ${extra || ''} ${dis ? 'disabled' : ''}>${label}</button>`;
    const tabs = [['council', '📜 Conselho'], ['aud', '⚖️ Audiências'], ['fiefs', '🏰 Vassalos'], ['spy', '🗡️ Espionagem'], ['heirs', '📚 Herdeiros'], ['diplo', '🤝 Diplomacia'], ['money', '💰 Tesouro'], ['army', '⚔️ Exército'], ['court', '🎭 Corte e legado']];
    let h = `<p><b>${this.titleName()} ${esc(G.name)}</b> · ${this.realms().map(x => CIV_DEFS[x.id].short).join(', ')} · tesouro de ${CIV_DEFS[c.id].short}: <b>${c.treasury} 🪙</b>${R.plots.some(p => p.found) ? ' · <b class="bad">🗡️ complô descoberto!</b>' : ''}</p>
      <div class="tabs">${tabs.map(([k, n]) => `<button class="${tab === k ? 'on' : ''}" data-act="rgTab" data-t="${k}">${n}${k === 'council' && R.dilemma ? ' •' : k === 'aud' && R.aud.length ? ` (${R.aud.length})` : ''}</button>`).join('')}</div>`;
    const person = p => p ? `${esc(People.full(p))} <small>· lealdade ${Math.round(p.loyal || 0)} · ambição ${Math.round(p.amb || 0)}</small>` : '—';
    if (tab === 'council') {
      const D = R.dilemma && this.DILEMMAS.find(x => x.id === R.dilemma.id);
      h += D ? `<div class="card"><div class="sec">${ROYAL_COUNCIL[D.who].icon} O ${ROYAL_COUNCIL[D.who].name.toLowerCase()} traz um dilema</div><p><b>${esc(D.t)}</b></p><div class="act-row">${D.o.map((o, i) => btn('rgAns', esc(o[0]), `data-i="${i}"`)).join('')}</div><small class="muted">Sem resposta até a virada do mês, o conselheiro decide pela primeira opção.</small></div>` : '<div class="card"><p class="muted">Nenhum dilema agora: o conselho se reúne todo mês.</p></div>';
      h += `<div class="kgrid two">${Object.entries(ROYAL_COUNCIL).map(([k, d]) => { const m = this.member(k); return `<div class="card"><div class="sec">${d.icon} ${d.name}</div><p>${person(m)}${m && (m.loyal || 0) < 25 && (m.amb || 0) > 55 ? ' <b class="bad">perigoso</b>' : ''}</p>
        <div class="act-row">${this.subjects().filter(q => d.ranks.includes(q.rank) && q !== m).slice(0, 2).map(q => btn('rgAppoint', `Nomear ${esc(q.name)}`, `data-k="${k}" data-p="${q.id}"`)).join('')}${m ? btn('tk', '💬', `data-op="open" data-id="${m.id}"`) : ''}</div></div>`; }).join('')}</div>`;
    } else if (tab === 'aud') {
      h += R.aud.length ? R.aud.map((a, k) => { const A = this.AUD[a.ai], p = G.people[a.p], q = a.q !== null ? G.people[a.q] : null; return `<div class="card"><div class="sec">${typeof SOC_GROUPS !== 'undefined' && SOC_GROUPS[A.g] ? SOC_GROUPS[A.g].icon + ' ' + SOC_GROUPS[A.g].name : '⚖️ Acusação'}</div><p>${esc(A.t(p, q))}</p><div class="act-row">${A.o.map((o, i) => btn('rgHear', esc(o[0]), `data-k="${k}" data-i="${i}"`)).join('')}</div></div>`; }).join('') : '<p class="muted">Ninguém pede audiência agora. Os súditos voltam no mês que vem.</p>';
    } else if (tab === 'fiefs') {
      const F = Object.entries(R.fiefs);
      h += `<p class="dt-desc">Vilas entregues a nobres pagam tributo e mandam ${this.levy()} soldados nas suas guerras. A lealdade cai todo mês: honrarias, bailes e o orçamento da corte seguram os barões. Dois barões insatisfeitos (ou um furioso) se revoltam.</p>`;
      h += F.length ? F.map(([vi, f]) => { const p = G.people[f.pid], v = World.villages[vi]; return `<div class="card"><div class="sec">🏰 ${esc(v.name)} <span class="${f.rebel ? 'bad' : f.loyal < 25 ? 'bad' : 'ok'}">${f.rebel ? 'EM REVOLTA' : 'lealdade ' + Math.round(f.loyal)}</span></div><p>${['Barão', 'Conde', 'Marquês'][f.rank || 0]} ${p ? esc(People.full(p)) : '?'} · tributo ${this.tribute(+vi)} 🪙/mês</p>
        <div class="act-row">${f.rebel ? btn('rgNego', 'Negociar (300 🪙)', `data-v="${vi}"`) + btn('rgCrush', 'Esmagar a revolta (10+ soldados)', `data-v="${vi}"`) : btn('rgHonor', '🎖️ Honrarias (100 🪙)', `data-v="${vi}"`) + btn('rgRevoke', 'Tomar de volta', `data-v="${vi}"`)}</div></div>`; }).join('') : '<p class="muted">Nenhum feudo ainda.</p>';
      const free = World.villages.map((v, vi) => ({ v, vi })).filter(x => this.realms().some(r => r.id === x.v.civ) && !R.fiefs[x.vi]), nb = this.nobles().slice(0, 4);
      if (free.length && nb.length) h += `<div class="card"><div class="sec">Entregar uma vila como feudo</div><div class="list">${free.slice(0, 4).map(x => `<div class="item"><span class="ic">🏘️</span><div class="info"><b>${esc(x.v.name)}</b><small>tributo ${this.tribute(x.vi)} 🪙/mês</small></div>${nb.slice(0, 2).map(p => btn('rgFief', `a ${esc(p.name)}`, `data-v="${x.vi}" data-p="${p.id}"`)).join('')}</div>`).join('')}</div></div>`;
    } else if (tab === 'spy') {
      h += `<p>Força da espionagem: <b>${Math.round(this.spySkill())}%</b> de descobrir complôs por mês (mestre espião leal, espiões, bobo da corte e vigilância somam).</p>`;
      const pl = R.plots.filter(p => p.found);
      if (pl.length) h += `<div class="card"><div class="sec bad">🗡️ Complôs descobertos</div>${pl.map(x => { const i = R.plots.indexOf(x), p = G.people[x.pid]; return `<p><b>${p ? esc(People.full(p)) : '?'}</b> ${this.PLOT_TXT[x.kind]}.</p><div class="act-row">${btn('rgPlot', '⛓️ Prender', `data-i="${i}" data-h="arrest"`)}${btn('rgPlot', '🚪 Exilar', `data-i="${i}" data-h="exile"`)}${btn('rgPlot', '🕊️ Perdoar', `data-i="${i}" data-h="pardon"`)}</div>`; }).join('')}</div>`;
      h += G.civs.filter(o => o.ruler !== 'player').map(o => { const s = R.spies[o.id]; return `<div class="card"><div class="sec">${CIV_DEFS[o.id].name} ${s ? '<span class="ok">espião infiltrado</span>' : ''}</div>${s ? `<p class="dt-desc">Guarnição ${o.garrison} · tesouro ${o.treasury} 🪙 · felicidade ${Math.round(o.happy)} · ${Diplo.warsOf(o.id).length ? 'em guerra' : 'em paz'} · ${Diplo.rel(o.id, c.id) < -35 ? '<b class="bad">planejam guerra contra você</b>' : 'sem planos contra você'}</p>
        <div class="act-row">${btn('rgMis', '🔥 Sabotar (100 🪙)', `data-c="${o.id}" data-k="sabotage"`)}${btn('rgMis', '💰 Roubar (60 🪙)', `data-c="${o.id}" data-k="steal"`)}${btn('rgMis', '☠️ Assassinar o herdeiro (300 🪙)', `data-c="${o.id}" data-k="kill"`)}</div>` : `<div class="act-row">${btn('rgSpy', '🗡️ Infiltrar um espião (80 🪙)', `data-c="${o.id}"`)}</div>`}</div>`; }).join('');
    } else if (tab === 'heirs') {
      const K = this.kids();
      h += K.length ? K.map(k => { const t = R.tutors[k.id]; Ranking.stats(k); return `<div class="card"><div class="sec">${k.sex === 'f' ? '👧' : '👦'} ${esc(k.name)} <span>${k.age} anos${R.heir === k.id ? ' · 👑 herdeiro escolhido' : ''}${(k.resent || 0) >= 30 ? ' · <b class="bad">ressentido</b>' : ''}</span></div>
        <p class="dt-desc">Força ${k.str} · inteligência ${k.int}${t ? ` · estuda ${TUTORS[t][1]} (${TUTORS[t][2]})` : ' · sem tutor'}</p>
        <div class="act-row">${Object.entries(TUTORS).map(([key, x]) => `<button class="${t === key ? 'primary' : ''}" data-act="rgTutor" data-p="${k.id}" data-k="${key}">${x[0]} ${x[1]}</button>`).join('')}${t ? btn('rgTutor', 'Sem tutor', `data-p="${k.id}" data-k=""`) : ''}${R.heir !== k.id ? btn('rgHeir', '👑 Escolher como herdeiro', `data-p="${k.id}"`) : ''}</div></div>`; }).join('') + '<p class="muted">Tutor: 25 🪙 por mês do seu ouro. Irmãos sem tutor (quando outro tem) e preteridos na sucessão guardam rancor e podem tramar.</p>' : '<p class="muted">Você ainda não tem filhos.</p>';
    } else if (tab === 'diplo') {
      h += G.civs.filter(o => o.ruler !== 'player').map(o => { const has = k => !!this.treaty(c.id, o.id, k); const kid = R.claims[o.id]; return `<div class="card"><div class="sec">${CIV_DEFS[o.id].name} <span>relação ${Math.round(o.relation)}${o.overlord === c.id ? ' · 👑 seu vassalo' : ''}${kid ? ' · 💍 direito ao trono' : ''}</span></div>
        <div class="act-row">${['commerce', 'nonagg', 'passage'].map(k => has(k) ? btn('rgBreak', `Romper ${{ commerce: 'comércio', nonagg: 'não agressão', passage: 'passagem' }[k]}`, `data-c="${o.id}" data-k="${k}"`) : btn('rgSign', `📜 ${{ commerce: 'Comércio (+5% renda)', nonagg: 'Não agressão', passage: 'Livre passagem (+3% renda)' }[k]}`, `data-c="${o.id}" data-k="${k}"`)).join('')}
          ${o.overlord === c.id ? '' : btn('rgVassal', '👑 Exigir vassalagem', `data-c="${o.id}"`)}${btn('rgHostage', '🤝 Pedir um refém', `data-c="${o.id}"`)}${btn('rgWed', '💍 Casamento real', `data-c="${o.id}"`)}</div></div>`; }).join('');
      const hs = R.hostages.map(id => G.people[id]).filter(p => p && p.alive); if (hs.length) h += `<div class="card"><div class="sec">Reféns na sua corte</div><p>${hs.map(p => `${esc(People.full(p))} (${CIV_DEFS[p.hostage] ? CIV_DEFS[p.hostage].short : '?'})`).join(', ')}</p></div>`;
    } else if (tab === 'money') {
      const b = R.budget, row = (k, n, d) => `<div class="wc-row"><span class="wc-l"><b>${n}</b><small>${d}</small></span><span class="wc-step"><button data-act="rgBud" data-k="${k}" data-d="-1" ${b[k] <= 0 ? 'disabled' : ''}>−</button><b>${b[k]}</b><button data-act="rgBud" data-k="${k}" data-d="1" ${b[k] >= 3 ? 'disabled' : ''}>+</button></span></div>`;
      h += `<div class="card"><div class="sec">📊 Orçamento <span>${this.budgetCost()} 🪙 por mês</span></div>${row('army', '⚔️ Exército', 'treino e moral da tropa')}${row('court', '🎭 Corte', 'lealdade dos vassalos, do conselho e da nobreza')}${row('works', '🏗️ Obras', 'as vilas do reino crescem mais rápido')}${row('church', '⛪ Igreja', 'clero e fé')}</div>
        <div class="card"><div class="sec">🪙 Moeda <span>${R.debase ? `desvalorizada (nível ${R.debase})` : 'forte'}</span></div><p class="dt-desc">Desvalorizar enche o tesouro na hora (+${300 * (R.debase + 1)} 🪙), mas os preços sobem por meses e mercadores e povo não gostam.</p><div class="act-row">${btn('rgDebase', '🪙 Desvalorizar a moeda', '', R.debase >= 3)}${R.debase ? btn('rgStrong', `Moeda forte (${200 * R.debase} 🪙)`) : ''}</div></div>
        <div class="card"><div class="sec">🛃 Alfândega <span>${R.customs}%</span></div><p class="dt-desc">Tarifa nas fronteiras: rende ouro todo mês com o comércio, mas mercadores e reinos vizinhos não gostam.</p><div class="act-row">${[0, 5, 10, 15].map(t => `<button class="${R.customs === t ? 'primary' : ''}" data-act="rgCustoms" data-t="${t}">${t}%</button>`).join('')}</div></div>
        ${R.debt ? `<p class="bad">Dívida da coroa com os banqueiros: ${R.debt} 🪙 (60 por mês).</p>` : ''}`;
    } else if (tab === 'army') {
      const A = R.army;
      h += `<div class="card"><div class="sec">⚔️ Tropa <span>moral ${Math.round(A.morale)} · treino ${Math.round(A.training)}</span></div><p class="dt-desc">Treino deixa os soldados mais fortes no campo de batalha; moral baixa faz parte da tropa fugir e, abaixo de 25, soldados desertam. O orçamento do exército sustenta os dois.</p></div>
        <div class="card"><div class="sec">🎖️ Generais (até 3)</div>${this.generals().map(g => `<p><b>${esc(People.full(g))}</b> · ${GEN_TRAITS[this.genTrait(g)][0]} (${GEN_TRAITS[this.genTrait(g)][1]})${g.hero ? ` · ⭐ ${esc(g.hero.epi)}, fama ${g.hero.fame}` : ''} ${btn('rgGenOff', 'Dispensar', `data-p="${g.id}"`)}</p>`).join('') || '<p class="muted">Nenhum general.</p>'}
          ${this.generals().length < 3 ? `<div class="act-row">${this.genCands().map(p => btn('rgGen', `Nomear ${esc(p.name)} (${GEN_TRAITS[this.genTrait(p)][0]})`, `data-p="${p.id}"`)).join('')}</div>` : ''}</div>`;
    } else {
      h += `<div class="kgrid two"><div class="card"><div class="sec">💃 Baile real</div><p class="dt-desc">200 🪙 · a cada 3 meses. Nobreza, vassalos e conselho mais leais.</p><div class="act-row">${btn('rgBall', 'Dar um baile')}</div></div>
        <div class="card"><div class="sec">🏇 Torneio real</div><p class="dt-desc">300 🪙 · a cada 6 meses. Fama, povo feliz e glória para um herói.</p><div class="act-row">${btn('rgTourney', 'Organizar o torneio')}</div></div>
        <div class="card"><div class="sec">🃏 Bobo da corte</div><p class="dt-desc">15 🪙 por mês: o povo ri (+felicidade) e ele ouve tudo nos corredores (descobre complôs).</p><div class="act-row"><button class="${R.court.jester ? 'primary' : ''}" data-act="rgJester">${R.court.jester ? '✔ Contratado' : 'Contratar'}</button></div></div>
        ${this.realms().map(x => { const lv = this.castleLv(x.id), nx = CASTLE_LV[lv + 1]; return `<div class="card"><div class="sec">🏰 Castelo de ${CIV_DEFS[x.id].short} <span>nível ${lv}/5</span></div><p class="dt-desc">${nx ? `Próximo nível: ${nx.gold} 🪙 do tesouro + ${Object.entries(nx).filter(([k]) => k !== 'gold').map(([k, n]) => `${n} ${ITEMS[k].name}`).join(', ')} da mochila.` : 'Nível máximo.'} Cada nível: torres e brasões a mais, felicidade, fama e portão mais forte.</p>${nx ? `<div class="act-row">${btn('rgCastle', `Ampliar para o nível ${lv + 1}`, `data-c="${x.id}"`)}</div>` : ''}</div>`; }).join('')}</div>
        <div class="card"><div class="sec">📜 Crônica do reinado</div><div class="list">${R.chron.slice(0, 25).map(x => `<div class="item"><span class="ic">📜</span><div class="info"><b>${esc(x.t)}</b><small>${Calendar.short(x.d)}</small></div></div>`).join('') || '<p class="muted">O seu reinado ainda não tem história.</p>'}</div></div>`;
    }
    UI.open(`👑 ${this.titleName()} ${G.name}`, `<div class="reign">${h}</div>`, 'showReign', [tab], 'Conselho, audiências, vassalos, espionagem, herdeiros, diplomacia, tesouro, exército e corte');
  },
};

// ------------------------------------------------------------------ ganchos
{
  const mt0 = Lifesim.monthTick.bind(Lifesim);
  Lifesim.monthTick = function () { mt0(); Reign.monthTick(); };
  // títulos maiores no painel do herói
  const pt0 = Game.playerTitle.bind(Game);
  Game.playerTitle = function () { const r = pt0(); const n = Reign.realms().length; if (r && r.king && n >= 2) r.text = `${Reign.titleName()} de ${CIV_DEFS[Reign.main().id].short}${n > 1 ? ` e +${n - 1}` : ''}`; return r; };
  // não agressão (e reféns): o reino da IA não declara guerra
  const dw0 = Diplo.declareWar.bind(Diplo);
  Diplo.declareWar = function (a, b, why) {
    const R = Reign.R(), pa = G.civs[a] && G.civs[a].ruler === 'player', pb = G.civs[b] && G.civs[b].ruler === 'player';
    if (!pa && pb && (Reign.treaty(a, Reign.main() ? Reign.main().id : b, 'nonagg') || R.hostages.some(id => G.people[id] && G.people[id].alive && G.people[id].hostage === a)) && why !== 'tentativa de assassinato' && why !== 'guerra de sucessão') return;
    if (pa && !pb) { const t = Reign.treaty(a, b, 'nonagg'); if (t) Reign.breakTreaty(b, 'nonagg'); }
    return dw0(a, b, why);
  };
  // exército: vassalos mandam soldados; treino, moral e generais no campo
  const ar0 = War.armyOf.bind(War);
  War.armyOf = function (ci, cfg) {
    const a = ar0(ci, cfg);
    if (G.civs[ci] && G.civs[ci].ruler === 'player') { a.soldiers += Reign.levy(); for (const v of G.civs) if (v.overlord === ci && v.ruler !== 'player') a.soldiers += Math.min(6, Math.floor(v.garrison / 3)); if (Reign.generals().some(g => Reign.genTrait(g) === 'estrategista')) a.cats += 2; }
    return a;
  };
  const dp0 = War.deploy.bind(War);
  War.deploy = function (ci, a, x0, cy, dir) {
    dp0.apply(War, arguments);
    if (!G.civs[ci] || G.civs[ci].ruler !== 'player') return;
    const R = Reign.R(), gs = Reign.generals(), tr = R.army.training, mo = R.army.morale + gs.filter(g => Reign.genTrait(g) === 'veterano').length * 15 + gs.reduce((s, g) => s + (g.hero ? g.hero.fame / 20 : 0), 0);
    const hpM = 1 + tr / 300 + (gs.some(g => Reign.genTrait(g) === 'defensor') ? 0.12 : 0), dmM = 1 + tr / 400 + (gs.some(g => Reign.genTrait(g) === 'agressivo') ? 0.1 : 0);
    const units = War.units(ci).filter(e => e.faction !== 'engine' && !e.battleKing && e.heroP === undefined && !e.recruitDone);
    for (const e of units) { e.recruitDone = true; e.maxHp = Math.round(e.maxHp * hpM); e.hp = e.maxHp; e.dmg = Math.round(e.dmg * dmM); }
    if (mo < 30) { const flee = units.slice(0, Math.floor(units.length * 0.15)); for (const e of flee) e.dead = true; if (flee.length) UI.msg(`🏃 Moral baixa: ${flee.length} soldados fugiram antes da batalha.`, 'bad'); }
  };
  // castelo maior: portão mais forte no cerco
  if (typeof Assault !== 'undefined') { const as0 = Assault.start.bind(Assault); Assault.start = function (wc) { const r = as0(wc); const A = Assault.A(); if (A && G.civs[A.def] && G.civs[A.def].ruler === 'player') { A.gateMax += (Reign.castleLv(A.def) - 1) * 600; A.gateHp = A.gateMax; } return r; }; }
  // castelo maior: torres e brasões a mais
  const ds0 = World.drawStruct.bind(World);
  World.drawStruct = function (ctx, s, X, Y, time) {
    const r = ds0(ctx, s, X, Y, time);
    if (s.type === 'castle' && typeof s.owner === 'number' && G.civs[s.owner] && G.civs[s.owner].ruler === 'player') {
      const lv = Reign.castleLv(s.owner); if (lv <= 1) return r;
      const w = s.w * TILE, col = Game.civColor(s.owner);
      for (let k = 0; k < lv - 1; k++) { const x = X + (k % 2 ? w - 22 - k * 6 : 8 + k * 6), y = Y - 30 - k * 8;
        ctx.fillStyle = '#9a948a'; ctx.fillRect(x, y, 14, 42); ctx.fillStyle = '#6e6a62'; ctx.fillRect(x, y, 4, 42);
        ctx.fillStyle = lv >= 5 ? '#d8b84a' : '#5a4a6a'; ctx.beginPath(); ctx.moveTo(x - 3, y); ctx.lineTo(x + 7, y - 16); ctx.lineTo(x + 17, y); ctx.fill();
        ctx.fillStyle = '#3a2a1a'; ctx.fillRect(x + 6, y - 30, 2, 14); ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x + 8, y - 30); ctx.lineTo(x + 20, y - 26 + Math.sin(time * 4 + k) * 2); ctx.lineTo(x + 8, y - 22); ctx.fill(); }
    }
    return r;
  };
  // janelas
  const op0 = UI.open.bind(UI);
  UI.open = function (title, body, fn, args, sub) { if (fn === 'showKingdom' && Reign.isKing()) body = body.replace('<div class="kpg">', '<div class="kpg"><div class="act-row"><button class="primary" data-act="rgTab" data-t="council">👑 Reinado</button></div>'); return op0(title, body, fn, args, sub); };
  const a0 = UI.act.bind(UI);
  UI.act = function (a, d) {
    if (!a.startsWith('rg')) return a0(a, d);
    const R = Reign.R(), c = Reign.main();
    switch (a) {
      case 'rgTab': Reign.show(d.t); return;
      case 'rgAns': Reign.answer(+d.i); break;
      case 'rgAppoint': Reign.appoint(d.k, +d.p); break;
      case 'rgHear': Reign.hear(+d.k, +d.i); break;
      case 'rgFief': Reign.grantFief(+d.v, +d.p); break;
      case 'rgHonor': Reign.honor(+d.v); break;
      case 'rgRevoke': Reign.revoke(+d.v); break;
      case 'rgNego': { const f = R.fiefs[d.v]; if (c.treasury < 300) { UI.msg('Negociar custa 300 🪙.', 'bad'); break; } c.treasury -= 300; f.rebel = false; f.rebelMonths = 0; f.loyal = 50; UI.msg('🤝 O barão aceitou o acordo e voltou a pagar tributo.', 'gold'); break; }
      case 'rgCrush': { if (c.garrison < 10) { UI.msg('Você precisa de 10 soldados na guarnição.', 'bad'); break; } c.garrison -= 4; Reign.revoke(+d.v); Court.addFame(2); Reign.rep('nobreza', -4); UI.msg('⚔️ A revolta foi esmagada: o feudo voltou à coroa.', 'gold'); break; }
      case 'rgSpy': Reign.plantSpy(+d.c); break;
      case 'rgMis': Reign.mission(+d.c, d.k); break;
      case 'rgPlot': Reign.resolvePlot(+d.i, d.h); break;
      case 'rgTutor': Reign.setTutor(+d.p, d.k); break;
      case 'rgHeir': { R.heir = +d.p; for (const k of Reign.kids()) if (k.id !== R.heir && k.age >= 12) k.resent = (k.resent || 0) + 20; UI.msg(`👑 ${G.people[R.heir].name} é o herdeiro escolhido. Os irmãos não gostaram.`, 'gold'); break; }
      case 'rgSign': Reign.sign(+d.c, d.k); break;
      case 'rgBreak': Reign.breakTreaty(+d.c, d.k); break;
      case 'rgVassal': Reign.demandVassal(+d.c); break;
      case 'rgHostage': Reign.hostage(+d.c); break;
      case 'rgWed': Reign.royalWed(+d.c); break;
      case 'rgBud': R.budget[d.k] = U.clamp(R.budget[d.k] + +d.d, 0, 3); break;
      case 'rgDebase': Reign.debase(); break;
      case 'rgStrong': Reign.strongCoin(); break;
      case 'rgCustoms': R.customs = +d.t; break;
      case 'rgGen': if (R.generals.length < 3) { R.generals.push(+d.p); People.addAff(G.people[+d.p], 10); } break;
      case 'rgGenOff': R.generals = R.generals.filter(id => id !== +d.p); break;
      case 'rgBall': Reign.ball(); break;
      case 'rgTourney': Reign.tourney(); break;
      case 'rgJester': R.court.jester = !R.court.jester; break;
      case 'rgCastle': Reign.upgradeCastle(+d.c); break;
    }
    Reign.show(UI.sel.rgTab);
  };
}
