'use strict';
// O banco de cada reino: é onde fica o tesouro nacional e onde o povo (e você) guarda e movimenta o dinheiro.
//  • Todo reino da IA já tem o seu banco perto do castelo, com nome próprio. No reino que você governa, você funda o
//    banco (Portfólio → o seu reino → Resumo → Fundar o banco), escolhe o lugar no mapa e dá o nome.
//  • No balcão: conta que rende (os juros quem define é o rei), aplicações a prazo (títulos do Tesouro: o dinheiro
//    financia o reino e volta com juros), empréstimos do reino, emprestar aos moradores, investir em famílias e vilas,
//    expedições de comércio (risco e lucro), cofre particular para guardar itens e, de noite, dá para tentar arrombar
//    o cofre-forte (com uma gazua).
//  • Na sala do cofre, o rei cuida do Tesouro Nacional: juros da conta, pedir dinheiro ao banco, emitir títulos,
//    passar ouro entre o seu bolso e o tesouro, auditoria e renomear o banco.
//  • Falência: quando o tesouro não paga as contas, o banco cobre o rombo enquanto tiver reserva e crédito. Sem
//    isso, o reino entra em crise; com 3 meses de crise, ele quebra: o rei cai, as vilas ficam sem dono, o povo vira
//    bárbaros (acampamentos novos e saques) e um exército anarquista anda pelas terras até uma família forte fundar
//    uma nova dinastia (ou alguém tomar o castelo do chefe anarquista).

const BANK_W = 5, BANK_H = 4, BANK_CRISIS = 3, BANK_DEBT_RATE = 0.02;
const BANK_NAMES = ['Banco do Grifo de Ouro', 'Banco dos Mercadores de {r}', 'Casa de Crédito do Leão', 'Banco da Coroa de {r}', 'Tesouraria do Dragão Dourado', 'Banco da Torre de Prata', 'Casa Bancária do Carvalho'];
const BANK_RATES = [0.005, 0.01, 0.015, 0.02];
const BANK_TERMS = [[3, 0.015, 'Título de 3 meses'], [6, 0.02, 'Título de 6 meses'], [12, 0.03, 'Título de 12 meses']];
const BANK_EXPEDITIONS = [
  { id: 'sal', icon: '🧂', name: 'Caravana do sal', m: 2, risk: 0.12, lo: 1.15, hi: 1.5, good: 'O sal chegou às feiras do norte e vendeu tudo.', bad: 'Bandidos levaram a caravana na estrada.' },
  { id: 'vinho', icon: '🍷', name: 'Barris de vinho para o sul', m: 3, risk: 0.2, lo: 1.3, hi: 1.9, good: 'O vinho fez sucesso nas tavernas do sul.', bad: 'Os barris azedaram no caminho.' },
  { id: 'seda', icon: '🧵', name: 'Rota da seda', m: 4, risk: 0.3, lo: 1.5, hi: 2.6, good: 'Os fardos de seda valeram ouro.', bad: 'Uma tempestade de areia engoliu os camelos.' },
  { id: 'ilhas', icon: '⛵', name: 'Navio às ilhas das especiarias', m: 5, risk: 0.4, lo: 1.8, hi: 3.4, good: 'O navio voltou carregado de especiarias.', bad: 'O navio afundou num temporal.' },
  { id: 'prata', icon: '⛏️', name: 'Mina de prata nas montanhas', m: 6, risk: 0.5, lo: 2, hi: 4.5, good: 'Os mineiros acharam um veio de prata!', bad: 'A mina desabou e não sobrou nada.' },
];
const BANK_TABS = [['conta', '💰 Conta'], ['prazo', '📜 Aplicações'], ['credito', '🧾 Empréstimos'], ['emprestar', '🤝 Emprestar'], ['investir', '📈 Investir'], ['expedicoes', '🐫 Expedições'], ['cofre', '🔐 Cofre'], ['tesouro', '👑 Tesouro']];

// o banco é uma obra do reino (só quem governa ergue), em qualquer lugar do mapa; fica fora da lista de obras das vilas
Object.defineProperty(CIVIC, 'bank', { value: { name: 'Banco do Reino', icon: '🏦', w: BANK_W, h: BANK_H, cost: { stone: 80, wood: 30, iron_bar: 6, gold_bar: 2 }, king: true,
  desc: 'Só quem governa um reino: o banco onde fica o tesouro nacional, com contas, aplicações, empréstimos, expedições e cofre. Você escolhe o nome.' }, enumerable: false, writable: true, configurable: true });
CIV_STRUCTS.bank = { name: 'Banco', blocks: true };
ANYWHERE.push('bank'); MOVE_ANYWHERE.push('bank'); ANY_NAME.bank = 'no banco';
ROOM_TYPES.bank = { lay: 'bank', theme: 'stone', name: s => Bank.name(s.owner) };

