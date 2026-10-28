'use strict';
// Mais aplicações no banco dos reinos:
//  • 📊 Bolsa dos Reinos: ações de cinco companhias (sal, ferreiros, frota, vinhedos e minas de prata). O preço sobe e
//    desce todo mês (as guerras animam os ferreiros, a colheita os vinhedos, os naufrágios derrubam a frota) e cada ação
//    paga dividendos. Comprar e vender custa 1% de corretagem.
//  • 🏛️ Fundo das Guildas: dinheiro espalhado pelas oficinas dos reinos — rende em média 1% ao mês, quase sem risco de
//    perder, e sai quando quiser (2% de taxa).
//  • 👑 Renda vitalícia: você entrega uma quantia ao Tesouro e recebe 2,2% dela todo mês, para sempre (o dinheiro não
//    volta; se o reino quebrar, a renda acaba).
//  • 🛡️ Seguro das expedições: com o seguro (8% do valor, pago na saída), a expedição que se perder devolve 70%.
//  • 📜 Títulos novos: de 1 mês (rende pouco) e de 24 meses (o que mais rende).
const BOLSA = [
  { id: 'sal',   icon: '🧂', name: 'Companhia do Sal',          base: 20, vol: 0.05, div: 0.007, up: 'O sal nunca falta à mesa: a companhia bateu recorde de vendas.', down: 'Uma nova salina no litoral derrubou o preço do sal.' },
  { id: 'ferro', icon: '⚒️', name: 'Guilda dos Ferreiros',      base: 35, vol: 0.08, div: 0.009, up: 'Encomendas de espadas e cotas para os exércitos.', down: 'A paz esvaziou as forjas.' },
  { id: 'vinho', icon: '🍷', name: 'Vinhedos do Sul',           base: 26, vol: 0.07, div: 0.009, up: 'Safra excelente: os barris valem ouro.', down: 'A geada queimou as videiras.' },
  { id: 'frota', icon: '⛵', name: 'Frota Mercante das Ilhas',  base: 50, vol: 0.13, div: 0.011, up: 'Os navios voltaram carregados de especiarias.', down: 'Dois navios afundaram num temporal.' },
  { id: 'prata', icon: '⛏️', name: 'Minas de Prata Real',       base: 80, vol: 0.19, div: 0.013, up: 'Um veio novo de prata foi achado.', down: 'Uma galeria da mina desabou.' },
];
const BOLSA_FEE = 0.01, FUND_FEE = 0.02, RENDA_RATE = 0.022, INSURE = { cost: 0.08, back: 0.7 };
BANK_TERMS.unshift([1, 0.008, 'Título de 1 mês']);
BANK_TERMS.push([24, 0.026, 'Título de 24 meses']);
BANK_TABS.splice(BANK_TABS.findIndex(t => t[0] === 'expedicoes'), 0, ['bolsa', '📊 Bolsa'], ['renda', '🏛️ Fundos e renda']);

