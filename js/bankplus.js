'use strict';
// Banco, segunda leva:
//  • 📊 Bolsa: nove companhias (lã, especiarias, serrarias e o banco dos mercadores entram), compra por valor (🪙100,
//    🪙1000), a sua carteira (valor, quanto pagou, lucro e os dividendos do mês), reinvestir os dividendos sozinho e
//    vender tudo de uma vez.
//  • 🏛️ Fundos e renda: a renda vitalícia virou um total por reino, como o Fundo das Guildas: você põe e tira quanto
//    quiser (a retirada paga 10%), sem uma linha para cada aplicação.
//  • 🐫 Expedições: dez rotas, até seis ao mesmo tempo, escolta armada (risco 40% menor, custa 12% a mais), o seguro, a
//    viagem andando na barra e o diário das que voltaram.
BOLSA.push(
  { id: 'la',      icon: '🐑', name: 'Tecelões da Lã',          base: 18,  vol: 0.06, div: 0.008, up: 'Inverno rigoroso: todo mundo quer lã.', down: 'Uma praga atacou os rebanhos.' },
  { id: 'madeira', icon: '🪵', name: 'Serrarias do Reino',      base: 24,  vol: 0.05, div: 0.008, up: 'As obras nas vilas compraram toda a madeira.', down: 'Um incêndio destruiu um depósito de toras.' },
  { id: 'espec',   icon: '🌶️', name: 'Casa das Especiarias',    base: 60,  vol: 0.15, div: 0.012, up: 'Pimenta e canela esgotaram nas feiras.', down: 'Um carregamento estragou no porão do navio.' },
  { id: 'merc',    icon: '🏦', name: 'Banco dos Mercadores',    base: 110, vol: 0.09, div: 0.010, up: 'Os empréstimos às guildas deram lucro recorde.', down: 'Um grande devedor deu calote no banco.' },
  { id: 'cerveja', icon: '🍺', name: 'Cervejarias Unidas',      base: 22,  vol: 0.05, div: 0.009, up: 'Festas da colheita: os barris acabaram.', down: 'Um lote de cerveja azedou nas adegas.' },
  { id: 'vidro',   icon: '🪟', name: 'Vidraria do Lago',        base: 30,  vol: 0.07, div: 0.009, up: 'As catedrais encomendaram vitrais novos.', down: 'O forno grande da vidraria rachou.' },
  { id: 'naval',   icon: '⚓', name: 'Estaleiros Reais',        base: 70,  vol: 0.12, div: 0.011, up: 'Os reis encomendaram uma frota inteira.', down: 'Um navio novo afundou na primeira viagem.' },
  { id: 'joias',   icon: '💎', name: 'Joalheiros da Coroa',     base: 150, vol: 0.16, div: 0.012, up: 'Casamento real: as joias esgotaram.', down: 'Ladrões assaltaram a oficina dos joalheiros.' },
);
const BOLSA_SECTORS = { sal: 'comida', vinho: 'comida', cerveja: 'comida', ferro: 'ofícios', madeira: 'ofícios', vidro: 'ofícios', la: 'ofícios', frota: 'mar', naval: 'mar', espec: 'mar', prata: 'riquezas', joias: 'riquezas', merc: 'riquezas' };
BANK_EXPEDITIONS.push(
  { id: 'feira',  icon: '🎪', name: 'Grande feira das capitais',   m: 1, risk: 0.05, lo: 1.02, hi: 1.12, good: 'As barracas venderam tudo na feira.', bad: 'Choveu a feira inteira e ninguém comprou nada.' },
  { id: 'peles',  icon: '🦊', name: 'Peles do norte gelado',       m: 3, risk: 0.15, lo: 1.1, hi: 1.45, good: 'As peles chegaram antes do inverno e valeram muito.', bad: 'Uma nevasca prendeu a caravana nas montanhas.' },
  { id: 'ambar',  icon: '🟠', name: 'Âmbar das praias do leste',   m: 4, risk: 0.22, lo: 1.2, hi: 1.7, good: 'O âmbar fez sucesso com os joalheiros.', bad: 'Piratas tomaram o barco do âmbar.' },
  { id: 'marfim', icon: '🐘', name: 'Marfim das terras quentes',   m: 5, risk: 0.33, lo: 1.35, hi: 2.1, good: 'O marfim foi disputado no leilão.', bad: 'A febre do pântano derrubou os carregadores.' },
  { id: 'ouro',   icon: '🏜️', name: 'Ouro do deserto',             m: 7, risk: 0.55, lo: 2.0, hi: 3.6, good: 'Acharam as minas de ouro perdidas do deserto!', bad: 'A caravana nunca voltou das dunas.' },
  { id: 'gelo',    icon: '🧊', name: 'Blocos de gelo para o sul',    m: 2, risk: 0.12, lo: 1.06, hi: 1.35, good: 'O gelo chegou inteiro e os nobres do sul pagaram caro.', bad: 'O calor derreteu a carga no caminho.' },
  { id: 'cavalos', icon: '🐎', name: 'Manada de cavalos das estepes', m: 3, risk: 0.2, lo: 1.15, hi: 1.6, good: 'Os cavalos foram vendidos aos cavaleiros do reino.', bad: 'Lobos espantaram a manada nas estepes.' },
  { id: 'livros',  icon: '📚', name: 'Manuscritos para os mosteiros', m: 4, risk: 0.18, lo: 1.18, hi: 1.55, good: 'Os monges pagaram bem pelos manuscritos raros.', bad: 'A chuva estragou os pergaminhos.' },
  { id: 'perolas', icon: '🦪', name: 'Pérolas dos mares do sul',      m: 6, risk: 0.42, lo: 1.6, hi: 2.6, good: 'Os mergulhadores voltaram com pérolas enormes.', bad: 'Os tubarões afastaram os mergulhadores.' },
  { id: 'escamas', icon: '🐉', name: 'Caça às escamas de dragão',     m: 8, risk: 0.62, lo: 2.4, hi: 4.5, good: 'Acharam um ninho abandonado cheio de escamas!', bad: 'O dragão estava em casa.' },
);
BANK_EXPEDITIONS.sort((a, b) => a.m - b.m || a.risk - b.risk);
const BANK_EXP_MAX = 6, BANK_ESCORT = { cost: 0.12, risk: 0.6 }, RENDA_FEE = 0.10;