const Bank = {
  // ---------------------------------------------------------------- dados
  B() { const u = G.urban || (G.urban = {}); const b = u.bank || (u.bank = { k: {}, acc: {}, terms: [], exp: [], box: {}, camps: [], robbed: -1 }); b.camps = b.camps || []; return b; },
  K(ci) { const b = this.B().k; return b[ci] || (b[ci] = { name: this.defName(ci), rate: 0.01, reserve: 400 + ((G.civs[ci] && G.civs[ci].pop) || 150) * 3, debt: 0, crisis: 0, bonds: [], log: [] }); },
  defName(ci) { return BANK_NAMES[ci % BANK_NAMES.length].replace('{r}', CIV_DEFS[ci] ? CIV_DEFS[ci].short : ''); },
  name(ci) { return this.K(ci).name; },
  struct(ci) { return World.structs.find(s => s && s.type === 'bank' && s.owner === ci && !s.removed) || null; },
  has(ci) { return !!this.struct(ci); },
  mine(ci) { return !!G.civs[ci] && G.civs[ci].ruler === 'player'; },
  log(ci, t) { const L = this.K(ci).log; L.unshift({ day: G.day, t }); if (L.length > 12) L.length = 12; },
  // o banco mais perto de você (o do reino onde você está, se houver)
  nearest() {
    let best = null, bd = 1e9;
    for (const s of World.structs) if (s && s.type === 'bank' && !s.removed) { const d = U.dist(P.x / TILE, P.y / TILE, s.x, s.y); if (d < bd) { bd = d; best = s; } }
    return best ? best.owner : G.civs.findIndex(c => c.ruler === 'player') >= 0 ? G.civs.findIndex(c => c.ruler === 'player') : 0;
  },
  creditCap(c) { return 600 + c.pop * 4; },
  acc(ci) { return this.B().acc[ci] || 0; },
  totalAcc() { return Object.values(this.B().acc).reduce((a, n) => a + n, 0); },

  // ---------------------------------------------------------------- um banco perto de cada castelo (o mesmo lugar sempre)
  place() {
    const E = Urban.E();
    World.capitals.forEach((cp, ci) => {
      if (!cp || !G.civs[ci] || this.struct(ci)) return;
      const k = this.K(ci);
      if (k.gone || (E.added || []).some(a => a.type === 'bank' && a.civ === ci)) return;
      let best = k.pos && !Graves.spotErr(null, k.pos.x, k.pos.y, true, BANK_W, BANK_H) ? k.pos : null;
      for (const [r0, r1, strict] of [[7, 16, true], [7, 30, false]]) {
        if (best) break;
        let bd = 1e9;
        for (let y = cp.y - r1; y <= cp.y + r1; y++) for (let x = cp.x - r1; x <= cp.x + r1; x++) {
          const d = U.dist(x + 2.5, y + 2, cp.x, cp.y); if (d < r0 || d > r1 || d >= bd) continue;
          if (!World.areaOk(x - 1, y - 1, BANK_W + 2, BANK_H + 2) || !World.areaFree(x - 1, y - 1, BANK_W + 2, BANK_H + 2)) continue;
          if (Towns.onRoad(x, y, BANK_W, BANK_H) || (strict && World.terr[World.idx(x + 2, y + 2)] !== ci)) continue;
          bd = d; best = { x, y };
        }
      }
      if (!best) return;
      for (let j = best.y; j < best.y + BANK_H; j++) for (let i = best.x; i < best.x + BANK_W; i++) World.obj[World.idx(i, j)] = 0;
      World.addStruct('bank', best.x, best.y, BANK_W, BANK_H, ci);
      k.pos = { x: best.x, y: best.y };
    });
    // acampamentos dos bárbaros que nasceram das falências
    for (const c of this.B().camps) if (!World.camps.some(s => s.x === c.x && s.y === c.y)) this.addCamp(c.x, c.y);
    World.chunks = new Map();
  },
  // fundar o banco do seu reino: escolher o lugar e o nome
  startFound(ci) {
    if (!this.mine(ci)) return;
    if (this.has(ci)) { UI.msg(`${CIV_DEFS[ci].short} já tem banco: ${this.name(ci)}.`, 'bad'); return; }
    if (!Inv.has(CIVIC.bank.cost)) { UI.msg('O banco custa ' + Object.entries(CIVIC.bank.cost).map(([k, n]) => `${n} ${ITEMS[k].name}`).join(', ') + '.', 'bad'); return; }
    this.founding = ci; UI.close(); Urban.start('c:bank');
  },
  found(ci) {
    const k = this.K(ci); k.gone = false;
    Dialog.prompt({ icon: '🏦', title: 'O nome do banco', text: 'Como vai se chamar o banco do seu reino? Ele guarda o tesouro nacional.', value: k.name, max: 32 }, nm => {
      nm = (nm || '').trim(); if (nm.length >= 3) k.name = nm;
      this.log(ci, `🏦 Fundado por ${G.name} ${G.surname || ''}.`);
      UI.banner(`🏦 ${k.name}`); UI.msg(`🏦 ${k.name} abriu as portas! O tesouro de ${CIV_DEFS[ci].short} agora fica aqui. Entre no banco para cuidar dele (sala do cofre).`, 'gold', true);
      Diplo.chronicle(`🏦 ${G.name} ${G.surname || ''} fundou o ${k.name} em ${CIV_DEFS[ci].name}.`, true);
    });
  },
  rename(ci) {
    if (!this.mine(ci)) return; const k = this.K(ci);
    Dialog.prompt({ icon: '🏦', title: 'Renomear o banco', text: 'O novo nome do banco do reino:', value: k.name, max: 32 }, nm => { nm = (nm || '').trim(); if (nm.length < 3) return; k.name = nm; this.log(ci, `✏️ Passou a se chamar ${nm}.`); UI.msg(`🏦 Agora é ${nm}.`, 'gold'); if (UI.cur) UI.refresh(); });
  },

  // ---------------------------------------------------------------- conta
  deposit(ci, n) { n = Math.min(Math.floor(n), P.gold); if (n <= 0) return; P.gold -= n; this.B().acc[ci] = this.acc(ci) + n; this.K(ci).reserve += n; Sound.play('coin'); },
  withdraw(ci, n) {
    const K = this.K(ci); n = Math.min(Math.floor(n), this.acc(ci)); if (n <= 0) return;
    if (K.reserve < n) { if (K.reserve <= 0) { UI.msg(`🏦 ${K.name} está sem dinheiro no caixa! Volte no mês que vem.`, 'bad'); return; } UI.msg(`🏦 O caixa só tinha ${K.reserve} 🪙: foi o que deu para sacar.`, 'bad'); n = K.reserve; }
    K.reserve -= n; this.B().acc[ci] -= n; P.gold += n; Sound.play('coin');
  },
  // ---------------------------------------------------------------- aplicações a prazo (títulos do Tesouro)
  apply(ci, ti, n) {
    const [m, r] = BANK_TERMS[ti]; n = Math.min(n, P.gold); if (n < 50) { UI.msg('A aplicação mínima é de 50 🪙.', 'bad'); return; }
    if (G.civs[ci].anarchy) { UI.msg('Ninguém compra títulos de um reino em anarquia.', 'bad'); return; }
    P.gold -= n; G.civs[ci].treasury += n; this.B().terms.push({ ci, n, m, r, due: G.day + m, day: G.day });
    Sound.play('coin'); UI.msg(`📜 Você comprou um título de ${CIV_DEFS[ci].short}: ${n} 🪙 voltam como ${Math.round(n * (1 + r * m))} 🪙 em ${Calendar.short(G.day + m)}.`, 'gold');
  },
  redeemEarly(i) {
    const t = this.B().terms[i]; if (!t) return; const c = G.civs[t.ci], back = Math.round(t.n * 0.9);
    if (c.treasury < back) { UI.msg(`O tesouro de ${CIV_DEFS[t.ci].short} não tem ${back} 🪙 agora.`, 'bad'); return; }
    c.treasury -= back; P.gold += back; this.B().terms.splice(i, 1); UI.msg(`Você resgatou antes do prazo: ${back} 🪙 (10% de multa).`);
  },
  // ---------------------------------------------------------------- expedições de comércio
  expedite(id, n) {
    const x = BANK_EXPEDITIONS.find(e => e.id === id); n = Math.min(n, P.gold); if (!x || n <= 0) return;
    if (this.B().exp.length >= 4) { UI.msg('Você já tem quatro expedições na estrada.', 'bad'); return; }
    P.gold -= n; this.B().exp.push({ id, n, due: G.day + x.m, day: G.day });
    UI.msg(`${x.icon} Você pôs ${n} 🪙 na ${x.name}. Volta em ${Calendar.short(G.day + x.m)}.`, 'gold'); Sound.play('coin');
  },
  // ---------------------------------------------------------------- cofre particular
  box(ci) { const b = this.B().box; return b[ci] || (b[ci] = {}); },
  boxPut(ci, k, n) { n = Math.min(n, Inv.sellable ? Inv.sellable(k) : Inv.count(k)); if (n <= 0) return; Inv.add(k, -n); const bx = this.box(ci); bx[k] = (bx[k] || 0) + n; },
  boxTake(ci, k) { const bx = this.box(ci), n = bx[k] || 0; if (!n) return; Inv.add(k, n); delete bx[k]; },
  // ---------------------------------------------------------------- arrombar o cofre-forte (de noite, com gazua)
  rob(ci) {
    const B = this.B(), K = this.K(ci);
    if (this.mine(ci)) { UI.msg('O cofre é do seu reino: abra pela sala do cofre.', 'bad'); return; }
    if (Routine.phase() !== 'night') { UI.msg('De dia o cofre-forte está cheio de guardas. Só de noite.', 'bad'); return; }
    if (Inv.count('lockpick') <= 0) { UI.msg('🗝️ Você precisa de uma Gazua.', 'bad'); return; }
    if (B.robbed === G.day) { UI.msg('Os guardas ainda estão de olho. Espere o mês que vem.', 'bad'); return; }
    B.robbed = G.day;
    const ok = Math.random() < 0.35 + (P.level || 1) * 0.01;
    if (ok) {
      const g = Math.max(40, Math.min(800, Math.round(K.reserve * 0.15))); K.reserve = Math.max(0, K.reserve - g); P.gold += g;
      this.log(ci, `🗝️ Arrombaram o cofre-forte e levaram ${g} 🪙.`); UI.banner('🗝️ Assalto ao banco!'); UI.msg(`🗝️ Você abriu o cofre-forte do ${K.name} e levou ${g} 🪙!`, 'gold', true);
      if (Math.random() < 0.5) Crime.commit(ci, 'assalto ao banco', g * 2, null, null, true);
    } else {
      if (Math.random() < 0.5) Inv.add('lockpick', -1);
      UI.msg('🚨 A fechadura emperrou e o alarme tocou! Os guardas viram você.', 'bad', true);
      Crime.commit(ci, 'tentativa de assalto ao banco', 300, null, null, true);
    }
  },

  // ---------------------------------------------------------------- tesouro nacional (o rei)
  setRate(ci, r) { if (!this.mine(ci)) return; this.K(ci).rate = r; this.log(ci, `📊 Juros da conta: ${(r * 100).toFixed(1)}% ao mês.`); },
  borrow(ci, n) {
    const c = G.civs[ci], K = this.K(ci); if (!this.mine(ci)) return;
    if (K.reserve < n) { UI.msg(`O banco só tem ${K.reserve} 🪙 em caixa.`, 'bad'); return; }
    if (K.debt + n > this.creditCap(c)) { UI.msg(`O banco não empresta mais: a dívida do reino passaria do limite de ${this.creditCap(c)} 🪙.`, 'bad'); return; }
    K.reserve -= n; K.debt += n; c.treasury += n; this.log(ci, `🧾 O tesouro pegou ${n} 🪙 emprestados (2% ao mês).`); UI.msg(`🧾 +${n} 🪙 no tesouro. A dívida do reino com o banco é de ${K.debt} 🪙.`, 'gold');
  },
  repay(ci, n) {
    const c = G.civs[ci], K = this.K(ci); if (!this.mine(ci)) return; n = Math.min(n, K.debt, c.treasury); if (n <= 0) return;
    c.treasury -= n; K.debt -= n; K.reserve += n; this.log(ci, `✅ O tesouro pagou ${n} 🪙 da dívida.`); if (!K.debt && K.crisis) K.crisis = Math.max(0, K.crisis - 1);
  },
  bond(ci) {
    const c = G.civs[ci], K = this.K(ci); if (!this.mine(ci)) return;
    if (K.bonds.length >= 3) { UI.msg('Já há três emissões de títulos esperando pagamento.', 'bad'); return; }
    const n = 300 + Math.round(c.pop * 1.5), pay = Math.round(n * 1.3);
    c.treasury += n; K.bonds.push({ n, pay, due: G.day + 6 }); this.log(ci, `📜 Emitiu títulos: +${n} 🪙 (paga ${pay} 🪙 em 6 meses).`);
    UI.msg(`📜 O povo comprou ${n} 🪙 em títulos do reino. Em ${Calendar.short(G.day + 6)} o tesouro paga ${pay} 🪙.`, 'gold');
  },
  give(ci, n) { const c = G.civs[ci]; n = Math.min(n, P.gold); if (n <= 0 || !this.mine(ci)) return; P.gold -= n; c.treasury += n; c.happy = Math.min(100, c.happy + n / 400); this.log(ci, `💝 O soberano pôs ${n} 🪙 do próprio bolso no tesouro.`); },
  take(ci, n) {
    const c = G.civs[ci]; n = Math.min(n, c.treasury); if (n <= 0 || !this.mine(ci)) return;
    c.treasury -= n; P.gold += n; c.happy = Math.max(0, c.happy - n / 100); this.log(ci, `💸 O soberano tirou ${n} 🪙 do tesouro para o próprio bolso.`);
    for (const f of Object.values(Families.F())) if (!f.player && f.civ === ci) f.loyalty = Math.max(0, (f.loyalty || 50) - n / 100);
    UI.msg(`💸 +${n} 🪙 no seu bolso. O povo e as famílias não gostaram nada (felicidade e lealdade caem).`, 'bad');
  },
  audit(ci) {
    const c = G.civs[ci]; if (!this.mine(ci)) return; if (c.treasury < 100) { UI.msg('A auditoria custa 100 🪙 do tesouro.', 'bad'); return; }
    c.treasury -= 100; const st = Math.round((c.stolen || 0) * 0.5);
    let caught = 0; const cn = Court.council(ci);
    for (const seat in cn) { const p = G.people[cn[seat]]; if (p && p.alive && p.corrupt) { caught++; p.corrupt = false; People.addAff(p, -20); } }
    c.treasury += st; c.stolen = 0;
    UI.msg(caught || st ? `🔎 A auditoria achou ${caught} conselheiro(s) corrupto(s) e recuperou ${st} 🪙.` : '🔎 A auditoria não achou nada: as contas estão limpas.', caught || st ? 'gold' : '');
    this.log(ci, `🔎 Auditoria: ${caught} corrupto(s), ${st} 🪙 recuperados.`);
  },
  // saúde das contas do reino (para as janelas)
  health(ci) {
    const c = G.civs[ci], K = this.K(ci), fc = Game.civForecast(c), net = fc.income - fc.upkeep;
    const level = c.anarchy ? 'anarquia' : K.crisis >= 2 ? 'crítico' : K.crisis || K.debt > this.creditCap(c) * 0.7 ? 'atenção' : 'saudável';
    return { c, K, net, level, cap: this.creditCap(c) };
  },

  // ---------------------------------------------------------------- todo mês
  // depois da economia de cada reino: o banco cobre o rombo (enquanto tiver reserva e crédito) ou o reino entra em crise
  monthCiv(c, expect) {
    if (c.anarchy) return;
    const K = this.K(c.id), mine = c.ruler === 'player', cap = this.creditCap(c);
    K.reserve += Math.round(c.pop * (0.4 + K.rate * 30)); // o povo deposita (juros maiores atraem mais)
    if (K.debt > 0) { K.debt += Math.ceil(K.debt * BANK_DEBT_RATE); const pay = Math.min(Math.max(0, c.treasury), Math.ceil(K.debt * 0.1)); c.treasury -= pay; K.debt -= pay; K.reserve += pay; }
    // o rei da IA às vezes gasta além da conta (banquetes, palácios, guerras)
    if (!mine && c.rulerId !== null && Math.random() < 0.05) { const p = People.get(c.rulerId), n = U.rint(80, 260) * (p && ['ganancioso', 'orgulhoso'].includes(p.trait) ? 2 : 1); K.debt += n; K.reserve -= Math.min(K.reserve, n); }
    let red = false;
    if (expect < 0) {
      const need = -expect;
      if (this.has(c.id) && K.reserve >= need && K.debt + need <= cap) { K.reserve -= need; K.debt += need; if (mine) Game.note(`🏦 ${K.name} cobriu o rombo de ${need} 🪙 do tesouro de ${CIV_DEFS[c.id].short} (dívida: ${K.debt} 🪙).`); }
      else red = true;
    }
    if (K.debt > cap) red = true;
    if (red) {
      K.crisis++;
      if (mine) { UI.banner(`🚨 ${CIV_DEFS[c.id].short} em crise (${K.crisis}/${BANK_CRISIS})`); UI.msg(`🚨 O tesouro de ${CIV_DEFS[c.id].short} não paga as contas${this.has(c.id) ? ' e o banco não cobre mais' : ' e o reino não tem banco'} (crise ${K.crisis}/${BANK_CRISIS}). Corte gastos, aumente impostos, pague a dívida ou o reino quebra!`, 'bad', true); }
      if (K.crisis >= BANK_CRISIS) this.collapse(c.id);
    } else if (K.crisis && c.treasury > 0) K.crisis--;
  },
  monthTick() {
    const B = this.B();
    // juros das contas (o reino em anarquia não paga)
    let j = 0;
    for (const ci in B.acc) { const c = G.civs[ci]; if (!c || c.anarchy || B.acc[ci] <= 0) continue; const g = Math.round(B.acc[ci] * this.K(ci).rate); B.acc[ci] += g; j += g; }
    if (j) Game.note(`🏦 Suas contas no banco renderam ${j} 🪙.`);
    // cofres particulares: 5 🪙 por mês de cada um
    for (const ci in B.box) if (Object.keys(B.box[ci]).length) { if (this.acc(ci) >= 5) B.acc[ci] -= 5; else if (P.gold >= 5) P.gold -= 5; }
    // títulos que venceram
    for (const t of B.terms.slice()) {
      if (G.day < t.due) continue;
      const c = G.civs[t.ci], pay = Math.round(t.n * (1 + t.r * t.m)); B.terms = B.terms.filter(x => x !== t);
      if (!c || c.anarchy) { UI.msg(`📜 O título de ${CIV_DEFS[t.ci].short} virou pó: o reino quebrou.`, 'bad', true); continue; }
      const K = this.K(t.ci), fromT = Math.min(c.treasury, pay), fromR = Math.min(K.reserve, pay - fromT);
      c.treasury -= fromT; K.reserve -= fromR; P.gold += fromT + fromR;
      if (fromT + fromR < pay) { UI.msg(`📜 ${CIV_DEFS[t.ci].short} só pagou ${fromT + fromR} de ${pay} 🪙 do seu título: calote!`, 'bad', true); K.crisis++; }
      else Game.note(`📜 O título de ${CIV_DEFS[t.ci].short} venceu: +${pay} 🪙.`);
    }
    // títulos emitidos pelo seu reino
    for (const ci in B.k) {
      const K = B.k[ci], c = G.civs[ci]; if (!c) continue;
      for (const b of K.bonds.slice()) { if (G.day < b.due) continue; K.bonds = K.bonds.filter(x => x !== b); if (c.treasury >= b.pay) { c.treasury -= b.pay; this.log(ci, `📜 Pagou ${b.pay} 🪙 de títulos.`); } else { c.treasury = 0; K.crisis++; this.log(ci, '📜 Não pagou os títulos: calote.'); if (c.ruler === 'player') UI.msg(`📜 ${CIV_DEFS[ci].short} não conseguiu pagar os títulos (${b.pay} 🪙): o povo perdeu a confiança (crise).`, 'bad', true); c.happy = Math.max(0, c.happy - 10); } }
    }
    // expedições que voltaram
    for (const e of B.exp.slice()) {
      if (G.day < e.due) continue; B.exp = B.exp.filter(x => x !== e);
      const x = BANK_EXPEDITIONS.find(q => q.id === e.id);
      if (Math.random() < x.risk) { const back = Math.random() < 0.4 ? Math.round(e.n * 0.25) : 0; P.gold += back; UI.msg(`${x.icon} ${x.name}: ${x.bad}${back ? ` Salvaram ${back} 🪙.` : ' Você perdeu tudo.'}`, 'bad', true); }
      else { const g = Math.round(e.n * U.rnd(x.lo, x.hi)); P.gold += g; UI.msg(`${x.icon} ${x.name}: ${x.good} Você recebeu ${g} 🪙 (investiu ${e.n}).`, 'gold', true); }
    }
    // anarquia: saques, bárbaros e, com o tempo, uma nova dinastia
    for (const c of G.civs) if (c.anarchy) this.anarchyTick(c);
  },

  // ---------------------------------------------------------------- falência e anarquia
  collapse(ci) {
    const c = G.civs[ci], K = this.K(ci), B = this.B(), wasMine = c.ruler === 'player', old = c.rulerName;
    const lost = Math.round(this.acc(ci) * 0.6); if (lost) B.acc[ci] -= lost;
    const lostT = B.terms.filter(t => t.ci === ci); B.terms = B.terms.filter(t => t.ci !== ci);
    K.reserve = 0; K.debt = 0; K.crisis = 0; K.bonds = []; K.fell = (K.fell || 0) + 1;
    const leader = People.create({ rank: 'ruler', civ: ci, home: { type: 'castle', civ: ci }, age: U.rint(28, 45), aff: -50, trait: 'corajoso' });
    c.ruler = 'npc'; c.rulerId = leader.id; c.rulerName = `Chefe anarquista ${leader.name}`;
    c.anarchy = { since: G.day, until: G.day + U.rint(4, 7), leader: leader.id };
    c.treasury = 0; c.garrison = 0; c.happy = 15; c.tax = 0; c.rebel = 0;
    if (wasMine) { c.atWar = true; c.relation = -60; if (G.mainRealm === ci) { const o = G.civs.find(x => x.ruler === 'player'); G.mainRealm = o ? o.id : null; } }
    Heraldry.apply();
    World.villages.forEach(v => { if (v.civ === ci && !v.free) { v.free = true; v.anarch = ci; } });
    // o povo sem rei vira bárbaro: acampamentos novos perto das vilas
    const vs = World.villages.filter(v => v.anarch === ci);
    for (const v of vs.slice(0, 3)) { const s = this.campSpot(v); if (s) { B.camps.push({ x: s.x, y: s.y, ci }); this.addCamp(s.x, s.y); } }
    World.chunks = new Map();
    this.log(ci, '💥 Falência: o banco fechou as portas.');
    UI.banner(`💥 ${CIV_DEFS[ci].short} quebrou!`);
    UI.msg(`💥 ${CIV_DEFS[ci].name} faliu! ${wasMine ? 'Você perdeu a coroa:' : `${old} caiu:`} as vilas ficaram sem dono, o povo virou bárbaro e um exército anarquista anda pelas terras.${lost ? ` Você perdeu ${lost} 🪙 da sua conta no banco.` : ''}${lostT.length ? ` ${lostT.length} título(s) seu(s) viraram pó.` : ''}`, wasMine ? 'bad' : 'gold', true);
    Diplo.chronicle(`💥 ${CIV_DEFS[ci].name} faliu: ${old} caiu e o reino virou anarquia.`, true);
    if (wasMine) Progress.diary(`💥 Perdeu ${CIV_DEFS[ci].name}: o reino faliu.`);
  },
  campSpot(v) {
    for (let k = 0; k < 400; k++) {
      const a = Math.random() * Math.PI * 2, r = U.rnd(9, 18), x = Math.round(v.x + Math.cos(a) * r), y = Math.round(v.y + Math.sin(a) * r);
      if (!World.areaOk(x - 1, y - 1, 5, 5) || !World.areaFree(x - 1, y - 1, 5, 5) || Towns.onRoad(x, y, 3, 3)) continue;
      if (World.camps.some(c => U.dist(x, y, c.x, c.y) < 10)) continue;
      return { x, y };
    }
    return null;
  },
  addCamp(x, y) { for (let j = y; j < y + 3; j++) for (let i = x; i < x + 3; i++) World.obj[World.idx(i, j)] = 0; const s = World.addStruct('camp', x, y, 3, 3, 'bandit', { cleared: false, left: 5, respawnDay: 0, barb: true }); World.camps.push(s); return s; },
  anarchyTick(c) {
    const A = c.anarchy;
    // o exército anarquista saqueia uma vila por mês (do reino que caiu ou de um vizinho)
    const near = World.villages.filter(v => v.anarch === c.id || (!v.free && U.dist(v.x, v.y, World.capitals[c.id].x, World.capitals[c.id].y) < 70));
    const v = near.length ? U.pick(near) : null;
    if (v) { v.raid = { by: c.id, until: G.day + ECON_DAYS }; v.ruin = Math.min(3, (v.ruin || 0) + 1); if (v.lord === 'player' || (G.civs[v.civ] && G.civs[v.civ].ruler === 'player')) UI.msg(`🏴 O exército anarquista de ${CIV_DEFS[c.id].short} saqueou ${v.name}!`, 'bad', true); Rumors.atV && Rumors.atV(World.villages.indexOf(v), `O exército anarquista passou por ${v.name} e levou tudo.`); }
    if (G.day < A.until) return;
    this.restore(c);
  },
  // fim da anarquia: a família mais forte do lugar funda uma nova dinastia
  restore(c, byPlayer) {
    const ci = c.id, A = c.anarchy; if (!A) return;
    c.anarchy = null;
    World.villages.forEach(v => { if (v.anarch === ci) { if (v.free && v.civ === ci) v.free = false; delete v.anarch; } });
    if (byPlayer) return;
    const fams = Object.values(Families.F()).filter(f => !f.player && f.civ === ci && Families.adults(f).length).sort((a, b) => Families.influence(b) - Families.influence(a));
    const f = fams[0], head = f ? Families.head(f) : null;
    const old = People.get(A.leader); if (old && old.alive && old.rank === 'ruler') old.rank = 'knight';
    if (head && head.alive) Succession.seat(c, head, 'ruler');
    else { const p = People.create({ rank: 'ruler', civ: ci, home: { type: 'castle', civ: ci }, age: U.rint(30, 50) }); Succession.seat(c, p, 'ruler'); }
    c.tax = 0.1; c.garrison = 6; c.treasury = 150; c.happy = 40; c.atWar = false; c.relation = Math.max(c.relation || 0, -20);
    const K = this.K(ci); K.reserve = 200 + c.pop; K.debt = 0; K.crisis = 0;
    Heraldry.apply();
    UI.msg(`👑 Fim da anarquia em ${CIV_DEFS[ci].short}: ${c.rulerName} fundou uma nova dinastia${f ? ` (${Families.name(f)})` : ''}.`, 'gold', true);
    Diplo.chronicle(`👑 ${c.rulerName} acabou com a anarquia e fundou uma nova dinastia em ${CIV_DEFS[ci].name}.`, true);
  },
  // o exército anarquista aparece quando você anda pelas terras do reino que caiu
  update(dt) {
    this.t = (this.t || 0) - dt; if (this.t > 0) return; this.t = 25;
    if (G.state !== 'play' || G.place || G.dungeon || G.siege || P.dead) return;
    const tx = Math.floor(P.x / TILE), ty = Math.floor(P.y / TILE); if (!World.inb(tx, ty)) return;
    const ci = World.terr[World.idx(tx, ty)], c = G.civs[ci]; if (!c || !c.anarchy) return;
    if (G.ents.filter(e => !e.dead && e.tag === 'anarch').length >= 6 || Math.random() < 0.5) return;
    const a = Math.random() * Math.PI * 2, n = U.rint(3, 5);
    for (let k = 0; k < n; k++) { const s = freeSpotNear(P.x + Math.cos(a) * 11 * TILE + U.rnd(-40, 40), P.y + Math.sin(a) * 11 * TILE + U.rnd(-40, 40), 80); const e = Game.spawn('bandit', s.x, s.y, { tag: 'anarch', leash: 40, archer: Math.random() < 0.3 }); e.aggro = 16; }
    UI.msg(`🏴 Um bando do exército anarquista de ${CIV_DEFS[ci].short} vem na sua direção!`, 'bad');
  },
};

