'use strict';
// Finanças pessoais (na sua casa) e os seus empreendimentos como loja de verdade.
//  • Poupança: o ouro guardado rende 1% ao mês e fica a salvo dos ladrões.
//  • Emprestar: todo mês alguns moradores pedem dinheiro; você escolhe a quem emprestar e eles devolvem com juros no
//    prazo (quem não puder paga parte, ganha mais prazo e, por fim, fica devendo).
//  • Investir: ponha dinheiro nos negócios de outras famílias e receba uma parte do lucro todo mês.
//  • Empreendimentos: o responsável (o primeiro funcionário) cuida da loja — a produção vai para a prateleira, ele repõe
//    a mercadoria do ramo no atacado, vende aos fregueses pelos preços que você define e todo mês te entrega o lucro.
//    No balcão você compra (como qualquer freguês) e vende para a loja.

const FIN_SAVE_RATE = 0.01, FIN_INVEST_CAP = 3000, BIZ_RESERVE = 40, FIN_LICENSE = 200, FIN_FOREIGN_TAX = 0.1, FIN_VILLAGE_RATE = 0.015;
const Fin = {
  D() { const u = G.urban || (G.urban = {}); const d = u.fin || (u.fin = { save: 0, asks: [], inv: [], earned: 0, lent: 0 }); d.vinv = d.vinv || {}; d.lic = d.lic || {}; return d; },
  // ---------------------------------------------------------------- vilas: investir no desenvolvimento
  vinv(vi) { return this.D().vinv[vi] || 0; },
  investVillage(vi, n) {
    const v = World.villages[vi]; if (!v) return; n = Math.min(n, P.gold); if (n <= 0) return;
    P.gold -= n; this.D().vinv[vi] = this.vinv(vi) + n;
    if (!v.free && G.civs[v.civ] && G.civs[v.civ].ruler !== 'player') Game.addRelation(v.civ, Math.min(10, Math.round(n / 200)));
    for (const p of People.residents(vi).slice(0, 12)) People.addAff(p, 1);
    UI.msg('🏘️ Você investiu ' + n + ' 🪙 no desenvolvimento de ' + v.name + ': a economia da vila fica mais forte.', 'gold'); Sound.play('coin');
  },
  takeVillage(vi) { const n = this.vinv(vi); if (!n) return; const back = Math.round(n * 0.8); P.gold += back; delete this.D().vinv[vi]; UI.msg('Você retirou ' + back + ' 🪙 de ' + World.villages[vi].name + ' (20% ficaram nas obras).'); },
  // ---------------------------------------------------------------- licença de comércio nos outros reinos
  hasLicense(ci) { return !!this.D().lic[ci]; },
  licenseErr(ci) { const c = G.civs[ci]; if (!c) return 'Reino inexistente'; if (c.atWar) return 'Vocês estão em guerra'; if ((c.relation || 0) < -20) return 'A relação está ruim demais'; if (P.gold < FIN_LICENSE) return 'Custa ' + FIN_LICENSE + ' 🪙'; return null; },
  buyLicense(ci) { const e = this.licenseErr(ci); if (e) { UI.msg(e, 'bad'); return; } P.gold -= FIN_LICENSE; G.civs[ci].treasury += FIN_LICENSE; this.D().lic[ci] = G.day; Game.addRelation(ci, 3); UI.msg('📜 Licença de comércio de ' + CIV_DEFS[ci].name + ': seus empreendimentos podem funcionar nas vilas do reino (10% do lucro vai de imposto).', 'gold'); },
  // empreendimento seu em terra de outro reino (paga imposto)
  foreignCiv(s) { if (!World.inb(s.x, s.y)) return -1; const t = World.terr[World.idx(s.x, s.y)]; return t >= 0 && G.civs[t] && G.civs[t].ruler !== 'player' ? t : -1; },

  // ---------------------------------------------------------------- poupança
  deposit(n) { n = Math.min(n, P.gold); if (n <= 0) return; P.gold -= n; this.D().save += n; Sound.play('coin'); },
  withdraw(n) { const D = this.D(); n = Math.min(n, D.save); if (n <= 0) return; D.save -= n; P.gold += n; Sound.play('coin'); },

  // ---------------------------------------------------------------- empréstimos aos moradores
  // quem pede: moradores adultos com a bolsa curta, sem dívida
  newAsks() {
    const D = this.D(); D.asks = D.asks.filter(a => { const p = G.people[a.pid]; return p && p.alive && !p.debt && a.until >= G.day; });
    const pool = G.people.filter(p => p.alive && !p.kin && !p.capanga && p.age >= 18 && p.home.type === 'village' && !p.debt && People.purse(p) < 120 && !D.asks.some(a => a.pid === p.id) && !People.isCourt(p));
    while (D.asks.length < 3 && pool.length) {
      const p = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
      const months = U.rint(2, 6), amount = U.pick([50, 80, 120, 200, 300, 500]), rate = U.pick([0.1, 0.15, 0.2, 0.3]);
      const why = U.pick(['consertar o telhado', 'comprar sementes', 'pagar o médico', 'abrir uma barraca na feira', 'o casamento da filha', 'repor as ferramentas', 'pagar uma dívida antiga']);
      D.asks.push({ pid: p.id, amount, total: Math.round(amount * (1 + rate)), months, why, until: G.day + 1 });
    }
  },
  // chance de pagar em dia (aparece como risco)
  trust(p) { const t = p.trait; let r = 0.75 + (p.aff || 0) / 400 + (t === 'leal' ? 0.15 : 0) - (t === 'ganancioso' ? 0.15 : 0) - (p.rank === 'beggar' ? 0.25 : 0) + (p.shop ? 0.1 : 0); return U.clamp(r, 0.25, 0.97); },
  lend(i) {
    const D = this.D(), a = D.asks[i], p = a && G.people[a.pid];
    if (!a || !p || !p.alive || p.debt) return;
    if (P.gold < a.amount) { UI.msg('Ouro insuficiente.', 'bad'); return; }
    P.gold -= a.amount; p.purse = People.purse(p) + a.amount;
    p.debt = { amount: a.amount, total: a.total, due: G.day + a.months, lender: 'player', ext: 0 };
    D.asks.splice(i, 1); D.lent += a.amount;
    People.addAff(p, 8); if (typeof Mind !== 'undefined') Mind.remember(p, 'loan');
    UI.msg(`💰 Você emprestou ${a.amount} 🪙 a ${People.full(p)}: devolve ${a.total} 🪙 em ${a.months} ${a.months === 1 ? 'mês' : 'meses'}.`, 'gold'); Sound.play('coin');
  },
  debtors() { return G.people.filter(p => p.alive && p.debt && p.debt.lender === 'player'); },
  collect(p) {
    const d = p.debt; if (!d) return;
    if (G.day < d.due) return;
    const purse = People.purse(p);
    if (purse >= d.total || Math.random() < this.trust(p) * 0.5 && purse >= d.total * 0.6) {
      const pay = Math.min(d.total, Math.max(purse, Math.round(d.total * 0.6)));
      if (pay >= d.total) { p.purse = purse - d.total; P.gold += d.total; this.D().earned += d.total - d.amount; p.debt = null; People.addAff(p, 3); Game.note(`💰 ${People.full(p)} pagou o empréstimo: +${d.total} 🪙.`, 'gold'); return; }
    }
    if (purse > 0 && d.ext < 2) {
      const part = Math.min(purse, Math.round(d.total * 0.5)); p.purse = purse - part; P.gold += part; d.total -= part; d.due = G.day + 2; d.ext++;
      Game.note(`💰 ${People.full(p)} pagou ${part} 🪙 e pediu mais dois meses para o resto (${d.total} 🪙).`);
      return;
    }
    // não tem como pagar: fica devendo para sempre (e você guarda a mágoa)
    Game.note(`😞 ${People.full(p)} não conseguiu pagar os ${d.total} 🪙 que devia a você.`, 'bad');
    if (typeof Rumors !== 'undefined' && p.home.type === 'village') Rumors.atV(p.home.idx, `${People.full(p)} deu calote em ${G.name}.`);
    People.addAff(p, -10); p.debt = null;
  },

  // ---------------------------------------------------------------- investimentos nos negócios das famílias
  // negócios de uma família: os empreendimentos dela e as lojas que gente da família administra
  bizOf(f) {
    const out = (f.biz || []).map(b => (CIV_STRUCTS[b.type] || {}).name || b.type);
    for (const p of Families.members(f)) { if (!p.shop) continue; const s = Shops.byKey(p.shop); if (s && s.owner !== 'player' && (Work.shopOf(s) || ['store', 'smith', 'lumber', 'quarry', 'tavern', 'fmill', 'fshop', 'fforge'].includes(s.type))) out.push(Places.def(s) ? Places.def(s).name(s) : (CIV_STRUCTS[s.type] || {}).name || s.type); }
    return out;
  },
  families() { return Object.values(G.fams || {}).filter(f => !f.player && !f.noble && Families.members(f).length && this.bizOf(f).length); },
  rate(f) { return U.clamp(0.015 + this.bizOf(f).length * 0.006 + Math.min(0.012, (f.wealth || 0) / 50000), 0.015, 0.045); },
  invested(f) { return this.D().inv.filter(x => x.fam === f.id).reduce((a, x) => a + x.amount, 0); },
  invest(fid, n) {
    const f = Families.get(fid); if (!f) return;
    n = Math.min(n, P.gold, FIN_INVEST_CAP - this.invested(f)); if (n <= 0) { UI.msg('Você não pode investir mais nesta família agora.', 'bad'); return; }
    P.gold -= n; f.wealth = (f.wealth || 0) + n;
    const D = this.D(), old = D.inv.find(x => x.fam === fid);
    if (old) old.amount += n; else D.inv.push({ fam: fid, amount: n, since: G.day, paid: 0 });
    for (const p of Families.members(f)) People.addAff(p, 2);
    UI.msg(`📈 Você investiu ${n} 🪙 nos negócios da ${Families.name(f)}.`, 'gold'); Sound.play('coin');
  },
  divest(fid) {
    const D = this.D(), x = D.inv.find(i => i.fam === fid); if (!x) return;
    const back = Math.round(x.amount * 0.9); P.gold += back; D.inv = D.inv.filter(i => i !== x);
    UI.msg(`📉 Você resgatou o investimento: ${back} 🪙 (10% ficaram com a família).`, 'gold');
  },

  // ---------------------------------------------------------------- todo mês
  monthTick() {
    const D = this.D();
    if (D.save > 0) { const j = Math.round(D.save * FIN_SAVE_RATE); D.save += j; D.earned += j; }
    for (const p of this.debtors()) this.collect(p);
    let div = 0;
    for (const x of D.inv.slice()) {
      const f = Families.get(x.fam);
      if (!f || !Families.members(f).length || !this.bizOf(f).length) {
        const back = Math.round(x.amount * 0.5); P.gold += back; D.inv = D.inv.filter(i => i !== x);
        Game.note(`📉 ${f ? Families.name(f) : 'A família'} perdeu os negócios: você recuperou ${back} 🪙 do investimento.`, 'bad'); continue;
      }
      if (Math.random() < 0.1) continue; // mês fraco
      const g = Math.round(x.amount * this.rate(f)); P.gold += g; x.paid += g; div += g; D.earned += g;
    }
    for (const vi in D.vinv) { const n = D.vinv[vi]; if (!World.villages[vi] || n <= 0) { delete D.vinv[vi]; continue; } const g = Math.round(n * FIN_VILLAGE_RATE); div += g; P.gold += g; D.earned += g; D.vinv[vi] = Math.round(n * 0.98); }
    if (div) Game.note(`📈 Seus investimentos renderam ${div} 🪙 este mês.`, 'gold');
    this.newAsks();
  },

  // ---------------------------------------------------------------- janela
  open() {
    const D = this.D(), S = UI.sel, sub = ['poupanca', 'emprestar', 'investir', 'vilas'].includes(S.fsub) ? S.fsub : 'poupanca';
    if (!D.asks.length) this.newAsks();
    const tabs = `<div class="tabs subtabs">${[['poupanca', '🏦 Poupança'], ['emprestar', '🤝 Emprestar'], ['investir', '📈 Famílias'], ['vilas', '🏘️ Vilas e reinos']].map(([k, l]) => `<button class="tab ${sub === k ? 'on' : ''}" data-act="fsub" data-s="${k}">${l}</button>`).join('')}</div>`;
    const top = `<div class="tiles big"><div class="stile"><small>Seu ouro</small><b>${P.gold} 🪙</b></div><div class="stile"><small>Na poupança</small><b>${D.save} 🪙</b></div>
      <div class="stile"><small>Emprestado</small><b>${this.debtors().reduce((a, p) => a + p.debt.total, 0)} 🪙</b></div><div class="stile"><small>Investido</small><b>${D.inv.reduce((a, x) => a + x.amount, 0) + Object.values(D.vinv).reduce((a, n) => a + n, 0)} 🪙</b></div></div>`;
    const btn = (op, v, lab, ok) => `<button data-act="fin" data-op="${op}" data-v="${v}" ${ok ? '' : 'disabled'}>${lab}</button>`;
    let body = '';
    if (sub === 'poupanca') {
      body = `<div class="card"><div class="sec">🏦 Poupança <span>rende 1% ao mês</span></div>
        <p class="dt-desc">O ouro guardado rende todo mês e fica a salvo de ladrões e cobradores. Já rendeu, somando tudo, <b>${D.earned} 🪙</b> entre juros, empréstimos e investimentos.</p>
        <div class="sec">Depositar</div><div class="act-row">${[100, 500, 1000].map(n => btn('dep', n, `+${n}`, P.gold >= n)).join('')}${btn('dep', 'all', 'Tudo', P.gold > 0)}</div>
        <div class="sec" style="margin-top:8px">Sacar</div><div class="act-row">${[100, 500, 1000].map(n => btn('wd', n, `−${n}`, D.save >= n)).join('')}${btn('wd', 'all', 'Tudo', D.save > 0)}</div></div>`;
    } else if (sub === 'emprestar') {
      const asks = D.asks.map((a, i) => { const p = G.people[a.pid]; if (!p) return ''; const t = this.trust(p);
        return `<div class="crow"><span class="ri">${p.sex === 'm' ? '👨' : '👩'}</span><span><b>${UI.esc(People.full(p))}</b><small>${People.title(p)} · ${UI.esc(People.homeName(p))} · quer ${a.amount} 🪙 para ${a.why}</small>
          <small>Devolve <b>${a.total} 🪙</b> em ${a.months} ${a.months === 1 ? 'mês' : 'meses'} · chance de pagar em dia: <b class="${t >= 0.8 ? 'ok' : t < 0.55 ? 'bad' : ''}">${Math.round(t * 100)}%</b></small></span>
          <span class="act-row"><button class="primary" data-act="fin" data-op="lend" data-v="${i}" ${P.gold >= a.amount ? '' : 'disabled'}>Emprestar</button></span></div>`; }).join('');
      const debts = this.debtors().map(p => `<div class="crow"><span class="ri">🧾</span><span><b>${UI.esc(People.full(p))}</b><small>deve ${p.debt.total} 🪙 · ${p.debt.due > G.day ? `vence em ${p.debt.due - G.day} ${p.debt.due - G.day === 1 ? 'mês' : 'meses'}` : 'vence este mês'}${p.debt.ext ? ` · prazo estendido ${p.debt.ext}×` : ''}</small></span></div>`).join('');
      body = `<div class="card"><div class="sec">🤝 Pedidos de empréstimo <span>novos todo mês</span></div>${asks || '<p class="muted">Ninguém pedindo dinheiro agora. Volte no mês que vem.</p>'}</div>
        <div class="card"><div class="sec">🧾 Quem te deve</div>${debts || '<p class="muted">Ninguém te deve nada.</p>'}<p class="dt-desc">No prazo, o devedor paga tudo; quem não tem paga parte e ganha mais dois meses (até duas vezes). Depois disso, o calote vira boato — e mágoa.</p></div>`;
    } else if (sub === 'vilas') {
      const here = World.villages.map((v, i) => ({ v, i, d: U.dist(P.x / TILE, P.y / TILE, v.x, v.y) })).sort((a, b) => (b.v.lord === 'player') - (a.v.lord === 'player') || (this.vinv(b.i) > 0) - (this.vinv(a.i) > 0) || a.d - b.d).slice(0, 10);
      const vl = here.map(({ v, i }) => { const n = this.vinv(i);
        return '<div class="crow"><span class="ri">🏘️</span><span><b>' + UI.esc(v.name) + '</b><small>nível ' + (v.level || 1) + ' · ' + (v.free ? 'vila livre' : CIV_DEFS[v.civ].short) + (v.lord === 'player' ? ' · você governa' : '') + ' · poder econômico ' + Math.round(VillageEcon.power(i)) + (n ? ' · você investiu ' + n + ' 🪙' : '') + '</small></span>'
          + '<span class="act-row">' + [100, 500, 1000].map(k => '<button data-act="fin" data-op="vinv" data-v="' + i + '" data-n="' + k + '" ' + (P.gold >= k ? '' : 'disabled') + '>+' + k + '</button>').join('') + (n ? '<button data-act="fin" data-op="vout" data-v="' + i + '">Retirar (−20%)</button>' : '') + '</span></div>'; }).join('');
      const kl = G.civs.filter(c => c.ruler !== 'player' && CIV_DEFS[c.id]).map(c => { const has = this.hasLicense(c.id), err = this.licenseErr(c.id);
        return '<div class="crow"><span class="ri">📜</span><span><b>' + CIV_DEFS[c.id].name + '</b><small>' + (has ? 'licença de comércio: seus empreendimentos funcionam nas vilas do reino (10% do lucro de imposto)' : 'sem licença · relação ' + Math.round(c.relation || 0) + (c.atWar ? ' · em guerra' : '')) + '</small></span>'
          + '<span class="act-row">' + (has ? '<b class="ok">✓</b>' : '<button data-act="fin" data-op="lic" data-v="' + c.id + '" ' + (err ? 'disabled title="' + err + '"' : '') + '>Licença ' + FIN_LICENSE + ' 🪙</button>') + '</span></div>'; }).join('');
      body = '<div class="card"><div class="sec">🏘️ Investir no desenvolvimento das vilas <span>rende 1,5% ao mês</span></div>' + vl
        + '<p class="dt-desc">O dinheiro vira obras, comércio e empregos: aumenta o poder econômico da vila (ela cresce mais rápido) e rende 1,5% ao mês para você. As obras envelhecem: o valor cai 2% ao mês.</p></div>'
        + '<div class="card"><div class="sec">📜 Licenças de comércio nos outros reinos</div>' + kl
        + '<p class="dt-desc">Com a licença, você constrói os seus empreendimentos nas vilas daquele reino (Construir → Empreendimentos). O reino cobra 10% do lucro de imposto.</p></div>';
    } else {
      const fams = this.families().sort((a, b) => this.bizOf(b).length - this.bizOf(a).length || (b.wealth || 0) - (a.wealth || 0)).slice(0, 12);
      const mine = D.inv.map(x => { const f = Families.get(x.fam); if (!f) return ''; return `<div class="crow"><span class="ri">📈</span><span><b>${UI.esc(Families.name(f))}</b><small>${x.amount} 🪙 investidos · rendeu ${x.paid} 🪙 · cerca de ${(this.rate(f) * 100).toFixed(1)}% ao mês</small></span>
        <span class="act-row"><button data-act="fin" data-op="out" data-v="${f.id}">Resgatar (−10%)</button></span></div>`; }).join('');
      const list = fams.map(f => { const nm = this.bizOf(f).slice(0, 3).join(', '), inv = this.invested(f);
        return `<div class="crow"><span class="ri">🏛️</span><span><b>${UI.esc(Families.name(f))}</b><small>${nm} · riqueza ${Math.round(f.wealth || 0)} 🪙 · rende cerca de ${(this.rate(f) * 100).toFixed(1)}% ao mês${inv ? ` · você já investiu ${inv} 🪙` : ''}</small></span>
          <span class="act-row">${[100, 500, 1000].map(n => `<button data-act="fin" data-op="inv" data-v="${f.id}" data-n="${n}" ${P.gold >= n && inv + n <= FIN_INVEST_CAP ? '' : 'disabled'}>+${n}</button>`).join('')}</span></div>`; }).join('');
      body = `${mine ? `<div class="card"><div class="sec">📈 Seus investimentos</div>${mine}</div>` : ''}
        <div class="card"><div class="sec">🏛️ Negócios das famílias <span>até ${FIN_INVEST_CAP} 🪙 em cada uma</span></div>${list || '<p class="muted">Nenhuma família com negócios ainda.</p>'}
        <p class="dt-desc">Todo mês a família te paga uma parte do lucro (há meses fracos, sem nada). Se ela perder os negócios, você recupera metade do que investiu.</p></div>`;
    }
    UI.open('💰 Finanças', top + tabs + body, 'showFinance', [], 'Poupança, empréstimos e investimentos');
  },
  act(d) {
    const v = d.v;
    if (d.op === 'dep') this.deposit(v === 'all' ? P.gold : +v);
    if (d.op === 'wd') this.withdraw(v === 'all' ? this.D().save : +v);
    if (d.op === 'lend') this.lend(+v);
    if (d.op === 'inv') this.invest(+v, +d.n);
    if (d.op === 'out') this.divest(+v);
    if (d.op === 'vinv') this.investVillage(+v, +d.n);
    if (d.op === 'vout') this.takeVillage(+v);
    if (d.op === 'lic') this.buyLicense(+v);
    this.open();
  },
};

