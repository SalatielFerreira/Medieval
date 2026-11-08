'use strict';
// A coroa do jogador: decretos (ordens de cada reino, com custo mensal e efeito no reino), ações de soberano (Grande
// Torneio, monumento, perdão, caçada, missa, feira internacional), sagrar cavaleiros e as Grandes Obras.
// Tudo fica guardado no próprio reino (G.civs[ci]): decrees, crownCd, inflation (contador de meses), monument, works.
// O que existia em dobro saiu: os decretos com o mesmo nome das leis (feira, toque de recolher, caça, escolas: ficam
// as Leis, laws.js), cunhar moedas (a moeda é a do Reinado: desvalorizar), o banquete (entrou no baile do Reinado),
// recrutar (é um só, na página do reino, com a quantidade), exigir tributo de uma vez (é o tributo dos Tratados), o
// Tribunal do Rei (o tribunal é o das Leis) e a audiência com o povo (as audiências são as do Reinado).

const DECREES = {
  colheita: { icon: '🌾', name: 'Subsídio da colheita', cost: 40, desc: '+25% de trigo nas fazendas do reino.' },
  servico:  { icon: '🛡️', name: 'Serviço militar', cost: 0, desc: '+1 soldado na guarnição por mês, sem custo. O povo não gosta (−4).' },
  pao:      { icon: '🥖', name: 'Pão e circo', cost: 90, desc: 'Comida e festas para o povo: +7 de felicidade.' },
  ronda:    { icon: '🔦', name: 'Ronda noturna', cost: 50, desc: 'Acampamentos de bandidos destruídos no reino demoram 3× mais para voltar (+1).' },
  caridade: { icon: '🤲', name: 'Casas de caridade', cost: 45, desc: 'Mendigos do reino ganham teto e trabalho e viram camponeses (+2).' },
  censo:    { icon: '📜', name: 'Censo do reino', cost: 20, desc: 'Escrivães contam o povo e as terras: +8% de impostos (−1).' },
  estradas: { icon: '🛤️', name: 'Estradas reais', cost: 55, desc: 'Conserta estradas e pontes: o comércio rende +8% (+1).' },
  cura:     { icon: '⚕️', name: 'Casas de cura', cost: 70, desc: 'Curandeiros em todas as vilas: o povo cresce mais rápido (+3).' },
  fe:       { icon: '⛪', name: 'Fé oficial', cost: 30, desc: 'A coroa sustenta as capelas: +2 de felicidade e +2 de devoção por mês.' },
  luxo:     { icon: '💎', name: 'Imposto sobre o luxo', cost: 0, desc: 'Taxa sedas, vinhos e joias: +10% de impostos; as grandes casas perdem lealdade (−1).' },
};
const DECREE_HAPPY = { servico: -4, pao: 7, ronda: 1, caridade: 2, censo: -1, estradas: 1, cura: 3, fe: 2, luxo: -1 };