// ------------------------------------------------------------------ interior do banco
LAYOUTS.bank = function () {
  return { w: 16, h: 10, items: [
    ['vaultdoor', 7, 0, 2, 1, { act: 'bank:vault' }], ['strongbox', 4, 0], ['strongbox', 11, 0], ['coinpile', 5, 0], ['coinpile', 10, 0],
    ['banner', 2, -1], ['banner', 13, -1], ['window', 4, -1], ['window', 11, -1], ['lamp', 6, -1], ['lamp', 9, -1],
    ['pillar', 1, 2], ['pillar', 14, 2], ['pillar', 1, 6], ['pillar', 14, 6],
    ['teller', 2, 3, 4, 1, { act: 'bank:conta' }], ['teller', 10, 3, 4, 1, { act: 'bank:credito' }],
    ['scales', 3, 3], ['scales', 12, 3],
    ['ledgerdesk', 0, 8, 2, 1, { act: 'bank:prazo' }], ['quoteboard', 15, 4, 1, 2, { act: 'bank:expedicoes' }], ['safebox', 13, 8, 2, 1, { act: 'bank:cofre' }],
    ['carpet', 7, 1, 2, 9], ['bench', 4, 6, 2], ['bench', 10, 6, 2], ['plant', 0, 0], ['plant', 15, 0], ['plant', 15, 9]],
    keeper: [3.5, 2], staff: [[11.5, 2], [7.5, 1.4]], wander: [[5, 7], [11, 7], [3, 6]] };
};
Object.assign(FURN, { vaultdoor: { block: true, light: 1, lr: 90, lcol: '#ffd36b' }, teller: { block: true }, strongbox: { block: true }, coinpile: { block: true }, scales: {}, ledgerdesk: { block: true }, quoteboard: { block: true }, safebox: { block: true } });

