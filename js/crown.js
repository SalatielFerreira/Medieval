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
  censo:    { icon: '📜', name: 'Censo do reino', cost: 20, desc: 'Escrivães contam o povo e as terras: +8% de impostos (−1).' },
  estradas: { icon: '🛤️', name: 'Estradas reais', cost: 55, desc: 'Conserta estradas e pontes: o comércio rende +8% (+1).' },
  caca:     { icon: '🦌', name: 'Leis da caça', cost: 0, desc: 'Só a nobreza caça nas matas reais: +100 🪙 por mês em licenças, mas o povo reclama (−3).' },
  cura:     { icon: '⚕️', name: 'Casas de cura', cost: 70, desc: 'Curandeiros em todas as vilas: o povo cresce mais rápido (+3).' },
  fe:       { icon: '⛪', name: 'Fé oficial', cost: 30, desc: 'A coroa sustenta as capelas: +2 de felicidade e +2 de devoção por mês.' },
  toque:    { icon: '🌙', name: 'Toque de recolher', cost: 0, desc: 'Ninguém na rua à noite: bandidos demoram 2× mais para voltar, mas o povo se irrita (−3).' },
  luxo:     { icon: '💎', name: 'Imposto sobre o luxo', cost: 0, desc: 'Taxa sedas, vinhos e joias: +10% de impostos; as grandes casas perdem lealdade (−1).' },
};
const DECREE_HAPPY = { feira: -3, escolas: 2, servico: -4, pao: 7, ronda: 1, caridade: 2, censo: -1, estradas: 1, caca: -3, cura: 3, fe: 2, toque: -3, luxo: -1 };

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
// Tribunal do Rei: casos que chegam ao trono, cada um com escolhas e consequências
const TRIALS = [
  { id: 'ladrao', icon: '🍞', text: v => `Um homem de ${v.name} foi pego roubando pão para os filhos.`, opts: [
    ['Perdoar', c => { c.happy = Math.min(100, c.happy + 3); return 'O povo elogia a sua misericórdia (+3).'; }],
    ['Trabalho forçado', c => { c.treasury += 40; return 'Ele vai trabalhar nas obras do reino (+40 🪙).'; }],
    ['Prisão', c => { c.happy = Math.max(0, c.happy - 1); Court.addFame(1); return 'A lei foi cumprida. Alguns acham que foi duro demais (−1).'; }]] },
  { id: 'terras', icon: '🌾', text: v => `Duas famílias de ${v.name} brigam pela mesma terra.`, opts: [
    ['Dividir a terra', c => { c.happy = Math.min(100, c.happy + 2); return 'As duas famílias saem satisfeitas pela metade (+2).'; }],
    ['Dar à família mais antiga', c => { const f = Families.ranking(c.id).find(x => !x.f.player); if (f) f.f.loyalty = Math.min(100, f.f.loyalty + 10); return 'A família mais antiga fica grata (+10 de lealdade).'; }],
    ['Tomar a terra para a coroa', c => { c.treasury += 120; c.happy = Math.max(0, c.happy - 4); return 'A coroa ficou com a terra (+120 🪙), mas o povo resmunga (−4).'; }]] },
  { id: 'bruxa', icon: '🧹', text: v => `Moradores de ${v.name} acusam uma curandeira de bruxaria.`, opts: [
    ['Absolver', c => { c.happy = Math.min(100, c.happy + 2); return 'A curandeira volta a tratar os doentes (+2).'; }],
    ['Exilar', c => { G.piety = (G.piety || 0) + 4; c.happy = Math.max(0, c.happy - 1); return 'Ela deixa o reino. O padre aprova (+4 de devoção).'; }]] },
  { id: 'divida', icon: '🧾', text: v => `Um mercador de ${v.name} cobra uma dívida antiga de um lavrador pobre.`, opts: [
    ['A favor do mercador', c => { c.treasury += 50; c.happy = Math.max(0, c.happy - 2); return 'O mercador paga a taxa do tribunal (+50 🪙). O lavrador chora (−2).'; }],
    ['A favor do lavrador', c => { c.happy = Math.min(100, c.happy + 3); return 'O povo vê justiça no trono (+3).'; }],
    ['A coroa paga a dívida (60 🪙)', c => { if (c.treasury < 60) return 'O tesouro não tinha 60 🪙: o caso foi adiado.'; c.treasury -= 60; c.happy = Math.min(100, c.happy + 4); Court.addFame(3); return 'Os dois saem contentes (+4, +3 de fama).'; }]] },
  { id: 'duelo', icon: '🤺', text: () => 'Dois cavaleiros pedem permissão para resolver uma ofensa num duelo.', opts: [
    ['Permitir o duelo', c => { Court.addFame(4); c.happy = Math.min(100, c.happy + 1); return 'O duelo vira festa na capital (+4 de fama).'; }],
    ['Proibir e reconciliar', c => { c.happy = Math.min(100, c.happy + 2); return 'Os cavaleiros apertam as mãos diante do trono (+2).'; }]] },
  { id: 'contrabando', icon: '📦', text: v => `Contrabandistas foram presos perto de ${v.name} com sedas e especiarias.`, opts: [
    ['Multar e confiscar', c => { c.treasury += 150; return 'A carga foi vendida pela coroa (+150 🪙).'; }],
    ['Contratar como espiões', c => { const sp = Court.member(c.id, 'spy'); if (sp) { Ranking.stats(sp); sp.int = Math.min(99, sp.int + 4); } Court.addFame(2); return 'Eles agora trabalham para o seu mestre espião.'; }]] },
  { id: 'desertor', icon: '🏃', text: () => 'Um soldado que fugiu da guarnição foi capturado.', opts: [
    ['Perdoar e devolver ao exército', c => { c.garrison++; c.happy = Math.min(100, c.happy + 1); return 'Ele jura lealdade e volta para a guarnição (+1 soldado).'; }],
    ['Punir com rigor', c => { c.happy = Math.max(0, c.happy - 2); Court.addFame(2); return 'Os soldados entendem o recado (−2 de felicidade).'; }]] },
  { id: 'heranca', icon: '📜', text: v => `Uma viúva de ${v.name} e o cunhado disputam a herança da casa.`, opts: [
    ['A favor da viúva', c => { c.happy = Math.min(100, c.happy + 3); return 'A viúva e os filhos ficam com a casa (+3).'; }],
    ['A favor do cunhado', c => { const f = Families.ranking(c.id).find(x => !x.f.player); if (f) f.f.loyalty = Math.min(100, f.f.loyalty + 6); return 'A família do cunhado fica grata (+6 de lealdade).'; }]] },
];

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
  { id: 'lobos', icon: '🐺', text: v => `Lobos estão atacando os rebanhos de ${v.name}. Os pastores pedem caçadores.`, cost: 80, yes: 'Pagar caçadores', no: 'Recusar',
    ok: (c, v) => { c.happy = Math.min(100, c.happy + 3); v.prosper = (v.prosper || 0) + 2; return `Os lobos foram afastados de ${v.name} (+3).`; },
    deny: c => { c.happy = Math.max(0, c.happy - 3); return 'Os pastores perdem ovelhas e culpam a coroa (−3).'; } },
  { id: 'seca', icon: '☀️', text: v => `A seca castiga ${v.name}. Os lavradores pedem trigo do tesouro.`, cost: 100, yes: 'Mandar trigo', no: 'Recusar',
    ok: (c, v) => { c.happy = Math.min(100, c.happy + 5); return `Carroças de trigo chegam a ${v.name} (+5).`; },
    deny: c => { c.happy = Math.max(0, c.happy - 4); return 'A fome aperta e o povo se revolta em silêncio (−4).'; } },
  { id: 'festa', icon: '🎉', text: v => `${v.name} quer uma festa para o santo padroeiro e pede ajuda.`, cost: 90, yes: 'Pagar a festa', no: 'Recusar',
    ok: (c, v) => { c.happy = Math.min(100, c.happy + 6); v.prosper = (v.prosper || 0) + 1; return `${v.name} dança a noite toda em sua honra (+6).`; },
    deny: c => { c.happy = Math.max(0, c.happy - 2); return 'A festa sai pobre e sem graça (−2).'; } },
  { id: 'escola', icon: '📚', text: v => `O padre de ${v.name} quer abrir uma escola para as crianças.`, cost: 140, yes: 'Financiar a escola', no: 'Recusar',
    ok: (c, v) => { c.happy = Math.min(100, c.happy + 3); for (const p of People.residents(World.villages.indexOf(v)).filter(q => q.age < 16).slice(0, 6)) { Ranking.stats(p); p.int = Math.min(99, p.int + 5); } return 'As crianças aprendem a ler e escrever (+3, mais inteligência).'; },
    deny: c => { c.happy = Math.max(0, c.happy - 1); return 'As crianças voltam para o campo.'; } },
  { id: 'mercador', icon: '🐪', text: v => `Um mercador estrangeiro pede licença para vender em ${v.name}.`, cost: 0, yes: 'Conceder a licença (+80 🪙)', no: 'Proibir',
    ok: (c, v) => { c.treasury += 80; v.prosper = (v.prosper || 0) + 2; return `O mercador paga a licença e ${v.name} ganha novidades (+80 🪙).`; },
    deny: c => { c.happy = Math.min(100, c.happy + 1); return 'Os comerciantes locais agradecem a proteção (+1).'; } },
  { id: 'bandidos', icon: '🗡️', text: v => `Bandidos assaltam viajantes na estrada de ${v.name}.`, cost: 150, yes: 'Mandar soldados', no: 'Recusar',
    ok: (c, v) => { c.happy = Math.min(100, c.happy + 4); Court.addFame(2); return `Os soldados limpam a estrada de ${v.name} (+4).`; },
    deny: c => { c.happy = Math.max(0, c.happy - 3); return 'Os viajantes evitam o reino (−3).'; } },
  { id: 'poco', icon: '🪣', text: v => `O poço de ${v.name} secou e as mulheres andam léguas atrás de água.`, cost: 70, yes: 'Cavar um poço novo', no: 'Recusar',
    ok: (c, v) => { c.happy = Math.min(100, c.happy + 3); v.prosper = (v.prosper || 0) + 2; return `Um poço novo jorra água em ${v.name} (+3).`; },
    deny: c => { c.happy = Math.max(0, c.happy - 2); return 'A vila sofre com a falta de água (−2).'; } },
  { id: 'ponte', icon: '🌉', text: v => `Os mercadores de ${v.name} pedem ouro para melhorar as estradas e pontes.`, cost: 200, yes: 'Financiar as obras', no: 'Recusar',
    ok: (c, v) => { c.happy = Math.min(100, c.happy + 3); v.prosper = (v.prosper || 0) + 4; c.tradeBonus = (c.tradeBonus || 0) + 3; return `Estradas melhores: ${v.name} prospera e o comércio rende mais por 3 meses.`; },
    deny: c => { c.happy = Math.max(0, c.happy - 2); return 'Os mercadores reclamam pelas tavernas (−2).'; } },
];

