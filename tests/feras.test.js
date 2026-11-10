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
      P.gold = 20000; Bolsa.renda(ci, 1000); Bolsa.renda(ci, 5000);
      ok(X.rendas.filter(r => r.ci === ci).length === 2, 'a renda não foi comprada');
      UI.showBank(ci, 'renda');
      ok(/Resgatar 900/.test(UI.panel.innerHTML) && /Resgatar tudo/.test(UI.panel.innerHTML), 'a janela não mostra o resgate');
      const g0 = P.gold; c.treasury = 100000; UI.act('bk2', { op: 'rout', c: ci, n: '0' });
      ok(P.gold - g0 === 900, 'resgatar 1000 devolveu ' + (P.gold - g0));
      ok(X.rendas.filter(r => r.ci === ci).length === 1, 'a renda resgatada continua');
      // Tesouro sem tudo: devolve o que tem e o resto continua rendendo
      c.treasury = 1800; const g1 = P.gold; Bolsa.rendaOut(ci, 'all');
      const left = X.rendas.find(r => r.ci === ci);
      ok(P.gold - g1 === 1800 && left && left.n === 3000 && left.m === Math.round(3000 * RENDA_RATE), 'resgate parcial errado: ' + (P.gold - g1) + ' / ' + (left && left.n));
      c.treasury = 0; const g2 = P.gold; Bolsa.rendaOut(ci, 'all'); ok(P.gold === g2 && X.rendas.some(r => r.ci === ci), 'Tesouro vazio pagou algo');
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