// ------------------------------------------------------------------ empreendimentos: o responsável cuida da loja
{
  Biz.prices = s => { const e = Biz.earn(s); return e.prices || (e.prices = {}); };
  // preço de venda aos fregueses (você define; começa no preço normal ajustado pelo preço geral)
  Biz.itemPrice = (s, k) => Math.max(1, Math.round(ITEMS[k].price * (Biz.prices(s)[k] || Biz.price(s))));
  Biz.itemMul = (s, k) => Biz.prices(s)[k] || Biz.price(s);
  Biz.manager = s => Biz.workers(s)[0] || null;
  // o que a loja oferece: o que está na prateleira e a mercadoria do ramo
  Biz.catalog = s => { const set = new Set(Object.keys(s.shelf || {}).filter(k => s.shelf[k] > 0)); for (const k of (Biz.trade(s).sells || [])) set.add(k); return [...set].filter(k => ITEMS[k]); };
  // fregueses do mês: compram mais quando há gente perto e quando o preço está bom
  Biz.sellMonth = function (s) {
    const mul = this.popMul(s), staff = this.workerCount(s);
    let budget = Math.round((6 + 8 * mul) * (1 + staff * 0.25)), rev = 0;
    const keys = Object.keys(s.shelf || {}).filter(k => s.shelf[k] > 0).sort(() => Math.random() - 0.5);
    for (const k of keys) {
      if (budget <= 0) break;
      const f = U.clamp(1.6 - 0.6 * this.itemMul(s, k), 0.15, 1.4), want = Math.min(s.shelf[k], budget, Math.max(0, Math.round((2 + 3 * mul) * f * U.rnd(0.7, 1.3))));
      if (want <= 0) continue;
      s.shelf[k] -= want; budget -= want; rev += want * this.itemPrice(s, k);
      if (s.shelf[k] <= 0) delete s.shelf[k];
    }
    return rev;
  };
  // o responsável repõe a mercadoria do ramo no atacado (com o dinheiro do caixa)
  // gasta no máximo um terço do que vendeu, só no que está acabando, e não enche demais a prateleira
  Biz.restock = function (s, rev) {
    let cost = 0; s.shelf = s.shelf || {};
    const cap = Math.round((6 + 8 * this.popMul(s)) * (1 + this.workerCount(s) * 0.25)) * 1.5;
    let total = Object.values(s.shelf).reduce((a, n) => a + n, 0), budget = Math.min(Math.max(0, (s.till || 0) - BIZ_RESERVE / 2), Math.round((rev || 0) / 3));
    const list = (this.trade(s).sells || []).filter(k => ITEMS[k] && (s.shelf[k] || 0) < 2).sort(() => Math.random() - 0.5);
    for (const k of list) {
      if (total >= cap) break;
      const pr = this.wholesale(s, k), n = Math.min(3 - (s.shelf[k] || 0), Math.floor(budget / pr)); if (n <= 0) continue;
      s.till -= n * pr; budget -= n * pr; cost += n * pr; s.shelf[k] = (s.shelf[k] || 0) + n; total += n;
    }
    return cost;
  };
  const dt0 = Biz.dayTick.bind(Biz);
  Biz.dayTick = function () {
    this.trim();
    let wagesAll = 0, profitAll = 0, made = {}; const quit = [], lines = [];
    for (const s of this.list()) { const e = this.earn(s); e.last = e.cur; e.cur = { rev: 0, wages: 0 }; e.months++; }
    for (const s of this.list()) {
      s.workers = (s.workers || []).filter(id => G.people[id] && G.people[id].alive && G.people[id].job === s.id);
      const ws = this.workers(s); if (!ws.length) continue;
      const fc = this.forecast(s);
      // salários: primeiro o caixa, o resto do seu bolso
      const fromTill = Math.min(s.till || 0, fc.wages), rest = fc.wages - fromTill;
      if (rest > 0 && P.gold < rest) { for (const p of ws) { People.addAff(p, -15); if (p.aff < -10) quit.push(p); } continue; }
      s.till = (s.till || 0) - fromTill; P.gold -= rest; wagesAll += fc.wages; this.addWages(s, fc.wages); for (const p of ws) People.addAff(p, 1);
      if (s.type === 'ptavern') continue; // a sua taverna vende do jeito dela
      // produção vai para a prateleira; ouro do serviço (estalagem, empório, câmbio) vai para o caixa
      s.shelf = s.shelf || {};
      for (const it in fc.out) if (fc.out[it] > 0) { s.shelf[it] = (s.shelf[it] || 0) + fc.out[it]; made[it] = (made[it] || 0) + fc.out[it]; }
      for (const it in s.goods || {}) if (s.goods[it] > 0) s.shelf[it] = (s.shelf[it] || 0) + s.goods[it];
      s.goods = {};
      if (fc.gold) s.till = (s.till || 0) + fc.gold;
      // vende primeiro; depois repõe a prateleira com o que entrou (para o mês que vem)
      const rev = this.sellMonth(s); s.till = (s.till || 0) + rev;
      const cost = this.restock(s, rev);
      this.addRev(s, rev + (fc.gold || 0) - cost);
      // o responsável entrega o lucro (fica um pouco no caixa para repor a mercadoria)
      let pay = Math.max(0, Math.round((s.till || 0) - BIZ_RESERVE));
      const fc2 = Fin.foreignCiv(s); if (pay > 0 && fc2 >= 0) { const tax = Math.round(pay * FIN_FOREIGN_TAX); s.till -= tax; pay -= tax; G.civs[fc2].treasury += tax; this.earn(s).tax = (this.earn(s).tax || 0) + tax; }
      if (pay > 0) { s.till -= pay; P.gold += pay; profitAll += pay; this.earn(s).paid = (this.earn(s).paid || 0) + pay; }
      this.earn(s).lastPaid = pay;
      if (pay > 0) lines.push(`${BUILDINGS[s.type].name} ${pay}`);
    }
    for (const p of quit) { this.fire(p); UI.msg(`😠 ${p.name} se demitiu por falta de pagamento.`, 'bad'); }
    if (profitAll || wagesAll) { Sound.play('coin'); Game.note(`💼 Os responsáveis entregaram ${profitAll} 🪙 de lucro${lines.length ? ` (${lines.slice(0, 4).join(' · ')}${lines.length > 4 ? '…' : ''})` : ''} · salários ${wagesAll} 🪙.`, profitAll ? 'gold' : ''); }
    return { profitAll, wagesAll };
  };
  // balcão do dono: comprar como freguês (o dinheiro volta como lucro), vender para a loja, definir os preços
  Biz.ownerBuy = function (s, k, n) {
    const pr = this.itemPrice(s, k), have = (s.shelf || {})[k] || 0, can = Math.min(n, have, Math.floor(P.gold / pr));
    if (can <= 0) { UI.msg(have ? 'Ouro insuficiente.' : 'Não há na prateleira: o responsável repõe no mês que vem.', 'bad'); return; }
    P.gold -= can * pr; s.till = (s.till || 0) + can * pr; s.shelf[k] -= can; if (s.shelf[k] <= 0) delete s.shelf[k]; Inv.add(k, can); this.addRev(s, can * pr); Sound.play('coin');
    UI.msg(`🛒 Comprou ${can} ${ITEMS[k].name} por ${can * pr} 🪙 (o dinheiro entra no caixa e volta como lucro).`, 'gold');
  };
  Biz.ownerSell = function (s, k, n) {
    const pay = this.wholesale(s, k), can = Math.min(n, Inv.sellable(k), Math.floor((s.till || 0) / pay));
    if (can <= 0) { UI.msg(Inv.sellable(k) <= 0 ? 'Você não tem esse item.' : `O caixa não tem ${pay} 🪙 para pagar.`, 'bad'); return; }
    Inv.add(k, -can); s.till -= pay * can; P.gold += pay * can; s.shelf = s.shelf || {}; s.shelf[k] = (s.shelf[k] || 0) + can; Sound.play('coin');
    UI.msg(`🏷️ Vendeu ${can} ${ITEMS[k].name} para a loja por ${pay * can} 🪙: agora estão na prateleira.`, 'gold');
  };
  Biz.setPrice = function (s, k, d) { const P0 = this.prices(s), cur = this.itemMul(s, k); P0[k] = Math.round(U.clamp(cur + d, 0.5, 2.5) * 10) / 10; };
  UI.showBizShop = function (sid) {
    const s = World.structs[sid]; if (!s || !BIZ_TYPES[s.type]) return;
    s.shelf = s.shelf || {};
    const mgr = Biz.manager(s), mul = Biz.popMul(s), e = Biz.earn(s);
    const cat = Biz.catalog(s), mine = Object.keys(P.inv).filter(k => P.inv[k] > 0 && ITEMS[k] && Biz.trade(s).buys(ITEMS[k]) && Inv.sellable(k) > 0);
    let h = `<div class="bzs-head"><div><b>🪙 ${s.till || 0}</b><small>no caixa</small></div><div><b>×${mul.toFixed(2)}</b><small>freguesia</small></div><div><b>${mgr ? UI.esc(mgr.name) : '—'}</b><small>${mgr ? 'responsável' : 'sem responsável'}</small></div><div><b>${e.lastPaid || 0} 🪙</b><small>lucro entregue no mês passado</small></div></div>
      <p class="muted">${mgr ? `${UI.esc(mgr.name)} cuida da loja: põe a produção na prateleira, repõe a mercadoria do ramo no atacado, vende aos fregueses pelos <b>preços que você define</b> e todo mês te entrega o lucro (fica ${BIZ_RESERVE} 🪙 no caixa para a reposição).` : 'Contrate um funcionário: o primeiro cuida da loja.'} Preço alto rende mais por venda, mas os fregueses levam menos.</p>
      <h3>🧾 Prateleira e preços</h3><table class="trade"><tr><th>Item</th><th>Na prateleira</th><th>Preço</th><th></th></tr>${cat.map(k => {
        const pr = Biz.itemPrice(s, k), m = Biz.itemMul(s, k), n = s.shelf[k] || 0;
        return `<tr><td>${UI.ii(k)} ${ITEMS[k].name}</td><td>${n}</td><td><button data-act="bzp" data-s="${sid}" data-k="${k}" data-d="-0.1">−</button> <b>${pr} 🪙</b> <small class="${m > 1.05 ? 'ok' : m < 0.95 ? 'bad' : 'muted'}">${Math.round(m * 100)}%</small> <button data-act="bzp" data-s="${sid}" data-k="${k}" data-d="0.1">+</button></td>
          <td><button data-act="bzbuy" data-s="${sid}" data-k="${k}" data-n="1" ${n && P.gold >= pr ? '' : 'disabled'}>Comprar 1</button><button data-act="bzbuy" data-s="${sid}" data-k="${k}" data-n="10" ${n && P.gold >= pr ? '' : 'disabled'}>10</button></td></tr>`; }).join('')}</table>
      <h3>🏷️ Vender para a loja</h3>${mine.length ? `<table class="trade"><tr><th>Item</th><th>Você tem</th><th>O caixa paga</th><th></th></tr>${mine.map(k => { const pay = Biz.wholesale(s, k), ok = (s.till || 0) >= pay;
        return `<tr><td>${UI.ii(k)} ${ITEMS[k].name}</td><td>${Inv.sellable(k)}</td><td>${pay} 🪙</td><td><button data-act="bzsell" data-s="${sid}" data-k="${k}" data-n="1" ${ok ? '' : 'disabled'}>Vender 1</button><button data-act="bzsell" data-s="${sid}" data-k="${k}" data-n="10" ${ok ? '' : 'disabled'}>10</button></td></tr>`; }).join('')}</table>` : '<p class="muted">Você não tem nada do ramo desta loja.</p>'}`;
    this.open('🏪 Balcão · ' + BUILDINGS[s.type].name, h, 'showBizShop', [sid], 'Prateleira, preços e vendas');
  };
  // o preço geral (no quadro do empreendimento) vale para tudo: limpa os preços de cada item
  const act0 = UI.act.bind(UI);
  UI.act = function (a, d) {
    if (a === 'fin') { Fin.act(d); return; }
    if (a === 'fsub') { this.sel.fsub = d.s; Fin.open(); return; }
    if (a === 'finance') { Fin.open(); return; }
    if (a === 'bzp') { const s = World.structs[+d.s]; if (s) { Biz.setPrice(s, d.k, +d.d); this.showBizShop(s.id); } return; }
    if (a === 'bizprice') { const s = World.structs[+d.s]; if (s) { Biz.earn(s).priceMul = +d.v; Biz.earn(s).prices = {}; this.showBiz(s.id); } return; }
    return act0(a, d);
  };
  UI.showFinance = function () { Fin.open(); };
  // a casa ganha o botão de finanças
  const sr0 = UI.showRest.bind(UI);
  UI.showRest = function (sid) {
    sr0(sid);
    const box = this.panel && this.panel.querySelector('.rest-acts'), s = World.structs[sid];
    if (box && s && !(s.tenant !== undefined && s.tenant !== null) && !box.querySelector('[data-act="finance"]')) {
      const D = Fin.D();
      box.insertAdjacentHTML('beforeend', `<button class="ra" data-act="finance"><span class="ra-ic">💰</span><span class="ra-t"><b>Finanças</b><small>Poupança (${D.save} 🪙), empréstimos e investimentos</small></span></button>`);
    }
  };
  // todo mês, junto com os empreendimentos
  const bd1 = Biz.dayTick.bind(Biz);
  Biz.dayTick = function (...a) { const r = bd1(...a); Fin.monthTick(); return r; };
  // a velha venda automática não existe mais: tudo vai para a prateleira e o responsável vende
  const sb1 = UI.showBiz.bind(UI);
  UI.showBiz = function (sid) {
    sb1(sid);
    const chk = this.panel && this.panel.querySelector('[data-act="bizauto"]'); if (chk) { const l = chk.closest('label'); if (l) l.remove(); }
    const pb = this.panel && this.panel.querySelector('.pb'), s = World.structs[sid];
    if (pb && s && !pb.querySelector('[data-act="bizshopopen"]')) pb.insertAdjacentHTML('beforeend', `<div class="act-row" style="margin-top:8px"><button class="primary" data-act="bizshopopen" data-s="${sid}">🏪 Balcão: prateleira, preços e vendas</button></div>`);
  };
  const act2 = UI.act.bind(UI);
  UI.act = function (a, d) { if (a === 'bizshopopen') { this.showBizShop(+d.s); return; } return act2(a, d); };
}

