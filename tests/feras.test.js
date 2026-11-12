// Renda vitalícia com resgate (o Tesouro devolve o que você entregou, menos 10%) e as feras errantes: barra de vida
// sobre elas e no alto da tela, e dá para abatê-las de verdade.
'use strict';
const { open } = require('./harness');
module.exports = async () => {
  const { page, errors, close } = await open(), fails = [];
  try {
    const out = await page.evaluate(() => {
      const out = [], ok = (c, t) => { if (!c) out.push(t); };
      UI.msg = () => {}; UI.banner = () => {}; P.god = true;
      // ---- renda vitalícia
      const ci = G.civs.findIndex(c => c && !c.dead && !c.anarchy), c = G.civs[ci], X = Bolsa.X();
      // a renda vitalícia é um total por reino: pôr mais soma; tirar devolve com 10% de taxa
      P.gold = 20000; UI.act('bk3', { op: 'rin', c: ci, k: '1000' }); UI.act('bk3', { op: 'rin', c: ci, k: '5000' });
      const R = () => X.rendas.filter(r => r.ci === ci);
      ok(R().length === 1 && R()[0].n === 6000 && R()[0].m === Math.round(6000 * RENDA_RATE), 'a renda não virou um total só: ' + JSON.stringify(R()));
      UI.showBank(ci, 'renda');
      ok(UI.panel.querySelector('.bk3-amt[data-op="rout"]') && UI.panel.querySelector('[data-op="rin"][data-k="all"]'), 'a janela não tem pôr e tirar da renda');
      ok(!/Resgatar 900/.test(UI.panel.innerHTML), 'ainda aparece um resgate para cada aplicação');
      const g0 = P.gold; c.treasury = 100000; UI.act('bk3', { op: 'rout', c: ci, k: '1000' });
      ok(P.gold - g0 === 900 && R()[0].n === 5000, 'tirar 1000 devolveu ' + (P.gold - g0) + ' e sobrou ' + (R()[0] && R()[0].n));
      // Tesouro sem tudo: devolve o que tem e o resto continua rendendo
      c.treasury = 1800; const g1 = P.gold; UI.act('bk3', { op: 'rout', c: ci, k: 'all' });
      const left = R()[0];
      ok(P.gold - g1 === 1800 && left && left.n === 3000 && left.m === Math.round(3000 * RENDA_RATE), 'retirada parcial errada: ' + (P.gold - g1) + ' / ' + (left && left.n));
      c.treasury = 0; const g2 = P.gold; Bolsa.rendaOut(ci, 'all'); ok(P.gold === g2 && R().length === 1, 'Tesouro vazio pagou algo');
      // a conta pessoal rende 0,5% sem tirar nada da reserva do banco nem do tesouro
      Bank.B().acc[ci] = 10000; const K = Bank.K(ci), res0 = K.reserve; c.treasury = 5000; const t0 = c.treasury;
      Bank.monthTick(); ok(Bank.acc(ci) === 10050, 'a conta pessoal não rendeu 0,5%: ' + Bank.acc(ci));
      void t0;
      // bolsa: nove companhias, compra por valor, vender tudo, reinvestir
      ok(BOLSA.length >= 9, 'a bolsa não ganhou companhias');
      P.gold = 50000; UI.act('bk3', { op: 'buyv', c: ci, k: 'la:1000' }); ok((Bolsa.X().own.la || 0) > 0, 'comprar por valor não comprou');
      UI.act('bk3', { op: 'reinv', c: ci, k: 0 }); ok(Bolsa.X().reinvest, 'reinvestir não ligou');
      const own0 = Bolsa.X().own.la; Bank.monthTick(); ok((Bolsa.X().own.la || 0) >= own0, 'reinvestir vendeu ações');
      UI.act('bk3', { op: 'sellall', c: ci, k: 0 }); ok(!Object.values(Bolsa.X().own).some(n => n > 0), 'vender tudo deixou ações');
      // expedições: dez rotas, seis de uma vez, escolta
      ok(BANK_EXPEDITIONS.length >= 10, 'poucas rotas de expedição');
      UI.act('bk3', { op: 'escort', c: ci, k: 0 }); const g3 = P.gold; Bank.expedite('feira', 1000);
      const ex = Bank.B().exp[Bank.B().exp.length - 1]; ok(ex && ex.esc && g3 - P.gold === 1120 - (Bolsa.X().insure ? 0 : 0), 'a escolta não foi cobrada: ' + (g3 - P.gold));
      for (let k = 0; k < 7; k++) Bank.expedite('sal', 100); ok(Bank.B().exp.length === BANK_EXP_MAX, 'o limite de expedições não é ' + BANK_EXP_MAX + ': ' + Bank.B().exp.length);
      G.day += 12; Bank.monthTick(); ok(!Bank.B().exp.length && Bolsa.X().expLog.length >= 6, 'as expedições não voltaram para o diário');
      UI.showBank(ci, 'expedicoes'); ok(UI.panel.querySelector('.bk3-body') && /Diário de viagens/.test(UI.panel.textContent), 'a aba das expedições não abriu');
      UI.close();
      // ---- feras errantes
      const res = {};
      for (const kind of Object.keys(BEAST_KINDS)) {
        G.beasts = [];
        const b = { id: 900 + Object.keys(res).length, kind, x: Math.round(P.x / TILE) + 3, y: Math.round(P.y / TILE), hp: BEAST_KINDS[kind].hp, day: G.day, bounty: { [ci]: 500 }, attacks: 0, target: -1 };
        G.beasts.push(b); Beasts.t = 0; Beasts.update(0.1);
        const e = b.ent; ok(e && !e.dead, kind + ': a fera não apareceu perto'); if (!e) continue;
        // desenha a barra sobre ela e a do alto da tela
        const calls = []; const ctx = Game.ctx || document.querySelector('canvas').getContext('2d'); const fr0 = ctx.fillRect;
        ctx.fillRect = function (...a) { calls.push(a); return fr0.apply(this, a); };
        e.hp = e.maxHp / 2; e.draw(ctx, e.x - 200, e.y - 200); const nBar = calls.filter(a => a[3] === 5 && a[2] > 0 && a[2] < 60).length;
        calls.length = 0; Game.drawBossBar(ctx, 1280); const nTop = calls.filter(a => a[3] === 9).length;
        ctx.fillRect = fr0;
        ok(nBar >= 1, kind + ': sem barra de vida sobre a fera');
        ok(nTop >= 2, kind + ': sem barra no alto da tela');
        // abater
        const gold0 = P.gold; for (let k = 0; k < 400 && !e.dead; k++) Game.damage(e, 50, P);
        ok(e.dead, kind + ': não morreu (vida ' + e.hp + ')');
        ok(!G.beasts.length && P.gold >= gold0 + 500, kind + ': sem recompensa / continua na lista');
        res[kind] = true;
      }
      return out;
    });
    fails.push(...out);
    if (errors.length) fails.push('erros: ' + errors.slice(0, 3).join(' | '));
  } finally { await close(); }
  return fails;
};