const BankPlus = {
  X() { const X = Bolsa.X(); X.expLog = X.expLog || []; X.lastDiv = X.lastDiv || 0; X.reinvest = !!X.reinvest; X.escort = !!X.escort; this.pool(X); return X; },
  // renda vitalícia: uma linha só por reino (junta as aplicações antigas)
  pool(X) {
    const by = {};
    for (const r of X.rendas) { const b = by[r.ci] || (by[r.ci] = { ci: r.ci, n: 0, m: 0, day: r.day }); b.n += r.n; b.day = Math.min(b.day, r.day); }
    const list = Object.values(by); for (const b of list) b.m = Math.round(b.n * RENDA_RATE);
    if (list.length !== X.rendas.length) X.rendas = list;
  },
  renda(ci) { return this.X().rendas.find(r => r.ci === ci) || null; },
  // ---------------------------------------------------------------- 📊 bolsa
  cost() { const X = Bolsa.X(); return BOLSA.reduce((a, c) => a + (X.paid[c.id] || 0), 0); },
  buyValue(id, g) { const p = Bolsa.price(id), n = Math.floor(Math.min(g, P.gold) / (p * (1 + BOLSA_FEE))); if (n <= 0) { UI.msg('Não dá para comprar nem uma ação com esse valor.', 'bad'); return; } Bolsa.buy(id, n); },
  // a cesta: uma ação (ou dez) de cada companhia, para espalhar o risco
  basket(q) { const X = Bolsa.X(); let n = 0; for (const c of BOLSA) { const p = Bolsa.price(c.id), cost = Math.round(q * p * (1 + BOLSA_FEE)); if (P.gold < cost) continue; P.gold -= cost; X.own[c.id] = (X.own[c.id] || 0) + q; X.paid[c.id] = (X.paid[c.id] || 0) + cost; n++; } if (n) { Sound.play('coin'); UI.msg(`🧺 Cesta comprada: ${q} ação(ões) de ${n} companhias.`, 'gold'); } else UI.msg('Ouro insuficiente para a cesta.', 'bad'); },
  basketCost(q) { return BOLSA.reduce((a, c) => a + Math.round(q * Bolsa.price(c.id) * (1 + BOLSA_FEE)), 0); },
  sellAll() { const X = Bolsa.X(); let got = 0; const g0 = P.gold; for (const c of BOLSA) if (X.own[c.id]) Bolsa.sell(c.id, X.own[c.id]); got = P.gold - g0; if (got) UI.msg(`📊 Você vendeu toda a carteira por ${got} 🪙.`, 'gold'); },
  bolsaHtml(ci) {
    const X = this.X(), b = (op, id, n, label, ok, cls) => `<button class="${cls || ''}" data-act="bk2" data-op="${op}" data-c="${ci}" data-k="${id}" data-n="${n}" ${ok ? '' : 'disabled'}>${label}</button>`;
    const B3 = (op, k, label, ok, cls) => `<button class="${cls || ''}" data-act="bk3" data-op="${op}" data-c="${ci}" data-k="${k}" ${ok ? '' : 'disabled'}>${label}</button>`;
    const val = Bolsa.value(), paid = this.cost(), pl = val - paid, n = BOLSA.reduce((a, c) => a + (X.own[c.id] || 0), 0);
    const rows = BOLSA.map(c => {
      const p = Bolsa.price(c.id), h = X.mkt[c.id].hist, prev = h.length > 1 ? h[h.length - 2] : p, own = X.own[c.id] || 0, cpl = own ? own * p - (X.paid[c.id] || 0) : 0, up = p >= prev;
      return `<div class="crow bx-row bp-row ${own ? 'mine' : ''}"><span class="ri">${c.icon}</span><span><b>${c.name} <em class="bp-p">${p} 🪙</em> <em class="${up ? 'ok' : 'bad'}">${up ? '▲' : '▼'} ${Math.abs(Math.round((p / prev - 1) * 100))}%</em></b>
        <small>${BOLSA_SECTORS[c.id] ? `<i class="bp-sec s-${BOLSA_SECTORS[c.id].replace(/\W/g, '')}">${BOLSA_SECTORS[c.id]}</i> ` : ''}dividendo ${(c.div * 100).toFixed(1)}%/mês · risco ${'●'.repeat(Math.ceil(c.vol * 20))}${own ? ` · <b class="bx-own">${own}</b> ações (${own * p} 🪙, <span class="${cpl >= 0 ? 'ok' : 'bad'}">${cpl >= 0 ? '+' : ''}${cpl}</span>)` : ''}</small>${Bolsa.spark(h)}</span>
        <span class="bp-act"><span class="act-row">${[1, 10, 100].map(q => b('buy', c.id, q, `+${q}`, P.gold >= q * p * (1 + BOLSA_FEE))).join('')}${[100, 1000].map(g => B3('buyv', c.id + ':' + g, `🪙${g}`, P.gold >= p * (1 + BOLSA_FEE) && g >= p, 'bp-v')).join('')}</span>
        <span class="act-row">${[1, 10].map(q => b('sell', c.id, q, `−${q}`, own >= q)).join('')}${b('sell', c.id, 'all', 'Vender tudo', own > 0)}</span></span></div>`;
    }).join('');
    return `<div class="card bp-sum"><div class="sec">💼 Sua carteira <span>${n} ações</span></div>
        <div class="bp-big"><b>${val.toLocaleString('pt-BR')} 🪙</b><small>valor das suas ações hoje</small></div>
        <div class="bp-kv"><span>Você pagou</span><b>${paid.toLocaleString('pt-BR')} 🪙</b></div>
        <div class="bp-kv"><span>Lucro / prejuízo</span><b class="${pl >= 0 ? 'ok' : 'bad'}">${pl >= 0 ? '+' : ''}${pl.toLocaleString('pt-BR')} 🪙</b></div>
        <div class="bp-kv"><span>Dividendos do último mês</span><b>${X.lastDiv} 🪙</b></div>
        <div class="bp-kv"><span>Corretagem</span><b>${BOLSA_FEE * 100}% na compra e na venda</b></div>
        <div class="act-row bp-opts">${B3('reinv', 0, X.reinvest ? '🔁 Reinvestindo dividendos' : '🔁 Reinvestir dividendos', true, X.reinvest ? 'on' : '')}${B3('sellall', 0, '💰 Vender tudo', n > 0)}</div>
        <div class="act-row bp-opts">${B3('basket', 1, `🧺 Cesta: 1 de cada (${this.basketCost(1)} 🪙)`, P.gold >= this.basketCost(1))}${B3('basket', 10, `🧺 10 de cada (${this.basketCost(10)} 🪙)`, P.gold >= this.basketCost(10))}</div>
        <small class="muted">Reinvestir: o dividendo de cada companhia compra mais ações dela no fim do mês.</small>
        <div class="sec" style="margin-top:10px">📰 Notícias da Bolsa</div>${X.news.length ? X.news.map(q => `<div class="bank-log"><small>${Calendar.short(q.day)}</small> ${UI.esc(q.t)}</div>`).join('') : '<p class="muted">Nada de novo nas companhias ainda.</p>'}</div>
      <div class="card bp-list bk3-wide"><div class="sec">📊 Bolsa dos Reinos <span>${BOLSA.length} companhias · ${new Set(Object.values(BOLSA_SECTORS)).size} setores</span></div>${rows}</div>`;
  },
  // ---------------------------------------------------------------- 🏛️ fundos e renda
  rendaIn(ci, n) {
    n = Math.min(Math.floor(n), P.gold); if (n < 1) return;
    const c = G.civs[ci]; if (!c || c.anarchy) { UI.msg('Um reino em anarquia não vende renda.', 'bad'); return; }
    const X = this.X(); let r = this.renda(ci); if (!r) { r = { ci, n: 0, m: 0, day: G.day }; X.rendas.push(r); }
    P.gold -= n; c.treasury += n; r.n += n; r.m = Math.round(r.n * RENDA_RATE); Sound.play('coin');
    UI.msg(`👑 Renda vitalícia de ${CIV_DEFS[ci].short}: agora ${r.n} 🪙 aplicados, rendendo ${r.m} 🪙 por mês.`, 'gold');
  },
  rendaOut(ci, n) {
    const X = this.X(), r = this.renda(ci), c = G.civs[ci]; if (!r || !c) return;
    n = Math.min(Math.floor(n), r.n); if (n < 1) return;
    const due = Math.round(n * (1 - RENDA_FEE)), can = Math.max(0, Math.floor(c.treasury));
    if (can <= 0) { UI.msg(`👑 O Tesouro de ${CIV_DEFS[ci].short} está vazio: não dá para retirar agora.`, 'bad'); return; }
    const pay = Math.min(due, can), took = pay >= due ? n : Math.ceil(pay / (1 - RENDA_FEE));
    c.treasury -= pay; P.gold += pay; r.n = Math.max(0, r.n - took); r.m = Math.round(r.n * RENDA_RATE);
    if (r.n < 1) X.rendas = X.rendas.filter(x => x !== r);
    Sound.play('coin'); UI.msg(`👑 Você retirou ${pay} 🪙 da renda vitalícia (taxa de ${RENDA_FEE * 100}%).${pay < due ? ' O Tesouro não tinha tudo: o resto continua aplicado.' : ''}`, 'gold');
  },
  rendaHtml(ci) {
    const X = this.X(), b = (op, n, label, ok) => `<button data-act="bk2" data-op="${op}" data-c="${ci}" data-n="${n}" ${ok ? '' : 'disabled'}>${label}</button>`;
    const B3 = (op, n, label, ok) => `<button data-act="bk3" data-op="${op}" data-c="${ci}" data-k="${n}" ${ok ? '' : 'disabled'}>${label}</button>`;
    const Q = [100, 500, 1000, 5000, 10000, 100000], r = this.renda(ci), here = r ? r.n : 0, an = !!G.civs[ci].anarchy, fund = Math.round(X.fund);
    const others = X.rendas.filter(x => x.ci !== ci), allM = X.rendas.reduce((a, x) => a + x.m, 0);
    return `<div class="card rd-card"><div class="sec">🏛️ Fundo das Guildas <span>~1% ao mês</span></div>
        <div class="bp-big"><b>${fund.toLocaleString('pt-BR')} 🪙</b><small>aplicados nas oficinas dos sete reinos</small></div>
        <p class="dt-desc">Rende em média 1% ao mês, quase nunca perde e sai quando você quiser (2% de taxa na saída).</p>
        <div class="rd-ops"><span>Pôr</span><div class="act-row">${Q.map(n => b('fin', n, `+${n}`, P.gold >= n)).join('')}${b('fin', 'all', 'Tudo', P.gold > 0)}</div>
        <span>Tirar</span><div class="act-row">${Q.map(n => b('fout', n, `−${n}`, fund >= n)).join('')}${b('fout', 'all', 'Tudo', fund >= 1)}</div></div></div>
      <div class="card rd-card"><div class="sec">👑 Renda vitalícia de ${CIV_DEFS[ci].short} <span>${(RENDA_RATE * 100).toFixed(1)}% ao mês</span></div>
        <div class="bp-big"><b>${here.toLocaleString('pt-BR')} 🪙</b><small>${here ? `rendem ${r.m} 🪙 por mês, pagos pelo Tesouro do reino` : 'nada aplicado neste reino'}</small></div>
        <p class="dt-desc">O dinheiro vai para o Tesouro do reino e volta ${(RENDA_RATE * 100).toFixed(1)}% dele todo mês, para sempre. Ponha mais quando quiser; para tirar, o Tesouro devolve com ${RENDA_FEE * 100}% de taxa. Se o reino quebrar, a renda acaba.</p>
        <div class="rd-ops"><span>Pôr</span><div class="act-row">${Q.map(n => B3('rin', n, `+${n}`, P.gold >= n && !an)).join('')}${B3('rin', 'all', 'Tudo', P.gold > 0 && !an)}</div>
        <span>Tirar</span><div class="act-row">${Q.map(n => B3('rout', n, `−${n}`, here >= n)).join('')}${B3('rout', 'all', 'Tudo', here > 0)}</div></div>
        ${others.length ? `<div class="sec" style="margin-top:8px">Nos outros reinos</div>${others.map(x => `<div class="crow"><span class="ri">👑</span><span><b>${CIV_DEFS[x.ci].short}</b><small>${x.n} 🪙 aplicados · ${x.m} 🪙 por mês</small></span><span></span></div>`).join('')}` : ''}</div>
      <div class="card rd-card"><div class="sec">📅 O que entra todo mês</div>
        <div class="bp-big"><b>${(allM + Math.round(fund * 0.01) + Math.round(Bank.acc(ci) * BANK_PERSONAL_RATE)).toLocaleString('pt-BR')} 🪙</b><small>por mês, mais ou menos</small></div>
        <div class="bp-kv"><span>👑 Rendas vitalícias</span><b>${allM} 🪙</b></div>
        <div class="bp-kv"><span>🏛️ Fundo das Guildas (média)</span><b>${Math.round(fund * 0.01)} 🪙</b></div>
        <div class="bp-kv"><span>💰 Conta pessoal aqui (0,5%)</span><b>${Math.round(Bank.acc(ci) * BANK_PERSONAL_RATE)} 🪙</b></div>
        <div class="sec" style="margin-top:10px">🛡️ Seguro das expedições <span>${X.insure ? 'ligado' : 'desligado'}</span></div>
        <p class="dt-desc">Cada expedição nova paga ${INSURE.cost * 100}% do valor na saída; se ela se perder, você recebe ${INSURE.back * 100}% de volta.</p>
        <div class="act-row">${b('insure', X.insure ? 0 : 1, X.insure ? 'Desligar o seguro' : '🛡️ Ligar o seguro', true)}</div></div>`;
  },
  // ---------------------------------------------------------------- 🐫 expedições
  fees() { const X = this.X(); return (X.insure ? INSURE.cost : 0) + (X.escort ? BANK_ESCORT.cost : 0); },
  expedite(id, n) {
    const X = this.X(), B = Bank.B(), x = BANK_EXPEDITIONS.find(e => e.id === id); if (!x) return;
    if (B.exp.length >= BANK_EXP_MAX) { UI.msg(`Você já tem ${BANK_EXP_MAX} expedições na estrada.`, 'bad'); return; }
    const f = this.fees(); n = Math.min(n, Math.floor(P.gold / (1 + f))); if (n <= 0) { UI.msg('Ouro insuficiente para essa expedição.', 'bad'); return; }
    const extra = Math.ceil(n * f); P.gold -= n + extra;
    B.exp.push({ id, n, due: G.day + x.m, day: G.day, ins: X.insure, esc: X.escort });
    Sound.play('coin');
    UI.msg(`${x.icon} Você pôs ${n} 🪙 na ${x.name}${extra ? ` (+${extra} 🪙 de ${[X.insure && 'seguro', X.escort && 'escolta'].filter(Boolean).join(' e ')})` : ''}. Volta em ${Calendar.short(G.day + x.m)}.`, 'gold');
  },
  // as que voltaram neste mês (com escolta e seguro) e o diário
  settle() {
    const X = this.X(), B = Bank.B();
    for (const e of B.exp.filter(q => G.day >= q.due)) {
      B.exp = B.exp.filter(q => q !== e);
      const x = BANK_EXPEDITIONS.find(q => q.id === e.id); if (!x) continue;
      const risk = x.risk * (e.esc ? BANK_ESCORT.risk : 1);
      let got, ok;
      if (Math.random() < risk) { ok = false; got = e.ins ? Math.round(e.n * INSURE.back) : Math.random() < 0.4 ? Math.round(e.n * 0.25) : 0; P.gold += got; UI.msg(`${x.icon} ${x.name}: ${x.bad}${e.ins ? ` O seguro pagou ${got} 🪙.` : got ? ` Salvaram ${got} 🪙.` : ' Você perdeu tudo.'}`, 'bad', true); }
      else { ok = true; got = Math.round(e.n * U.rnd(x.lo, x.hi)); P.gold += got; UI.msg(`${x.icon} ${x.name}: ${x.good} Você recebeu ${got} 🪙 (investiu ${e.n}).`, 'gold', true); }
      X.expLog.unshift({ day: G.day, id: e.id, n: e.n, got, ok }); if (X.expLog.length > 12) X.expLog.length = 12;
    }
  },
  expHtml(ci) {
    const X = this.X(), B = Bank.B(), f = this.fees(), full = B.exp.length >= BANK_EXP_MAX;
    const B3 = (op, k, label, ok, cls) => `<button class="${cls || ''}" data-act="bk3" data-op="${op}" data-c="${ci}" data-k="${k}" ${ok ? '' : 'disabled'}>${label}</button>`;
    const bk = (id, n) => `<button data-act="bk" data-op="exp" data-c="${ci}" data-i="${id}" data-n="${n}" ${!full && P.gold >= Math.ceil(n * (1 + f)) ? '' : 'disabled'}>${n}</button>`;
    const routes = BANK_EXPEDITIONS.map(x => { const r = x.risk * (X.escort ? BANK_ESCORT.risk : 1);
      return `<div class="crow ex-row"><span class="ri">${x.icon}</span><span><b>${x.name}</b><small>${x.m} ${x.m === 1 ? 'mês' : 'meses'} · ganho de ${Math.round((x.lo - 1) * 100)}% a ${Math.round((x.hi - 1) * 100)}% · risco ${Math.round(r * 100)}%</small><i class="ex-risk"><i style="width:${Math.round(r * 100)}%"></i></i></span>
        <span class="act-row">${[100, 500, 1000, 5000, 10000, 100000].map(n => bk(x.id, n)).join('')}</span></div>`; }).join('');
    const going = B.exp.map(e => { const x = BANK_EXPEDITIONS.find(q => q.id === e.id) || { icon: '🐫', name: e.id, m: 1 }, tot = Math.max(1, e.due - (e.day || e.due - x.m)), done = U.clamp((G.day - (e.day || e.due - x.m)) / tot, 0, 1);
      return `<div class="crow"><span class="ri">${x.icon}</span><span><b>${x.name}</b><small>${e.n} 🪙 · volta em ${Calendar.short(e.due)}${e.esc ? ' · 🛡️ escolta' : ''}${e.ins ? ' · 📜 seguro' : ''}</small><i class="ex-prog"><i style="width:${Math.round(done * 100)}%"></i></i></span><span></span></div>`; }).join('');
    const log = X.expLog.map(l => { const x = BANK_EXPEDITIONS.find(q => q.id === l.id) || { icon: '🐫', name: l.id };
      return `<div class="crow"><span class="ri">${x.icon}</span><span><b>${x.name}</b><small>${Calendar.short(l.day)} · pôs ${l.n} 🪙</small></span><b class="${l.ok ? 'ok' : 'bad'}">${l.got - l.n >= 0 ? '+' : ''}${l.got - l.n} 🪙</b></div>`; }).join('');
    const won = X.expLog.reduce((a, l) => a + l.got - l.n, 0);
    return `<div class="card ex-routes bk3-wide"><div class="sec">🗺️ Rotas de comércio <span>${B.exp.length}/${BANK_EXP_MAX} na estrada</span></div>${routes}</div>
      <div class="card ex-side"><div class="sec">⚙️ Como viajar</div>
        <div class="act-row">${B3('escort', 0, X.escort ? '🛡️ Com escolta armada' : '🛡️ Sem escolta', true, X.escort ? 'on' : '')}<button data-act="bk2" data-op="insure" data-c="${ci}" data-n="${X.insure ? 0 : 1}" class="${X.insure ? 'on' : ''}">${X.insure ? '📜 Com seguro' : '📜 Sem seguro'}</button></div>
        <small class="muted">Escolta: risco ${Math.round((1 - BANK_ESCORT.risk) * 100)}% menor, custa +${BANK_ESCORT.cost * 100}%. Seguro: +${INSURE.cost * 100}%, devolve ${INSURE.back * 100}% se der errado.${f ? ` Agora cada expedição custa +${Math.round(f * 100)}%.` : ''}</small>
        <div class="sec" style="margin-top:10px">🐫 Na estrada</div>${going || '<p class="muted">Nenhuma expedição sua agora.</p>'}
        <div class="sec" style="margin-top:10px">📒 Diário de viagens <span class="${won >= 0 ? 'ok' : 'bad'}">${X.expLog.length ? `${won >= 0 ? '+' : ''}${won} 🪙` : ''}</span></div>${log || '<p class="muted">Nenhuma expedição voltou ainda.</p>'}</div>`;
  },
};