const Bolsa = {
  X() { const B = Bank.B(); B.x = B.x || {}; const X = B.x; X.mkt = X.mkt || {}; X.own = X.own || {}; X.paid = X.paid || {}; X.fund = X.fund || 0; X.rendas = X.rendas || []; X.insure = !!X.insure; X.news = X.news || [];
    for (const c of BOLSA) if (!X.mkt[c.id]) X.mkt[c.id] = { p: c.base, hist: [c.base] };
    return X; },
  co(id) { return BOLSA.find(c => c.id === id); },
  price(id) { return Math.max(1, Math.round(this.X().mkt[id].p)); },
  value() { const X = this.X(); return BOLSA.reduce((a, c) => a + (X.own[c.id] || 0) * this.price(c.id), 0); },
  buy(id, n) {
    const X = this.X(), p = this.price(id), each = p * (1 + BOLSA_FEE); n = Math.min(n, Math.floor(P.gold / each)); if (n <= 0) { UI.msg('Ouro insuficiente para essas ações.', 'bad'); return; }
    const cost = Math.round(n * each); P.gold -= cost; X.own[id] = (X.own[id] || 0) + n; X.paid[id] = (X.paid[id] || 0) + cost; Sound.play('coin');
    UI.msg(`📊 Você comprou ${n} ação(ões) da ${this.co(id).name} por ${cost} 🪙.`, 'gold');
  },
  sell(id, n) {
    const X = this.X(), have = X.own[id] || 0; n = Math.min(n, have); if (n <= 0) return;
    const got = Math.round(n * this.price(id) * (1 - BOLSA_FEE)); P.gold += got;
    X.paid[id] = Math.round((X.paid[id] || 0) * (have - n) / have); X.own[id] = have - n; if (!X.own[id]) { delete X.own[id]; delete X.paid[id]; }
    Sound.play('coin'); UI.msg(`📊 Você vendeu ${n} ação(ões) da ${this.co(id).name} por ${got} 🪙.`, 'gold');
  },
  fundIn(n) { n = Math.min(Math.floor(n), P.gold); if (n <= 0) return; P.gold -= n; this.X().fund += n; Sound.play('coin'); },
  fundOut(n) { const X = this.X(); n = Math.min(Math.floor(n), Math.floor(X.fund)); if (n <= 0) return; X.fund -= n; const g = Math.round(n * (1 - FUND_FEE)); P.gold += g; Sound.play('coin'); UI.msg(`🏛️ Você tirou ${g} 🪙 do Fundo das Guildas (taxa de 2%).`); },
  renda(ci, n) {
    n = Math.min(n, P.gold); if (n < 100) { UI.msg('A renda vitalícia começa em 100 🪙.', 'bad'); return; }
    if (G.civs[ci].anarchy) { UI.msg('Um reino em anarquia não vende renda.', 'bad'); return; }
    P.gold -= n; G.civs[ci].treasury += n; this.X().rendas.push({ ci, n, m: Math.round(n * RENDA_RATE), day: G.day });
    Sound.play('coin'); UI.msg(`👑 ${CIV_DEFS[ci].short} vai pagar a você ${Math.round(n * RENDA_RATE)} 🪙 todo mês, para sempre.`, 'gold');
  },
  // o mês da bolsa: preços, dividendos, fundo e rendas
  monthTick() {
    const X = this.X(), war = G.civs.some(c => c && c.atWar) || (G.wars && G.wars.length), cd = Calendar.of(G.day), lines = [];
    for (const c of BOLSA) {
      const m = X.mkt[c.id], norm = (Math.random() + Math.random() + Math.random() - 1.5) * 1.15;
      let drift = 0.004 + Math.log(c.base * Math.pow(1.004, G.day) / m.p) * 0.12; // volta devagar para o valor justo (que cresce um pouco)
      if (c.id === 'ferro' && war) drift += 0.03;
      if (c.id === 'vinho' && cd.month >= 8 && cd.month <= 9) drift += 0.025;
      const ch = Math.exp(drift + norm * c.vol), old = m.p; m.p = Math.max(c.base * 0.15, m.p * ch);
      m.hist.push(Math.round(m.p)); if (m.hist.length > 12) m.hist.shift();
      if (Math.abs(ch - 1) > c.vol * 1.3) X.news.unshift({ day: G.day, t: `${c.icon} ${c.name}: ${ch > 1 ? c.up : c.down} (${ch > 1 ? '+' : ''}${Math.round((m.p / old - 1) * 100)}%)` });
      const own = X.own[c.id] || 0; if (own) { const d = Math.round(own * m.p * c.div); if (d > 0) { P.gold += d; lines.push(`${c.icon} ${d}`); } }
    }
    X.news.length = Math.min(X.news.length, 8);
    if (lines.length) Game.note(`📊 Dividendos da Bolsa: ${lines.join(' · ')} 🪙.`);
    if (X.fund > 0) { const r = U.rnd(-0.004, 0.024), g = Math.round(X.fund * r); X.fund = Math.max(0, X.fund + g); if (g) Game.note(`🏛️ Fundo das Guildas: ${g > 0 ? '+' : ''}${g} 🪙 no mês.`); }
    let rd = 0;
    for (const r of X.rendas.slice()) {
      const c = G.civs[r.ci]; if (!c || c.anarchy) { X.rendas = X.rendas.filter(x => x !== r); UI.msg(`👑 ${CIV_DEFS[r.ci].short} quebrou: a sua renda vitalícia de ${r.m} 🪙 acabou.`, 'bad', true); continue; }
      const g = Math.min(r.m, Math.max(0, c.treasury)); c.treasury -= g; P.gold += g; rd += g;
    }
    if (rd) Game.note(`👑 Rendas vitalícias: +${rd} 🪙.`);
  },
  // ---------------------------------------------------------------- janelas
  spark(hist) { const mx = Math.max(...hist), mn = Math.min(...hist); return `<span class="bx-spark">${hist.map((v, i) => `<i style="height:${Math.round(15 + (v - mn) / Math.max(1, mx - mn) * 85)}%" class="${i && v < hist[i - 1] ? 'dn' : ''}"></i>`).join('')}</span>`; },
  bolsaHtml(ci) {
    const X = this.X(), b = (op, id, n, label, ok) => `<button data-act="bk2" data-op="${op}" data-c="${ci}" data-k="${id}" data-n="${n}" ${ok ? '' : 'disabled'}>${label}</button>`;
    const rows = BOLSA.map(c => {
      const p = this.price(c.id), h = X.mkt[c.id].hist, prev = h.length > 1 ? h[h.length - 2] : p, own = X.own[c.id] || 0, pl = own ? own * p - (X.paid[c.id] || 0) : 0;
      return `<div class="crow bx-row"><span class="ri">${c.icon}</span><span><b>${c.name} · ${p} 🪙 <em class="${p >= prev ? 'ok' : 'bad'}">${p >= prev ? '▲' : '▼'} ${Math.abs(Math.round((p / prev - 1) * 100))}%</em></b>
        <small>dividendo ${(c.div * 100).toFixed(1)}% ao mês · risco ${'●'.repeat(Math.ceil(c.vol * 20))}${own ? ` · você tem <b class="bx-own">${own}</b> (${own * p} 🪙, <span class="${pl >= 0 ? 'ok' : 'bad'}">${pl >= 0 ? '+' : ''}${pl}</span>)` : ''}</small>${this.spark(h)}</span>
        <span class="act-row bx-act">${[1, 10, 100, 1000].map(n => b('buy', c.id, n, `+${n}`, P.gold >= n * p * (1 + BOLSA_FEE))).join('')}${[1, 10].map(n => b('sell', c.id, n, `−${n}`, own >= n)).join('')}${b('sell', c.id, 'all', 'Vender tudo', own > 0)}</span></div>`;
    }).join('');
    return `<div class="card"><div class="sec">📊 Bolsa dos Reinos <span>suas ações: ${this.value()} 🪙</span></div>
      <p class="dt-desc">Compre ações das companhias: o preço muda todo mês e cada ação paga dividendos. As guerras animam os ferreiros, a colheita os vinhedos; a frota e a prata dão mais, e arriscam mais. Corretagem de 1% na compra e na venda.</p>${rows}</div>
      ${X.news.length ? `<div class="card"><div class="sec">📰 Notícias da Bolsa</div>${X.news.map(n => `<div class="bank-log"><small>${Calendar.short(n.day)}</small> ${UI.esc(n.t)}</div>`).join('')}</div>` : ''}`;
  },
  rendaHtml(ci) {
    const X = this.X(), b = (op, n, label, ok) => `<button data-act="bk2" data-op="${op}" data-c="${ci}" data-n="${n}" ${ok ? '' : 'disabled'}>${label}</button>`, Q = [1, 100, 500, 1000, 5000];
    const mineR = X.rendas.filter(r => r.ci === ci), allR = X.rendas.reduce((a, r) => a + r.m, 0);
    return `<div class="kgrid two"><div class="card"><div class="sec">🏛️ Fundo das Guildas <span>${Math.round(X.fund)} 🪙</span></div>
        <p class="dt-desc">O dinheiro é espalhado pelas oficinas dos sete reinos: rende em média 1% ao mês, quase nunca perde e sai quando você quiser (2% de taxa na saída).</p>
        <div class="act-row">${Q.map(n => b('fin', n, `+${n}`, P.gold >= n)).join('')}${b('fin', 'all', 'Tudo', P.gold > 0)}</div>
        <div class="act-row">${Q.map(n => b('fout', n, `−${n}`, X.fund >= n)).join('')}${b('fout', 'all', 'Tudo', X.fund >= 1)}</div></div>
      <div class="card"><div class="sec">👑 Renda vitalícia de ${CIV_DEFS[ci].short} <span>${(RENDA_RATE * 100).toFixed(1)}% ao mês</span></div>
        <p class="dt-desc">Você entrega a quantia ao Tesouro do reino e recebe ${(RENDA_RATE * 100).toFixed(1)}% dela todo mês, para sempre. O dinheiro não volta: em 4 anos de jogo a renda já pagou tudo. Se o reino quebrar, ela acaba.</p>
        <div class="act-row">${[100, 500, 1000, 5000, 10000].map(n => b('renda', n, `${n}`, P.gold >= n && !G.civs[ci].anarchy)).join('')}</div>
        <small class="muted">${mineR.length ? `Aqui você recebe ${mineR.reduce((a, r) => a + r.m, 0)} 🪙 por mês` : 'Nenhuma renda deste reino'}${allR ? ` · no total, ${allR} 🪙 por mês` : ''}.</small></div>
      <div class="card"><div class="sec">🛡️ Seguro das expedições <span>${X.insure ? 'ligado' : 'desligado'}</span></div>
        <p class="dt-desc">Com o seguro, cada expedição nova paga ${INSURE.cost * 100}% do valor na saída; se ela se perder, você recebe ${INSURE.back * 100}% de volta.</p>
        <div class="act-row">${b('insure', X.insure ? 0 : 1, X.insure ? 'Desligar o seguro' : '🛡️ Ligar o seguro', true)}</div></div></div>`;
  },
};

