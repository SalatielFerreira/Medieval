// Obras: quatro Grandes Obras reais novas com efeito (Grande Mercado +6% de impostos...), o Óleo quente nas Obras do
// reino (instalar, melhorar e queimar quem está no pé do portão num cerco ao seu castelo), espião por 100 🪙, as listas
// de Vassalos rolando por dentro (uma página só) e a Diplomacia com botões curtos.
'use strict';
const { open } = require('./harness');
module.exports = async () => {
  const { page, errors, close } = await open(), fails = [];
  try {
    const r = await page.evaluate(() => {
      const bad = [], ok = (c, m) => { if (!c) bad.push(m); };
      UI.msg = () => {}; UI.banner = () => {}; Dialog.autoYes = true; P.god = true;
      Game.becomeRuler(1, 'teste'); UI.close(); const c = G.civs[1]; c.treasury = 50000; Object.assign(c.stock, { wood: 500, iron_ore: 300, stone: 500 });
      // 1. obras reais novas
      ok(['arsenal', 'hospital', 'mercado', 'estabulos'].every(k => WORKS[k]) && Object.keys(WORKS).length >= 12, 'faltam as obras reais novas');
      const m0 = Crown.incomeMul(c); c.works = c.works || {}; c.works.mercado = { paid: 6, done: false }; Crown.finishWork(c, 'mercado');
      ok(Crown.incomeMul(c) > m0 * 1.05, 'o Grande Mercado não aumentou os impostos');
      c.works.estabulos = { paid: 7, done: true }; ok(War.armyOf(1).cav >= 3, 'os Estábulos Reais não deram cavaleiros');
      UI.sel.knav = 'x:reign'; UI.sel.rnRole = 'k:1'; UI.sel.rnTab = 'obras'; UI.showKingdom();
      ok(UI.panel.querySelector('[data-act="oilbuy"]') && UI.panel.querySelectorAll('.kpg.kpage').length === 1, 'a janela de Obras não mostra o óleo ou passou de uma página');
      // 2. óleo quente
      UI.act('oilbuy', { c: 1 }); UI.act('oilbuy', { c: 1 }); ok(Oil.lvl(1) === 2, 'não deu para instalar e melhorar o óleo: ' + Oil.lvl(1));
      G.warCall = { side: 1, enemy: 2, own: true, day: G.day, shown: true, deadline: null, cfg: War.defaults(1, true), assault: 'defend' };
      const sa = SiegeArms.setup; SiegeArms.setup = () => {}; try { War.start(); } finally { SiegeArms.setup = sa; }
      const A = Assault.A(); ok(A && A.mode === 'defend' && Places.furn.some(f => f.k === 'bf_oilpot'), 'o cerco ao seu castelo não tem os caldeirões');
      if (A) {
        G.place.phase = 'fight'; const foe = War.units(2).find(e => e.faction !== 'engine' && !e.battleKing); const m = Assault.gateMid();
        foe.x = (A.x0 - 1.4) * TILE; foe.y = m.y; const hp0 = foe.hp; Oil.t = 0; Oil.update(0.1);
        ok(foe.hp < hp0, 'o óleo não queimou quem estava no pé do portão');
        Game.render(); War.finish(true); UI.close();
      }
      // 3. espião por 100
      const t0 = c.treasury; Reign.plantSpy(3); ok(t0 - c.treasury === 100, 'o espião não custou 100: ' + (t0 - c.treasury));
      // 4. vassalos: muitos feudos rolam por dentro, numa página
      const R = Reign.R(), vs = World.villages.map((v, vi) => vi).filter(vi => World.villages[vi] && World.villages[vi].civ === 1);
      const nb = G.people.filter(p => p.alive && p.age > 20 && !p.kin).slice(0, 10);
      for (let k = 0; k < 10; k++) R.fiefs[1000 + k] = { pid: nb[k].id, loyal: 60, rank: 0 };
      UI.sel.rnTab = 'vassalos';
      try { UI.showKingdom(); } catch (e) { /* vila de mentira */ }
      for (let k = 0; k < 10; k++) delete R.fiefs[1000 + k];
      for (const vi of vs.slice(0, 1)) R.fiefs[vi] = { pid: nb[0].id, loyal: 60, rank: 0 };
      UI.showKingdom(); ok(UI.panel.querySelector('.rn-fiefs .kscroll') && UI.panel.querySelectorAll('.kpg.kpage').length === 1, 'Vassalos não rola por dentro ou passou de uma página');
      // 5. diplomacia: botões curtos
      UI.sel.rnTab = 'diplo'; UI.showKingdom(); ok(UI.panel.querySelector('.rn-dip button.dp-ic[title]'), 'a diplomacia não tem os botões curtos com dica');
      return bad;
    });
    fails.push(...r);
  } finally { await close(); }
  return fails.concat(errors.map(e => 'erro no jogo: ' + e));
};
