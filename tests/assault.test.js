// Invasão de castelo: guarnição máxima 30 e até 10 catapultas; o conselho oferece campo aberto ou assalto; no assalto o
// portão é arrombado, o rei cai e o reino passa a ser seu; na defesa você fica no pátio e as muralhas resistem.
'use strict';
const { open } = require('./harness');
module.exports = async () => {
  const { page, errors, close } = await open(), fails = [];
  try {
    const r = await page.evaluate(() => {
      const bad = [], ok = (c, m) => { if (!c) bad.push(m); };
      UI.msg = () => {}; UI.banner = () => {};
      const me = 1, foe = 2; Game.becomeRuler(me, 'teste'); UI.close();
      const c = G.civs[me]; c.garrison = 30; c.treasury = 6000; G.civs[foe].garrison = 22; G.civs[foe].treasury = 2000;
      P.level = 20; P.maxHp = P.hp = 3000;
      ok(Game.maxGarrison(c) === 30, 'guarnição máxima não é 30');
      Diplo.declareWar(foe, me, 'teste'); Assault.manual = true; War.summon(me, foe, true); Assault.manual = false; G.warCall.shown = true;
      ok(War.limits(G.warCall).cats === 10, 'limite de catapultas: ' + War.limits(G.warCall).cats);
      UI.showWarCouncil(); ok(UI.panel.innerHTML.includes('wassault') && UI.panel.innerHTML.includes('wfield'), 'o conselho não oferece as duas estratégias');
      G.warCall.cfg.cats = 6; UI.act('wassault', {});
      const A = G.place && G.place.assault; ok(A && A.mode === 'attack', 'o assalto não começou');
      if (!A) return bad;
      ok(War.units(foe).filter(u => u.faction !== 'engine').every(u => Assault.inside(u)), 'há defensores fora das muralhas');
      let t = 0, broke = 0; while (G.place && t < 420) { P.hp = P.maxHp; Game.update(1 / 20); t += 1 / 20; if (!broke && A.gateHp <= 0) broke = t; }
      ok(broke > 20, 'o portão caiu cedo demais ou não caiu: ' + Math.round(broke) + ' s');
      ok(!G.place, 'o assalto não terminou em 420 s');
      ok(G.civs[foe].ruler === 'player', 'o reino conquistado não passou para você');
      ok(!World.solid.some(x => x), 'ficaram bloqueios das muralhas no mapa');
      UI.close(); const foe2 = 3; G.civs[foe2].garrison = 30; G.civs[foe2].treasury = 3000; c.garrison = 24; G.warRest = {};
      Diplo.declareWar(foe2, me, 'teste'); G.warCall = null; War.summon(me, foe2, true); G.warCall.assault = 'defend'; G.warCall.shown = true;
      UI.act('wassault', {});
      ok(G.place && G.place.assault && G.place.assault.mode === 'defend' && Assault.inside(P), 'a defesa não começou com você no pátio');
      t = 0; while (G.place && t < 420) { P.hp = P.maxHp; Game.update(1 / 20); t += 1 / 20; }
      ok(!G.place, 'a defesa não terminou em 420 s');
      return bad;
    });
    fails.push(...r);
  } finally { await close(); }
  return fails.concat(errors.map(e => 'erro no jogo: ' + e));
};