{
  const sb0 = UI.showBank.bind(UI);
  UI.showBank = function (ci, tab, robbing) {
    if (!G.civs[ci] || !['bolsa', 'renda'].includes(tab)) return sb0(ci, tab, robbing);
    const K = Bank.K(ci), c = G.civs[ci];
    const body = c.anarchy ? `<div class="card bank-closed"><div class="sec">💥 Portas fechadas</div><p class="dt-desc">${CIV_DEFS[ci].name} quebrou e virou anarquia.</p></div>` : tab === 'bolsa' ? Bolsa.bolsaHtml(ci) : Bolsa.rendaHtml(ci);
    const tb = `<div class="tabs">${BANK_TABS.map(([k, l]) => `<button class="tab ${tab === k ? 'on' : ''}" data-act="bank" data-c="${ci}" data-t="${k}">${l}</button>`).join('')}</div>`;
    this.open(`🏦 ${K.name}`, `<div class="bankw">${tb}${body}</div>`, 'showBank', [ci, tab], `Banco de ${CIV_DEFS[ci].name}`);
  };
  // expedições com seguro: o seguro sai na partida; a perda é decidida aqui antes do mês do banco
  const ex0 = Bank.expedite.bind(Bank);
  Bank.expedite = function (id, n) {
    const X = Bolsa.X(), B = Bank.B(), before = B.exp.length;
    if (X.insure) n = Math.min(n, Math.floor(P.gold / (1 + INSURE.cost)));
    ex0(id, n);
    if (X.insure && B.exp.length > before) { const e = B.exp[B.exp.length - 1], fee = Math.ceil(e.n * INSURE.cost); P.gold -= fee; e.ins = true; UI.msg(`🛡️ Seguro da expedição: ${fee} 🪙.`); }
  };
  const mt0 = Bank.monthTick.bind(Bank);
  Bank.monthTick = function () {
    const B = Bank.B();
    for (const e of B.exp.filter(x => x.ins && G.day >= x.due)) {
      B.exp = B.exp.filter(x => x !== e);
      const x = BANK_EXPEDITIONS.find(q => q.id === e.id); if (!x) continue;
      if (Math.random() < x.risk) { const back = Math.round(e.n * INSURE.back); P.gold += back; UI.msg(`${x.icon} ${x.name}: ${x.bad} O seguro pagou ${back} 🪙.`, 'bad', true); }
      else { const g = Math.round(e.n * U.rnd(x.lo, x.hi)); P.gold += g; UI.msg(`${x.icon} ${x.name}: ${x.good} Você recebeu ${g} 🪙 (investiu ${e.n}).`, 'gold', true); }
    }
    mt0(); Bolsa.monthTick();
  };
  const a0 = UI.act.bind(UI);
  UI.act = function (a, d) {
    if (a !== 'bk2') return a0(a, d);
    const ci = +d.c, X = Bolsa.X(), n = d.n === 'all' ? Infinity : +d.n;
    switch (d.op) {
      case 'buy': Bolsa.buy(d.k, n); break;
      case 'sell': Bolsa.sell(d.k, n === Infinity ? (X.own[d.k] || 0) : n); break;
      case 'fin': Bolsa.fundIn(n === Infinity ? P.gold : n); break;
      case 'fout': Bolsa.fundOut(n === Infinity ? X.fund : n); break;
      case 'renda': Bolsa.renda(ci, n); break;
      case 'insure': X.insure = !!n; UI.msg(X.insure ? '🛡️ Seguro das expedições ligado.' : 'Seguro das expedições desligado.'); break;
    }
    if (UI.cur && UI.cur.fn === 'showBank') UI.showBank(ci, UI.cur.args[1]);
  };
}
