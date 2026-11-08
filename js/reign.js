'use strict';
// Reinado (Portfólio → 👑 Reinado, montado em reinado.js): governar pessoas e decisões, não só números.
//  • Conselho: o mesmo conselho de cada reino (court.js: tesoureiro, general, espião-mor e diplomata, com os efeitos
//    reais) traz um dilema por mês; a lealdade (amizade) e a ambição de cada um alimentam os complôs.
//  • Audiências: súditos de todos os grupos pedem justiça, favores e terras, acusam alguém ou brigam por herança.
//  • Vassalos e feudos: vilas entregues a nobres pagam tributo e mandam soldados; barões insatisfeitos se revoltam.
//  • Espionagem e complôs: espiões nos outros reinos e o único lugar onde se julgam os complôs (do conselho, dos
//    barões, dos herdeiros, da consorte e das famílias golpistas).
//  • Herdeiros: tutor de guerra, diplomacia, administração ou fé; filhos preteridos guardam rancor.
//  • Diplomacia: não agressão e reinos vassalos (casamento, comércio, tributo e reféns são os Tratados, pacts.js).
//  • Economia de Estado: orçamento por área, a moeda (desvalorizar dá ouro e traz inflação) e alfândega.
//  • Exército: generais com traços, moral, treinamento e deserção.
//  • Corte e legado: o baile real, o bobo da corte, o castelo crescendo em níveis, títulos de Alto Rei e Imperador e a
//    crônica do reinado. (O torneio real é o Grande Torneio da coroa, crown.js.)

const GEN_TRAITS = { agressivo: ['Agressivo', '+10% de dano'], defensor: ['Defensor', '+12% de vida'], estrategista: ['Estrategista', '+2 catapultas de graça'], veterano: ['Veterano', '+15 de moral'] };
const TUTORS = { guerra: ['⚔️', 'Guerra', 'força e liderança: vira general'], diplomacia: ['🤝', 'Diplomacia', 'adulto, melhora as relações com todos os reinos'], admin: ['💰', 'Administração', 'adulto, aumenta a renda do reino em 3%'], fe: ['⛪', 'Fé', 'adulto, agrada o clero todo mês'] };
const CASTLE_LV = [null, null, { stone_block: 60, gold: 400 }, { stone_block: 100, marble_block: 20, gold: 800 }, { marble_block: 40, glass: 20, gold: 1500 }, { marble_block: 80, gold_bar: 10, gold: 3000 }];

