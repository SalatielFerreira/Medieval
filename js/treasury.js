'use strict';
// O mês do tesouro de um reino: TODAS as entradas e saídas previstas para a próxima virada do mês, numa conta só.
// Antes cada janela somava um pedaço (o Resumo e o banco só imposto − soldo, as Finanças tiravam o orçamento) e nenhuma
// batia com o que acontecia de verdade. Agora o Resumo do reino, a página de Finanças, o banco (saúde e crise) e o aviso
// "o tesouro acaba em N meses" usam esta mesma conta.
//  • Cada linha é [rótulo, valor, opcional]. "Opcional" é o gasto que só sai se houver ouro (decretos, orçamento, Grandes
//    Obras, bobo): sem ouro ele para em vez de virar dívida. O banco cobre só o que é obrigatório (netMust).
//  • O que é sorte não entra: tesoureiro corrupto, espiões estrangeiros, multas, contrabando, o general que recruta.
const Treasury = {
  month(c) {
    const inc = [], exp = [], fc = Game.civForecast(c), mine = c.ruler === 'player';
    const add = (L, label, v, opt) => { v = Math.round(v); if (v > 0) L.push([label, v, !!opt]); };
    const signed = (label, v) => { v = Math.round(v); if (v > 0) add(inc, label, v); else if (v < 0) add(exp, label, -v); };
    add(inc, '👪 Impostos', fc.income);
    add(exp, '⚔️ Soldo da guarnição', fc.upkeep);
    if (mine && !c.anarchy) {
      const ci = c.id, next = G.day + 1;
      // a coroa: decretos e as parcelas das Grandes Obras (param sem ouro)
      if (typeof Crown !== 'undefined') {
        add(exp, '📜 Decretos', Crown.upkeep(c), true);
        const w = Object.entries(c.works || {}).filter(([k, st]) => WORKS[k] && !st.done).reduce((a, [k]) => a + Math.ceil(WORKS[k].gold / WORKS[k].months), 0);
        add(exp, '🏗️ Grandes Obras (parcelas)', w, true);
      }
      // o tesoureiro do conselho: +3% dos impostos por ponto de competência
      const tr = typeof Court !== 'undefined' ? Court.member(ci, 'treasurer') : null;
      if (tr) add(inc, `💰 Tesoureiro (${tr.name})`, fc.income * tr.comp * 0.03);
      // o Reinado: feudos, reinos vassalos e, no reino principal, alfândega, orçamento, bobo e o tutor de administração
      if (typeof Reign !== 'undefined') {
        const R = Reign.R(), main = Reign.main() === c;
        add(inc, '🏰 Tributo dos feudos', Object.entries(R.fiefs).filter(([vi, f]) => !f.rebel && World.villages[vi] && !World.villages[vi].free && World.villages[vi].civ === ci).reduce((a, [vi]) => a + Reign.tribute(+vi), 0));
        add(inc, '👑 Reinos vassalos', G.civs.filter(v => v.ruler !== 'player' && v.overlord === ci).reduce((a, v) => a + Math.round(v.treasury * 0.1), 0));
        if (main) {
          if (R.customs) add(inc, '🛃 Alfândega', Reign.customsIncome());
          add(exp, '📊 Orçamento (exército, corte, obras, igreja)', Reign.budgetCost(), true);
          if (R.court.jester) add(exp, '🃏 Bobo da corte', 15, true);
          add(inc, '📚 Filhos que estudaram administração', Reign.kids().filter(k => k.age >= 16 && R.tutors[k.id] === 'admin').length * Math.round(fc.income * 0.03));
        }
      }
      // tratados (Pacts): comércio e tributos
      if (typeof Pacts !== 'undefined') {
        const S = Pacts.S();
        add(inc, '📦 Tratados de comércio', S.trade.filter(t => (t.a === ci || t.b === ci) && next <= t.until && !Diplo.atWar(t.a, t.b) && !(Pacts.mine(t.a) && Pacts.mine(t.b))).reduce((a, t) => a + Pacts.income(t.a, t.b), 0));
        add(inc, '💰 Tributos recebidos', S.trib.filter(t => t.to === ci && next <= t.until && G.civs[t.from] && !Pacts.mine(t.from)).reduce((a, t) => a + Math.min(t.amt, Math.max(0, Math.floor(G.civs[t.from].treasury))), 0));
        add(exp, '💰 Tributos pagos', S.trib.filter(t => t.from === ci && next <= t.until && !Pacts.mine(t.to)).reduce((a, t) => a + t.amt, 0));
      }
      // leis (valem em todos os seus reinos)
      if (typeof Laws !== 'undefined') for (const k of Laws.L().active) if (LAWS[k] && LAWS[k].income) signed(`⚖️ Lei: ${LAWS[k].name}`, c.pop * LAWS[k].income);
      // aluguel das obras das vilas do reino (o que o governador-herói recebe vai para o bolso dele, não para cá)
      if (typeof VillageWorks !== 'undefined') add(inc, '🏘️ Aluguel das obras das vilas', World.villages.reduce((a, v, vi) => v && v.civ === ci && v.lord !== 'player' ? a + VillageWorks.of(vi).reduce((s, x) => s + ((VWORKS[x.type] || {}).rent || 0), 0) : a, 0));
      // o imposto da colheita, no outono
      if (typeof HARVEST_TAX !== 'undefined' && Season.idx(next) === 2) add(inc, '🍂 Imposto da colheita', World.villages.filter(v => v && !v.free && v.civ === ci && !v.ruin).length * HARVEST_TAX);
    }
    // o banco: parcela da dívida (com os juros do mês), juros acima de 1% pagos ao povo, títulos e rendas que vencem
    if (typeof Bank !== 'undefined' && !c.anarchy) {
      const K = Bank.K(c.id);
      if (K.debt > 0) add(exp, '🧾 Dívida com o banco (parcela)', Math.min(Math.max(0, c.treasury + fc.income - fc.upkeep), Math.ceil((K.debt + Math.ceil(K.debt * BANK_DEBT_RATE)) * 0.1)));
      if (K.rate > 0.01) add(exp, '🏦 Juros da conta do povo acima de 1%', (K.reserve + c.pop * (0.4 + K.rate * 30)) * (K.rate - 0.01) * 0.25);
      add(exp, '📜 Títulos emitidos que vencem', K.bonds.filter(b => b.due <= G.day + 1).reduce((a, b) => a + b.pay, 0));
      add(exp, '📜 Títulos comprados por você que vencem', Bank.B().terms.filter(t => t.ci === c.id && t.due <= G.day + 1).reduce((a, t) => a + Math.round(t.n * (1 + t.r * t.m)), 0));
      if (typeof Bolsa !== 'undefined') add(exp, '👑 Rendas vitalícias pagas a você', Bolsa.X().rendas.filter(r => r.ci === c.id).reduce((a, r) => a + r.m, 0));
    }
    const sum = L => L.reduce((a, x) => a + x[1], 0), tin = sum(inc), tout = sum(exp);
    return { inc, exp, tin, tout, net: tin - tout, netMust: tin - sum(exp.filter(x => !x[2])), fc };
  },
  // quantos meses o tesouro aguenta no ritmo de agora (null: está crescendo)
  runway(c, m) { m = m || this.month(c); return m.net < 0 ? Math.floor(Math.max(0, c.treasury) / -m.net) : null; },
};
