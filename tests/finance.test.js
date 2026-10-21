// Finanças (poupança, empréstimo, investimento) e um empreendimento que entrega lucro todo mês.
'use strict';
const { open } = require('./harness');
module.exports = async () => {
  const { page, errors, close } = await open(), fails = [];
  try {
    const r = await page.evaluate(async () => {
      P.god = true; P.gold = 5000; G.day = 5;
      Fin.deposit(1000); Fin.newAsks(); const asked = Fin.D().asks.length; if (asked) Fin.lend(0);
      const f = Fin.families()[0]; if (f) Fin.invest(f.id, 500);
      const v = World.villages[0];
      const spot = (w, h) => { for (let r = 12; r < 60; r++) for (let k = 0; k < 48; k++) { const a = k / 48 * 6.283, x = Math.round(v.x + Math.cos(a) * r), y = Math.round(v.y + Math.sin(a) * r); if (World.areaOk(x - 1, y - 1, w + 2, h + 4) && World.areaFree(x - 1, y - 1, w + 2, h + 4)) return { x, y }; } };
      const sp = spot(3, 2), bz = World.addStruct('biz_bakery', sp.x, sp.y, BUILDINGS.biz_bakery.w, BUILDINGS.biz_bakery.h, 'player', { built: true }); Biz.autoHire(true);
      for (let k = 0; k < 8; k++) { Game.onNewDay(); await new Promise(r => setTimeout(r, 15)); }
      return { asked, families: Fin.families().length, saveGain: Fin.D().save - 1000, invPaid: (Fin.D().inv[0] || {}).paid || 0, bizPaid: Biz.earn(bz).paid || 0, workers: Biz.workerCount(bz) };
    });
    if (!r.asked) fails.push('nenhum morador pediu empréstimo');
    if (!r.families) fails.push('nenhuma família para investir');
    if (r.saveGain <= 0) fails.push('a poupança não rendeu');
    if (r.invPaid <= 0) fails.push('o investimento não rendeu');
    if (r.bizPaid <= 0) fails.push('a padaria não entregou lucro');
    if (r.workers > 2) fails.push('empreendimento com mais de 2 funcionários');
  } finally { await close(); }
  return fails.concat(errors.map(e => 'erro no jogo: ' + e));
};
