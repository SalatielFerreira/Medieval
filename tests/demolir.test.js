// Demolir um empreendimento: ele some (do mapa e da lista dos negócios); com sócio, só depois de comprar a parte dele.
'use strict';
const { open } = require('./harness');
module.exports = async () => {
  const { page, errors, close } = await open(), fails = [];
  try {
    const out = await page.evaluate(() => {
      const out = [], ok = (c, t) => { if (!c) out.push(t); };
      UI.msg = () => {}; P.god = true;
      const spot = dx => { const tx = Math.round(P.x / TILE) + dx, ty = Math.round(P.y / TILE) + 4; World.freeArea(tx, ty, 2, 2); return World.addStruct('biz_mill', tx, ty, 2, 2, 'player'); };
      // sem sócio: some na hora
      Dialog.autoYes = true;
      const a = spot(5); ok(Biz.list().includes(a), 'o negócio novo não está na lista');
      Urban.demolish(a);
      ok(a.removed && !Biz.list().includes(a), 'o negócio demolido continua na lista');
      ok(World.sgrid[World.idx(a.x, a.y)] !== a.id, 'o negócio demolido continua no mapa');
      // com sócio: recusa sem a compra; com a compra, paga e demole
      const b = spot(-8), p = G.people.find(x => x.alive && x.age >= 25 && !x.capanga && !x.kin);
      b.partner = { pid: p.id, share: 0.3, since: G.day, got: 0 };
      Urban.doDemolish(b); ok(!b.removed, 'demoliu o negócio com sócio sem comprar a parte dele');
      P.gold = 99999; Dialog.autoYes = false; const c0 = Dialog.confirm; let asked = null; Dialog.confirm = (o, f) => { asked = o; };
      Urban.demolish(b); ok(asked && /sócio/.test(asked.text) && !b.removed, 'não pediu para comprar a parte do sócio');
      Dialog.confirm = c0; Dialog.autoYes = true;
      const cost = Math.round(Commerce.value(b) * 0.5), purse0 = People.purse(p);
      P.gold = 1; Urban.demolish(b); ok(!b.removed && b.partner, 'sem dinheiro, demoliu mesmo assim');
      P.gold = cost + 500; const g0 = P.gold; Urban.demolish(b);
      ok(b.removed && !b.partner, 'comprou a parte e não demoliu');
      ok(g0 - P.gold === cost && People.purse(p) === purse0 + cost, 'a parte do sócio não foi paga certo: ' + (g0 - P.gold) + ' / ' + cost);
      ok(!Biz.list().includes(b), 'o negócio do sócio continua na lista');
      return out;
    });
    fails.push(...out);
    if (errors.length) fails.push('erros: ' + errors.slice(0, 3).join(' | '));
  } finally { await close(); }
  return fails;
};