const Reign = {
  R() { G.urban = G.urban || {}; return G.urban.reign || (G.urban.reign = { dilemma: null, aud: [], fiefs: {}, spies: {}, plots: [], tutors: {}, heir: null, treaties: [], claims: {}, budget: { army: 1, court: 1, works: 1, church: 1 }, debase: 0, inflUntil: 0, customs: 0, army: { morale: 60, training: 30 }, generals: [], court: { jester: false, ball: -9, castle: {} }, chron: [], title: 0 }); },
  realms() { return G.civs.filter(c => c.ruler === 'player'); },
  main() { const m = G.mainRealm; return (m !== undefined && m !== null && G.civs[m] && G.civs[m].ruler === 'player') ? G.civs[m] : this.realms()[0] || null; },
  isKing() { return this.realms().length > 0; },
  chron(t) { const L = this.R().chron; L.unshift({ d: G.day, t }); if (L.length > 60) L.length = 60; },
  rep(g, n) { if (typeof Society !== 'undefined') Society.rep(g, n); },
  vOf(p) { return p && p.home && p.home.type === 'village' ? World.villages[p.home.idx] : null; },
  // vila livre guarda o civ só como referência: não é do reino
  inRealm(p) { const v = this.vOf(p), cs = this.realms().map(c => c.id); return v ? !v.free && cs.includes(v.civ) : p.home && p.home.type === 'castle' && cs.includes(p.home.civ); },
  // relação entre reinos (Diplo) do seu reino principal com outro; c.relation é a relação pessoal do herói, não do reino
  rel(ci) { const m = this.main(); return m ? Diplo.rel(m.id, ci) : 0; },
  addRel(ci, n) { const m = this.main(); if (m && m.id !== ci) Diplo.addRel(m.id, ci, n); },
  subjects() { return G.people.filter(p => p.alive && p.age >= 18 && !p.kin && !p.capanga && this.inRealm(p)); },
  // ---------------------------------------------------------------- conselho
  // O conselho é um só, por reino: as quatro cadeiras do Court (c.council). O Reinado lê as cadeiras do reino
  // principal (ou do reino pedido) em vez de manter um conselho próprio, que não tinha efeito nenhum na economia.
  member(k, ci) { const c = ci === undefined ? this.main() : G.civs[ci]; return c && c.ruler === 'player' ? Court.member(c.id, k) : null; },
  councilors(ci) { return Object.keys(COUNCIL).map(k => this.member(k, ci)).filter(Boolean); },
  seatName(k, p) { const d = COUNCIL[k]; return d ? (p && p.sex === 'f' ? d.f : d.m) : k; },
  // quem traz cada dilema é uma das quatro cadeiras (o antigo sacerdote não existe mais: a igreja fala com o tesoureiro,
  // que paga as terras e as festas, e as heresias são assunto do espião-mor)
  DILEMMAS: [
    { id: 'colheita', who: 'treasurer', t: 'A colheita falhou em parte do reino. O que fazemos com os celeiros reais?', o: [['Abrir os celeiros ao povo', c => { c.treasury -= 120; c.happy = Math.min(100, c.happy + 8); Reign.rep('povo', 5); return 'O povo agradece de joelhos.'; }], ['Vender o trigo caro', c => { c.treasury += 200; c.happy -= 8; Reign.rep('povo', -6); Reign.rep('mercadores', 3); return 'O tesouro encheu; nas vilas, resmungos.'; }]] },
    { id: 'terras', who: 'treasurer', t: 'O bispo pede terras da coroa para um mosteiro.', o: [['Doar as terras', c => { c.treasury -= 120; Reign.rep('clero', 8); Reign.rep('nobreza', -3); G.piety = (G.piety || 0) + 5; return 'O clero canta o seu nome.'; }], ['Recusar', c => { Reign.rep('clero', -6); return 'O bispo sai calado e ressentido.'; }]] },
    { id: 'soldo', who: 'general', t: 'Os soldados pedem aumento de soldo.', o: [['Pagar o aumento', c => { c.treasury -= 100; Reign.R().army.morale += 15; return 'A tropa vibra.'; }], ['Negar', c => { Reign.R().army.morale -= 15; return 'A tropa murmura nos quartéis.'; }], ['Punir os cabeças', c => { Reign.R().army.morale -= 5; Reign.R().army.training += 5; Reign.rep('povo', -2); return 'A ordem voltou, à força.'; }]] },
    { id: 'espiao', who: 'spy', t: 'Capturamos um espião estrangeiro na capital.', o: [['Executar', c => { const o = Reign.rivalCiv(c); if (o >= 0) Diplo.addRel(c.id, o, -10); Reign.rep('nobreza', 2); return 'Um aviso aos outros reinos.'; }], ['Trocar por ouro', c => { c.treasury += 120; return 'O outro reino pagou caro para tê-lo de volta.'; }], ['Virar agente duplo', c => { const o = Reign.rivalCiv(c); if (o >= 0) Reign.R().spies[o] = { since: G.day }; return 'Agora ele trabalha para nós.'; }]] },
    { id: 'emprestimo', who: 'treasurer', t: 'Banqueiros oferecem um empréstimo à coroa.', o: [['Aceitar 400 🪙 (devolve 480)', c => { const K = Bank.K(c.id); c.treasury += 400; K.debt += 480; K.reserve = Math.max(0, K.reserve - 400); Bank.log(c.id, '🧾 Os banqueiros emprestaram 400 🪙 à coroa (dívida de 480 🪙).'); Reign.rep('mercadores', 3); return 'O tesouro respira (a dívida fica com o banco do reino).'; }], ['Recusar', c => 'Nada de dívidas.']] },
    { id: 'bandidos', who: 'general', t: 'Bandidos atacam aldeias na fronteira.', o: [['Mandar tropas', c => { c.garrison = Math.max(0, c.garrison - 2); c.happy = Math.min(100, c.happy + 5); Court.addFame(2); return 'Os bandidos foram caçados.'; }], ['Ignorar', c => { c.happy -= 6; Reign.rep('povo', -3); return 'As aldeias se sentem abandonadas.'; }]] },
    { id: 'heresia', who: 'spy', t: 'Um pregador diz coisas estranhas nas praças.', o: [['Tolerar', c => { Reign.rep('clero', -5); Reign.rep('povo', 2); return 'O povo gosta de liberdade.'; }], ['Expulsar', c => { Reign.rep('clero', 5); Reign.rep('povo', -2); return 'O pregador foi embora.'; }], ['Levar a julgamento', c => { Reign.rep('clero', 8); Reign.rep('povo', -5); return 'O tribunal da fé decidiu.'; }]] },
    { id: 'monopolio', who: 'treasurer', t: 'Uma guilda pede o monopólio do sal do reino.', o: [['Conceder', c => { c.treasury += 150; Reign.rep('guildas', 6); Reign.rep('mercadores', -5); return 'A guilda pagou bem.'; }], ['Negar', c => { Reign.rep('guildas', -5); Reign.rep('mercadores', 2); return 'Mercado livre.'; }]] },
    { id: 'suspeito', who: 'spy', t: 'Um nobre anda se reunindo às escondidas.', o: [['Vigiar (40 🪙)', c => { c.treasury -= 40; Reign.R().watch = G.day + 3; return 'Olhos atentos nele.'; }], ['Prender', c => { Reign.rep('nobreza', -6); Reign.R().plots = Reign.R().plots.filter(p => p.kind !== 'baron'); return 'Preso. A nobreza estranha.'; }], ['Ignorar', c => 'Deve ser intriga.']] },
    { id: 'muralhas', who: 'general', t: 'As muralhas da capital estão velhas.', o: [['Reformar (200 🪙)', c => { c.treasury -= 200; c.invest.walls = (c.invest.walls || 0) + 1; return 'Muralhas novas: o portão aguenta mais nos cercos.'; }], ['Adiar', c => 'Fica para depois.']] },
    { id: 'santo', who: 'treasurer', t: 'É dia do padroeiro. A igreja pede uma festa.', o: [['Patrocinar (100 🪙)', c => { c.treasury -= 100; c.happy = Math.min(100, c.happy + 6); Reign.rep('clero', 4); return 'Festa bonita.'; }], ['Não patrocinar', c => { Reign.rep('clero', -2); return 'Festa modesta.'; }]] },
    { id: 'embaixada', who: 'diplomat', t: 'Soldados de um reino vizinho cruzaram a fronteira e saquearam uma fazenda. O embaixador deles pede desculpas.', o: [['Aceitar as desculpas', c => { const o = Reign.rivalCiv(c); if (o >= 0) Diplo.addRel(c.id, o, 8); Reign.rep('povo', -2); return 'A paz vale mais que uma fazenda.'; }], ['Exigir reparação (+150 🪙)', c => { const o = Reign.rivalCiv(c); if (o >= 0) { Diplo.addRel(c.id, o, -8); const t = G.civs[o], g = Math.min(150, Math.max(0, Math.floor(t.treasury))); t.treasury -= g; c.treasury += g; } Reign.rep('nobreza', 2); return 'Eles pagaram, de má vontade.'; }]] },
    { id: 'taxanobre', who: 'treasurer', t: 'O tesouro sugere cobrar imposto também da nobreza.', o: [['Cobrar', c => { c.treasury += 180; Reign.rep('nobreza', -8); for (const f of Object.values(Reign.R().fiefs)) f.loyal -= 10; return 'Os nobres pagaram, de cara feia.'; }], ['Isentar', c => { Reign.rep('nobreza', 4); return 'A nobreza agradece.'; }]] },
  ],
  rivalCiv(c) { const o = G.civs.filter(x => x.ruler !== 'player').sort((a, b) => Diplo.rel(c.id, a.id) - Diplo.rel(c.id, b.id))[0]; return o ? o.id : -1; },
  answer(i) {
    const R = this.R(), d = R.dilemma; if (!d) return; const D = this.DILEMMAS.find(x => x.id === d.id), c = G.civs[d.ci]; if (!D || !c) return;
    const res = D.o[i][1](c); c.treasury = Math.max(0, c.treasury);
    // seguir o conselho deixa o conselheiro mais leal (a lealdade é a amizade dele com você)
    const m = this.member(D.who, d.ci); if (m) m.aff = U.clamp((m.aff || 0) + (i === 0 ? 5 : -5), -100, 100);
    R.dilemma = null; this.chron(`${COUNCIL[D.who].icon} ${D.t} — ${D.o[i][0]}.`);
    UI.msg(`👑 ${D.o[i][0]}: ${res}`, 'gold');
  },
  // ---------------------------------------------------------------- audiências
  AUD: [
    { g: 'povo', t: p => `${p.name}, camponês, pede que o imposto baixe: "a família passa fome".`, o: [['Baixar o imposto', c => { c.tax = Math.max(0.05, c.tax - 0.02); Reign.rep('povo', 5); }], ['Negar', c => Reign.rep('povo', -3)]] },
    { g: 'povo', t: p => `${p.name}, viúva, pede ajuda para criar os filhos.`, o: [['Dar 30 🪙', c => { c.treasury -= 30; Reign.rep('povo', 3); Reign.rep('clero', 1); }], ['Mandar ao convento', c => Reign.rep('clero', 1)]] },
    { g: 'mercadores', t: p => `${p.name}, mercador, pede uma estrada calçada até a feira.`, o: [['Pagar 150 🪙', c => { c.treasury -= 150; c.tradeBonus = (c.tradeBonus || 0) + 3; Reign.rep('mercadores', 5); }], ['Negar', c => Reign.rep('mercadores', -3)]] },
    { g: 'nobreza', t: p => `${p.name}, nobre, pede terras para a família.`, o: [['Entregar uma vila como feudo', (c, p) => { const v = Reign.freeVillage(); if (v >= 0) Reign.grantFief(v, p.id); else Reign.rep('nobreza', 1); }], ['Prometer para depois', (c, p) => { People.addAff(p, -5); }], ['Negar', (c, p) => { Reign.rep('nobreza', -3); People.addAff(p, -15); }]] },
    { g: 'clero', t: p => `${p.name}, padre, pede o dízimo obrigatório no reino.`, o: [['Conceder', c => { Reign.rep('clero', 6); Reign.rep('povo', -3); }], ['Negar', c => Reign.rep('clero', -4)]] },
    { g: 'guildas', t: p => `${p.name} pede um alvará para a guilda dela abrir oficinas.`, o: [['Conceder (+60 🪙)', c => { c.treasury += 60; Reign.rep('guildas', 5); }], ['Negar', c => Reign.rep('guildas', -3)]] },
    { g: 'submundo', t: p => `${p.name} implora perdão para um irmão preso por furto.`, o: [['Perdoar', c => { Reign.rep('submundo', 6); Reign.rep('povo', -2); Reign.rep('nobreza', -2); }], ['Negar', c => Reign.rep('submundo', -4)], ['Enforcar o ladrão', c => { Reign.rep('submundo', -8); Reign.rep('povo', 2); }]] },
    { g: 'acusa', t: (p, q) => `${p.name} acusa ${q.name} de roubar as suas ovelhas.`, o: [['Condenar o acusado', (c, p, q) => { People.addAff(q, -20); People.addAff(p, 10); Reign.rep('povo', q.guilty ? 3 : -3); }], ['Absolver', (c, p, q) => { People.addAff(p, -10); People.addAff(q, 10); Reign.rep('povo', q.guilty ? -3 : 3); }], ['Investigar (30 🪙)', (c, p, q) => { c.treasury -= 30; Reign.rep('povo', 4); (q.guilty ? People.addAff(p, 12) : People.addAff(q, 12)); UI.msg(q.guilty ? `🔎 A investigação provou: ${q.name} roubou mesmo.` : `🔎 A investigação provou: ${q.name} é inocente.`, 'gold'); }]] },
    // pedidos que antes chegavam como "Audiência real" da coroa (crown.js): agora são audiências como as outras
    { g: 'povo', t: p => `${p.name} conta que lobos atacam os rebanhos da vila e pede caçadores.`, o: [['Pagar caçadores (80 🪙)', (c, p) => { c.treasury -= 80; c.happy = Math.min(100, c.happy + 3); const v = Reign.vOf(p); if (v) v.prosper = (v.prosper || 0) + 2; Reign.rep('povo', 3); }], ['Recusar', c => { c.happy = Math.max(0, c.happy - 3); Reign.rep('povo', -2); }]] },
    { g: 'povo', t: p => `${p.name} diz que o poço da vila secou e pede um novo.`, o: [['Cavar um poço (70 🪙)', (c, p) => { c.treasury -= 70; c.happy = Math.min(100, c.happy + 3); const v = Reign.vOf(p); if (v) v.prosper = (v.prosper || 0) + 2; Reign.rep('povo', 2); }], ['Recusar', c => { c.happy = Math.max(0, c.happy - 2); Reign.rep('povo', -1); }]] },
    { g: 'clero', t: p => `${p.name}, padre, pede ouro para reformar a capela.`, o: [['Doar à capela (120 🪙)', c => { c.treasury -= 120; c.happy = Math.min(100, c.happy + 4); G.piety = (G.piety || 0) + 8; Reign.rep('clero', 4); }], ['Recusar', c => { c.happy = Math.max(0, c.happy - 2); Reign.rep('clero', -2); }]] },
    // briga de herança entre irmãos (lifesim.js abre esta audiência quando alguém do reino morre): não é sorteada
    { g: 'heranca', only: true, t: (p, q) => `Os irmãos ${p.name} e ${q.name} brigam pela herança da família.`, o: [
      ['Dividir igualmente', (c, p, q) => { for (const x of [p, q]) if (x) { x.feud = null; Mind.feel(x, 'joy', 20); } c.happy = Math.min(100, c.happy + 2); }],
      ['Tudo para o mais velho', (c, p, q) => { if (p && q) { const n = Math.floor(People.purse(q) / 2); q.purse -= n; p.purse = People.purse(p) + n; Mind.feel(q, 'anger', 60); p.feud = q.feud = null; } }],
      ['A coroa fica com a herança', (c, p, q) => { let got = 0; for (const x of [p, q]) if (x) { const n = Math.floor(People.purse(x) / 2); x.purse -= n; got += n; x.feud = null; Mind.feel(x, 'anger', 60); } c.treasury += got; c.happy = Math.max(0, c.happy - 3); }]] },
  ],
  newAudiences() {
    // a briga de herança que chegou neste mês fica; as outras audiências são renovadas
    const R = this.R(), sub = this.subjects(); R.aud = R.aud.filter(a => this.AUD[a.ai] && this.AUD[a.ai].only && G.day - (a.day || 0) <= 1);
    for (let k = 0; k < 2 && sub.length > 2; k++) {
      const pool = this.AUD.map((A, i) => i).filter(i => !this.AUD[i].only), ai = U.pick(pool), A = this.AUD[ai];
      let p = sub.filter(q => (typeof Society !== 'undefined' ? Society.groupOf(q) : 'povo') === A.g)[0] || U.pick(sub), q = null;
      if (A.g === 'acusa') { p = U.pick(sub); q = U.pick(sub.filter(x => x !== p)); q.guilty = Math.random() < 0.5; }
      R.aud.push({ ai, p: p.id, q: q ? q.id : null, day: G.day });
    }
  },
  // dois irmãos do seu reino brigam pela herança: vira uma audiência (antes era um caso do Tribunal do Rei da coroa)
  dispute(a, b, ci) {
    const R = this.R(), ai = this.AUD.findIndex(A => A.g === 'heranca');
    if (ai < 0 || R.aud.some(x => x.ai === ai)) return;
    R.aud.push({ ai, p: a.id, q: b.id, ci, day: G.day });
    UI.msg(`⚖️ Os irmãos ${a.name} e ${b.name} pedem audiência: brigam pela herança (Reinado → Vassalos e audiências).`, 'gold');
  },
  hear(k, i) {
    const R = this.R(), a = R.aud[k]; if (!a) return; const A = this.AUD[a.ai], p = G.people[a.p], q = a.q !== null ? G.people[a.q] : null;
    const c = a.ci !== undefined && G.civs[a.ci] && G.civs[a.ci].ruler === 'player' ? G.civs[a.ci] : this.main();
    if (!A || !p || !c) { R.aud.splice(k, 1); return; }
    A.o[i][1](c, p, q); c.treasury = Math.max(0, c.treasury); R.aud.splice(k, 1);
    this.chron(`⚖️ Audiência: ${A.t(p, q)} — ${A.o[i][0]}.`);
  },
  // ---------------------------------------------------------------- vassalos e feudos
  // feudo só de vila do seu reino (nem vila livre, nem arruinada, nem a que você governa)
  fiefOk(vi) { const v = World.villages[vi]; return !!v && !v.free && !v.ruin && v.lord !== 'player' && !!G.civs[v.civ] && G.civs[v.civ].ruler === 'player'; },
  freeVillage() { return World.villages.findIndex((v, vi) => this.fiefOk(vi) && !this.R().fiefs[vi]); },
  nobles() { return G.people.filter(p => p.alive && p.age >= 20 && !p.kin && !p.capanga && (p.rank === 'knight' || (typeof NOBLE_RANKS !== 'undefined' && NOBLE_RANKS.includes(p.rank) && p.rank !== 'ruler')) && !Object.values(this.R().fiefs).some(f => f.pid === p.id)); },
  grantFief(vi, pid) {
    const v = World.villages[vi], p = G.people[pid]; if (!v || !p) return;
    if (!this.fiefOk(vi)) { UI.msg(`🏰 ${v.name} não é uma vila do seu reino que possa virar feudo.`, 'bad'); return; }
    this.R().fiefs[vi] = { pid, loyal: 65, since: G.day, rank: 0 }; p.baron = vi; People.addAff(p, 20); this.rep('nobreza', 3);
    UI.msg(`🏰 ${People.full(p)} recebeu ${v.name} como feudo: paga tributo todo mês e manda soldados na guerra.`, 'gold'); this.chron(`🏰 ${v.name} virou feudo de ${People.full(p)}.`);
  },
  revoke(vi) { const f = this.R().fiefs[vi]; if (!f) return; const p = G.people[f.pid]; if (p) { People.addAff(p, -40); p.baron = undefined; } delete this.R().fiefs[vi]; this.rep('nobreza', -4); UI.msg(`🏰 Você tomou de volta ${World.villages[vi].name}.`, 'bad'); },
  honor(vi) { const f = this.R().fiefs[vi], c = this.main(); if (!f || c.treasury < 100) { UI.msg('Honrarias custam 100 🪙 do tesouro.', 'bad'); return; } c.treasury -= 100; f.loyal = Math.min(100, f.loyal + 15); f.rank = Math.min(2, (f.rank || 0) + 1); const p = G.people[f.pid]; if (p) People.addAff(p, 10); UI.msg(`🎖️ ${p ? p.name : ''} recebeu honrarias: agora é ${['Barão', 'Conde', 'Marquês'][f.rank]}.`, 'gold'); },
  tribute(vi) { const n = People.residents(vi).length; return Math.round(5 + n * 0.6); },
  levy() { return Math.min(15, Object.values(this.R().fiefs).filter(f => !f.rebel).length * 3); },
  // ---------------------------------------------------------------- espionagem e complôs
  plantSpy(ci) { const c = this.main(); if (c.treasury < 80) { UI.msg('Um espião custa 80 🪙 do tesouro.', 'bad'); return; } c.treasury -= 80; this.R().spies[ci] = { since: G.day }; UI.msg(`🗡️ Um espião se infiltrou na corte de ${CIV_DEFS[ci].short}.`, 'gold'); },
  // força da espionagem (chance por mês de descobrir cada complô): o espião-mor do conselho (competência e lealdade),
  // os espiões nos outros reinos, o bobo da corte e a vigilância pedida no dilema
  spySkill(ci) { const s = this.member('spy', ci), R = this.R(); return (s ? (s.comp || 3) * 4 + U.clamp(s.aff || 0, 0, 100) / 10 : 10) + Object.keys(R.spies).length * 4 + (R.court.jester ? 10 : 0) + (R.watch >= G.day ? 20 : 0); },
  mission(ci, kind) {
    const R = this.R(), c = this.main(), t = G.civs[ci]; if (!R.spies[ci] || !t) return;
    const cost = { sabotage: 100, steal: 60, kill: 300 }[kind], ch = { sabotage: 0.6, steal: 0.65, kill: 0.35 }[kind] + this.spySkill() / 400;
    if (c.treasury < cost) { UI.msg(`A missão custa ${cost} 🪙 do tesouro.`, 'bad'); return; }
    c.treasury -= cost;
    if (Math.random() > ch) { delete R.spies[ci]; Diplo.addRel(c.id, ci, -20); if (kind === 'kill' && !Diplo.atWar(ci, c.id)) Diplo.declareWar(ci, c.id, 'tentativa de assassinato'); UI.msg(`🗡️ O espião foi pego em ${CIV_DEFS[ci].short}! (−20 de relação${kind === 'kill' ? ' e guerra' : ''})`, 'bad', true); this.chron(`🗡️ Espião capturado em ${CIV_DEFS[ci].short}.`); return; }
    if (kind === 'sabotage') { t.garrison = Math.max(0, t.garrison - 3); const l = Math.round(t.treasury * 0.15); t.treasury -= l; UI.msg(`🔥 Sabotagem em ${CIV_DEFS[ci].short}: −3 soldados e −${l} 🪙 no tesouro deles.`, 'gold'); }
    if (kind === 'steal') { const g = Math.min(400, Math.round(t.treasury * 0.1)); t.treasury -= g; c.treasury += g; const noble = G.people.find(p => p.alive && p.home && p.home.type === 'castle' && p.home.civ === ci && p.age >= 18); if (noble && typeof Society !== 'undefined') Society.learn(noble, 'espião'); UI.msg(`💰 O espião roubou ${g} 🪙 de ${CIV_DEFS[ci].short}${noble ? ' e um segredo da corte deles' : ''}.`, 'gold'); }
    if (kind === 'kill') { const v = G.people.find(p => p.alive && p.civ === ci && p.rank === 'heir') || (typeof Heroes !== 'undefined' ? Heroes.of(ci)[0] : null); if (v) { People.die(v, 'envenenado'); UI.msg(`☠️ ${People.full(v)} de ${CIV_DEFS[ci].short} morreu "de repente".`, 'gold', true); this.chron(`☠️ ${People.full(v)} morreu em ${CIV_DEFS[ci].short}, envenenado.`); } }
  },
  // Um só sistema de complôs (R.plots): os do conselho (seat: a cadeira de quem trama, criados pelo Court.dayTick), dos
  // barões, dos herdeiros, da consorte e das famílias golpistas (politics.js). Cada um tem o reino (ci) e o mês em que
  // ataca se ninguém descobrir (ripe). Descobrir e julgar acontece aqui, num lugar só (Reinado → Conselho).
  PLOT_TXT: { embezzle: 'desvia ouro do tesouro', coup: 'reúne nobres para um golpe', poison: 'planeja envenenar você', betray: 'vende os segredos do reino a outra coroa', baron: 'arma os vassalos contra a coroa', heir: 'quer o trono antes da hora', queen: 'conspira com o reino de origem' },
  SEAT_PLOT: { treasurer: 'embezzle', general: 'coup', spy: 'poison', diplomat: 'betray' },
  newPlot(pid, kind, o) {
    const R = this.R(), m = this.main(); o = o || {}; if (R.plots.some(p => p.pid === pid)) return null;
    const pl = { pid, kind, day: G.day, found: false, ci: o.ci !== undefined ? o.ci : m ? m.id : -1, ripe: o.ripe !== undefined ? o.ripe : G.day + 2 };
    if (o.seat) pl.seat = o.seat;
    R.plots.push(pl); return pl;
  },
  plotsOf(ci) { return this.R().plots.filter(x => x.found && (ci === undefined || x.ci === ci)); },
  // quem sai do conselho (preso, exilado, executado ou fugido) deixa a cadeira vaga
  unseat(p) { if (p && p.council && G.civs[p.council.civ]) { const cn = Court.council(p.council.civ); if (cn[p.council.seat] === p.id) cn[p.council.seat] = null; } if (p) p.council = null; },
  resolvePlot(i, how) {
    const R = this.R(), pl = R.plots[i]; if (!pl) return; const p = G.people[pl.pid], c = G.civs[pl.ci], f = p && Families.of(p);
    if (how === 'arrest') { if (p) { p.jail = G.day + 6; People.addAff(p, -40); this.unseat(p); } this.rep('nobreza', -4); UI.msg(`⛓️ ${p ? p.name : 'O conspirador'} foi preso.`, 'gold'); }
    if (how === 'exile') { if (p) { p.home = { type: 'wild' }; People.addAff(p, -60); this.unseat(p); if (f) f.loyalty = Math.max(0, f.loyalty - 20); } this.rep('nobreza', -2); UI.msg(`🚪 ${p ? p.name : 'O conspirador'} foi exilado.`, 'gold'); }
    if (how === 'execute') { if (p && p.alive) { this.unseat(p); People.die(p, 'executado por traição'); } if (f) f.loyalty = Math.max(0, f.loyalty - 40); if (c) c.happy = Math.max(0, c.happy - 4); this.rep('nobreza', -5); UI.msg(`⚔️ ${p ? People.full(p) : 'O conspirador'} foi executado. A família está furiosa.`, 'bad'); }
    if (how === 'pardon') { if (p) { p.aff = Math.max(p.aff || 0, 40); p.amb = Math.max(0, (p.amb || 50) - 30); } this.rep('nobreza', 2); UI.msg(`🕊️ Você perdoou ${p ? p.name : ''}: a lealdade voltou.`, 'gold'); }
    R.plots.splice(i, 1); this.chron(`🗡️ Complô de ${p ? People.full(p) : '?'}: ${{ arrest: 'preso', exile: 'exilado', execute: 'executado', pardon: 'perdoado' }[how]}.`);
  },
  plotStrike(pl) {
    const p = G.people[pl.pid], c = G.civs[pl.ci] && G.civs[pl.ci].ruler === 'player' ? G.civs[pl.ci] : this.main(); if (!p || !p.alive || !c) return;
    // conselheiro: o golpe é o da cadeira dele (o tesoureiro foge com o ouro, o general leva soldados, o diplomata
    // provoca uma guerra, o espião-mor contrata assassinos)
    if (pl.seat) { Court.strike(Object.assign({}, pl, { civ: c.id }), p); this.chron(`🗡️ ${People.full(p)} traiu a coroa.`); return; }
    const msg = { embezzle: () => { const l = Math.round(c.treasury * 0.25); c.treasury -= l; return `${p.name} fugiu com ${l} 🪙 do tesouro!`; }, coup: () => { c.happy -= 10; for (const f of Object.values(this.R().fiefs)) f.loyal -= 15; return `${p.name} tentou um golpe: o reino ficou abalado e os vassalos, divididos.`; },
      poison: () => { P.hp = Math.max(1, Math.round(P.hp * 0.4)); return `Envenenaram a sua taça! Você sobreviveu por pouco. Foi ${p.name}.`; }, baron: () => { for (const f of Object.values(this.R().fiefs)) f.loyal -= 20; return `${p.name} incitou os barões contra você.`; },
      heir: () => { this.rep('nobreza', -6); for (const f of Object.values(this.R().fiefs)) f.loyal -= 10; return `${p.name} tenta ganhar a nobreza para tomar o trono: a corte está dividida.`; }, queen: () => { const l = Math.round(c.treasury * 0.1); c.treasury -= l; return `${p.name} mandou ${l} 🪙 do tesouro para o reino de origem.`; } }[pl.kind];
    if (msg) { const t = msg(); UI.banner('🗡️ Complô!'); UI.msg(`🗡️ ${t}`, 'bad', true); this.chron(`🗡️ ${t}`); }
    p.amb = Math.max(0, (p.amb || 50) - 20);
  },
  // ---------------------------------------------------------------- herdeiros
  kids() { return G.people.filter(c => c.alive && c.kin === 'child'); },
  setTutor(id, k) { const R = this.R(); if (k) R.tutors[id] = k; else delete R.tutors[id]; const c = G.people[id]; UI.msg(k ? `📚 ${c.name} agora estuda ${TUTORS[k][1].toLowerCase()} (25 🪙 por mês).` : `${c.name} ficou sem tutor.`); },
  // ---------------------------------------------------------------- diplomacia
  // Do Reinado ficam só a não agressão e a vassalagem. Comércio (o antigo "livre passagem" era o mesmo ouro do comércio),
  // casamento entre dinastias, tributo e reféns são os Tratados (pacts.js): um sistema só, sem renda em dobro.
  treaty(a, b, kind) { return this.R().treaties.find(t => t.kind === (kind || 'nonagg') && ((t.a === a && t.b === b) || (t.a === b && t.b === a))); },
  sign(ci, kind) {
    const c = this.main(); kind = kind || 'nonagg';
    if (kind !== 'nonagg' || !c || !G.civs[ci] || G.civs[ci].ruler === 'player') return; // tratado com um reino seu não faz sentido
    if (Diplo.atWar(c.id, ci)) { UI.msg(`Em guerra com ${CIV_DEFS[ci].short}: primeiro a paz.`, 'bad'); return; }
    if (this.treaty(c.id, ci, kind)) return;
    this.R().treaties.push({ a: c.id, b: ci, kind, day: G.day }); Diplo.addRel(c.id, ci, 5);
    UI.msg(`📜 Tratado de não agressão assinado com ${CIV_DEFS[ci].short}.`, 'gold'); this.chron(`📜 Tratado com ${CIV_DEFS[ci].short}: não agressão.`);
  },
  breakTreaty(ci, kind) { const R = this.R(), t = this.treaty(this.main().id, ci, kind); if (!t) return; R.treaties = R.treaties.filter(x => x !== t); this.addRel(ci, -15); this.rep('nobreza', -3); for (const o of G.civs) if (o.ruler !== 'player' && o.id !== ci) this.addRel(o.id, -3); UI.msg(`📜 Você rompeu o tratado com ${CIV_DEFS[ci].short}: a sua palavra vale menos agora.`, 'bad'); },
  demandVassal(ci) {
    const c = this.main(), t = G.civs[ci], ratio = Diplo.strength(ci) / Math.max(1, Diplo.strength(c.id));
    if (ratio > 0.7) { UI.msg(`${CIV_DEFS[ci].short} é forte demais para aceitar (força ${Math.round(ratio * 100)}% da sua).`, 'bad'); return; }
    if (Math.random() < 0.85 - ratio) { t.overlord = c.id; Diplo.addRel(c.id, ci, -10); UI.msg(`👑 ${CIV_DEFS[ci].name} aceitou ser vassalo: paga 10% do tesouro por mês e manda soldados nas suas guerras.`, 'gold', true); this.chron(`👑 ${CIV_DEFS[ci].name} virou reino vassalo.`); Diplo.chronicle(`👑 ${CIV_DEFS[ci].name} jurou vassalagem a ${G.name}.`, true); }
    else { Diplo.addRel(c.id, ci, -20); UI.msg(`${CIV_DEFS[ci].short} recusou com desprezo (−20 de relação).`, 'bad'); }
  },
  // ---------------------------------------------------------------- economia de Estado
  debase() { const R = this.R(), c = this.main(); const g = 300 * (R.debase + 1); c.treasury += g; R.debase = Math.min(3, R.debase + 1); R.inflUntil = G.day + 4 * R.debase; for (const x of this.realms()) x.inflation = Math.max(+x.inflation || 0, 4 * R.debase); /* meses: o Crown.monthCiv desconta um por mês */ this.rep('mercadores', -6); this.rep('povo', -4); UI.msg(`🪙 Moeda desvalorizada: +${g} 🪙 no tesouro, mas os preços vão subir por ${4 * R.debase} meses.`, 'bad', true); this.chron(`🪙 A coroa desvalorizou a moeda (+${g} 🪙).`); },
  strongCoin() { const R = this.R(), c = this.main(), cost = 200 * R.debase; if (!R.debase) return; if (c.treasury < cost) { UI.msg(`Recuperar a moeda custa ${cost} 🪙.`, 'bad'); return; } c.treasury -= cost; R.debase = 0; R.inflUntil = 0; for (const x of this.realms()) x.inflation = 0; this.rep('mercadores', 5); UI.msg('🪙 Moeda forte de novo: os preços voltaram ao normal.', 'gold'); },
  budgetCost() { const b = this.R().budget; return (b.army + b.court + b.works + b.church) * 40; },
  customsIncome() { const R = this.R(); return R.customs ? Math.round(R.customs / 100 * (this.realms().reduce((a, x) => a + x.pop, 0) * 0.4 + (G.caravans || []).length * 25)) : 0; },
  // ---------------------------------------------------------------- exército
  genTrait(p) { const ks = Object.keys(GEN_TRAITS); return ks[Math.floor(U.hash2(p.id, 21, 3) * ks.length)]; },
  generals() { return this.R().generals.map(id => G.people[id]).filter(p => p && p.alive); },
  genCands() { const cs = this.realms().map(c => c.id); return G.people.filter(p => p.alive && p.age >= 20 && !this.R().generals.includes(p.id) && ((p.hero && cs.includes(p.hero.civ)) || (p.rank === 'knight' && p.home && cs.includes(p.home.civ)) || (this.R().tutors[p.id] === 'guerra' && p.age >= 16))).slice(0, 6); },
  // ---------------------------------------------------------------- corte
  // o baile real: um só evento da corte (o banquete da coroa entrou nele). Agrada a nobreza, os vassalos, o conselho de
  // cada reino seu e as grandes casas, e o povo festeja junto. O torneio é o Grande Torneio da coroa (crown.js).
  BALL_COST: 250,
  ball() {
    const R = this.R(), c = this.main(); if (!c) return;
    if (G.day - R.court.ball < 3) { UI.msg('O último baile foi há pouco: espere 3 meses.', 'bad'); return; }
    if (c.treasury < this.BALL_COST) { UI.msg(`O baile custa ${this.BALL_COST} 🪙 do tesouro.`, 'bad'); return; }
    c.treasury -= this.BALL_COST; R.court.ball = G.day; this.rep('nobreza', 5);
    for (const f of Object.values(R.fiefs)) f.loyal = Math.min(100, f.loyal + 10);
    for (const x of this.realms()) {
      for (const m of this.councilors(x.id)) m.aff = Math.min(100, (m.aff || 0) + 5);
      for (const y of Families.ranking(x.id)) if (!y.f.player) y.f.loyalty = Math.min(100, y.f.loyalty + 12);
      x.happy = Math.min(100, x.happy + 4);
    }
    UI.banner('💃 Baile real!'); UI.msg('💃 Um baile no castelo: a nobreza dançou até o amanhecer (nobreza +5, vassalos, conselho e grandes casas mais leais, o povo +4).', 'gold'); this.chron('💃 Baile real no castelo.');
  },
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
    const c = this.main();
    // dilema do conselho (o anterior sem resposta: o conselheiro decide por você)
    if (R.dilemma) { const D = this.DILEMMAS.find(x => x.id === R.dilemma.id); if (D) { D.o[0][1](G.civs[R.dilemma.ci] || c); this.chron(`${COUNCIL[D.who].icon} Sem resposta, o conselho (${COUNCIL[D.who].m.toLowerCase()}) decidiu: ${D.o[0][0]}.`); } R.dilemma = null; }
    const D = U.pick(this.DILEMMAS); R.dilemma = { id: D.id, ci: c.id, day: G.day };
    this.newAudiences();
    UI.msg(`👑 O conselho tem um dilema e ${R.aud.length} súditos pedem audiência (Portfólio → 👑 Reinado).`, 'gold');
    // orçamento
    const b = R.budget, cost = this.budgetCost();
    if (c.treasury >= cost) { c.treasury -= cost; R.army.training = Math.min(100, R.army.training + b.army * 4); R.army.morale = Math.min(100, R.army.morale + b.army * 3); for (const f of Object.values(R.fiefs)) f.loyal = Math.min(100, f.loyal + b.court * 2); this.rep('nobreza', b.court * 0.5); this.rep('clero', b.church); G.piety = (G.piety || 0) + b.church; for (const x of this.realms()) for (const v of Diplo.villagesOf(x.id)) v.prosper = (v.prosper || 0) + b.works * 0.6; }
    else { R.army.morale -= 10; UI.msg('👑 O tesouro não cobriu o orçamento: soldo atrasado e obras paradas.', 'bad', true); }
    R.army.training = Math.max(0, R.army.training - 2); R.army.morale = U.clamp(R.army.morale + this.generals().filter(g => this.genTrait(g) === 'veterano').length * 2 - (b.army === 0 && c.garrison > 15 ? 5 : 0), 0, 100);
    if (R.army.morale < 25 && c.garrison > 4) { const n = U.rint(2, 4); c.garrison -= n; UI.msg(`🏃 ${n} soldados desertaram: a moral da tropa está no chão (${Math.round(R.army.morale)}).`, 'bad', true); }
    // moeda e alfândega
    // (a inflação é o contador c.inflation de cada reino, descontado pelo Crown.monthCiv: aqui não se zera nada)
    if (R.customs) { const g = this.customsIncome(); c.treasury += g; this.rep('mercadores', -R.customs / 8); for (const o of G.civs) if (o.ruler !== 'player') Diplo.addRel(c.id, o.id, -R.customs / 20); }
    // não agressão com um reino que passou a ser seu (ou assinada por um reino que você perdeu) acaba
    R.treaties = R.treaties.filter(t => G.civs[t.a] && G.civs[t.a].ruler === 'player' && G.civs[t.b] && G.civs[t.b].ruler !== 'player');
    // cada reino vassalo paga ao reino seu de quem é vassalo (não só ao principal)
    for (const v of G.civs) { const o = v.overlord !== undefined && v.overlord !== null ? G.civs[v.overlord] : null; if (v.ruler !== 'player' && o && o.ruler === 'player') { const g = Math.round(v.treasury * 0.1); v.treasury -= g; o.treasury += g; } }
    // feudos: tributo, lealdade e revoltas
    let rebels = [];
    for (const [vi, f] of Object.entries(R.fiefs)) {
      const p = G.people[f.pid], fv = World.villages[vi];
      // a vila saiu do reino (fronteira, captura, falência) ou o barão morreu: o feudo acaba
      if (!p || !p.alive || !fv || fv.free || !G.civs[fv.civ] || G.civs[fv.civ].ruler !== 'player') { if (p) p.baron = undefined; delete R.fiefs[vi]; continue; }
      f.loyal = U.clamp(f.loyal - 2, 0, 100);
      if (f.rebel) { f.rebelMonths = (f.rebelMonths || 0) + 1; if (f.rebelMonths >= 3) { const v = World.villages[vi], other = G.civs.filter(o => o.ruler !== 'player').sort((a, bb) => U.dist(World.capitals[a.id].x, World.capitals[a.id].y, v.x, v.y) - U.dist(World.capitals[bb.id].x, World.capitals[bb.id].y, v.x, v.y))[0]; if (other) Diplo.captureVillage(v, other.id); delete R.fiefs[vi]; UI.msg(`🏴 ${v.name} se separou do reino com o barão rebelde e jurou lealdade a ${CIV_DEFS[other.id].short}.`, 'bad', true); this.chron(`🏴 ${v.name} se separou do reino.`); } continue; }
      G.civs[fv.civ].treasury += this.tribute(+vi); // o tributo vai para o tesouro do reino da vila
      if (f.loyal < 25) rebels.push(vi);
      if (f.loyal < 20 && Math.random() < 0.3) this.newPlot(f.pid, 'baron', { ci: fv.civ });
    }
    if (rebels.length >= 2 || rebels.some(vi => R.fiefs[vi].loyal < 10)) for (const vi of rebels) if (!R.fiefs[vi].rebel) { R.fiefs[vi].rebel = true; c.happy -= 4; UI.banner('🏴 Revolta dos barões!'); UI.msg(`🏴 O barão de ${World.villages[vi].name} se revoltou: parou de pagar tributo. Negocie ou esmague a revolta em 3 meses (Reinado → Vassalos).`, 'bad', true); this.chron(`🏴 Revolta do barão de ${World.villages[vi].name}.`); }
    // o orçamento da corte agrada (ou desagrada) os conselheiros de todos os seus reinos; os complôs do conselho nascem no
    // Court.dayTick (lealdade baixa e ambição alta); herdeiros ressentidos e a consorte também tramam
    for (const x of this.realms()) for (const m of this.councilors(x.id)) m.aff = U.clamp((m.aff || 0) + (b.court - 1), -100, 100);
    const kids = this.kids();
    for (const k of kids) { if (k.age >= 14 && !R.tutors[k.id] && kids.some(o => R.tutors[o.id])) k.resent = (k.resent || 0) + 5; if (R.heir !== null && R.heir !== k.id && k.age >= 16) k.resent = (k.resent || 0) + 2; if (k.age >= 20 && (k.resent || 0) >= 40 && Math.random() < 0.2) this.newPlot(k.id, 'heir'); }
    const sp = typeof Society !== 'undefined' ? Society.spouse() : null; if (sp && sp.maidenFam !== undefined && (sp.rom || 0) < 25 && Math.random() < 0.08) this.newPlot(sp.id, 'queen');
    // descobrir complôs (o espião-mor do reino, os espiões, o bobo e a vigilância ajudam); os não descobertos atacam no
    // mês marcado (ripe). Complô de quem morreu ou de um reino que deixou de ser seu acaba.
    for (const pl of R.plots.slice()) {
      const p = G.people[pl.pid], pc = G.civs[pl.ci];
      if (!p || !p.alive || (pc && pc.ruler !== 'player')) { R.plots = R.plots.filter(x => x !== pl); continue; }
      if (pl.found) continue;
      if (Math.random() < this.spySkill(pc ? pl.ci : undefined) / 100) { pl.found = true; const sp = this.member('spy', pc ? pl.ci : undefined); UI.banner('🗡️ Complô descoberto!'); UI.msg(`🗡️ ${sp ? `${sp.name}, ${this.seatName('spy', sp).toLowerCase()},` : 'Um informante'} descobriu: ${People.full(p)}${pl.seat ? ` (${this.seatName(pl.seat, p).toLowerCase()})` : ''} ${this.PLOT_TXT[pl.kind] || 'trama contra você'}. Decida o destino em Reinado → Conselho.`, 'gold', true); }
      else if (G.day >= (pl.ripe !== undefined ? pl.ripe : pl.day + 2)) { this.plotStrike(pl); R.plots = R.plots.filter(x => x !== pl); }
    }
    // tutores dos filhos
    for (const [id, k] of Object.entries(R.tutors)) { const kid = G.people[id]; if (!kid || !kid.alive) { delete R.tutors[id]; continue; } if (P.gold >= 25) P.gold -= 25; else continue; Ranking.stats(kid); if (k === 'guerra') kid.str = Math.min(95, kid.str + 1); else kid.int = Math.min(95, kid.int + 1); kid.edu = k; if (kid.age >= 16) { if (k === 'diplomacia') for (const o of G.civs) if (o.ruler !== 'player') Diplo.addRel(c.id, o.id, 0.5); if (k === 'admin') c.treasury += Math.round(Game.civForecast(c).income * 0.03); if (k === 'fe') this.rep('clero', 0.5); } }
    // bobo da corte
    if (R.court.jester) { if (c.treasury >= 15) { c.treasury -= 15; c.happy = Math.min(100, c.happy + 2); } else R.court.jester = false; }
    // castelo: felicidade pelo nível
    for (const x of this.realms()) x.happy = Math.min(100, x.happy + (this.castleLv(x.id) - 1) * 0.5);
    // reivindicações por casamento real: o rei do outro reino morreu?
    for (const [ci, cl] of Object.entries(R.claims)) { const t = G.civs[ci], kid = G.people[cl.kid]; if (!t || t.ruler === 'player' || !kid || !kid.alive) { delete R.claims[ci]; continue; } if (t.rulerId !== cl.ruler) { delete R.claims[ci]; if (Math.random() < 0.5) { Game.becomeRuler(+ci, `Pelo casamento de ${kid.name}, a coroa de ${CIV_DEFS[ci].short} passa à sua dinastia.`); this.chron(`👑 ${CIV_DEFS[ci].name} foi herdado pelo casamento real.`); } else { Diplo.declareWar(+ci, c.id, 'guerra de sucessão'); UI.msg(`⚔️ A nobreza de ${CIV_DEFS[ci].short} não aceitou o direito da sua dinastia: guerra de sucessão!`, 'bad', true); } } }
    // títulos maiores
    const tl = Math.min(3, this.realms().length); if (tl > R.title) { if (tl >= 2) { UI.banner(`👑 ${this.titleName()}!`); UI.msg(`👑 Com ${tl} reinos, você agora é ${this.titleName()}.`, 'gold', true); Court.addFame(10 * tl); this.chron(`👑 ${G.name} se proclamou ${this.titleName()}.`); Diplo.chronicle(`👑 ${G.name} se proclamou ${this.titleName()}.`, true); } R.title = tl; }
  },
  // ---------------------------------------------------------------- quadros do Reinado (reinado.js monta as abas)
  // Cada função devolve um ou mais quadros (.card). O que é da dinastia (orçamento, moeda, alfândega, generais, moral,
  // espiões, herdeiros, baile, bobo, crônica, feudos e audiências) vale para todos os seus reinos e aparece no reino
  // principal; o que é de um reino (castelo) recebe o reino.
  show(tab) { Reinado.go('rg', tab); },
  btn(act, label, extra, dis, cls) { return `<button class="${cls || ''}" data-act="${act}" ${extra || ''} ${dis ? 'disabled' : ''}>${label}</button>`; },
  dilemmaHtml() {
    const R = this.R(), D = R.dilemma && this.DILEMMAS.find(x => x.id === R.dilemma.id), dm = D && this.member(D.who, R.dilemma.ci), esc = UI.esc.bind(UI);
    if (!D) return '<div class="card rn-dilemma"><div class="sec">📜 Dilema do mês</div><p class="muted">Nenhum dilema agora: o conselho se reúne todo mês.</p></div>';
    return `<div class="card rn-dilemma"><div class="sec">${COUNCIL[D.who].icon} ${dm ? `${esc(dm.name)}, ${this.seatName(D.who, dm).toLowerCase()},` : `O conselho (${COUNCIL[D.who].m.toLowerCase()})`} traz um dilema <span>sem resposta, vale a primeira opção</span></div>
      <p><b>${esc(D.t)}</b></p><div class="act-row">${D.o.map((o, i) => this.btn('rgAns', esc(o[0]), `data-i="${i}"`)).join('')}</div></div>`;
  },
  // os complôs descobertos (do conselho, dos barões, dos herdeiros, da consorte e dos golpistas): julgados aqui
  plotsHtml() {
    const R = this.R(), esc = UI.esc.bind(UI), pl = R.plots.filter(p => p.found);
    const rows = pl.map(x => { const i = R.plots.indexOf(x), p = G.people[x.pid];
      return `<div class="rn-row"><span><b>${p ? esc(People.full(p)) : '?'}</b><small>${x.seat ? `${esc(this.seatName(x.seat, p).toLowerCase())} de ${CIV_DEFS[x.ci] ? CIV_DEFS[x.ci].short : '?'} · ` : ''}${this.PLOT_TXT[x.kind] || 'trama contra você'}</small></span>
        <span class="act-row">${this.btn('rgPlot', '⛓️ Prender', `data-i="${i}" data-h="arrest"`)}${this.btn('rgPlot', '🚪 Exilar', `data-i="${i}" data-h="exile"`)}${this.btn('rgPlot', '⚔️ Executar', `data-i="${i}" data-h="execute"`, false, 'danger')}${this.btn('rgPlot', '🕊️ Perdoar', `data-i="${i}" data-h="pardon"`)}</span></div>`; }).join('');
    return `<div class="card rn-plots ${pl.length > 1 ? 'wide' : ''}"><div class="sec">🗡️ Complôs <span>descobrir: ${Math.round(this.spySkill())}% por mês</span></div>${rows || '<p class="muted">Nenhum complô descoberto. O espião-mor, os espiões, o bobo e a vigilância somam a chance de descobrir.</p>'}${typeof Politics !== 'undefined' ? Politics.throneCard() : ''}</div>`;
  },
  // espiões nos outros reinos: uma linha por reino
  spyHtml() {
    const R = this.R(), c = this.main(), b = this.btn.bind(this);
    const rows = G.civs.filter(o => o.ruler !== 'player').map(o => { const s = R.spies[o.id];
      return `<div class="rn-row"><span><b>${Heraldry.armsSvg(o.id, 14)} ${CIV_DEFS[o.id].short}</b><small>${s ? `🛡️ ${o.garrison} · 🪙 ${o.treasury} · 😊 ${Math.round(o.happy)} · ${Diplo.warsOf(o.id).length ? 'em guerra' : 'em paz'} · ${Diplo.rel(o.id, c.id) < -35 ? '<b class="bad">planejam guerra contra você</b>' : 'sem planos contra você'}` : 'sem espião'}</small></span>
        <span class="act-row">${s ? b('rgMis', '🔥 Sabotar 100', `data-c="${o.id}" data-k="sabotage"`) + b('rgMis', '💰 Roubar 60', `data-c="${o.id}" data-k="steal"`) + b('rgMis', '☠️ Herdeiro 300', `data-c="${o.id}" data-k="kill"`, false, 'danger') : b('rgSpy', '🗡️ Infiltrar (80 🪙)', `data-c="${o.id}"`)}</span></div>`; }).join('');
    return `<div class="card rn-spy"><div class="sec">🕵️ Espionagem nos outros reinos <span>${Object.keys(R.spies).length} espião(ões)</span></div><div class="rn-grid3">${rows}</div></div>`;
  },
  audHtml() {
    const R = this.R(), esc = UI.esc.bind(UI);
    const rows = R.aud.map((a, k) => { const A = this.AUD[a.ai], p = G.people[a.p], q = a.q !== null ? G.people[a.q] : null; if (!A || !p || (a.q !== null && !q)) return '';
      return `<div class="rn-aud"><small>${typeof SOC_GROUPS !== 'undefined' && SOC_GROUPS[A.g] ? SOC_GROUPS[A.g].icon + ' ' + SOC_GROUPS[A.g].name : A.g === 'heranca' ? '📜 Herança' : '⚖️ Acusação'}</small><p>${esc(A.t(p, q))}</p><div class="act-row">${A.o.map((o, i) => this.btn('rgHear', esc(o[0]), `data-k="${k}" data-i="${i}"`)).join('')}</div></div>`; }).join('');
    return `<div class="card rn-auds wide"><div class="sec">⚖️ Audiências <span>${R.aud.length ? `${R.aud.length} súdito(s)` : 'ninguém agora'}</span></div>${rows ? `<div class="rn-grid2">${rows}</div>` : '<p class="muted">Ninguém pede audiência agora. Os súditos voltam no mês que vem.</p>'}</div>`;
  },
  fiefsHtml() {
    const R = this.R(), esc = UI.esc.bind(UI), b = this.btn.bind(this), F = Object.entries(R.fiefs);
    const rows = F.map(([vi, f]) => { const p = G.people[f.pid], v = World.villages[vi];
      return `<div class="rn-row"><span><b>🏰 ${esc(v.name)} <i class="${f.rebel || f.loyal < 25 ? 'bad' : 'ok'}">${f.rebel ? 'EM REVOLTA' : 'lealdade ' + Math.round(f.loyal)}</i></b><small>${['Barão', 'Conde', 'Marquês'][f.rank || 0]} ${p ? esc(People.full(p)) : '?'} · tributo ${this.tribute(+vi)} 🪙/mês</small></span>
        <span class="act-row">${f.rebel ? b('rgNego', 'Negociar 300', `data-v="${vi}"`) + b('rgCrush', 'Esmagar (10 soldados)', `data-v="${vi}"`) : b('rgHonor', '🎖️ Honrarias 100', `data-v="${vi}"`) + b('rgRevoke', 'Tomar de volta', `data-v="${vi}"`)}</span></div>`; }).join('');
    const free = World.villages.map((v, vi) => ({ v, vi })).filter(x => this.fiefOk(x.vi) && !R.fiefs[x.vi]), nb = this.nobles().slice(0, 2);
    const grant = free.length && nb.length ? free.slice(0, 4).map(x => `<div class="rn-row"><span><b>🏘️ ${esc(x.v.name)}</b><small>tributo ${this.tribute(x.vi)} 🪙/mês</small></span><span class="act-row">${nb.map(p => b('rgFief', `a ${esc(p.name)}`, `data-v="${x.vi}" data-p="${p.id}"`)).join('')}</span></div>`).join('') : '';
    return `<div class="card rn-fiefs"><div class="sec">🏰 Vassalos <span>${F.length} feudo(s) · ${this.levy()} soldados nas guerras</span></div>${rows || '<p class="muted">Nenhum feudo ainda.</p>'}
      <small class="muted">A lealdade cai todo mês: honrarias, bailes e o orçamento da corte seguram os barões. Dois insatisfeitos (ou um furioso) se revoltam.</small></div>
      ${grant ? `<div class="card rn-grant"><div class="sec">🎁 Entregar uma vila como feudo</div>${grant}</div>` : ''}`;
  },
  heirsHtml() {
    const R = this.R(), esc = UI.esc.bind(UI), K = this.kids();
    const rows = K.map(k => { const t = R.tutors[k.id]; Ranking.stats(k);
      return `<div class="rn-heir"><b>${k.sex === 'f' ? '👧' : '👦'} ${esc(k.name)} <small>${k.age} anos · 💪 ${k.str} · 🧠 ${k.int}${R.heir === k.id ? ' · 👑 herdeiro' : ''}${(k.resent || 0) >= 30 ? ' · <i class="bad">ressentido</i>' : ''}</small></b>
        <span class="act-row">${Object.entries(TUTORS).map(([key, x]) => `<button class="${t === key ? 'primary' : ''}" data-act="rgTutor" data-p="${k.id}" data-k="${t === key ? '' : key}" title="${x[2]}">${x[0]} ${x[1]}</button>`).join('')}${R.heir !== k.id ? this.btn('rgHeir', '👑 Herdeiro', `data-p="${k.id}"`) : ''}</span></div>`; }).join('');
    return `<div class="card rn-heirs"><div class="sec">📚 Herdeiros e tutores <span>tutor: 25 🪙/mês do seu ouro</span></div>${rows || '<p class="muted">Você ainda não tem filhos.</p>'}${rows ? '<small class="muted">Irmãos sem tutor (quando outro tem) e preteridos na sucessão guardam rancor.</small>' : ''}</div>`;
  },
  // diplomacia do Reinado com um reino: não agressão e vassalagem (só o reino principal assina)
  diploActs(o) {
    const c = this.main(), na = !!this.treaty(c.id, o.id, 'nonagg');
    return (na ? this.btn('rgBreak', '📜 Romper não agressão', `data-c="${o.id}" data-k="nonagg"`) : this.btn('rgSign', '📜 Não agressão', `data-c="${o.id}" data-k="nonagg"`, Diplo.atWar(c.id, o.id)))
      + (o.overlord === c.id ? '' : this.btn('rgVassal', '👑 Vassalagem', `data-c="${o.id}" title="Exigir que o reino vire seu vassalo"`));
  },
  budgetHtml() {
    const R = this.R(), b = R.budget, row = (k, n, d) => `<div class="rn-bud"><span><b>${n}</b><small>${d}</small></span><span class="wc-step"><button data-act="rgBud" data-k="${k}" data-d="-1" ${b[k] <= 0 ? 'disabled' : ''}>−</button><b>${b[k]}</b><button data-act="rgBud" data-k="${k}" data-d="1" ${b[k] >= 3 ? 'disabled' : ''}>+</button></span></div>`;
    return `<div class="card rn-budget"><div class="sec">📊 Orçamento, moeda e alfândega <span>o orçamento só sai se houver ouro</span></div><div class="rn-grid2">${row('army', '⚔️ Exército', 'treino e moral')}${row('court', '🎭 Corte', 'lealdade de vassalos e nobres')}${row('works', '🏗️ Obras', 'vilas crescem mais rápido')}${row('church', '⛪ Igreja', 'clero e fé')}</div>${this.moneyHtml()}</div>`;
  },
  // a moeda e a alfândega (dentro do quadro do orçamento)
  moneyHtml() {
    const R = this.R(), c = this.main();
    return `<div class="rn-money rn-grid2"><div><div class="law-h">🪙 Moeda <small>${R.debase ? `desvalorizada (nível ${R.debase})${c && c.inflation ? ` · inflação ${c.inflation} meses` : ''}` : 'forte'}</small></div><p class="dt-desc">Desvalorizar enche o tesouro na hora (+${300 * (R.debase + 1)} 🪙), mas os preços sobem por meses e mercadores e povo não gostam.</p>
        <div class="act-row">${this.btn('rgDebase', '🪙 Desvalorizar', '', R.debase >= 3)}${R.debase ? this.btn('rgStrong', `Moeda forte (${200 * R.debase} 🪙)`) : ''}</div></div>      <div><div class="law-h">🛃 Alfândega <small>${R.customs}%</small></div><p class="dt-desc">Tarifa nas fronteiras: rende ouro com o comércio, mas mercadores e vizinhos não gostam.</p><div class="act-row">${[0, 5, 10, 15].map(t => `<button class="${R.customs === t ? 'primary' : ''}" data-act="rgCustoms" data-t="${t}">${t}%</button>`).join('')}</div></div></div>`;
  },
  troopHtml() {
    const A = this.R().army, bar = v => `<span class="rn-bar"><i style="width:${U.clamp(v, 0, 100)}%"></i></span>`;
    return `<div class="card rn-troop"><div class="sec">⚔️ Tropa <span>o orçamento do exército sustenta</span></div><div class="rn-meter"><span>Moral</span>${bar(A.morale)}<b class="${A.morale < 30 ? 'bad' : ''}">${Math.round(A.morale)}</b></div><div class="rn-meter"><span>Treino</span>${bar(A.training)}<b>${Math.round(A.training)}</b></div>
      <small class="muted">Treino deixa os soldados mais fortes; moral baixa faz parte da tropa fugir e, abaixo de 25, soldados desertam.</small></div>`;
  },
  generalsHtml() {
    const esc = UI.esc.bind(UI), gs = this.generals();
    return `<div class="card rn-gens"><div class="sec">🎖️ Generais <span>${gs.length}/3 · bônus no campo de batalha</span></div>${gs.map(g => `<div class="rn-row"><span><b>${esc(People.full(g))}</b><small>${GEN_TRAITS[this.genTrait(g)][0]} (${GEN_TRAITS[this.genTrait(g)][1]})${g.hero ? ` · ⭐ ${esc(g.hero.epi)}` : ''}</small></span><span class="act-row">${this.btn('rgGenOff', 'Dispensar', `data-p="${g.id}"`)}</span></div>`).join('') || '<p class="muted">Nenhum general.</p>'}
      ${gs.length < 3 && this.genCands().length ? `<div class="act-row">${this.genCands().slice(0, 4).map(p => this.btn('rgGen', `Nomear ${esc(p.name)} (${GEN_TRAITS[this.genTrait(p)][0]})`, `data-p="${p.id}"`)).join('')}</div>` : ''}</div>`;
  },
  // o baile e o bobo entram na grade das festas e cerimônias da Corte (uma linha cada)
  ballHtml() { return `<div class="rn-it"><span class="rn-ic">💃</span><span class="rn-t"><b>Baile real</b><small>Nobreza, vassalos, conselho e grandes casas mais leais; o povo festeja (+4) · ${this.BALL_COST} 🪙 · a cada 3 meses</small></span>${this.btn('rgBall', 'Dar um baile', '', false, 'primary')}</div>`; },
  jesterHtml() { const R = this.R(); return `<div class="rn-it ${R.court.jester ? 'on' : ''}"><span class="rn-ic">🃏</span><span class="rn-t"><b>Bobo da corte</b><small>O povo ri (+felicidade) e ele ouve tudo nos corredores (descobre complôs) · 15 🪙/mês</small></span><button class="${R.court.jester ? '' : 'primary'}" data-act="rgJester">${R.court.jester ? '✔ Contratado' : 'Contratar'}</button></div>`; },
  castleHtml(ci) {
    const lv = this.castleLv(ci), nx = CASTLE_LV[lv + 1];
    return `<div class="rn-it"><span class="rn-ic">🏰</span><span class="rn-t"><b>Castelo de ${CIV_DEFS[ci].short} <i>nível ${lv}/5</i></b><small>${nx ? `${nx.gold} 🪙 do tesouro + ${Object.entries(nx).filter(([k]) => k !== 'gold').map(([k, n]) => `${n} ${ITEMS[k].name}`).join(', ')} da mochila · torres, felicidade, fama e portão mais forte` : 'Nível máximo.'}</small></span>${nx ? this.btn('rgCastle', `Nível ${lv + 1}`, `data-c="${ci}"`, false, 'primary') : '<span class="ok">✔</span>'}</div>`;
  },
  chronHtml() {
    const R = this.R(), esc = UI.esc.bind(UI);
    return `<div class="card rn-chron"><div class="sec">📜 Crônica do reinado <span>${R.chron.length}</span></div>${R.chron.length ? `<div class="rn-chr">${R.chron.slice(0, 8).map(x => `<div><small>${Calendar.short(x.d)}</small> ${esc(x.t)}</div>`).join('')}</div>` : '<p class="muted">O seu reinado ainda não tem história.</p>'}</div>`;
  },
};