// as dívidas com você não entram na cobrança dos bancos e agiotas (a sua é cobrada pelo Fin)
{
  const lm0 = Loans.monthTick.bind(Loans);
  Loans.monthTick = function (...a) {
    const keep = Fin.debtors().map(p => [p, p.debt]);
    for (const [p] of keep) p.debt = null;
    try { return lm0(...a); } finally { for (const [p, d] of keep) p.debt = d; }
  };
}


// empreendimentos nos outros reinos: com a licença de comércio, valem nas vilas deles (sem a distância das cidades)
{
  const cb0 = Game.canBuild.bind(Game);
  Game.canBuild = function (k, tx, ty) {
    const err = cb0(k, tx, ty);
    if (!BIZ_TYPES[k]) return err;
    const b = BUILDINGS[k], cx = Math.floor(tx + b.w / 2), cy = Math.floor(ty + b.h / 2);
    const t = World.inb(cx, cy) ? World.terr[World.idx(cx, cy)] : -1;
    const foreign = t >= 0 && G.civs[t] && G.civs[t].ruler !== 'player';
    if (!foreign) return err;
    if (!Fin.hasLicense(t)) return err || 'Para abrir um empreendimento em ' + CIV_DEFS[t].name + ', compre a licença de comércio (casa → Finanças → Vilas e reinos)';
    return err === 'Perto demais de uma cidade' ? null : err;
  };
}
