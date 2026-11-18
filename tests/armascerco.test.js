// Armas de cerco: no Conselho de Guerra, aríetes, sapadores e fogo; no assalto, os aríetes avançam e batem no portão,
// os sapadores racham o portão depressa, o fogo queima sozinho e você mesmo bate na porta (o golpe aparece nela).
'use strict';
const { open } = require('./harness');
module.exports = async () => {
  const { page, errors, close } = await open(), fails = [];
  try {
    const r = await page.evaluate(() => {
      const bad = [], ok = (c, m) => { if (!c) bad.push(m); };
      UI.msg = () => {}; UI.banner = () => {}; Dialog.autoYes = true; P.god = true;
      const side = 1, enemy = 2; Game.becomeRuler(side, 'teste'); UI.close(); G.civs[side].garrison = 30; G.civs[side].treasury = 9000; G.civs[enemy].garrison = 20;
      G.warCall = { side, enemy, own: true, day: G.day, shown: true, deadline: null, cfg: War.defaults(side, true) };
      UI.showWarCouncil(); ok(UI.panel.querySelector('.wc-arms'), 'o conselho não mostra as armas de cerco');
      UI.act('wcfg', { k: 'rams', d: 1 }); UI.act('wcfg', { k: 'rams', d: 1 }); UI.act('wcfg', { k: 'sappers', d: 3 }); UI.act('wfire', {});
      const cfg = G.warCall.cfg; ok(cfg.rams === 2 && cfg.sappers === 3 && cfg.fire, 'não deu para escolher aríetes, sapadores e fogo: ' + JSON.stringify({ r: cfg.rams, s: cfg.sappers, f: cfg.fire }));
      const t0 = G.civs[side].treasury; G.warCall.assault = 'attack'; War.start(); const A = Assault.A();
      ok(A, 'o assalto não começou');
      const rams = War.units(side).filter(e => e.battleRam), saps = War.units(side).filter(e => e.sapper);
      ok(rams.length === 2 && saps.length === 3 && A.fire && G.civs[side].treasury < t0, `as armas não foram ao campo (${rams.length} aríetes, ${saps.length} sapadores)`);
      for (let k = 0; k < 100; k++) Game.update(0.05);
      // os aríetes no portão batem
      const m = Assault.gateMid(); for (const e of rams) { e.x = (A.x0 - 1.6) * TILE; e.y = m.y; e.rcd = 0; }
      const h0 = A.gateHp; for (let k = 0; k < 10; k++) Game.update(0.05);
      ok(A.gateHp < h0 - 100, `os aríetes não bateram no portão (${h0} → ${A.gateHp})`);
      // você bate na porta
      P.x = (A.x0 - 1.2) * TILE; P.y = m.y; A.pSw2 = 0; P.swing = 0.35; const h1 = A.gateHp; SiegeArms.update(0.016);
      ok(A.gateHp < h1 && G.texts.some(t => /^−\d+/.test(t.text)), 'bater na porta não tirou vida do portão');
      // o fogo queima sozinho
      A.burn = 1; const h2 = A.gateHp; for (let k = 0; k < 8; k++) { SiegeArms.t = 0; SiegeArms.update(0.25); }
      ok(A.gateHp < h2, 'o fogo não queimou o portão');
      return bad;
    });
    fails.push(...r);
  } finally { await close(); }
  return fails.concat(errors.map(e => 'erro no jogo: ' + e));
};