// ------------------------------------------------------------------ ganchos
{
  const mt0 = Lifesim.monthTick.bind(Lifesim);
  Lifesim.monthTick = function () { mt0(); Reign.monthTick(); };
  // títulos maiores no painel do herói
  const pt0 = Game.playerTitle.bind(Game);
  Game.playerTitle = function () { const r = pt0(); const n = Reign.realms().length; if (r && r.king && n >= 2) r.text = `${Reign.titleName()} de ${CIV_DEFS[Reign.main().id].short}${n > 1 ? ` e +${n - 1}` : ''}`; return r; };
  // não agressão: o reino da IA não declara guerra (os reféns que seguram a guerra são os dos Tratados, pacts.js)
  const dw0 = Diplo.declareWar.bind(Diplo);
  Diplo.declareWar = function (a, b, why) {
    const pa = G.civs[a] && G.civs[a].ruler === 'player', pb = G.civs[b] && G.civs[b].ruler === 'player';
    if (!pa && pb && Reign.treaty(a, Reign.main() ? Reign.main().id : b, 'nonagg') && why !== 'tentativa de assassinato' && why !== 'guerra de sucessão') return;
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
  const a0 = UI.act.bind(UI);
  UI.act = function (a, d) {
    if (!a.startsWith('rg')) return a0(a, d);
    const R = Reign.R(), c = Reign.main();
    switch (a) {
      case 'rgTab': Reign.show(d.t); return;
      case 'rgAns': Reign.answer(+d.i); break;
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
      case 'rgBud': R.budget[d.k] = U.clamp(R.budget[d.k] + +d.d, 0, 3); break;
      case 'rgDebase': Reign.debase(); break;
      case 'rgStrong': Reign.strongCoin(); break;
      case 'rgCustoms': R.customs = +d.t; break;
      case 'rgGen': if (R.generals.length < 3) { R.generals.push(+d.p); People.addAff(G.people[+d.p], 10); } break;
      case 'rgGenOff': R.generals = R.generals.filter(id => id !== +d.p); break;
      case 'rgBall': Reign.ball(); break;
      case 'rgJester': R.court.jester = !R.court.jester; break;
      case 'rgCastle': Reign.upgradeCastle(+d.c); break;
    }
    Reinado.refresh(); // a mesma página do Reinado, com o que mudou
  };
}
