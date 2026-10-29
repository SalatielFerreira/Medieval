// O caminho do dinheiro: o que sai da sua bolsa entra na riqueza de quem recebe (pessoa, vila, reino, família, igreja).
'use strict';
const { open } = require('./harness');
module.exports = async () => {
  const { page, errors, close } = await open(), fails = [];
  try {
    const r = await page.evaluate(() => {
      const bad = [], ok = (c, m) => { if (!c) bad.push(m); };
      UI.msg = () => {}; UI.banner = () => {}; Game.note = () => {};
      const p = G.people.find(q => q.alive && q.age >= 18 && !q.capanga && q.home.type === 'village');
      // presente: 5000 Salin dados = 5000 a mais na riqueza dela
      P.gold = 10000; const w0 = People.purse(p); People.giveGold(p, 5000);
      ok(People.purse(p) === w0 + 5000, `presente de 5000: a riqueza foi de ${w0} para ${People.purse(p)}`);
      ok(P.gold === 5000, 'o presente não saiu da sua bolsa');
      // a Ficha mostra a riqueza nova
      p.aff = 80; ok(Social.wealthTxt(p).includes(String(People.purse(p))), 'a Ficha não mostra a riqueza nova');
      // doação para a vila: o caixa da vila
      const vi = p.home.idx, f0 = NpcWorks.fundOf(vi); Politics.donate(vi, 300);
      ok(NpcWorks.fundOf(vi) === f0 + 300, `doação de 300: caixa da vila ${f0} → ${NpcWorks.fundOf(vi)}`);
      // a doação passa do teto do caixa sem ser cortada no mês
      { const v = World.villages[vi], st = NpcWorks.state(vi); st.fund = NpcWorks.fundMax(v) + 500; st.wait = 5; const a = st.fund; NpcWorks.village(vi); ok(st.fund === a, `o mês mexeu no caixa acima do teto: ${a} → ${st.fund}`); }
      // compra sem comerciante (animal): o tesouro do reino de onde você está
      P.x = (World.villages[vi].x + 1) * TILE; P.y = (World.villages[vi].y + 1) * TILE;
      const ci = Money.realmHere(), t0 = G.civs[ci].treasury;
      const coop = { type: 'coop', animals: {} }; Farm.buyAnimal(coop, 'chicken');
      ok(G.civs[ci].treasury === t0 + ANIMAL_PRICES.chicken, 'a galinha comprada não entrou no tesouro do reino');
      // igreja: o padre da vila (ou o tesouro)
      const pr = Faith.priestOf(Money.villageHere()), pw = pr ? People.purse(pr) : 0, ct = G.civs[ci].treasury;
      Faith.donate(ci, 100);
      ok(pr ? People.purse(pr) === pw + 100 : G.civs[ci].treasury === ct + 100, 'a doação à igreja sumiu');
      // empréstimo: sai de quem empresta e volta para ele
      const lender = G.people.find(q => q.alive && q.rank === 'merchant' && q !== p) || p, lw = People.purse(lender);
      Loans.take('merchant', ci, lender.id, 150); ok(People.purse(lender) === Math.max(0, lw - 150), 'o empréstimo não saiu da bolsa do agiota');
      const i = Loans.L().length - 1, lw2 = People.purse(lender); P.gold = 5000; Loans.pay(i, true);
      ok(People.purse(lender) > lw2, 'a parcela paga não voltou para o agiota');
      // aliança com uma família: os presentes ficam com a casa
      const fam = Families.get(p.fam);
      if (fam && Court.allyWith) { P.gold = 5000; const fw = fam.wealth || 0, g0 = P.gold; Court.allyWith(fam); if (P.gold < g0) ok((fam.wealth || 0) === fw + (g0 - P.gold), 'os presentes da aliança não entraram na riqueza da família'); }
      return bad;
    });
    fails.push(...r);
  } finally { await close(); }
  return fails.concat(errors.map(e => 'erro no jogo: ' + e));
};