{
  // quem trabalha no banco: o banqueiro (um por banco) e os guardas
  const pe0 = Places.people.bind(Places);
  Places.people = function (src, d, L) {
    pe0(src, d, L);
    if (d.lay !== 'bank') return;
    const P0 = G.place, ci = src.owner, K = Bank.K(ci), at = ([x, y]) => [(P0.fx0 + x + 0.5) * TILE, (P0.fy0 + y + 0.85) * TILE];
    let bk = K.banker !== undefined ? People.get(K.banker) : null;
    if (!bk || !bk.alive) { bk = People.create({ rank: 'merchant', civ: ci, home: { type: 'castle', civ: ci }, age: U.rint(35, 60) }); K.banker = bk.id; }
    const put = (p, spot) => { const [x, y] = at(spot), e = Game.spawn('villager', x, y, { civ: ci, npc: p, leash: 0.4 }); e.placeNpc = true; e.still = true; G.spawned.set(p.id, e); return e; };
    put(bk, L.keeper);
    let ck = K.clerk !== undefined ? People.get(K.clerk) : null;
    if (!ck || !ck.alive) { ck = People.create({ rank: 'merchant', civ: ci, home: { type: 'castle', civ: ci }, age: U.rint(20, 40) }); K.clerk = ck.id; }
    put(ck, L.staff[0]);
    const cl = G.people.filter(p => p.alive && People.isAdult(p) && !p.capanga && !p.kin && p.civ === ci && !People.isCourt(p) && !G.spawned.has(p.id)).slice(0, 2);
    cl.forEach((p, k) => { const [x, y] = at(L.wander[k]), e = Game.spawn('villager', x, y, { civ: ci, npc: p, leash: 1.6 }); e.placeNpc = true; G.spawned.set(p.id, e); });
    for (const sp of [[0.5, 4.5], [15.2, 7]]) { const [x, y] = at(sp), g = Game.spawn('guard', x, y, { civ: ci, leash: 0.4, tag: 'room' }); g.placeNpc = true; }
  };
  const fl0 = Places.furnLabel.bind(Places);
  Places.furnLabel = function (f) {
    if (!f.act || !f.act.startsWith('bank:')) return fl0(f);
    const s = G.place && G.place.src, mine = s && Bank.mine(s.owner);
    return { 'bank:vault': mine ? '🏦 Sala do cofre — o Tesouro Nacional' : '🔒 Cofre-forte' + (Routine.phase() === 'night' ? ' — tentar arrombar' : ''), 'bank:conta': 'Caixa — conta, depósitos e saques', 'bank:credito': 'Caixa — empréstimos e crédito',
      'bank:prazo': 'Mesa do escrivão — aplicações e títulos', 'bank:expedicoes': 'Quadro das expedições de comércio', 'bank:cofre': 'Cofres particulares — guardar itens' }[f.act] || 'Banco';
  };
  const us0 = Places.use.bind(Places);
  Places.use = function (f) {
    if (!f.act || !f.act.startsWith('bank:')) return us0(f);
    const ci = G.place.src.owner, k = f.act.slice(5);
    if (k === 'vault') { if (Bank.mine(ci)) UI.showBank(ci, 'tesouro'); else UI.showBank(ci, 'cofre', true); return; }
    UI.showBank(ci, k);
  };
  // desenho: o prédio e os móveis
  const ds0 = drawStructExtra;
  // eslint-disable-next-line no-global-assign
  drawStructExtra = function (ctx, s, X, Y, time, H) {
    if (s.type !== 'bank') return ds0(ctx, s, X, Y, time, H);
    const { R, shadow, flag, w, h } = H, stone = '#d8d2c4', dark = '#a8a090', gold = '#d6ae60';
    shadow();
    R(4, h - 14, w - 8, 10, '#b8b0a0'); R(10, h - 8, w - 20, 4, '#9a9284'); // escadaria
    R(10, 30, w - 20, h - 44, stone); R(10, 30, w - 20, 4, '#efe9dc');
    for (let x = 16; x < w - 18; x += 22) { R(x, 34, 8, h - 50, '#f2ede2'); R(x + 6, 34, 2, h - 50, dark); R(x - 2, h - 18, 12, 4, dark); R(x - 2, 32, 12, 4, dark); }
    ctx.fillStyle = '#c9c1b0'; ctx.beginPath(); ctx.moveTo(X + 4, Y + 32); ctx.lineTo(X + w / 2, Y + 4); ctx.lineTo(X + w - 4, Y + 32); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#e6dfd0'; ctx.beginPath(); ctx.moveTo(X + 12, Y + 29); ctx.lineTo(X + w / 2, Y + 10); ctx.lineTo(X + w - 12, Y + 29); ctx.closePath(); ctx.fill();
    ctx.fillStyle = gold; ctx.beginPath(); ctx.arc(X + w / 2, Y + 21, 6, 0, Math.PI * 2); ctx.fill(); R(w / 2 - 1, 17, 2, 8, '#8a6a20');
    R(w / 2 - 9, h - 40, 18, 26, '#5a3a1e'); R(w / 2 - 9, h - 40, 18, 3, gold); R(w / 2 + 4, h - 28, 2, 2, gold);
    if (G.darkness > 0.2) { R(22, 44, 8, 10, U.rgba('#ffd36b', 0.8)); R(w - 30, 44, 8, 10, U.rgba('#ffd36b', 0.8)); }
    flag(8, -6, Game.civColor(typeof s.owner === 'number' ? s.owner : 0)); flag(w - 12, -6, Game.civColor(typeof s.owner === 'number' ? s.owner : 0));
  };
  const df0 = drawFurn;
  // eslint-disable-next-line no-global-assign
  drawFurn = function (ctx, f, X, Y, time) {
    if (!['vaultdoor', 'teller', 'strongbox', 'coinpile', 'scales', 'ledgerdesk', 'quoteboard', 'safebox'].includes(f.k)) return df0(ctx, f, X, Y, time);
    const w = f.w * TILE, h = f.h * TILE;
    const R = (x, y, ww, hh, c) => { ctx.fillStyle = c; ctx.fillRect(Math.round(X + x), Math.round(Y + y), ww, hh); };
    const ell = (x, y, rx, ry, c) => { ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(X + x, Y + y, rx, ry, 0, 0, Math.PI * 2); ctx.fill(); };
    const gold = '#e2b84a', gdark = '#9a7420';
    switch (f.k) {
      case 'vaultdoor': R(0, -26, w, h + 26, '#6e6a62'); ell(w / 2, -2, 26, 26, '#8f8a80'); ell(w / 2, -2, 21, 21, '#b8b2a6'); for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3 + time * 0.2; R(w / 2 + Math.cos(a) * 14 - 2, -2 + Math.sin(a) * 14 - 2, 4, 4, '#5a564e'); } ell(w / 2, -2, 6, 6, gold); R(w / 2 - 1, -8, 2, 12, gdark); break;
      case 'teller': R(0, 2, w, h - 4, '#6a4626'); R(0, 2, w, 4, '#8a5e34'); for (let x = 4; x < w; x += 8) R(x, -18, 2, 20, gold); R(0, -20, w, 3, gdark); R(w / 2 - 8, 8, 16, 10, '#efe6d2'); break;
      case 'strongbox': R(3, 6, w - 6, h - 8, '#5a3a1e'); R(3, 6, w - 6, 3, '#7a5230'); R(3, 14, w - 6, 2, '#3a3a3a'); R(w / 2 - 3, 12, 6, 6, gold); break;
      case 'coinpile': ell(w / 2, h - 8, 12, 5, gdark); ell(w / 2, h - 11, 10, 5, gold); ell(w / 2 - 3, h - 15, 6, 3, '#f2d27a'); ell(w / 2 + 4, h - 13, 4, 2, '#f2d27a'); break;
      case 'scales': R(w / 2 - 1, -6, 2, 14, gdark); R(w / 2 - 10, -6, 20, 2, gdark); ell(w / 2 - 9, 0, 5, 2, gold); ell(w / 2 + 9, 2, 5, 2, gold); break;
      case 'ledgerdesk': R(0, 6, w, h - 8, '#7a4a26'); R(0, 6, w, 3, '#9a6a3a'); R(8, 0, 22, 10, '#efe6d2'); R(18, 0, 1, 10, '#a8977a'); R(w - 16, -2, 3, 12, '#3a2a1a'); break;
      case 'quoteboard': R(4, -20, w - 8, h + 10, '#3a2a1a'); R(6, -18, w - 12, h + 6, '#2a3a2a'); for (let y = -14; y < h - 6; y += 7) R(8, y, w - 16, 2, ['#e8e0c8', '#c8a050', '#e8e0c8'][((y + 14) / 7) % 3 | 0]); break;
      case 'safebox': for (let k = 0; k < 2; k++) for (let j = 0; j < 3; j++) { R(2 + k * 30, -14 + j * 14, 26, 12, '#8a8478'); R(2 + k * 30, -14 + j * 14, 26, 2, '#a8a296'); ell(15 + k * 30, -8 + j * 14, 2, 2, gold); } break;
    }
  };

  // ---------------------------------------------------------------- ganchos no jogo
  // um banco perto de cada castelo, junto com o cemitério
  const gp0 = Graves.place.bind(Graves);
  Graves.place = function () { const r = gp0(); try { Bank.place(); } catch (e) { console.warn('banco', e); } return r; };
  // fundar: escolher o lugar e depois o nome; um banco por reino
  const st0 = Urban.start.bind(Urban);
  Urban.start = function (mode) {
    if (mode !== 'c:bank') return st0(mode);
    const m0 = UI.msg; UI.msg = () => {}; let r; try { r = st0(mode); } finally { UI.msg = m0; }
    UI.msg('🏦 Escolha o lugar do banco: chão limpo, fora da estrada e sem vegetação (perto do castelo é melhor). Botão direito ou Esc encerra.', 'gold');
    return r;
  };
  const pe1 = Urban.placeErr.bind(Urban);
  Urban.placeErr = function (def, tx, ty, s, civic) {
    if (!s && def === CIVIC.bank) { const ci = Bank.founding; if (ci !== undefined && Bank.has(ci)) return `${CIV_DEFS[ci].short} já tem banco`; }
    return pe1(def, tx, ty, s, civic);
  };
  const ck0 = Urban.click.bind(Urban);
  Urban.click = function () {
    const bank = this.mode === 'c:bank', r = ck0();
    if (bank && r && r.type === 'bank') { if (Bank.founding !== undefined && r.owner !== Bank.founding && Bank.mine(Bank.founding)) { r.owner = Bank.founding; const e = this.E().added.find(a => a.type === 'bank' && a.x === r.x && a.y === r.y); if (e) e.civ = Bank.founding; } Bank.found(r.owner); Bank.founding = undefined; }
    return r;
  };
  // mudar de lugar o banco que veio com o reino: o lugar novo fica guardado; demolir: ele não volta mais
  const rl0 = Urban.relocate.bind(Urban);
  Urban.relocate = function (s, nx, ny, quiet) { const r = rl0(s, nx, ny, quiet); if (s.type === 'bank' && !s.added) Bank.K(s.owner).pos = { x: s.x, y: s.y }; return r; };
  const dd0 = Urban.doDemolish.bind(Urban);
  Urban.doDemolish = function (s) { if (s && s.type === 'bank') { const K = Bank.K(s.owner); if (!s.added) K.gone = true; Bank.log(s.owner, '🏚️ O prédio foi demolido.'); } return dd0(s); };
  // a economia de cada reino: o banco cobre o rombo ou começa a crise
  const tc0 = Game.tickCiv.bind(Game);
  Game.tickCiv = function (c) {
    if (c.anarchy) { c.treasury = 0; c.garrison = 0; c.happy = Math.max(5, Math.min(30, c.happy)); return; }
    const fc = this.civForecast(c), expect = c.treasury + fc.income - fc.upkeep;
    tc0(c); Bank.monthCiv(c, expect);
  };
  const mt0 = Lifesim.monthTick.bind(Lifesim);
  Lifesim.monthTick = function () { mt0(); Bank.monthTick(); };
  // tomar o castelo do chefe anarquista acaba com a anarquia
  const br0 = Game.becomeRuler.bind(Game);
  Game.becomeRuler = function (ci, how) { const c = G.civs[ci]; if (c && c.anarchy) Bank.restore(c, true); return br0(ci, how); };
  // empréstimos da coroa saem da reserva do banco e as parcelas voltam para ela
  const lt0 = Loans.take.bind(Loans);
  Loans.take = function (kind, ci, pid, amount) {
    if (kind === 'crown' && G.civs[ci]) { const K = Bank.K(ci); if (K.reserve < amount) { UI.msg(`🏦 ${K.name} não tem ${amount} 🪙 em caixa para emprestar.`, 'bad'); return; } const n0 = Loans.L().length; lt0(kind, ci, pid, amount); if (Loans.L().length > n0) K.reserve -= amount; return; }
    return lt0(kind, ci, pid, amount);
  };
  const owed = () => Loans.L().filter(l => l.kind === 'crown').map(l => [l, l.left]);
  const back = before => { for (const [l, left] of before) { const d = left - Math.max(0, l.left); if (d > 0 && G.civs[l.ci]) Bank.K(l.ci).reserve += d; } };
  const lm0 = Loans.monthTick.bind(Loans);
  Loans.monthTick = function () { const b = owed(); lm0(); back(b); };
  const lp0 = Loans.pay.bind(Loans);
  Loans.pay = function (i, all) { const b = owed(); lp0(i, all); back(b); };
  // as finanças da casa agora ficam no banco: a poupança antiga vira conta no banco do reino mais perto
  Fin._open = Fin.open.bind(Fin);
  Fin.open = function () {
    const D = Fin.D(), ci = Bank.nearest();
    if (D.save > 0) { Bank.B().acc[ci] = Bank.acc(ci) + D.save; Bank.K(ci).reserve += D.save; UI.msg(`🏦 Sua poupança de ${D.save} 🪙 foi para uma conta no ${Bank.name(ci)}.`, 'gold'); D.save = 0; }
    const map = { poupanca: 'conta', emprestar: 'emprestar', investir: 'investir', vilas: 'investir' };
    const cur = UI.cur && UI.cur.fn === 'showBank' ? UI.cur.args : null;
    UI.showBank(cur ? cur[0] : ci, cur ? cur[1] : map[UI.sel.fsub] || 'conta');
  };
  const sr0 = UI.showRest.bind(UI);
  UI.showRest = function (sid) {
    sr0(sid);
    const b = this.panel && this.panel.querySelector('.rest-acts [data-act="finance"] .ra-t');
    if (b) { const ci = Bank.nearest(); b.innerHTML = `<b>Banco</b><small>${UI.esc(Bank.name(ci))}: conta (${Bank.acc(ci)} 🪙), empréstimos e investimentos</small>`; }
  };
  // no castelo dos outros, o empréstimo da coroa vira o banco do reino
  const op0 = UI.open.bind(UI);
  UI.open = function (title, body, fn, args, sub) {
    if (fn === 'showCastle' && args && args[0] !== undefined) body = body.replace(/<button data-act="loans" data-k="crown"[^>]*>[^<]*<\/button>/, `<button data-act="bank" data-c="${args[0]}" data-t="credito">🏦 ${UI.esc(Bank.name(args[0]))}: empréstimos e contas</button>`);
    return op0(title, body, fn, args, sub);
  };
  // na administração do reino: o banco e o tesouro nacional
  const kp0 = UI.kingdomPage.bind(UI);
  UI.kingdomPage = function (ci) {
    let h = kp0(ci);
    if (this.sel.ksub !== 'resumo') return h;
    const H = Bank.health(ci), has = Bank.has(ci), K = H.K;
    h = h.replace('<small>Tesouro do reino</small>', `<small>Tesouro no ${UI.esc(K.name)}</small>`);
    const card = has ? `<div class="card bank-k ${H.level}"><div class="sec">🏦 ${UI.esc(K.name)} <span>${{ saudável: '✔ contas saudáveis', atenção: '⚠️ atenção', crítico: '🚨 crise', anarquia: '💥 anarquia' }[H.level]}</span></div>
        <div class="bank-k-row"><span>Reserva <b>${K.reserve} 🪙</b></span><span>Dívida do reino <b class="${K.debt > H.cap * 0.7 ? 'bad' : ''}">${K.debt} / ${H.cap} 🪙</b></span><span>Crise <b class="${K.crisis ? 'bad' : ''}">${K.crisis}/${BANK_CRISIS}</b></span><span>Juros da conta <b>${(K.rate * 100).toFixed(1)}%</b></span></div>
        <div class="act-row"><button class="primary" data-act="bank" data-c="${ci}" data-t="tesouro">👑 Tesouro Nacional</button><button data-act="bankName" data-c="${ci}">✏️ Renomear</button></div></div>`
      : `<div class="card bank-k atenção"><div class="sec">🏦 O reino ainda não tem banco</div><p class="dt-desc">Sem banco, ninguém cobre o rombo quando o tesouro fica no vermelho: com ${BANK_CRISIS} meses de crise o reino quebra. Funde o banco do reino, escolha o lugar e o nome.</p>
        <div class="act-row"><button class="primary" data-act="bankFound" data-c="${ci}" ${Inv.has(CIVIC.bank.cost) ? '' : 'disabled'}>🏦 Fundar o banco (${Object.entries(CIVIC.bank.cost).map(([k, n]) => `${n} ${ITEMS[k].name}`).join(', ')})</button></div></div>`;
    return h.replace('<div class="tiles big">', card + '<div class="tiles big">');
  };
  // avisos de crise
  const ka0 = UI.kAlerts.bind(UI);
  UI.kAlerts = function () {
    const out = ka0();
    for (const c of G.civs.filter(x => x.ruler === 'player')) { const K = Bank.K(c.id); if (K.crisis) out.unshift([`🚨 ${CIV_DEFS[c.id].short} em crise financeira (${K.crisis}/${BANK_CRISIS}): o reino pode quebrar.`, 'k:' + c.id]); else if (!Bank.has(c.id)) out.push([`🏦 ${CIV_DEFS[c.id].short} não tem banco: funde um no Resumo do reino.`, 'k:' + c.id]); }
    return out;
  };
  const cu0 = Content2.update.bind(Content2);
  Content2.update = function (dt) { cu0(dt); Bank.update(dt); };
  const a0 = UI.act.bind(UI);
  UI.act = function (a, d) {
    if (a === 'bank') { UI.showBank(+d.c, d.t); return; }
    if (a === 'bankFound') { Bank.startFound(+d.c); return; }
    if (a === 'bankName') { Bank.rename(+d.c); return; }
    if (a === 'bk') {
      const ci = +d.c, n = d.n === 'all' ? Infinity : +d.n;
      switch (d.op) {
        case 'dep': Bank.deposit(ci, n === Infinity ? P.gold : n); break;
        case 'wd': Bank.withdraw(ci, n === Infinity ? Bank.acc(ci) : n); break;
        case 'apply': Bank.apply(ci, +d.i, n); break;
        case 'early': Bank.redeemEarly(+d.i); break;
        case 'exp': Bank.expedite(d.i, n); break;
        case 'put': Bank.boxPut(ci, d.k, Inv.count(d.k)); break;
        case 'take': Bank.boxTake(ci, d.k); break;
        case 'rob': Bank.rob(ci); break;
        case 'rate': Bank.setRate(ci, +d.n); break;
        case 'borrow': Bank.borrow(ci, n); break;
        case 'repay': Bank.repay(ci, n === Infinity ? Bank.K(ci).debt : n); break;
        case 'bond': Bank.bond(ci); break;
        case 'give': Bank.give(ci, n); break;
        case 'take2': Bank.take(ci, n); break;
        case 'audit': Bank.audit(ci); break;
        case 'loan': Loans.take('crown', ci, undefined, n); break;
        case 'pay': Loans.pay(+d.i, d.all === '1'); break;
      }
      if (UI.cur && UI.cur.fn === 'showBank') UI.showBank(ci, UI.cur.args[1]);
      return;
    }
    return a0(a, d);
  };
}

