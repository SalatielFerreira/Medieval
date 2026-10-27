// Banco do reino: um banco por reino (com nome), conta, títulos, expedições, cofre, empréstimos, interior, tesouro
// nacional, crise, falência, anarquia (bárbaros) e a nova dinastia.
'use strict';
const { open } = require('./harness');
module.exports = async () => {
  const { page, errors, close } = await open(), fails = [];
  try {
    const r = await page.evaluate(() => {
      const bad = [], ok = (c, m) => { if (!c) bad.push(m); }, html = () => UI.panel ? UI.panel.innerHTML : '';
      UI.msg = () => {}; UI.banner = () => {}; Dialog.autoYes = true; P.god = true; P.gold = 20000;
      for (const c of G.civs) ok(Bank.has(c.id) && Bank.name(c.id).length > 3, 'reino sem banco: ' + c.id);
      // conta
      const ci = 2, K = Bank.K(ci), r0 = K.reserve;
      Bank.deposit(ci, 1000); ok(Bank.acc(ci) === 1000 && K.reserve === r0 + 1000, 'depósito');
      Bank.withdraw(ci, 400); ok(Bank.acc(ci) === 600 && P.gold === 19400, 'saque');
      Bank.monthTick(); ok(Bank.acc(ci) > 600, 'a conta não rendeu');
      // título do Tesouro
      const t0 = G.civs[ci].treasury; Bank.apply(ci, 0, 500); ok(G.civs[ci].treasury === t0 + 500 && Bank.B().terms.length === 1, 'título');
      Bank.B().terms[0].due = G.day; const g0 = P.gold; Bank.monthTick(); ok(P.gold > g0 + 500 && !Bank.B().terms.length, 'o título não pagou');
      // expedição
      Bank.expedite('sal', 300); ok(Bank.B().exp.length === 1, 'expedição'); Bank.B().exp[0].due = G.day; Bank.monthTick(); ok(!Bank.B().exp.length, 'a expedição não voltou');
      // cofre
      P.inv.iron_bar = 5; Bank.boxPut(ci, 'iron_bar', 5); ok(!P.inv.iron_bar && Bank.box(ci).iron_bar === 5, 'guardar no cofre'); Bank.boxTake(ci, 'iron_bar'); ok(P.inv.iron_bar === 5, 'tirar do cofre');
      // empréstimo da coroa sai da reserva
      const r1 = K.reserve; Loans.take('crown', ci, undefined, 200); ok(K.reserve === r1 - 200, 'o empréstimo não saiu da reserva'); Loans.pay(0, true); ok(K.reserve > r1 - 200, 'o pagamento não voltou à reserva');
      // janela em todas as abas e as finanças da casa
      for (const [t] of BANK_TABS) { UI.showBank(ci, t); ok(UI.cur.fn === 'showBank' && html().includes('bankw'), 'aba do banco: ' + t); }
      Fin.D().save = 300; Fin.open(); ok(UI.cur.fn === 'showBank' && Fin.D().save === 0, 'a poupança da casa não foi para o banco');
      // interior
      const s = Bank.struct(ci); P.x = (s.x + 2.5) * TILE; P.y = (s.y + s.h + 1) * TILE;
      ok(Places.enterRoom(s) && G.place && G.place.lay === 'bank', 'não entrou no banco');
      const teller = Places.furn.find(f => f.act === 'bank:conta'); ok(teller && Places.furnLabel(teller).includes('Caixa'), 'caixa do banco'); Places.use(teller); ok(UI.cur && UI.cur.fn === 'showBank', 'o caixa não abriu o banco');
      ok(G.ents.some(e => !e.dead && e.placeNpc && e.npc && e.npc.id === K.banker), 'sem banqueiro');
      UI.close(); Places.exit();
      const cv = document.createElement('canvas').getContext('2d'); World.drawStruct(cv, s, 10, 10, 1); for (const k of ['vaultdoor', 'teller', 'strongbox', 'coinpile', 'scales', 'ledgerdesk', 'quoteboard', 'safebox']) drawFurn(cv, { k, w: 2, h: 1 }, 10, 10, 1);
      // o seu reino: tesouro nacional e o nome na administração
      Game.becomeRuler(1, 'teste'); UI.close(); const c = G.civs[1], K1 = Bank.K(1); c.treasury = 1000;
      UI.sel.knav = 'k:1'; UI.sel.ksub = 'resumo'; UI.showKingdom(); ok(html().includes(UI.esc(K1.name)), 'o nome do banco não aparece na administração');
      Bank.setRate(1, 0.02); ok(K1.rate === 0.02, 'juros');
      const tb = c.treasury; Bank.borrow(1, 200); ok(c.treasury === tb + 200 && K1.debt === 200, 'pegar do banco'); Bank.repay(1, 200); ok(K1.debt === 0, 'pagar o banco');
      Bank.bond(1); ok(K1.bonds.length === 1, 'títulos'); Bank.give(1, 100); Bank.take(1, 100); Bank.audit(1);
      // crise e falência: sem reserva e com o tesouro no vermelho
      K1.reserve = 0; c.treasury = 0; c.garrison = 9000;
      for (let k = 0; k < BANK_CRISIS && !c.anarchy; k++) Game.tickCiv(c);
      ok(c.anarchy && c.ruler !== 'player', 'o reino não quebrou');
      ok(World.villages.filter(v => v.civ === 1).every(v => v.free), 'as vilas não ficaram livres');
      ok(Bank.B().camps.some(x => x.ci === 1), 'não surgiram bárbaros');
      UI.showBank(1, 'conta'); ok(html().includes('Portas fechadas'), 'o banco do reino quebrado está aberto');
      Bank.update(30);
      c.anarchy.until = G.day; Bank.monthTick(); ok(!c.anarchy && c.rulerId !== null && c.ruler === 'npc', 'não veio a nova dinastia');
      ok(World.villages.filter(v => v.civ === 1).every(v => !v.free), 'as vilas não voltaram ao reino');
      UI.close();
      return bad;
    });
    fails.push(...r);
  } finally { await close(); }
  return fails.concat(errors.map(e => 'erro no jogo: ' + e));
};
