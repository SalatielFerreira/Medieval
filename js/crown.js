'use strict';
// A coroa do jogador: decretos (leis que ficam em vigor, com custo mensal e efeito no reino) e ações de soberano
// (banquete, torneio real, sagrar cavaleiros, exigir tributo, cunhar moedas, monumento e audiências com o povo).
// Tudo fica guardado no próprio reino (G.civs[ci]): decrees, crownCd, inflation, monument.

const DECREES = {
  colheita: { icon: '🌾', name: 'Subsídio da colheita', cost: 40, desc: '+25% de trigo nas fazendas do reino.' },
  feira:    { icon: '⚖️', name: 'Feira livre', cost: 0, desc: '+15% na arrecadação de impostos, mas o povo reclama (−3 de felicidade).' },
  escolas:  { icon: '📚', name: 'Escolas do reino', cost: 60, desc: 'Os jovens estudam: a inteligência do povo sobe todo mês (+2 de felicidade).' },
  servico:  { icon: '🛡️', name: 'Serviço militar', cost: 0, desc: '+1 soldado na guarnição por mês, sem custo. O povo não gosta (−4).' },
  pao:      { icon: '🥖', name: 'Pão e circo', cost: 90, desc: 'Comida e festas para o povo: +7 de felicidade.' },
  ronda:    { icon: '🔦', name: 'Ronda noturna', cost: 50, desc: 'Acampamentos de bandidos destruídos no reino demoram 3× mais para voltar (+1).' },
  caridade: { icon: '🤲', name: 'Casas de caridade', cost: 45, desc: 'Mendigos do reino ganham teto e trabalho e viram camponeses (+2).' },
};
const DECREE_HAPPY = { feira: -3, escolas: 2, servico: -4, pao: 7, ronda: 1, caridade: 2 };

const PETITIONS = [
  { id: 'casas', icon: '🏚️', text: v => `Os moradores de ${v.name} pedem ajuda para consertar as casas.`, cost: 150, yes: 'Pagar o conserto', no: 'Recusar',
    ok: (c, v) => { c.happy = Math.min(100, c.happy + 5); v.prosper = (v.prosper || 0) + 3; return `${v.name} agradece: as casas foram consertadas (+5 de felicidade).`; },
    deny: c => { c.happy = Math.max(0, c.happy - 3); return 'O povo sai da audiência desapontado (−3).'; } },
  { id: 'capela', icon: '⛪', text: v => `O padre de ${v.name} pede ouro para reformar a capela.`, cost: 120, yes: 'Doar à capela', no: 'Recusar',
    ok: (c, v) => { c.happy = Math.min(100, c.happy + 4); if (typeof Faith !== 'undefined') G.piety = (G.piety || 0) + 8; return `A capela de ${v.name} foi reformada (+4 de felicidade, +8 de devoção).`; },
    deny: c => { c.happy = Math.max(0, c.happy - 2); return 'O padre lamenta a sua decisão (−2).'; } },
  { id: 'viuva', icon: '🕯️', text: v => `Uma viúva de ${v.name} pede uma pensão para criar os filhos.`, cost: 60, yes: 'Conceder pensão', no: 'Recusar',
    ok: c => { c.happy = Math.min(100, c.happy + 2); Court.addFame(4); return 'A história da sua bondade corre o reino (+2 de felicidade, +4 de fama).'; },
    deny: c => { c.happy = Math.max(0, c.happy - 1); return 'A viúva vai embora em silêncio.'; } },
  { id: 'cobrador', icon: '🧾', text: () => 'Um camponês acusa o cobrador de impostos de roubar o povo.', cost: 50, yes: 'Investigar', no: 'Ignorar',
    ok: (c) => { const t = Court.member(c.id, 'treasurer'); if (t && t.corrupt && !t.exposed) { t.exposed = true; return `A investigação descobriu: ${t.name} desviava o tesouro! Decida o destino del${t.sex === 'f' ? 'a' : 'e'} no Conselho.`; } c.happy = Math.min(100, c.happy + 3); return 'A investigação não achou roubo, mas o povo gostou de ser ouvido (+3).'; },
    deny: c => { c.happy = Math.max(0, c.happy - 4); return 'O povo acha que a coroa protege os ladrões (−4).'; } },
  { id: 'ponte', icon: '🌉', text: v => `Os mercadores de ${v.name} pedem ouro para melhorar as estradas e pontes.`, cost: 200, yes: 'Financiar as obras', no: 'Recusar',
    ok: (c, v) => { c.happy = Math.min(100, c.happy + 3); v.prosper = (v.prosper || 0) + 4; c.tradeBonus = (c.tradeBonus || 0) + 3; return `Estradas melhores: ${v.name} prospera e o comércio rende mais por 3 meses.`; },
    deny: c => { c.happy = Math.max(0, c.happy - 2); return 'Os mercadores reclamam pelas tavernas (−2).'; } },
];