const Crown = {
  mine(ci) { const c = G.civs[ci]; return !!c && c.ruler === 'player'; },
  dec(c) { return c.decrees || (c.decrees = {}); },
  on(c, k) { return !!(c && c.decrees && c.decrees[k] && !c.decreeOff); },
  // ------------------------------------------------------------ efeitos dos decretos (lidos pela economia do reino)
  wheatMul(c) { return (this.on(c, 'colheita') ? 1.25 : 1) * (this.built(c, 'celeiro') ? 1.15 : 1); },
  incomeMul(c) { return (this.on(c, 'feira') ? 1.15 : 1) * ((c && c.tradeBonus) ? 1.1 : 1) * (this.on(c, 'censo') ? 1.08 : 1) * (this.on(c, 'estradas') ? 1.08 : 1) * (this.on(c, 'luxo') ? 1.1 : 1)
      * (this.built(c, 'estrada') ? 1.06 : 1) * (this.built(c, 'porto') ? 1.08 : 1) * (this.built(c, 'universidade') ? 1.05 : 1); },
  happyBonus(c) { if (!c || c.ruler !== 'player') return 0; let h = (c.monument ? 4 * c.monument : 0) + (this.built(c, 'jardins') ? 3 : 0) + (this.built(c, 'universidade') ? 3 : 0) + (this.built(c, 'catedral') ? 5 : 0); for (const k in DECREE_HAPPY) if (this.on(c, k)) h += DECREE_HAPPY[k]; if (c.inflation) h -= 4; return h; },
  priceMul(ci) { const c = G.civs[ci]; return c && c.inflation ? 1.15 : 1; },
  campDelay(x, y) { if (!World.inb(x, y)) return 1; const ci = World.terr[World.idx(x, y)]; return ci >= 0 && this.on(G.civs[ci], 'ronda') ? 3 : ci >= 0 && this.on(G.civs[ci], 'toque') ? 2 : 1; },
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
    if (this.on(c, 'escolas')) for (const p of people.filter(q => q.age >= 6 && q.age < 30).sort(() => Math.random() - 0.5).slice(0, 8)) { Ranking.stats(p); p.int = Math.min(99, p.int + 2); }
    if (this.on(c, 'caridade')) for (const p of people.filter(q => q.rank === 'beggar').slice(0, 2)) { p.rank = 'peasant'; People.addAff(p, 10); }
    if (this.on(c, 'caca')) c.treasury += 100;
    if (this.on(c, 'cura')) c.pop = (c.pop || 0) + 3;
    if (this.on(c, 'fe')) G.piety = (G.piety || 0) + 2;
    if (this.on(c, 'luxo')) for (const x of Families.ranking(c.id)) if (!x.f.player) x.f.loyalty = Math.max(0, x.f.loyalty - 2);
    this.worksMonth(c);
    if (c.inflation) c.inflation--;
    if (c.tradeBonus) c.tradeBonus--;
    // casos chegam ao tribunal do rei
    if (!G.trial && Math.random() < 0.35) this.newTrial(c.id);
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
    recrutar: { icon: '🛡️', name: 'Recrutar soldados', cost: 300, cd: 2, desc: '+6 soldados na guarnição agora (até o máximo do reino).' },
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
    } else if (k === 'recrutar') {
      const n = Math.min(6, Math.max(0, Game.maxGarrison(c) - c.garrison)); c.garrison += n;
      UI.msg(n ? `🛡️ ${n} recrutas entraram na guarnição de ${name}.` : 'A guarnição já está cheia: o dinheiro foi para equipar os soldados.', 'gold');
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
  // ------------------------------------------------------------ Tribunal do Rei
  newTrial(ci) {
    const vs = World.villages.map((v, vi) => ({ v, vi })).filter(x => x.v.civ === ci && !x.v.free);
    if (!vs.length) return;
    const t = U.pick(TRIALS), x = U.pick(vs);
    G.trial = { ci, vi: x.vi, id: t.id, day: G.day };
    UI.msg(`⚖️ Um caso chegou ao seu tribunal: ${t.text(x.v)} Veja em Reino → ${CIV_DEFS[ci].short} → Decretos e ações.`, 'gold');
  },
  trial() { const p = G.trial; if (!p) return null; const t = TRIALS.find(x => x.id === p.id), v = World.villages[p.vi]; return t && v && this.mine(p.ci) ? { ...p, t, v } : null; },
  judge(i) {
    const p = this.trial(); if (!p) { G.trial = null; return; }
    const o = p.t.opts[i]; if (!o) return;
    const msg = o[1](G.civs[p.ci], p.v);
    G.trial = null; G.stats.trials = (G.stats.trials || 0) + 1;
    UI.msg(`⚖️ ${o[0]}: ${msg}`, 'gold');
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