{
  // as janelas novas da Bolsa, dos Fundos e das Expedições (por dentro, a moldura do banco continua a mesma)
  Bolsa.bolsaHtml = ci => BankPlus.bolsaHtml(ci);
  Bolsa.rendaHtml = ci => BankPlus.rendaHtml(ci);
  Bolsa.renda = (ci, n) => BankPlus.rendaIn(ci, n);
  Bolsa.rendaOut = (ci, n) => { const r = BankPlus.renda(ci); BankPlus.rendaOut(ci, n === 'all' || n === undefined ? (r ? r.n : 0) : +n); };
  Bank.expedite = (id, n) => BankPlus.expedite(id, n);
  // a conta: quanto o dinheiro vai render (1, 6 e 12 meses) e o total em todos os bancos
  BankPlus.contaExtra = function (ci) {
    const a = Bank.acc(ci), all = Object.values(Bank.B().acc).reduce((s, n) => s + Math.max(0, n), 0), r = BANK_PERSONAL_RATE;
    const f = m => Math.round(a * Math.pow(1 + r, m));
    return `<div class="card bk-conta2"><div class="sec">📈 Quanto rende <span>0,5% ao mês, juros sobre juros</span></div>
      <div class="bk-proj">${[1, 6, 12].map(m => `<div><small>em ${m} ${m === 1 ? 'mês' : 'meses'}</small><b>${f(m).toLocaleString('pt-BR')} 🪙</b><em>+${(f(m) - a).toLocaleString('pt-BR')}</em></div>`).join('')}</div>
      <div class="bp-kv"><span>💰 Nesta conta</span><b>${a.toLocaleString('pt-BR')} 🪙</b></div>
      <div class="bp-kv"><span>🏦 Em todos os bancos</span><b>${all.toLocaleString('pt-BR')} 🪙</b></div>
      <div class="bp-kv"><span>🪙 No bolso (corre risco na estrada)</span><b>${P.gold.toLocaleString('pt-BR')} 🪙</b></div>
      <div class="bp-kv"><span>🛡️ Se o reino quebrar</span><b class="bad">perde 60%</b></div>
      <small class="muted">A conta é o seu dinheiro pessoal; o dinheiro do reino fica na aba Tesouro.</small></div>`;
  };
  const sb0 = UI.showBank.bind(UI);
  UI.showBank = function (ci, tab, robbing) {
    if (tab === 'conta' && G.civs[ci] && !G.civs[ci].anarchy) {
      const op = this.open; let got = null;
      this.open = (title, body, fn, args, sub) => { got = { title, body, fn, args, sub }; };
      try { sb0(ci, tab, robbing); } finally { this.open = op; }
      if (!got) return;
      const i = got.body.lastIndexOf('</div>'); // a página da conta ganha o cartão do rendimento
      return this.open(got.title, got.body.slice(0, i) + BankPlus.contaExtra(ci) + got.body.slice(i), got.fn, got.args, got.sub);
    }
    if (tab !== 'expedicoes' || !G.civs[ci] || G.civs[ci].anarchy) return sb0(ci, tab, robbing);
    const op = this.open; let got = null;
    this.open = (title, body, fn, args, sub) => { got = { title, body, fn, args, sub }; };
    try { sb0(ci, 'conta', robbing); } finally { this.open = op; }
    if (!got) return;
    const tb = `<div class="tabs">${BANK_TABS.map(([k, l]) => `<button class="tab ${tab === k ? 'on' : ''}" data-act="bank" data-c="${ci}" data-t="${k}">${l}</button>`).join('')}</div>`;
    this.open(got.title, `<div class="bankw">${tb}${BankPlus.expHtml(ci)}</div>`, 'showBank', [ci, tab], got.sub);
  };
  // o mês: as expedições voltam com as regras novas; dividendos reinvestidos
  const mt0 = Bank.monthTick.bind(Bank);
  Bank.monthTick = function () {
    BankPlus.settle();
    const X = BankPlus.X(), before = {}; for (const c of BOLSA) before[c.id] = X.own[c.id] || 0;
    mt0();
    let d = 0;
    for (const c of BOLSA) { const own = before[c.id]; if (!own) continue; const dv = Math.round(own * X.mkt[c.id].p * c.div); d += dv;
      if (X.reinvest && dv > 0) { const p = Bolsa.price(c.id), q = Math.floor(dv / (p * (1 + BOLSA_FEE))); if (q > 0 && P.gold >= dv) { const cost = Math.round(q * p * (1 + BOLSA_FEE)); P.gold -= cost; X.own[c.id] = (X.own[c.id] || 0) + q; X.paid[c.id] = (X.paid[c.id] || 0) + cost; } } }
    X.lastDiv = d;
  };
  const a0 = UI.act.bind(UI);
  UI.act = function (a, d) {
    if (a !== 'bk3') return a0(a, d);
    const ci = +d.c, X = BankPlus.X();
    switch (d.op) {
      case 'buyv': { const [id, g] = String(d.k).split(':'); BankPlus.buyValue(id, +g); break; }
      case 'sellall': BankPlus.sellAll(); break;
      case 'basket': BankPlus.basket(Math.max(1, +d.k || 1)); break;
      case 'reinv': X.reinvest = !X.reinvest; UI.msg(X.reinvest ? '🔁 Os dividendos vão comprar mais ações sozinhos.' : 'Os dividendos voltam para o seu bolso.'); break;
      case 'rin': BankPlus.rendaIn(ci, d.k === 'all' ? P.gold : +d.k); break;
      case 'rout': { const r = BankPlus.renda(ci); BankPlus.rendaOut(ci, d.k === 'all' ? (r ? r.n : 0) : +d.k); break; }
      case 'escort': X.escort = !X.escort; UI.msg(X.escort ? '🛡️ As próximas expedições vão com escolta armada.' : 'As próximas expedições vão sem escolta.'); break;
    }
    if (UI.cur && UI.cur.fn === 'showBank') UI.showBank(ci, UI.cur.args[1]);
  };
}