const Crown = {
  mine(ci) { const c = G.civs[ci]; return !!c && c.ruler === 'player'; },
  dec(c) { return c.decrees || (c.decrees = {}); },
  on(c, k) { return !!(c && c.decrees && c.decrees[k] && !c.decreeOff); },
  // ------------------------------------------------------------ efeitos dos decretos (lidos pela economia do reino)
  wheatMul(c) { return this.on(c, 'colheita') ? 1.25 : 1; },
  incomeMul(c) { return (this.on(c, 'feira') ? 1.15 : 1) * ((c && c.tradeBonus) ? 1.1 : 1); },
  happyBonus(c) { if (!c || c.ruler !== 'player') return 0; let h = c.monument ? 4 * c.monument : 0; for (const k in DECREE_HAPPY) if (this.on(c, k)) h += DECREE_HAPPY[k]; if (c.inflation) h -= 4; return h; },
  priceMul(ci) { const c = G.civs[ci]; return c && c.inflation ? 1.15 : 1; },
  campDelay(x, y) { if (!World.inb(x, y)) return 1; const ci = World.terr[World.idx(x, y)]; return ci >= 0 && this.on(G.civs[ci], 'ronda') ? 3 : 1; },
  upkeep(c) { let n = 0; for (const k in DECREES) if (c.decrees && c.decrees[k]) n += DECREES[k].cost; return n; },
  toggle(ci, k) {
    const c = G.civs[ci]; if (!this.mine(ci) || !DECREES[k]) return;
    const d = this.dec(c); d[k] = !d[k];
    UI.msg(`${DECREES[k].icon} ${d[k] ? 'Decreto assinado' : 'Decreto revogado'}: ${DECREES[k].name}.`, d[k] ? 'gold' : '');
    if (d[k]) Progress.diary(`${DECREES[k].icon} Decretou em ${CIV_DEFS[ci].short}: ${DECREES[k].name}.`);
  },
  // ------------------------------------------------------------ um mês no reino do jogador (chamado pela economia)
  monthCiv(c) {
    if (c.ruler !== 'player') return;
    const cost = this.upkeep(c);
    if (cost) {
      if (c.treasury >= cost) { c.treasury -= cost; c.decreeOff = false; }
      else { c.decreeOff = true; UI.msg(`⚠️ ${CIV_DEFS[c.id].short}: o tesouro não pagou os decretos (${cost} 🪙). Eles ficam suspensos até haver ouro.`, 'bad'); }
    }
    if (this.on(c, 'servico') && c.garrison < Game.maxGarrison(c)) c.garrison++;
    const people = Families.civPeople(c.id);
    if (this.on(c, 'escolas')) for (const p of people.filter(q => q.age >= 6 && q.age < 30).sort(() => Math.random() - 0.5).slice(0, 8)) { Ranking.stats(p); p.int = Math.min(99, p.int + 2); }
    if (this.on(c, 'caridade')) for (const p of people.filter(q => q.rank === 'beggar').slice(0, 2)) { p.rank = 'peasant'; People.addAff(p, 10); }
    if (c.inflation) c.inflation--;
    if (c.tradeBonus) c.tradeBonus--;
    // de vez em quando alguém do povo pede uma audiência
    if (!G.petition && Math.random() < 0.45) this.newPetition(c.id);
  },
  // ------------------------------------------------------------ ações de soberano
  cd(c, k) { return Math.max(0, ((c.crownCd || {})[k] || -99) - G.day); },
  setCd(c, k, months) { c.crownCd = c.crownCd || {}; c.crownCd[k] = G.day + months; },
  ACTIONS: {
    banquete: { icon: '🍷', name: 'Banquete real', cost: 300, cd: 4, desc: 'Convida as grandes casas do reino: +12 de lealdade em todas e +4 de felicidade.' },
    torneio:  { icon: '🏟️', name: 'Grande Torneio real', cost: 500, cd: 8, desc: 'O Grande Torneio acontece na sua capital: +8 de felicidade, +15 de fama e melhores relações com os reinos vizinhos.' },
    cunhar:   { icon: '🪙', name: 'Cunhar moedas', cost: 0, cd: 6, desc: '+600 🪙 no tesouro agora, mas a inflação deixa tudo 15% mais caro e o povo descontente por 4 meses.' },
    monumento:{ icon: '🗿', name: 'Erguer um monumento', cost: 2000, cd: 0, desc: 'Uma grande estátua na capital: +4 de felicidade para sempre e +30 de fama (até 3 monumentos).' },
  },
  act(ci, k) {
    const c = G.civs[ci], a = this.ACTIONS[k];
    if (!this.mine(ci) || !a) return false;
    if (this.cd(c, k)) { UI.msg(`Ainda faltam ${this.cd(c, k)} meses para repetir: ${a.name}.`, 'bad'); return false; }
    if (c.treasury < a.cost) { UI.msg(`O tesouro do reino não tem ${a.cost} 🪙.`, 'bad'); return false; }
    if (k === 'monumento' && (c.monument || 0) >= 3) { UI.msg('O reino já tem três monumentos.', 'bad'); return false; }
    if (k === 'torneio' && Arena.tourney()) { UI.msg('Já há um Grande Torneio acontecendo neste ano.', 'bad'); return false; }
    c.treasury -= a.cost;
    if (a.cd) this.setCd(c, k, a.cd);
    const name = CIV_DEFS[ci].short;
    if (k === 'banquete') {
      for (const x of Families.ranking(ci)) if (!x.f.player) x.f.loyalty = Math.min(100, x.f.loyalty + 12);
      c.happy = Math.min(100, c.happy + 4);
      UI.banner('🍷 Banquete real!'); UI.msg(`As grandes casas de ${name} brindam à sua saúde (+12 de lealdade).`, 'gold');
    } else if (k === 'torneio') {
      G.tourney = { ci, until: G.day + 1, round: 0, out: false, won: false };
      c.happy = Math.min(100, c.happy + 8); Court.addFame(15);
      for (const o of G.civs) if (o.id !== ci && !Diplo.atWar(ci, o.id)) Diplo.addRel(ci, o.id, 6);
      Diplo.chronicle(`🏟️ ${G.name} ${G.surname} organiza o Grande Torneio real em ${name}!`, true);
      UI.banner('🏟️ Grande Torneio real!');
    } else if (k === 'cunhar') {
      c.treasury += 600; c.inflation = 4; c.happy = Math.max(0, c.happy - 8);
      UI.msg(`🪙 A casa da moeda de ${name} cunhou 600 🪙. Os preços sobem nos próximos meses.`, 'gold');
    } else if (k === 'monumento') {
      c.monument = (c.monument || 0) + 1; Court.addFame(30);
      UI.banner('🗿 Um monumento foi erguido!'); UI.msg(`O povo de ${name} admira o novo monumento (+4 de felicidade para sempre).`, 'gold');
      Progress.diary(`🗿 Ergueu um monumento em ${name}.`);
    }
    Sound.play('coin');
    return true;
  },
  // sagrar cavaleiro: um homem ou mulher forte do povo entra para a corte
  knightCandidates(ci) {
    return Families.civPeople(ci).filter(p => p.alive && p.age >= 18 && p.age <= 50 && !People.isCourt(p) && !p.capanga && !p.kin && p.spouse !== 'player' && !p.port &&
      (p.job === undefined || p.job === null) && !['merchant', 'smith', 'lumber', 'mason', 'innkeeper', 'priest'].includes(p.rank))
      .map(p => Ranking.stats(p)).sort((a, b) => b.str - a.str).slice(0, 5);
  },
  knight(ci, id) {
    const c = G.civs[ci], p = G.people[id];
    if (!this.mine(ci) || !p || !p.alive || c.treasury < 150) return false;
    c.treasury -= 150;
    p.rank = 'knight'; p.home = { type: 'castle', civ: ci }; p.civ = ci; People.addAff(p, 30); p.met = true;
    p.str = Math.min(99, (p.str || 50) + 8);
    const f = Families.of(p); if (f && !f.player) { f.loyalty = Math.min(100, f.loyalty + 20); f.favor = (f.favor || 0) + 10; }
    const e = G.spawned.get(p.id); if (e) { e.dead = true; G.spawned.delete(p.id); }
    UI.banner(`🗡️ ${p.sex === 'f' ? 'Dama' : 'Cavaleiro'} ${p.name}!`);
    UI.msg(`${People.full(p)} foi sagrad${p.sex === 'f' ? 'a Dama Cavaleira' : 'o Cavaleiro'} e agora serve no castelo de ${CIV_DEFS[ci].short}.`, 'gold');
    Progress.diary(`🗡️ Sagrou ${People.full(p)} ${p.sex === 'f' ? 'Dama Cavaleira' : 'Cavaleiro'}.`);
    return true;
  },
  // exigir tributo de um reino mais fraco (se ele for forte, recusa e pode haver guerra)
  demand(ci, oi) {
    const c = G.civs[ci], o = G.civs[oi];
    if (!this.mine(ci) || !o || o.ruler === 'player' || Diplo.atWar(ci, oi)) return false;
    c.crownCd = c.crownCd || {};
    if ((c.crownCd['trib' + oi] || -99) > G.day) { UI.msg(`${CIV_DEFS[oi].short} já foi pressionado há pouco tempo.`, 'bad'); return false; }
    c.crownCd['trib' + oi] = G.day + 6;
    const ratio = Diplo.strength(ci) / Math.max(1, Diplo.strength(oi));
    if (ratio >= 1.3) {
      const g = Math.max(80, Math.min(400, Math.round(o.treasury * 0.3)));
      o.treasury = Math.max(0, o.treasury - g); c.treasury += g; Diplo.addRel(ci, oi, -15);
      UI.msg(`📜 ${CIV_DEFS[oi].short} teme o seu exército e paga ${g} 🪙 de tributo (−15 de relação).`, 'gold');
      Diplo.chronicle(`📜 ${CIV_DEFS[oi].short} pagou tributo a ${CIV_DEFS[ci].short}.`);
    } else {
      Diplo.addRel(ci, oi, -25);
      if (Math.random() < 0.3) { Diplo.declareWar(oi, ci, 'tributo exigido com arrogância'); UI.msg(`⚔️ ${CIV_DEFS[oi].short} se ofendeu e declarou guerra!`, 'bad'); }
      else UI.msg(`${CIV_DEFS[oi].short} recusa: o seu exército não os assusta (−25 de relação).`, 'bad');
    }
    return true;
  },
  // ------------------------------------------------------------ audiências com o povo
  newPetition(ci) {
    const vs = World.villages.map((v, vi) => ({ v, vi })).filter(x => x.v.civ === ci && !x.v.free);
    if (!vs.length) return;
    const t = U.pick(PETITIONS), x = U.pick(vs);
    G.petition = { ci, vi: x.vi, id: t.id, day: G.day };
    UI.msg(`🔔 Audiência real: ${t.text(x.v)} Veja em Reino → ${CIV_DEFS[ci].short} → Decretos e ações.`, 'gold');
  },
  petition() { const p = G.petition; if (!p) return null; const t = PETITIONS.find(x => x.id === p.id), v = World.villages[p.vi]; return t && v && this.mine(p.ci) ? { ...p, t, v } : null; },
  answer(yes) {
    const p = this.petition(); if (!p) { G.petition = null; return; }
    const c = G.civs[p.ci];
    if (yes && c.treasury < p.t.cost) { UI.msg(`O tesouro não tem ${p.t.cost} 🪙 para atender ao pedido.`, 'bad'); return; }
    if (yes) c.treasury -= p.t.cost;
    const msg = yes ? p.t.ok(c, p.v) : p.t.deny(c, p.v);
    G.petition = null;
    UI.msg(`${p.t.icon} ${msg}`, yes ? 'gold' : '');
  },
};