// ------------------------------------------------------------------ a janela do banco
WIN_SCENES.showBank = ci => {
  const K = Bank.K(ci), H = Bank.health(ci);
  return { ic: '🏦', theme: 'gold', kicker: `Banco de ${CIV_DEFS[ci].short}`, title: K.name, line: H.level === 'anarquia' ? 'O reino quebrou: o banco está de portas fechadas.' : 'Guarde, aplique, peça emprestado, invista e arrisque em expedições. Aqui também fica o tesouro do reino.',
    chips: [['🪙', `${P.gold} no bolso`], ['🏦', `${Bank.acc(ci)} na conta`], ['📊', `${(K.rate * 100).toFixed(1)}% ao mês`], [H.level === 'saudável' ? '✔' : '⚠️', H.level]] };
};
UI.showBank = function (ci, tab, robbing) {
  if (!G.civs[ci]) return;
  const K = Bank.K(ci), B = Bank.B(), c = G.civs[ci], mine = Bank.mine(ci);
  const tabs = BANK_TABS;
  tab = tabs.some(([k]) => k === tab) ? tab : 'conta';
  const btn = (op, n, label, ok, extra) => `<button data-act="bk" data-op="${op}" data-c="${ci}" data-n="${n}" ${extra || ''} ${ok ? '' : 'disabled'}>${label}</button>`;
  const closed = !!c.anarchy;
  let body = '';
  if (closed && tab !== 'tesouro') body = `<div class="card bank-closed"><div class="sec">💥 Portas fechadas</div><p class="dt-desc">${CIV_DEFS[ci].name} quebrou e virou anarquia. O banco não abre até uma nova dinastia (ou alguém tomar o castelo do ${UI.esc(c.rulerName)}).</p></div>`;
  else if (tab === 'conta') {
    const a = Bank.acc(ci), all = Object.entries(B.acc).filter(([, n]) => n > 0);
    body = `<div class="card"><div class="sec">💰 Sua conta <span>rende ${(K.rate * 100).toFixed(1)}% ao mês</span></div>
      <div class="bank-big"><b>${a} 🪙</b><small>no ${UI.esc(K.name)}</small></div>
      <p class="dt-desc">O dinheiro na conta rende todo mês e fica a salvo de ladrões e cobradores. Mas cuidado: se o reino quebrar, a conta perde 60%. Espalhe o dinheiro por bancos de reinos saudáveis.</p>
      <div class="sec">Depositar</div><div class="act-row">${[100, 500, 1000].map(n => btn('dep', n, `+${n}`, P.gold >= n)).join('')}${btn('dep', 'all', 'Tudo', P.gold > 0)}</div>
      <div class="sec" style="margin-top:8px">Sacar <span>no caixa: ${K.reserve} 🪙</span></div><div class="act-row">${[100, 500, 1000].map(n => btn('wd', n, `−${n}`, a >= n)).join('')}${btn('wd', 'all', 'Tudo', a > 0)}</div></div>
      ${all.length > 1 || (all.length === 1 && +all[0][0] !== ci) ? `<div class="card"><div class="sec">🗺️ Suas contas nos outros bancos</div>${all.filter(([k]) => +k !== ci).map(([k, n]) => `<div class="crow"><span class="ri">🏦</span><span><b>${UI.esc(Bank.name(+k))}</b><small>${CIV_DEFS[k].short} · ${n} 🪙 · ${Bank.health(+k).level}</small></span><span class="act-row"><button data-act="bank" data-c="${k}" data-t="conta">Ver</button></span></div>`).join('')}</div>` : ''}`;
  } else if (tab === 'prazo') {
    const mineT = B.terms.map((t, i) => t.ci === ci ? `<div class="crow"><span class="ri">📜</span><span><b>${t.n} 🪙 → ${Math.round(t.n * (1 + t.r * t.m))} 🪙</b><small>${t.m} meses a ${(t.r * 100).toFixed(1)}% · vence em ${Calendar.short(t.due)}</small></span><span class="act-row"><button data-act="bk" data-op="early" data-c="${ci}" data-i="${i}">Resgatar já (−10%)</button></span></div>` : '').join('');
    body = `<div class="card"><div class="sec">📜 Títulos do Tesouro de ${CIV_DEFS[ci].short}</div>
      <p class="dt-desc">Você empresta ao reino: o dinheiro vai para o tesouro e volta com juros no vencimento. Quanto mais longo, mais rende, e maior o risco: se o reino quebrar antes, o título vira pó.</p>
      ${BANK_TERMS.map(([m, r, nm], i) => `<div class="crow"><span class="ri">📜</span><span><b>${nm}</b><small>${(r * 100).toFixed(1)}% ao mês · 1000 🪙 viram ${Math.round(1000 * (1 + r * m))} 🪙</small></span><span class="act-row">${[100, 500, 1000].map(n => btn('apply', n, `${n}`, P.gold >= n, `data-i="${i}"`)).join('')}</span></div>`).join('')}</div>
      <div class="card"><div class="sec">Seus títulos aqui</div>${mineT || '<p class="muted">Nenhum título deste reino.</p>'}</div>`;
  } else if (tab === 'credito') {
    const o = Loans.OFFERS.crown, L = Loans.L();
    const offers = o.amounts.map(a => { const total = Math.round(a * (1 + o.rate * o.months)); return `<div class="crow"><span class="ri">💰</span><span><b>${a} 🪙</b><small>${o.months} parcelas de ${Math.ceil(total / o.months)} 🪙 · total ${total} 🪙</small></span><span class="act-row">${btn('loan', a, 'Pegar', K.reserve >= a)}</span></div>`; }).join('');
    const debts = L.map((l, i) => `<div class="crow"><span class="ri">🧾</span><span><b>${UI.esc(Loans.lenderName(l))}</b><small>deve ${l.left} 🪙 · parcela ${l.monthly} 🪙${l.missed ? ` · <b class="bad">${l.missed} atrasada(s)</b>` : ''}</small></span><span class="act-row"><button data-act="bk" data-op="pay" data-c="${ci}" data-i="${i}" ${P.gold >= l.monthly ? '' : 'disabled'}>Parcela</button><button data-act="bk" data-op="pay" data-c="${ci}" data-i="${i}" data-all="1" ${P.gold > 0 ? '' : 'disabled'}>Quitar</button></span></div>`).join('');
    body = `<div class="card"><div class="sec">🧾 Empréstimos do ${UI.esc(K.name)} <span>${(o.rate * 100).toFixed(0)}% ao mês</span></div>${offers}<p class="dt-desc">As parcelas saem do seu ouro todo mês. Atrasou duas vezes, os cobradores levam ouro e bens; atrasou três, você vira procurado no reino.</p></div>
      <div class="card"><div class="sec">Suas dívidas <span>${L.length}</span></div>${debts || '<p class="muted">Você não deve nada a ninguém.</p>'}</div>`;
  } else if (tab === 'emprestar' || tab === 'investir') {
    const subs = tab === 'emprestar' ? ['emprestar'] : ['investir', 'vilas'], o = UI.sel.fsub; let inner = '';
    const op = UI.open; UI.open = (t, b) => { const ti = b.indexOf('<div class="tabs subtabs">'); inner += ti >= 0 ? b.slice(b.indexOf('</div>', ti) + 6) : b; };
    try { for (const s of subs) { UI.sel.fsub = s; Fin._open(); } } finally { UI.open = op; UI.sel.fsub = o; }
    body = inner;
  } else if (tab === 'expedicoes') {
    const going = B.exp.map(e => { const x = BANK_EXPEDITIONS.find(q => q.id === e.id); return `<div class="crow"><span class="ri">${x.icon}</span><span><b>${x.name}</b><small>${e.n} 🪙 · volta em ${Calendar.short(e.due)}</small></span></div>`; }).join('');
    body = `<div class="card"><div class="sec">🐫 Expedições de comércio <span>até 4 ao mesmo tempo</span></div>
      <p class="dt-desc">Ponha dinheiro numa expedição: quando ela voltar, você recebe o lucro. Quanto mais longe, mais rende e maior o risco de perder tudo.</p>
      ${BANK_EXPEDITIONS.map(x => `<div class="crow"><span class="ri">${x.icon}</span><span><b>${x.name}</b><small>${x.m} meses · ganho de ${Math.round((x.lo - 1) * 100)}% a ${Math.round((x.hi - 1) * 100)}% · risco ${Math.round(x.risk * 100)}%</small><i class="bank-risk"><i style="width:${x.risk * 100}%"></i></i></span><span class="act-row">${[100, 500, 1000].map(n => btn('exp', n, `${n}`, P.gold >= n && B.exp.length < 4, `data-i="${x.id}"`)).join('')}</span></div>`).join('')}</div>
      <div class="card"><div class="sec">Na estrada</div>${going || '<p class="muted">Nenhuma expedição sua agora.</p>'}</div>`;
  } else if (tab === 'cofre') {
    const bx = Bank.box(ci), stored = Object.entries(bx), inv = Object.keys(P.inv).filter(k => P.inv[k] > 0 && ITEMS[k] && !Object.values(P.equip).includes(k)).sort((a, b) => ITEMS[b].price * P.inv[b] - ITEMS[a].price * P.inv[a]).slice(0, 12);
    body = `<div class="card"><div class="sec">🔐 Seu cofre particular <span>5 🪙 por mês</span></div><p class="dt-desc">Guarde o que vale muito e não precisa levar: fica a salvo de ladrões, cobradores e da morte na estrada.</p>
      <div class="bank-box">${stored.map(([k, n]) => `<button class="bank-it" data-act="bk" data-op="take" data-c="${ci}" data-k="${k}" title="Tirar">${UI.ii(ITEMS[k])}<b>${n}</b><small>${UI.esc(ITEMS[k].name)}</small></button>`).join('') || '<p class="muted">O cofre está vazio.</p>'}</div>
      <div class="sec" style="margin-top:8px">Guardar da mochila <span>o que vale mais</span></div><div class="bank-box">${inv.map(k => `<button class="bank-it" data-act="bk" data-op="put" data-c="${ci}" data-k="${k}" title="Guardar tudo">${UI.ii(ITEMS[k])}<b>${P.inv[k]}</b><small>${UI.esc(ITEMS[k].name)}</small></button>`).join('') || '<p class="muted">Nada na mochila.</p>'}</div></div>
      ${!mine ? `<div class="card bank-rob"><div class="sec">🗝️ O cofre-forte</div><p class="dt-desc">Lá dentro fica a reserva do banco (${K.reserve} 🪙). De noite, com uma gazua, dá para tentar arrombar. Se der errado, você vira procurado.</p><div class="act-row">${btn('rob', 0, '🗝️ Tentar arrombar', Routine.phase() === 'night' && Inv.count('lockpick') > 0 && B.robbed !== G.day)}</div></div>` : ''}`;
  } else if (tab === 'tesouro') {
    const H = Bank.health(ci), fc = Game.civForecast(c);
    if (!mine) {
      body = `<div class="card"><div class="sec">👑 Tesouro de ${CIV_DEFS[ci].short} <span>${H.level}</span></div><div class="bank-k-row"><span>Reserva do banco <b>${K.reserve} 🪙</b></span><span>Dívida do reino <b>${K.debt} 🪙</b></span><span>Crise <b>${K.crisis}/${BANK_CRISIS}</b></span></div>
        <p class="dt-desc">Só ${UI.esc(c.rulerName)} entra na sala do cofre. Pela dívida e pela crise dá para ver se vale a pena deixar dinheiro aqui.</p>${K.log.length ? `<div class="sec">Notícias do banco</div>${K.log.slice(0, 5).map(l => `<div class="bank-log"><small>${Calendar.short(l.day)}</small> ${UI.esc(l.t)}</div>`).join('')}` : ''}</div>`;
    } else {
      body = `<div class="card bank-k ${H.level}"><div class="sec">👑 Tesouro Nacional de ${CIV_DEFS[ci].short} <span>${H.level}</span></div>
        <div class="tiles big"><div class="stile"><small>Tesouro</small><b>${c.treasury} 🪙</b></div><div class="stile"><small>Saldo do mês</small><b class="${H.net < 0 ? 'bad' : 'ok'}">${H.net >= 0 ? '+' : ''}${H.net} 🪙</b></div>
          <div class="stile"><small>Reserva do banco</small><b>${K.reserve} 🪙</b></div><div class="stile"><small>Dívida do reino</small><b class="${K.debt > H.cap * 0.7 ? 'bad' : ''}">${K.debt} / ${H.cap}</b></div><div class="stile"><small>Crise</small><b class="${K.crisis ? 'bad' : 'ok'}">${K.crisis}/${BANK_CRISIS}</b></div></div>
        <p class="dt-desc">Quando o tesouro não paga as contas, o banco cobre com a reserva e a dívida cresce (2% ao mês). Se a dívida passar do limite ou faltar reserva, o reino entra em crise; com ${BANK_CRISIS} meses de crise ele quebra: você perde a coroa e o povo vira bárbaro.</p></div>
      <div class="kgrid two"><div class="card"><div class="sec">📊 Juros da conta do povo</div><p class="dt-desc">Juros maiores atraem mais depósitos para a reserva (e rendem mais para você).</p><div class="act-row">${BANK_RATES.map(r => `<button class="${K.rate === r ? 'primary' : ''}" data-act="bk" data-op="rate" data-c="${ci}" data-n="${r}">${(r * 100).toFixed(1)}%</button>`).join('')}</div></div>
        <div class="card"><div class="sec">🧾 Dinheiro do banco para o tesouro</div><div class="act-row">${[200, 500, 1000].map(n => btn('borrow', n, `+${n}`, K.reserve >= n && K.debt + n <= H.cap)).join('')}</div><div class="act-row">${[100, 500].map(n => btn('repay', n, `Pagar ${n}`, K.debt > 0 && c.treasury > 0)).join('')}${btn('repay', 'all', 'Pagar tudo', K.debt > 0 && c.treasury > 0)}</div></div>
        <div class="card"><div class="sec">📜 Emitir títulos</div><p class="dt-desc">O povo compra títulos: ${300 + Math.round(c.pop * 1.5)} 🪙 agora, ${Math.round((300 + Math.round(c.pop * 1.5)) * 1.3)} 🪙 a pagar em 6 meses. Não pagar é calote (crise).</p>${btn('bond', 0, '📜 Emitir', K.bonds.length < 3)}${K.bonds.length ? `<small class="muted"> ${K.bonds.map(b => `${b.pay} 🪙 em ${Calendar.short(b.due)}`).join(' · ')}</small>` : ''}</div>
        <div class="card"><div class="sec">💝 Seu bolso e o tesouro</div><div class="act-row">${[100, 500].map(n => btn('give', n, `Doar ${n}`, P.gold >= n)).join('')}</div><div class="act-row">${[100, 500].map(n => btn('take2', n, `Retirar ${n}`, c.treasury >= n)).join('')}</div><small class="muted">Doar agrada o povo; retirar desagrada o povo e as famílias.</small></div>
        <div class="card"><div class="sec">🔎 Auditoria <span>100 🪙</span></div><p class="dt-desc">Procura conselheiros corruptos e recupera metade do que foi desviado${c.stolen ? ` (${c.stolen} 🪙 sumiram)` : ''}.</p>${btn('audit', 0, '🔎 Auditar as contas', c.treasury >= 100)}</div>
        <div class="card"><div class="sec">✏️ O nome</div><p class="dt-desc">${UI.esc(K.name)}</p><button data-act="bankName" data-c="${ci}">Renomear o banco</button></div></div>
      ${K.log.length ? `<div class="card"><div class="sec">📒 Livro do banco</div>${K.log.map(l => `<div class="bank-log"><small>${Calendar.short(l.day)}</small> ${UI.esc(l.t)}</div>`).join('')}</div>` : ''}`;
      void fc;
    }
  }
  const tb = `<div class="tabs">${tabs.map(([k, l]) => `<button class="tab ${tab === k ? 'on' : ''}" data-act="bank" data-c="${ci}" data-t="${k}">${l}</button>`).join('')}</div>`;
  this.open(`🏦 ${K.name}`, `<div class="bankw">${tb}${body}</div>`, 'showBank', [ci, tab], robbing ? 'O cofre-forte' : `Banco de ${CIV_DEFS[ci].name}`);
};