// Grandes Obras reais: projetos de vários meses pagos em parcelas pelo tesouro; prontas, dão um bônus para sempre
const WORKS = {
  estrada:  { icon: '🛣️', name: 'Estrada Real', gold: 1500, months: 6, desc: 'Uma estrada calçada ligando as vilas: +6% de impostos para sempre.' },
  celeiro:  { icon: '🌾', name: 'Celeiro Real', gold: 1200, months: 5, desc: 'Guarda o trigo do reino: +15% de trigo e o povo não passa fome tão fácil.' },
  muralhas: { icon: '🏰', name: 'Muralhas de Pedra', gold: 2000, months: 8, desc: 'Muralhas novas na capital: o reino fica mais forte nas guerras (+3 de força).' },
  quartel:  { icon: '⚔️', name: 'Quartel Real', gold: 1600, months: 6, desc: 'Treina recrutas o ano todo: +1 soldado na guarnição por mês, sem descontentar o povo.' },
  porto:    { icon: '⚓', name: 'Porto Real', gold: 1800, months: 7, desc: 'Docas e armazéns reais: o comércio rende +8% para sempre.' },
  jardins:  { icon: '🌷', name: 'Jardins Reais', gold: 900, months: 4, desc: 'Jardins abertos ao povo na capital: +3 de felicidade e +10 de fama.' },
  universidade: { icon: '🎓', name: 'Universidade', gold: 2500, months: 10, desc: 'Sábios e estudantes: +3 de felicidade, +5% de impostos e o povo fica mais inteligente.' },
  catedral: { icon: '⛪', name: 'Grande Catedral', gold: 3000, months: 12, desc: 'A maior igreja do reino: +5 de felicidade e +3 de devoção por mês.' },
};
const Crown = {
  mine(ci) { const c = G.civs[ci]; return !!c && c.ruler === 'player'; },
  dec(c) { return c.decrees || (c.decrees = {}); },
  on(c, k) { return !!(c && c.decrees && c.decrees[k] && !c.decreeOff); },
  // ------------------------------------------------------------ efeitos dos decretos (lidos pela economia do reino)
  wheatMul(c) { return (this.on(c, 'colheita') ? 1.25 : 1) * (this.built(c, 'celeiro') ? 1.15 : 1); },
  incomeMul(c) { return ((c && c.tradeBonus) ? 1.1 : 1) * (this.on(c, 'censo') ? 1.08 : 1) * (this.on(c, 'estradas') ? 1.08 : 1) * (this.on(c, 'luxo') ? 1.1 : 1)
      * (this.built(c, 'estrada') ? 1.06 : 1) * (this.built(c, 'porto') ? 1.08 : 1) * (this.built(c, 'universidade') ? 1.05 : 1); },
  happyBonus(c) { if (!c || c.ruler !== 'player') return 0; let h = (c.monument ? 4 * c.monument : 0) + (this.built(c, 'jardins') ? 3 : 0) + (this.built(c, 'universidade') ? 3 : 0) + (this.built(c, 'catedral') ? 5 : 0); for (const k in DECREE_HAPPY) if (this.on(c, k)) h += DECREE_HAPPY[k]; if (c.inflation) h -= 4; return h; },
  priceMul(ci) { const c = G.civs[ci]; return c && c.inflation ? 1.15 : 1; },
  campDelay(x, y) { if (!World.inb(x, y)) return 1; const ci = World.terr[World.idx(x, y)]; return ci >= 0 && this.on(G.civs[ci], 'ronda') ? 3 : ci >= 0 && typeof Laws !== 'undefined' && Laws.inForce('recolher', ci) ? 2 : 1; }, // a lei do toque de recolher (o antigo decreto) também segura os bandidos
  built(c, k) { return !!(c && c.works && c.works[k] && c.works[k].done); },
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
    if (this.on(c, 'caridade')) for (const p of people.filter(q => q.rank === 'beggar').slice(0, 2)) { p.rank = 'peasant'; People.addAff(p, 10); }
    if (this.on(c, 'cura')) c.pop = (c.pop || 0) + 3;
    if (this.on(c, 'fe')) G.piety = (G.piety || 0) + 2;
    if (this.on(c, 'luxo')) for (const x of Families.ranking(c.id)) if (!x.f.player) x.f.loyalty = Math.max(0, x.f.loyalty - 2);
    this.worksMonth(c);
    if (c.inflation) c.inflation--;
    if (c.tradeBonus) c.tradeBonus--;
  },
  // ------------------------------------------------------------ ações de soberano
  cd(c, k) { return Math.max(0, ((c.crownCd || {})[k] || -99) - G.day); },
  setCd(c, k, months) { c.crownCd = c.crownCd || {}; c.crownCd[k] = G.day + months; },
  ACTIONS: {
    torneio:  { icon: '🏟️', name: 'Grande Torneio real', cost: 500, cd: 8, desc: 'O Grande Torneio acontece na sua capital: +8 de felicidade, +15 de fama e melhores relações com os reinos vizinhos.' },
    monumento:{ icon: '🗿', name: 'Erguer um monumento', cost: 2000, cd: 0, desc: 'Uma grande estátua na capital: +4 de felicidade para sempre e +30 de fama (até 3 monumentos).' },
    perdao:   { icon: '🕊️', name: 'Perdão real', cost: 0, cd: 12, desc: 'Anistia geral: +6 de felicidade e as grandes casas menos leais se acalmam (+10 de lealdade).' },
    cacada:   { icon: '🏹', name: 'Caçada real', cost: 200, cd: 5, desc: 'Os nobres caçam com o soberano: +8 de lealdade nas grandes casas, +10 de fama e carne para você.' },
    missa:    { icon: '🔔', name: 'Missa solene', cost: 120, cd: 3, desc: 'A igreja celebra pelo reino: +5 de felicidade e +15 de devoção.' },
    feiraint: { icon: '🎪', name: 'Feira internacional', cost: 400, cd: 8, desc: 'Mercadores de todos os reinos na capital: comércio +10% por 3 meses e +6 de relação com todos.' },
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
    if (k === 'torneio') {
      G.tourney = { ci, until: G.day + 1, round: 0, out: false, won: false };
      c.happy = Math.min(100, c.happy + 8); Court.addFame(15);
      for (const o of G.civs) if (o.id !== ci && !Diplo.atWar(ci, o.id)) Diplo.addRel(ci, o.id, 6);
      Diplo.chronicle(`🏟️ ${G.name} ${G.surname} organiza o Grande Torneio real em ${name}!`, true);
      UI.banner('🏟️ Grande Torneio real!');
    } else if (k === 'perdao') {
      c.happy = Math.min(100, c.happy + 6);
      for (const x of Families.ranking(ci).filter(x => !x.f.player).sort((a, b) => a.f.loyalty - b.f.loyalty).slice(0, 3)) x.f.loyalty = Math.min(100, x.f.loyalty + 10);
      UI.banner('🕊️ Perdão real!'); UI.msg(`As prisões de ${name} se abrem e o povo comemora (+6 de felicidade).`, 'gold');
    } else if (k === 'cacada') {
      for (const x of Families.ranking(ci)) if (!x.f.player) x.f.loyalty = Math.min(100, x.f.loyalty + 8);
      Court.addFame(10); Inv.add('meat', 8); Inv.add('deer_antler', 2);
      UI.banner('🏹 Caçada real!'); UI.msg('Os nobres voltam da caçada contando vantagens (+8 de lealdade, +10 de fama, carne e chifres para você).', 'gold');
    } else if (k === 'missa') {
      c.happy = Math.min(100, c.happy + 5); G.piety = (G.piety || 0) + 15;
      UI.banner('🔔 Missa solene'); UI.msg(`Os sinos tocam em todo o ${CIV_DEFS[ci].name} (+5 de felicidade, +15 de devoção).`, 'gold');
    } else if (k === 'feiraint') {
      c.tradeBonus = (c.tradeBonus || 0) + 3;
      for (const o of G.civs) if (o.id !== ci && !Diplo.atWar(ci, o.id)) Diplo.addRel(ci, o.id, 6);
      UI.banner('🎪 Feira internacional!'); Diplo.chronicle(`🎪 Mercadores de todos os reinos foram à grande feira de ${name}.`, true);
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
  // ------------------------------------------------------------ Grandes Obras reais
  work(c, k) { return (c.works || {})[k] || null; },
  startWork(ci, k) {
    const c = G.civs[ci], w = WORKS[k];
    if (!this.mine(ci) || !w) return;
    c.works = c.works || {};
    if (c.works[k]) { UI.msg('Essa obra já foi começada.', 'bad'); return; }
    if (Object.values(c.works).filter(x => !x.done).length >= 2) { UI.msg('O reino só toca duas grandes obras ao mesmo tempo.', 'bad'); return; }
    const first = Math.ceil(w.gold / w.months);
    if (c.treasury < first) { UI.msg(`A primeira parcela custa ${first} 🪙.`, 'bad'); return; }
    c.treasury -= first;
    c.works[k] = { paid: 1, done: false, since: G.day };
    UI.msg(`${w.icon} Começou a obra: ${w.name}. Faltam ${w.months - 1} parcelas mensais de ${first} 🪙.`, 'gold');
    Progress.diary(`${w.icon} Começou a obra real: ${w.name} em ${CIV_DEFS[ci].short}.`);
    if (w.months <= 1) this.finishWork(c, k);
  },
  // todo mês: paga a parcela de cada obra em andamento (sem ouro, a obra para até haver)
  worksMonth(c) {
    if (this.built(c, 'quartel') && c.garrison < Game.maxGarrison(c)) c.garrison++;
    if (this.built(c, 'catedral')) G.piety = (G.piety || 0) + 3;
    if (this.built(c, 'universidade')) for (const p of Families.civPeople(c.id).filter(q => q.age >= 10 && q.age < 40).slice(0, 4)) { Ranking.stats(p); p.int = Math.min(99, p.int + 1); }
    for (const k in c.works || {}) {
      const st = c.works[k], w = WORKS[k];
      if (!w || st.done) continue;
      const part = Math.ceil(w.gold / w.months);
      if (c.treasury < part) { st.stalled = true; continue; }
      c.treasury -= part; st.paid++; st.stalled = false;
      if (st.paid >= w.months) this.finishWork(c, k);
    }
  },
  finishWork(c, k) {
    const w = WORKS[k]; c.works[k].done = true;
    if (k === 'muralhas') c.invest.walls = (c.invest.walls || 0) + 1;
    if (k === 'jardins') Court.addFame(10);
    Court.addFame(8);
    UI.banner(`${w.icon} ${w.name} pronta!`); UI.msg(`${w.icon} A obra terminou: ${w.name}. ${w.desc}`, 'gold', true);
    Diplo.chronicle(`${w.icon} ${CIV_DEFS[c.id].short} inaugurou: ${w.name}.`, true);
  },
};
